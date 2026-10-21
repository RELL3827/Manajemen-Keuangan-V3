<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\SavingGoal;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = $request->query('period', 'this_month');
        $now = Carbon::now();

        // Determine current period date range
        if ($period === 'today') {
            $startDate = $now->copy()->startOfDay()->toDateString();
            $endDate = $now->copy()->endOfDay()->toDateString();
            $prevStartDate = $now->copy()->subDay()->startOfDay()->toDateString();
            $prevEndDate = $now->copy()->subDay()->endOfDay()->toDateString();
            $periodLabel = 'Hari Ini';
            $prevPeriodLabel = 'Kemarin';
        } elseif ($period === 'this_week') {
            $startDate = $now->copy()->startOfWeek()->toDateString();
            $endDate = $now->copy()->endOfWeek()->toDateString();
            $prevStartDate = $now->copy()->subWeek()->startOfWeek()->toDateString();
            $prevEndDate = $now->copy()->subWeek()->endOfWeek()->toDateString();
            $periodLabel = 'Minggu Ini';
            $prevPeriodLabel = 'Minggu Lalu';
        } elseif ($period === 'last_month') {
            $startDate = $now->copy()->subMonth()->startOfMonth()->toDateString();
            $endDate = $now->copy()->subMonth()->endOfMonth()->toDateString();
            $prevStartDate = $now->copy()->subMonths(2)->startOfMonth()->toDateString();
            $prevEndDate = $now->copy()->subMonths(2)->endOfMonth()->toDateString();
            $periodLabel = 'Bulan Lalu';
            $prevPeriodLabel = '2 Bulan Lalu';
        } elseif ($period === 'this_year') {
            $startDate = $now->copy()->startOfYear()->toDateString();
            $endDate = $now->copy()->endOfYear()->toDateString();
            $prevStartDate = $now->copy()->subYear()->startOfYear()->toDateString();
            $prevEndDate = $now->copy()->subYear()->endOfYear()->toDateString();
            $periodLabel = 'Tahun Ini';
            $prevPeriodLabel = 'Tahun Lalu';
        } else { // default 'this_month'
            $startDate = $now->copy()->startOfMonth()->toDateString();
            $endDate = $now->copy()->endOfMonth()->toDateString();
            $prevStartDate = $now->copy()->subMonth()->startOfMonth()->toDateString();
            $prevEndDate = $now->copy()->subMonth()->endOfMonth()->toDateString();
            $periodLabel = 'Bulan Ini (' . $now->translatedFormat('F Y') . ')';
            $prevPeriodLabel = 'Bulan Sebelumnya';
        }

        // Custom range overrides if given
        if ($customStart = $request->query('start_date')) {
            $startDate = $customStart;
            $periodLabel = "Rentang: {$startDate}";
        }
        if ($customEnd = $request->query('end_date')) {
            $endDate = $customEnd;
            $periodLabel .= " s/d {$endDate}";
        }

        // 1. Current Period Stats
        $currentTxs = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->with(['category', 'account'])
            ->get();

        $income = (float) $currentTxs->where('type', 'income')->sum('amount');
        $expense = (float) $currentTxs->where('type', 'expense')->sum('amount');
        $netCashflow = $income - $expense;
        $savingsRate = $income > 0 ? round((max(0, $netCashflow) / $income) * 100, 1) : 0;

        // 2. Previous Period Stats
        $prevTxs = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$prevStartDate, $prevEndDate])
            ->get();

        $prevIncome = (float) $prevTxs->where('type', 'income')->sum('amount');
        $prevExpense = (float) $prevTxs->where('type', 'expense')->sum('amount');

        $incomeDiffPct = $prevIncome > 0 ? round((($income - $prevIncome) / $prevIncome) * 100, 1) : 0;
        $expenseDiffPct = $prevExpense > 0 ? round((($expense - $prevExpense) / $prevExpense) * 100, 1) : 0;

        // 3. Category Breakdown (Expenses)
        $expenseTxs = $currentTxs->where('type', 'expense');
        $categoryBreakdown = $expenseTxs->groupBy('category_id')->map(function ($items, $catId) use ($expense) {
            $category = $items->first()->category;
            $catTotal = (float) $items->sum('amount');
            $pct = $expense > 0 ? round(($catTotal / $expense) * 100, 1) : 0;

            return [
                'category_id' => $catId,
                'name' => $category?->name ?? 'Lainnya',
                'color' => $category?->color ?? '#F43F5E',
                'icon' => $category?->icon ?? 'tag',
                'amount' => $catTotal,
                'percentage' => $pct,
                'count' => $items->count(),
            ];
        })->values()->sortByDesc('amount')->values();

        // 4. Monthly Trend (Past 6 Months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth()->toDateString();
            $mEnd = $monthDate->copy()->endOfMonth()->toDateString();

            $mTxs = Transaction::where('user_id', $user->id)
                ->whereBetween('date', [$mStart, $mEnd])
                ->get();

            $mIncome = (float) $mTxs->where('type', 'income')->sum('amount');
            $mExpense = (float) $mTxs->where('type', 'expense')->sum('amount');

            $monthlyTrend[] = [
                'month_key' => $monthDate->format('Y-m'),
                'label' => $monthDate->translatedFormat('M Y'),
                'income' => $mIncome,
                'expense' => $mExpense,
                'net' => $mIncome - $mExpense,
            ];
        }

        // 5. Total Balances Across Accounts
        $accounts = Account::where('user_id', $user->id)->where('is_archived', false)->get();
        $totalBalance = (float) $accounts->sum('balance');

        // 6. Routine vs Non-routine expenses
        $routineExpense = (float) $expenseTxs->where('is_recurring', true)->sum('amount');
        $nonRoutineExpense = (float) $expenseTxs->where('is_recurring', false)->sum('amount');

        // 7. Saving Goals Overview
        $goals = SavingGoal::where('user_id', $user->id)->get();
        $goalsTarget = (float) $goals->sum('target_amount');
        $goalsCurrent = (float) $goals->sum('current_amount');
        $goalsPct = $goalsTarget > 0 ? round(($goalsCurrent / $goalsTarget) * 100, 1) : 0;

        return response()->json([
            'period' => [
                'current' => $periodLabel,
                'previous' => $prevPeriodLabel,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_balance' => $totalBalance,
                'income' => $income,
                'expense' => $expense,
                'net_cashflow' => $netCashflow,
                'savings_rate' => $savingsRate,
                'prev_income' => $prevIncome,
                'prev_expense' => $prevExpense,
                'income_diff_pct' => $incomeDiffPct,
                'expense_diff_pct' => $expenseDiffPct,
                'routine_expense' => $routineExpense,
                'non_routine_expense' => $nonRoutineExpense,
            ],
            'category_breakdown' => $categoryBreakdown,
            'monthly_trend' => $monthlyTrend,
            'accounts_summary' => $accounts,
            'saving_goals_summary' => [
                'total_target' => $goalsTarget,
                'total_saved' => $goalsCurrent,
                'percentage' => $goalsPct,
                'count' => $goals->count(),
            ],
        ]);
    }
}
