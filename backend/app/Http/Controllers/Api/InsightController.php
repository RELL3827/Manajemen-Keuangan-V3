<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\SavingGoal;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();

        $startThisMonth = $now->copy()->startOfMonth()->toDateString();
        $endThisMonth = $now->copy()->endOfMonth()->toDateString();

        $startLastMonth = $now->copy()->subMonth()->startOfMonth()->toDateString();
        $endLastMonth = $now->copy()->subMonth()->endOfMonth()->toDateString();

        $thisMonthTxs = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$startThisMonth, $endThisMonth])
            ->with('category')
            ->get();

        $lastMonthTxs = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$startLastMonth, $endLastMonth])
            ->with('category')
            ->get();

        $insights = [];

        // Insight 1: Total expense comparison MoM
        $thisMonthExpense = (float) $thisMonthTxs->where('type', 'expense')->sum('amount');
        $lastMonthExpense = (float) $lastMonthTxs->where('type', 'expense')->sum('amount');

        if ($lastMonthExpense > 0 && $thisMonthExpense > 0) {
            $diffPct = round((($thisMonthExpense - $lastMonthExpense) / $lastMonthExpense) * 100, 1);
            if ($diffPct > 10) {
                $insights[] = [
                    'id' => 'expense_growth',
                    'type' => 'warning',
                    'icon' => 'trending-up',
                    'title' => 'Pengeluaran Meningkat',
                    'message' => "Total pengeluaran bulan ini naik {$diffPct}% dibandingkan bulan lalu. Periksa kembali pengeluaran non-primer Anda.",
                    'metric' => "+{$diffPct}%",
                    'priority' => 1,
                ];
            } elseif ($diffPct < -10) {
                $abs = abs($diffPct);
                $insights[] = [
                    'id' => 'expense_saved',
                    'type' => 'success',
                    'icon' => 'sparkles',
                    'title' => 'Penghematan Efektif',
                    'message' => "Hebat! Pengeluaran Anda hemat {$abs}% lebih rendah dibanding periode bulan lalu.",
                    'metric' => "-{$abs}%",
                    'priority' => 2,
                ];
            }
        }

        // Insight 2: Category specific surge
        $thisCatExpenses = $thisMonthTxs->where('type', 'expense')->groupBy('category_id');
        $lastCatExpenses = $lastMonthTxs->where('type', 'expense')->groupBy('category_id');

        foreach ($thisCatExpenses as $catId => $items) {
            $catName = $items->first()->category->name ?? 'Kategori';
            $catThis = (float) $items->sum('amount');
            $catLast = isset($lastCatExpenses[$catId]) ? (float) $lastCatExpenses[$catId]->sum('amount') : 0;

            if ($catLast > 50000 && $catThis > $catLast) {
                $catDiffPct = round((($catThis - $catLast) / $catLast) * 100, 1);
                if ($catDiffPct >= 15) {
                    $insights[] = [
                        'id' => 'cat_surge_' . $catId,
                        'type' => 'alert',
                        'icon' => 'alert-triangle',
                        'title' => "Kategori {$catName} Naik",
                        'message' => "Pengeluaran {$catName} bulan ini meningkat {$catDiffPct}% dibandingkan bulan lalu.",
                        'metric' => "+{$catDiffPct}%",
                        'priority' => 2,
                    ];
                    break; // Just report the most notable one
                }
            }
        }

        // Insight 3: Top spending category
        if ($thisMonthExpense > 0) {
            $topCatGroup = $thisCatExpenses->sortByDesc(fn($g) => $g->sum('amount'))->first();
            if ($topCatGroup) {
                $topCatName = $topCatGroup->first()->category->name ?? 'Lainnya';
                $topCatAmount = (float) $topCatGroup->sum('amount');
                $topCatPct = round(($topCatAmount / $thisMonthExpense) * 100, 1);

                $insights[] = [
                    'id' => 'top_category',
                    'type' => 'info',
                    'icon' => 'pie-chart',
                    'title' => 'Kategori Pengeluaran Terbesar',
                    'message' => "Pengeluaran {$topCatName} menjadi porsi terbesar bulan ini dengan {$topCatPct}% dari seluruh pengeluaran.",
                    'metric' => "{$topCatPct}%",
                    'priority' => 3,
                ];
            }
        }

        // Insight 4: Budget status
        $currentBudget = Budget::where('user_id', $user->id)
            ->where('month', $now->month)
            ->where('year', $now->year)
            ->with('budgetCategories.category')
            ->first();

        if ($currentBudget) {
            foreach ($currentBudget->budgetCategories as $bc) {
                $allocated = (float) $bc->allocated_amount;
                $spent = isset($thisCatExpenses[$bc->category_id]) ? (float) $thisCatExpenses[$bc->category_id]->sum('amount') : 0;
                if ($allocated > 0) {
                    $pct = round(($spent / $allocated) * 100, 1);
                    if ($pct >= 85 && $pct <= 100) {
                        $catTitle = $bc->category->name ?? 'Kategori';
                        $insights[] = [
                            'id' => 'budget_critical_' . $bc->id,
                            'type' => 'warning',
                            'icon' => 'shield-alert',
                            'title' => 'Peringatan Anggaran',
                            'message' => "Anggaran {$catTitle} telah terpakai {$pct}%. Anda mendekati batas limit bulan ini.",
                            'metric' => "{$pct}%",
                            'priority' => 1,
                        ];
                        break;
                    } elseif ($pct > 100) {
                        $catTitle = $bc->category->name ?? 'Kategori';
                        $insights[] = [
                            'id' => 'budget_exceeded_' . $bc->id,
                            'type' => 'danger',
                            'icon' => 'flame',
                            'title' => 'Anggaran Terlampaui',
                            'message' => "Anggaran {$catTitle} telah melampaui batas dengan pemakaian {$pct}%.",
                            'metric' => "Over {$pct}%",
                            'priority' => 1,
                        ];
                        break;
                    }
                }
            }
        }

        // Insight 5: Saving Goals estimation
        $activeGoals = SavingGoal::where('user_id', $user->id)
            ->where('is_completed', false)
            ->where('current_amount', '<', DB::raw('target_amount'))
            ->get();

        foreach ($activeGoals as $goal) {
            $rem = (float) $goal->target_amount - (float) $goal->current_amount;
            $periodic = (float) ($goal->periodic_contribution ?? 0);
            if ($periodic > 0 && $rem > 0) {
                $monthsNeeded = ceil($rem / $periodic);
                $insights[] = [
                    'id' => 'goal_eta_' . $goal->id,
                    'type' => 'goal',
                    'icon' => 'target',
                    'title' => "Proyeksi Tujuan: {$goal->name}",
                    'message' => "Jika pola tabungan saat ini berlanjut (Rp " . number_format($periodic, 0, ',', '.') . "/bln), target {$goal->name} diperkirakan tercapai dalam {$monthsNeeded} bulan.",
                    'metric' => "{$monthsNeeded} bln",
                    'priority' => 2,
                ];
                break;
            }
        }

        // Financial health summary
        $totalIncome = (float) $thisMonthTxs->where('type', 'income')->sum('amount');
        $savingsRate = $totalIncome > 0 ? round((max(0, $totalIncome - $thisMonthExpense) / $totalIncome) * 100, 1) : 0;

        $healthStatus = 'Sehat';
        $healthScore = 80;
        if ($savingsRate >= 30) {
            $healthStatus = 'Sangat Sehat';
            $healthScore = 95;
        } elseif ($savingsRate >= 15) {
            $healthStatus = 'Cukup Baik';
            $healthScore = 75;
        } elseif ($totalIncome > 0 && $savingsRate < 10) {
            $healthStatus = 'Perlu Diwaspadai';
            $healthScore = 50;
        } elseif ($totalIncome == 0 && $thisMonthExpense > 0) {
            $healthStatus = 'Defisit';
            $healthScore = 35;
        }

        return response()->json([
            'has_sufficient_data' => ($thisMonthTxs->count() + $lastMonthTxs->count()) >= 3,
            'insights' => $insights,
            'financial_health' => [
                'score' => $healthScore,
                'status' => $healthStatus,
                'savings_rate' => $savingsRate,
                'summary' => "Kondisi arus kas berada dalam taraf {$healthStatus} dengan rasio tabungan {$savingsRate}%.",
            ],
        ]);
    }
}
