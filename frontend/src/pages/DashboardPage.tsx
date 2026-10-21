import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  TrendingUp,
  Receipt,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Calendar,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { Transaction, Account, Bill, SavingGoal, InsightItem, FinancialHealth } from '../types';
import { formatRupiah, formatCompactRupiah, formatDate } from '../utils/formatters';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenAddTransaction: () => void;
  onOpenVoiceInput: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddTransaction,
  onOpenVoiceInput,
}) => {
  const [period, setPeriod] = useState<string>('this_month');
  const [reportData, setReportData] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dueBills, setDueBills] = useState<Bill[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [repRes, txRes, billRes, goalRes, budRes, insRes] = await Promise.all([
        api.getReportsSummary(period),
        api.getTransactions({ per_page: 6 }),
        api.getBills('unpaid'),
        api.getSavingGoals(),
        api.getBudgets(),
        api.getInsights(),
      ]);

      setReportData(repRes);
      setRecentTransactions(txRes.transactions?.data || []);
      setDueBills((billRes.bills || []).slice(0, 4));
      setSavingGoals((goalRes.goals || []).slice(0, 3));
      setBudgetSummary(budRes.summary || null);
      setInsights(insRes.insights || []);
      setHealth(insRes.financial_health || null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const summary = reportData?.summary || {};
  const totalBalance = summary.total_balance || 0;
  const income = summary.income || 0;
  const expense = summary.expense || 0;
  const netCashflow = summary.net_cashflow || 0;
  const savingsRate = summary.savings_rate || 0;
  const expenseDiffPct = summary.expense_diff_pct ?? 0;

  const monthlyTrend = reportData?.monthly_trend || [];
  const categoryBreakdown = reportData?.category_breakdown || [];

  const CHART_COLORS = ['#F43F5E', '#FB923C', '#EAB308', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#64748B'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Financial Health & Quick Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-linear-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                Skor Keuangan: {health?.score || 80}/100
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {health?.status || 'Sehat'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-md">
              {health?.summary || 'Kondisi arus kas berada dalam taraf sehat dengan tabungan yang konsisten.'}
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-stretch md:self-auto overflow-x-auto">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'this_year', label: 'Tahun Ini' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                period === p.id
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Saldo Seluruh Akun</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatRupiah(totalBalance)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
            <span>Dari 6 dompet & rekening aktif</span>
          </div>
        </div>

        {/* Pemasukan */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatRupiah(income)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <span>Periode: {reportData?.period?.current || 'Bulan Ini'}</span>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            {formatRupiah(expense)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            {expenseDiffPct > 0 ? (
              <span className="text-rose-400 font-bold">+{expenseDiffPct}% vs bulan lalu</span>
            ) : expenseDiffPct < 0 ? (
              <span className="text-emerald-400 font-bold">{expenseDiffPct}% vs bulan lalu</span>
            ) : (
              <span className="text-slate-400">Sama dengan periode lalu</span>
            )}
          </div>
        </div>

        {/* Arus Kas Bersih & Rasio Tabungan */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Selisih & Rasio Tabungan</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${netCashflow >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatRupiah(netCashflow)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Rasio Simpanan:</span>
            <span className="font-bold text-cyan-400">{savingsRate}%</span>
          </div>
        </div>
      </div>

      {/* Budget Progress Notification Banner */}
      {budgetSummary && budgetSummary.total_budget > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              budgetSummary.is_critical
                ? 'bg-rose-500/20 text-rose-400'
                : budgetSummary.is_warning
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Anggaran Bulanan ({budgetSummary.percentage}%)
                </span>
                {budgetSummary.is_critical && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400">
                    Kritis (&gt;80%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Terpakai {formatRupiah(budgetSummary.total_spent)} dari total limit {formatRupiah(budgetSummary.total_budget)} (Sisa {formatRupiah(budgetSummary.total_remaining)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetSummary.is_critical
                    ? 'bg-rose-500'
                    : budgetSummary.is_warning
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.percentage)}%` }}
              />
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 shrink-0"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Trend Chart (Area / Bar) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white m-0">Tren Arus Kas (6 Bulan Terakhir)</h2>
              <p className="text-xs text-slate-400 m-0">Perbandingan pemasukan vs pengeluaran aktual</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-300">Pengeluaran</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactRupiah(val)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-emerald-400">
                            Pemasukan: {formatRupiah(payload[0]?.value as number)}
                          </p>
                          <p className="text-rose-400">
                            Pengeluaran: {formatRupiah(payload[1]?.value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white m-0">Pengeluaran per Kategori</h2>
              <span className="text-xs text-slate-400">{categoryBreakdown.length} Kategori</span>
            </div>
            <p className="text-xs text-slate-400">Porsi pengeluaran terbesar periode ini</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(val), 'Total']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">Belum ada pengeluaran periode ini</p>
            )}
          </div>

          {/* Mini Legend List */}
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.slice(0, 3).map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{formatRupiah(cat.amount)}</span>
                  <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Smart Insights Row */}
      {insights.length > 0 && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white m-0">Insight Otomatis Keuangan</h2>
            </div>
            <button
              onClick={() => onNavigate('insights')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Lihat Semua Analisis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.slice(0, 3).map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
              >
                <div className={`p-2 rounded-xl mt-0.5 ${
                  ins.type === 'warning' || ins.type === 'alert'
                    ? 'bg-amber-500/10 text-amber-400'
                    : ins.type === 'danger'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{ins.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ins.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three Columns Bottom Section: Recent Transactions, Due Bills, Saving Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white m-0">Transaksi Terbaru</h2>
                <p className="text-xs text-slate-400 m-0">Aktivitas keuangan paling mutakhir</p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Semua Transaksi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada transaksi tercatat. Klik "+ Tambah Transaksi" untuk mulai.
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : tx.type === 'expense' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{tx.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tx.category?.name || (tx.type === 'transfer' ? 'Transfer' : '-')} • {tx.account?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold font-mono ${
                          tx.type === 'income'
                            ? 'text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatRupiah(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={onOpenAddTransaction}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              + Catat Transaksi Baru
            </button>
            <button
              onClick={onOpenVoiceInput}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Input Suara</span>
            </button>
          </div>
        </div>

        {/* Right Column: Bills Due Soon & Saving Goals */}
        <div className="space-y-6">
          {/* Bills Widget */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white m-0">Tagihan Jatuh Tempo</h2>
              </div>
              <button
                onClick={() => onNavigate('bills')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {dueBills.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 text-center text-xs text-slate-400">
                  Tidak ada tagihan tertunggak. Semua tagihan aman!
                </div>
              ) : (
                dueBills.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{b.title}</p>
                      <span className="text-[10px] text-amber-400">
                        {b.days_left !== undefined && b.days_left <= 0
                          ? 'Jatuh tempo hari ini'
                          : `Jatuh tempo ${b.days_left} hari lagi`}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white font-mono">{formatRupiah(b.amount)}</p>
                      <button
                        onClick={() => onNavigate('bills')}
                        className="text-[10px] font-bold text-emerald-400 hover:underline"
                      >
                        Bayar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Saving Goals Widget */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white m-0">Tujuan Tabungan</h2>
              </div>
              <button
                onClick={() => onNavigate('saving-goals')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Semua Target
              </button>
            </div>

            <div className="space-y-3">
              {savingGoals.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 text-center text-xs text-slate-400">
                  Belum ada tujuan tabungan dibuat.
                </div>
              ) : (
                savingGoals.map((g) => (
                  <div key={g.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-white truncate">{g.name}</span>
                      <span className="text-emerald-400 font-bold">{g.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400"
                        style={{ width: `${Math.min(100, g.progress_percentage || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Terkumpul: {formatRupiah(g.current_amount)}</span>
                      <span>Target: {formatRupiah(g.target_amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
