<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Services\FinancialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $includeArchived = $request->boolean('include_archived', false);

        $query = Account::where('user_id', $user->id);
        if (!$includeArchived) {
            $query->where('is_archived', false);
        }

        $accounts = $query->orderBy('is_active', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $totalBalance = $accounts->where('is_archived', false)->sum('balance');

        return response()->json([
            'accounts' => $accounts,
            'total_balance' => (float) $totalBalance,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:cash,bank,ewallet,savings,investment,other',
            'account_number' => 'nullable|string|max:50',
            'initial_balance' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:500',
        ]);

        $initialBalance = floatval($validated['initial_balance'] ?? 0);

        $account = Account::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'account_number' => $validated['account_number'] ?? null,
            'initial_balance' => $initialBalance,
            'balance' => $initialBalance,
            'color' => $validated['color'] ?? '#10B981',
            'icon' => $validated['icon'] ?? 'wallet',
            'description' => $validated['description'] ?? null,
            'is_active' => true,
            'is_archived' => false,
        ]);

        return response()->json([
            'message' => 'Akun berhasil dibuat.',
            'account' => $account,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $account = Account::where('user_id', $user->id)->findOrFail($id);

        $recentTransactions = $account->transactions()
            ->with(['category', 'toAccount'])
            ->latest('date')
            ->latest('id')
            ->take(15)
            ->get();

        $totalIncome = $account->transactions()->where('type', 'income')->sum('amount');
        $totalExpense = $account->transactions()->where('type', 'expense')->sum('amount');

        return response()->json([
            'account' => $account,
            'recent_transactions' => $recentTransactions,
            'total_income' => (float) $totalIncome,
            'total_expense' => (float) $totalExpense,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $account = Account::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'type' => 'sometimes|in:cash,bank,ewallet,savings,investment,other',
            'account_number' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
            'is_archived' => 'sometimes|boolean',
            'description' => 'nullable|string|max:500',
        ]);

        $account->update($validated);

        return response()->json([
            'message' => 'Akun berhasil diperbarui.',
            'account' => $account->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $account = Account::where('user_id', $user->id)->findOrFail($id);

        $hasTransactions = $account->transactions()->exists() || $account->incomingTransfers()->exists();

        if ($hasTransactions) {
            // Archive to preserve transaction history as required
            $account->update(['is_archived' => true, 'is_active' => false]);
            return response()->json([
                'message' => 'Akun memiliki riwayat transaksi sehingga diarsipkan demi menjaga keutuhan data keuangan.',
                'account' => $account,
                'archived' => true,
            ]);
        }

        $account->delete();

        return response()->json([
            'message' => 'Akun berhasil dihapus.',
            'deleted' => true,
        ]);
    }

    public function transfer(Request $request, FinancialService $financialService): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|different:from_account_id|exists:accounts,id',
            'amount' => 'required|numeric|min:1',
            'date' => 'nullable|date',
            'notes' => 'nullable|string|max:255',
        ]);

        $fromAccount = Account::where('id', $validated['from_account_id'])->where('user_id', $user->id)->firstOrFail();
        $toAccount = Account::where('id', $validated['to_account_id'])->where('user_id', $user->id)->firstOrFail();

        $transaction = $financialService->createTransaction($user, [
            'account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'name' => 'Transfer dari ' . $fromAccount->name . ' ke ' . $toAccount->name,
            'type' => 'transfer',
            'amount' => $validated['amount'],
            'date' => $validated['date'] ?? now()->toDateString(),
            'notes' => $validated['notes'] ?? null,
            'payment_method' => 'transfer',
        ]);

        return response()->json([
            'message' => 'Transfer antar akun berhasil.',
            'transaction' => $transaction->load(['account', 'toAccount']),
            'from_account' => $fromAccount->fresh(),
            'to_account' => $toAccount->fresh(),
        ]);
    }
}
