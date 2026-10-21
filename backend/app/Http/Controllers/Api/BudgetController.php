<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Models\Category;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();
        $month = (int) $request->query('month', $now->month);
        $year = (int) $request->query('year', $now->year);

        $budget = Budget::where('user_id', $user->id)
            ->where('month', $month)
            ->where('year', $year)
            ->with(['budgetCategories.category'])
            ->first();

        // Calculate actual spending in that month & year
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        $expenses = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $totalSpent = (float) $expenses->sum('amount');
        $spentByCategory = $expenses->groupBy('category_id')->map(fn($group) => (float) $group->sum('amount'));

        $totalBudget = $budget ? (float) $budget->total_budget : 0;
        $totalRemaining = max(0, $totalBudget - $totalSpent);
        $totalPercentage = $totalBudget > 0 ? round(($totalSpent / $totalBudget) * 100, 1) : 0;

        // Categories breakdown
        $categoriesData = [];
        if ($budget) {
            foreach ($budget->budgetCategories as $bc) {
                $allocated = (float) $bc->allocated_amount;
                $spent = (float) ($spentByCategory->get($bc->category_id) ?? 0);
                $remaining = max(0, $allocated - $spent);
                $percentage = $allocated > 0 ? round(($spent / $allocated) * 100, 1) : 0;

                $categoriesData[] = [
                    'id' => $bc->id,
                    'category_id' => $bc->category_id,
                    'category_name' => $bc->category->name ?? 'Kategori',
                    'category_icon' => $bc->category->icon ?? 'tag',
                    'category_color' => $bc->category->color ?? '#3B82F6',
                    'allocated_amount' => $allocated,
                    'spent_amount' => $spent,
                    'remaining_amount' => $remaining,
                    'percentage' => $percentage,
                    'is_over_budget' => $spent > $allocated,
                    'is_critical' => $percentage >= 80,
                    'is_warning' => $percentage >= 50 && $percentage < 80,
                ];
            }
        }

        // Available expense categories not yet budgeted
        $budgetedCategoryIds = $budget ? $budget->budgetCategories->pluck('category_id')->toArray() : [];
        $unbudgetedCategories = Category::where(function ($q) use ($user) {
            $q->whereNull('user_id')->orWhere('user_id', $user->id);
        })->where('type', 'expense')
          ->where('is_archived', false)
          ->whereNotIn('id', $budgetedCategoryIds)
          ->get();

        return response()->json([
            'budget' => $budget,
            'summary' => [
                'month' => $month,
                'year' => $year,
                'total_budget' => $totalBudget,
                'total_spent' => $totalSpent,
                'total_remaining' => $totalRemaining,
                'percentage' => $totalPercentage,
                'is_over_budget' => $totalSpent > $totalBudget && $totalBudget > 0,
                'is_critical' => $totalPercentage >= 80,
                'is_warning' => $totalPercentage >= 50 && $totalPercentage < 80,
            ],
            'categories' => $categoriesData,
            'unbudgeted_categories' => $unbudgetedCategories,
        ]);
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020|max:2040',
            'total_budget' => 'required|numeric|min:0',
            'method' => 'nullable|string|in:custom,fixed,50_30_20',
            'categories' => 'nullable|array',
            'categories.*.category_id' => 'required_with:categories|exists:categories,id',
            'categories.*.allocated_amount' => 'required_with:categories|numeric|min:0',
        ]);

        $budget = Budget::updateOrCreate(
            [
                'user_id' => $user->id,
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            [
                'total_budget' => $validated['total_budget'],
                'method' => $validated['method'] ?? 'custom',
            ]
        );

        if (!empty($validated['categories'])) {
            $seenCatIds = [];
            foreach ($validated['categories'] as $item) {
                $seenCatIds[] = $item['category_id'];
                BudgetCategory::updateOrCreate(
                    [
                        'budget_id' => $budget->id,
                        'category_id' => $item['category_id'],
                    ],
                    [
                        'allocated_amount' => $item['allocated_amount'],
                    ]
                );
            }
            // Remove unmentioned categories
            BudgetCategory::where('budget_id', $budget->id)
                ->whereNotIn('category_id', $seenCatIds)
                ->delete();
        }

        return response()->json([
            'message' => 'Anggaran bulanan berhasil disimpan.',
            'budget' => $budget->load('budgetCategories.category'),
        ]);
    }

    public function copyPreviousMonth(Request $request): JsonResponse
    {
        $user = $request->user();
        $targetMonth = (int) $request->input('month', Carbon::now()->month);
        $targetYear = (int) $request->input('year', Carbon::now()->year);

        $prevDate = Carbon::createFromDate($targetYear, $targetMonth, 1)->subMonth();
        $prevBudget = Budget::where('user_id', $user->id)
            ->where('month', $prevDate->month)
            ->where('year', $prevDate->year)
            ->with('budgetCategories')
            ->first();

        if (!$prevBudget) {
            return response()->json([
                'message' => 'Data anggaran bulan sebelumnya tidak ditemukan.',
            ], 404);
        }

        $targetBudget = Budget::updateOrCreate(
            [
                'user_id' => $user->id,
                'month' => $targetMonth,
                'year' => $targetYear,
            ],
            [
                'total_budget' => $prevBudget->total_budget,
                'method' => $prevBudget->method,
            ]
        );

        foreach ($prevBudget->budgetCategories as $item) {
            BudgetCategory::updateOrCreate(
                [
                    'budget_id' => $targetBudget->id,
                    'category_id' => $item->category_id,
                ],
                [
                    'allocated_amount' => $item->allocated_amount,
                ]
            );
        }

        return response()->json([
            'message' => 'Berhasil menyalin alokasi anggaran dari bulan sebelumnya.',
            'budget' => $targetBudget->load('budgetCategories.category'),
        ]);
    }
}
