<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->query('status'); // 'paid', 'unpaid', or all

        $query = Bill::where('user_id', $user->id)->with(['account', 'category']);

        if ($status === 'paid') {
            $query->where('is_paid', true);
        } elseif ($status === 'unpaid') {
            $query->where('is_paid', false);
        }

        $bills = $query->orderBy('is_paid', 'asc')
            ->orderBy('due_date', 'asc')
            ->get();

        $today = Carbon::today();
        $enhancedBills = $bills->map(function ($bill) use ($today) {
            $dueDate = Carbon::parse($bill->due_date);
            $daysLeft = $today->diffInDays($dueDate, false);
            $isOverdue = !$bill->is_paid && $daysLeft < 0;
            $isDueSoon = !$bill->is_paid && $daysLeft >= 0 && $daysLeft <= ($bill->reminder_days_before ?? 3);

            return [
                'id' => $bill->id,
                'title' => $bill->title,
                'amount' => (float) $bill->amount,
                'due_date' => $dueDate->format('Y-m-d'),
                'is_paid' => $bill->is_paid,
                'paid_at' => $bill->paid_at?->format('Y-m-d H:i'),
                'days_left' => $daysLeft,
                'is_overdue' => $isOverdue,
                'is_due_soon' => $isDueSoon,
                'frequency' => $bill->frequency,
                'notes' => $bill->notes,
                'account' => $bill->account,
                'category' => $bill->category,
            ];
        });

        $unpaidBills = $bills->where('is_paid', false);
        $totalUnpaid = (float) $unpaidBills->sum('amount');
        $overdueCount = $enhancedBills->where('is_overdue', true)->count();
        $dueSoonCount = $enhancedBills->where('is_due_soon', true)->count();

        return response()->json([
            'bills' => $enhancedBills,
            'summary' => [
                'total_bills' => $bills->count(),
                'unpaid_count' => $unpaidBills->count(),
                'total_unpaid_amount' => $totalUnpaid,
                'overdue_count' => $overdueCount,
                'due_soon_count' => $dueSoonCount,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'due_date' => 'required|date',
            'account_id' => 'nullable|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'reminder_days_before' => 'nullable|integer|min:1|max:30',
            'frequency' => 'nullable|in:one_time,weekly,monthly,yearly',
            'notes' => 'nullable|string|max:500',
        ]);

        $bill = Bill::create([
            'user_id' => $user->id,
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'due_date' => $validated['due_date'],
            'account_id' => $validated['account_id'] ?? null,
            'category_id' => $validated['category_id'] ?? null,
            'reminder_days_before' => $validated['reminder_days_before'] ?? 3,
            'frequency' => $validated['frequency'] ?? 'monthly',
            'notes' => $validated['notes'] ?? null,
            'is_paid' => false,
        ]);

        return response()->json([
            'message' => 'Tagihan berhasil ditambahkan.',
            'bill' => $bill->load(['account', 'category']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bill = Bill::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:1',
            'due_date' => 'sometimes|date',
            'account_id' => 'nullable|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'reminder_days_before' => 'nullable|integer|min:1|max:30',
            'frequency' => 'nullable|in:one_time,weekly,monthly,yearly',
            'notes' => 'nullable|string|max:500',
        ]);

        $bill->update($validated);

        return response()->json([
            'message' => 'Tagihan berhasil diperbarui.',
            'bill' => $bill->fresh(['account', 'category']),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bill = Bill::where('user_id', $user->id)->findOrFail($id);
        $bill->delete();

        return response()->json([
            'message' => 'Tagihan berhasil dihapus.',
        ]);
    }

    public function markAsPaid(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bill = Bill::where('user_id', $user->id)->findOrFail($id);

        $accountId = $request->input('account_id', $bill->account_id);
        if (!$accountId) {
            $firstAccount = Account::where('user_id', $user->id)->where('is_archived', false)->first();
            $accountId = $firstAccount?->id;
        }

        if (!$accountId) {
            return response()->json(['message' => 'Silakan pilih akun pembayaran terlebih dahulu.'], 422);
        }

        return DB::transaction(function () use ($user, $bill, $accountId) {
            $account = Account::where('id', $accountId)->where('user_id', $user->id)->lockForUpdate()->firstOrFail();

            // Deduct balance
            $account->decrement('balance', $bill->amount);

            // Record transaction
            $tx = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'category_id' => $bill->category_id,
                'name' => 'Bayar Tagihan: ' . $bill->title,
                'type' => 'expense',
                'amount' => $bill->amount,
                'date' => now()->toDateString(),
                'payment_method' => 'transfer',
                'notes' => 'Pembayaran tagihan rutin: ' . $bill->title,
            ]);

            $bill->update([
                'is_paid' => true,
                'paid_at' => now(),
                'paid_transaction_id' => $tx->id,
                'account_id' => $account->id,
            ]);

            return response()->json([
                'message' => 'Tagihan berhasil ditandai lunas dan saldo akun telah dipotong.',
                'bill' => $bill->fresh(['account', 'category']),
                'transaction' => $tx,
                'account' => $account->fresh(),
            ]);
        });
    }

    public function markAsUnpaid(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bill = Bill::where('user_id', $user->id)->findOrFail($id);

        return DB::transaction(function () use ($bill) {
            if ($bill->paid_transaction_id) {
                $tx = Transaction::find($bill->paid_transaction_id);
                if ($tx) {
                    $acc = Account::find($tx->account_id);
                    if ($acc) {
                        $acc->increment('balance', $tx->amount);
                    }
                    $tx->delete();
                }
            }

            $bill->update([
                'is_paid' => false,
                'paid_at' => null,
                'paid_transaction_id' => null,
            ]);

            return response()->json([
                'message' => 'Status tagihan dikembalikan menjadi belum lunas.',
                'bill' => $bill->fresh(['account', 'category']),
            ]);
        });
    }
}
