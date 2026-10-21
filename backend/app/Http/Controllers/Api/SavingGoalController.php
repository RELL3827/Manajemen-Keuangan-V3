<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\SavingGoal;
use App\Models\SavingGoalContribution;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavingGoalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $goals = SavingGoal::where('user_id', $user->id)
            ->with(['account'])
            ->orderBy('is_completed', 'asc')
            ->orderBy('target_date', 'asc')
            ->get();

        $enhancedGoals = $goals->map(function ($goal) {
            $target = (float) $goal->target_amount;
            $current = (float) $goal->current_amount;
            $progress = $target > 0 ? min(100, round(($current / $target) * 100, 1)) : 0;
            $remaining = max(0, $target - $current);

            // Time estimate
            $monthsRemaining = Carbon::now()->diffInMonths(Carbon::parse($goal->target_date), false);
            $periodic = (float) ($goal->periodic_contribution ?? 0);
            $estimatedMonthsToReach = ($periodic > 0 && $remaining > 0) ? ceil($remaining / $periodic) : null;

            return [
                'id' => $goal->id,
                'name' => $goal->name,
                'target_amount' => $target,
                'current_amount' => $current,
                'remaining_amount' => $remaining,
                'progress_percentage' => $progress,
                'target_date' => $goal->target_date->format('Y-m-d'),
                'periodic_contribution' => $periodic,
                'color' => $goal->color,
                'icon' => $goal->icon,
                'is_completed' => $goal->is_completed || $current >= $target,
                'months_remaining_deadline' => max(0, $monthsRemaining),
                'estimated_months_to_target' => $estimatedMonthsToReach,
                'account' => $goal->account,
            ];
        });

        $totalTarget = (float) $goals->sum('target_amount');
        $totalSaved = (float) $goals->sum('current_amount');

        return response()->json([
            'goals' => $enhancedGoals,
            'summary' => [
                'total_goals' => $goals->count(),
                'completed_goals' => $goals->where('is_completed', true)->count(),
                'total_target' => $totalTarget,
                'total_saved' => $totalSaved,
                'overall_percentage' => $totalTarget > 0 ? round(($totalSaved / $totalTarget) * 100, 1) : 0,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'current_amount' => 'nullable|numeric|min:0',
            'target_date' => 'required|date|after_or_equal:today',
            'periodic_contribution' => 'nullable|numeric|min:0',
            'account_id' => 'nullable|exists:accounts,id',
            'color' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
        ]);

        $goal = SavingGoal::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'target_amount' => $validated['target_amount'],
            'current_amount' => $validated['current_amount'] ?? 0,
            'target_date' => $validated['target_date'],
            'periodic_contribution' => $validated['periodic_contribution'] ?? null,
            'account_id' => $validated['account_id'] ?? null,
            'color' => $validated['color'] ?? '#10B981',
            'icon' => $validated['icon'] ?? 'target',
            'is_completed' => ($validated['current_amount'] ?? 0) >= $validated['target_amount'],
        ]);

        return response()->json([
            'message' => 'Tujuan tabungan berhasil dibuat.',
            'goal' => $goal->load('account'),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = SavingGoal::where('user_id', $user->id)
            ->with(['account', 'contributions.account'])
            ->findOrFail($id);

        return response()->json([
            'goal' => $goal,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = SavingGoal::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_amount' => 'sometimes|numeric|min:1',
            'target_date' => 'sometimes|date',
            'periodic_contribution' => 'nullable|numeric|min:0',
            'account_id' => 'nullable|exists:accounts,id',
            'color' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
            'is_completed' => 'sometimes|boolean',
        ]);

        $goal->update($validated);

        return response()->json([
            'message' => 'Tujuan tabungan berhasil diperbarui.',
            'goal' => $goal->fresh(['account']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = SavingGoal::where('user_id', $user->id)->findOrFail($id);
        $goal->delete();

        return response()->json([
            'message' => 'Tujuan tabungan berhasil dihapus.',
        ]);
    }

    public function contribute(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $goal = SavingGoal::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:1',
            'type' => 'required|in:deposit,withdraw',
            'notes' => 'nullable|string|max:255',
            'date' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($user, $goal, $validated) {
            $account = Account::where('id', $validated['account_id'])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $amount = floatval($validated['amount']);
            $type = $validated['type'];
            $date = $validated['date'] ?? now()->toDateString();

            if ($type === 'deposit') {
                $account->decrement('balance', $amount);
                $goal->increment('current_amount', $amount);
                // Record expense/saving transaction linked to goal
                $tx = Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $account->id,
                    'name' => 'Alokasi Tabungan: ' . $goal->name,
                    'type' => 'expense',
                    'amount' => $amount,
                    'date' => $date,
                    'payment_method' => 'transfer',
                    'notes' => $validated['notes'] ?? 'Setoran ke tujuan tabungan',
                ]);
            } else {
                $account->increment('balance', $amount);
                $goal->decrement('current_amount', $amount);
                $tx = Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $account->id,
                    'name' => 'Penarikan Tabungan: ' . $goal->name,
                    'type' => 'income',
                    'amount' => $amount,
                    'date' => $date,
                    'payment_method' => 'transfer',
                    'notes' => $validated['notes'] ?? 'Tarik dana dari tujuan tabungan',
                ]);
            }

            $contribution = SavingGoalContribution::create([
                'saving_goal_id' => $goal->id,
                'user_id' => $user->id,
                'account_id' => $account->id,
                'transaction_id' => $tx->id,
                'amount' => $amount,
                'type' => $type,
                'notes' => $validated['notes'] ?? null,
                'date' => $date,
            ]);

            // Check completion status
            $isCompleted = $goal->fresh()->current_amount >= $goal->target_amount;
            $goal->update(['is_completed' => $isCompleted]);

            return response()->json([
                'message' => $type === 'deposit' ? 'Kontribusi tabungan berhasil disetorkan!' : 'Penarikan dana tabungan berhasil diproses.',
                'goal' => $goal->fresh(['account']),
                'contribution' => $contribution,
                'account' => $account->fresh(),
            ]);
        });
    }
}
