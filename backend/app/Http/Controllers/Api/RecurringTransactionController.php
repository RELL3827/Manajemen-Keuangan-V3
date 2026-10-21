<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringTransaction;
use App\Services\FinancialService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = RecurringTransaction::where('user_id', $user->id)
            ->with(['account', 'category'])
            ->orderBy('next_due_date', 'asc')
            ->get();

        return response()->json([
            'recurring_transactions' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:1',
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'frequency' => 'required|in:daily,weekly,monthly,yearly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string|max:500',
        ]);

        $item = RecurringTransaction::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'account_id' => $validated['account_id'],
            'category_id' => $validated['category_id'] ?? null,
            'frequency' => $validated['frequency'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'next_due_date' => $validated['start_date'],
            'is_active' => true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Transaksi berulang berhasil didaftarkan.',
            'recurring_transaction' => $item->load(['account', 'category']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $item = RecurringTransaction::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:income,expense',
            'amount' => 'sometimes|numeric|min:1',
            'account_id' => 'sometimes|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'frequency' => 'sometimes|in:daily,weekly,monthly,yearly',
            'is_active' => 'sometimes|boolean',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Transaksi berulang berhasil diperbarui.',
            'recurring_transaction' => $item->fresh(['account', 'category']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $item = RecurringTransaction::where('user_id', $user->id)->findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Transaksi berulang berhasil dihapus.',
        ]);
    }

    public function processNow(Request $request, int $id, FinancialService $financialService): JsonResponse
    {
        $user = $request->user();
        $item = RecurringTransaction::where('user_id', $user->id)->findOrFail($id);

        $tx = $financialService->createTransaction($user, [
            'account_id' => $item->account_id,
            'category_id' => $item->category_id,
            'name' => $item->name,
            'type' => $item->type,
            'amount' => $item->amount,
            'date' => now()->toDateString(),
            'notes' => $item->notes ?? 'Diproses dari transaksi rutin',
            'is_recurring' => true,
        ]);

        // Calculate next date
        $current = Carbon::parse($item->next_due_date);
        $next = match ($item->frequency) {
            'daily' => $current->addDay(),
            'weekly' => $current->addWeek(),
            'monthly' => $current->addMonth(),
            'yearly' => $current->addYear(),
        };

        $item->update([
            'last_processed' => now()->toDateString(),
            'next_due_date' => $next->toDateString(),
        ]);

        return response()->json([
            'message' => 'Transaksi rutin berhasil diproses.',
            'transaction' => $tx,
            'recurring_transaction' => $item->fresh(),
        ]);
    }
}
