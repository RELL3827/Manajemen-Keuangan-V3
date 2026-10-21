import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  Calculator,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Budget, Category } from '../types';
import { formatRupiah } from '../utils/formatters';

export const BudgetsPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgetData, setBudgetData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [unbudgetedCats, setUnbudgetedCats] = useState<Category[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Allocation State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState<number | ''>('');
  const [allocations, setAllocations] = useState<{ category_id: number; allocated_amount: number; name?: string }[]>([]);
  const [method, setMethod] = useState<'custom' | 'fixed' | '50_30_20'>('custom');

  // 50/30/20 Calculator Modal
  const [show503020Modal, setShow503020Modal] = useState(false);
  const [incomeInput, setIncomeInput] = useState<number | ''>(10000000);

  const fetchBudget = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBudgets(selectedMonth, selectedYear);
      setBudgetData(res.budget);
      setCategories(res.categories || []);
      setUnbudgetedCats(res.unbudgeted_categories || []);
      setSummary(res.summary || {});

      if (res.budget) {
        setTotalBudgetInput(res.budget.total_budget);
        setAllocations(
          (res.categories || []).map((c: any) => ({
            category_id: c.category_id,
            allocated_amount: c.allocated_amount,
            name: c.category_name,
          }))
        );
      } else {
        setTotalBudgetInput('');
        setAllocations([]);
      }
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCopyPrevious = async () => {
    try {
      await api.copyPreviousBudget(selectedMonth, selectedYear);
      fetchBudget();
    } catch (err: any) {
      alert(err.message || 'Gagal menyalin anggaran bulan lalu.');
    }
  };

  const handleOpenConfigModal = () => {
    if (budgetData) {
      setTotalBudgetInput(budgetData.total_budget);
      setAllocations(
        categories.map((c: any) => ({
          category_id: c.category_id,
          allocated_amount: c.allocated_amount,
          name: c.category_name,
        }))
      );
    } else {
      setTotalBudgetInput(5000000);
      setAllocations([]);
    }
    setShowConfigModal(true);
  };

  const handleAddCategoryAllocation = (cat: Category) => {
    setAllocations((prev) => [
      ...prev,
      { category_id: cat.id, allocated_amount: 500000, name: cat.name },
    ]);
  };

  const handleRemoveCategoryAllocation = (catId: number) => {
    setAllocations((prev) => prev.filter((a) => a.category_id !== catId));
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveBudget({
        month: selectedMonth,
        year: selectedYear,
        total_budget: Number(totalBudgetInput) || 0,
        method,
        categories: allocations,
      });
      setShowConfigModal(false);
      fetchBudget();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan anggaran.');
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Anggaran Bulanan (Budgeting)</h2>
          <p className="text-xs text-slate-400 m-0">
            Kendalikan pengeluaran dengan alokasi terencana dan peringatan limit real-time
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-3 font-mono">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShow503020Modal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator 50/30/20</span>
          </button>

          <button
            onClick={handleCopyPrevious}
            title="Salin alokasi bulan lalu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Bulan Lalu</span>
          </button>

          <button
            onClick={handleOpenConfigModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{budgetData ? 'Ubah Alokasi' : 'Atur Anggaran'}</span>
          </button>
        </div>
      </div>

      {/* Main Total Budget Progress Card */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Total Batas Pengeluaran Bulan Ini
            </span>
            <div className="text-3xl font-black font-mono text-white mt-1">
              {formatRupiah(summary.total_budget || 0)}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">Sudah Terpakai</span>
              <span className="text-lg font-bold font-mono text-rose-400">
                {formatRupiah(summary.total_spent || 0)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Sisa Anggaran</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {formatRupiah(summary.total_remaining || 0)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Pemakaian</span>
              <span className={`text-lg font-bold font-mono ${
                summary.is_critical ? 'text-rose-400' : summary.is_warning ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {summary.percentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              summary.is_critical
                ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                : summary.is_warning
                ? 'bg-amber-400'
                : 'bg-emerald-400 shadow-md shadow-emerald-400/50'
            }`}
            style={{ width: `${Math.min(100, summary.percentage || 0)}%` }}
          />
        </div>

        {/* Threshold Markers */}
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
          <span>0%</span>
          <span className="text-emerald-500/80">50% Waspada</span>
          <span className="text-amber-500/80">80% Kritis</span>
          <span className="text-rose-500/80">100% Batas Limit</span>
        </div>
      </div>

      {/* Categories Allocation Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Alokasi Anggaran per Kategori</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
            <span>Memuat rincian anggaran...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
            <p className="text-xs mb-3">Belum ada alokasi anggaran kategori untuk bulan ini.</p>
            <button
              onClick={handleOpenConfigModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Mulai Susun Anggaran
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`p-4 rounded-3xl bg-slate-900 border transition-all ${
                  cat.is_over_budget
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : cat.is_critical
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.category_color }}
                    />
                    <span className="text-sm font-bold text-white truncate max-w-[140px]">
                      {cat.category_name}
                    </span>
                  </div>

                  {cat.is_over_budget ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400">
                      Lewat Limit
                    </span>
                  ) : cat.is_critical ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400">
                      Kritis ({cat.percentage}%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      {cat.percentage}%
                    </span>
                  )}
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden my-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.is_over_budget
                        ? 'bg-rose-500'
                        : cat.is_critical
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, cat.percentage || 0)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Terpakai:</span>
                  <span className="font-bold font-mono text-white">
                    {formatRupiah(cat.spent_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Alokasi:</span>
                  <span className="font-mono text-slate-300">
                    {formatRupiah(cat.allocated_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/80 mt-2">
                  <span className="text-[11px] text-slate-400">Sisa Kuota:</span>
                  <span className={`font-mono font-bold ${cat.is_over_budget ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {cat.is_over_budget
                      ? `Defisit ${formatRupiah(cat.spent_amount - cat.allocated_amount)}`
                      : formatRupiah(cat.remaining_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config / Edit Allocation Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Konfigurasi Anggaran ({monthNames[selectedMonth - 1]} {selectedYear})
                </h3>
                <p className="text-xs text-slate-400">Tentukan batas total dan jatah tiap pos pengeluaran</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 overflow-y-auto flex-1 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Total Anggaran Bulanan (IDR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalBudgetInput}
                  onChange={(e) => setTotalBudgetInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:border-emerald-500 focus:outline-hidden"
                  required
                />
                {totalBudgetInput !== '' && Number(totalBudgetInput) > 0 && (
                  <span className="text-emerald-400 font-semibold mt-1 block">
                    {formatRupiah(totalBudgetInput)}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Metode Penganggaran
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="custom">Anggaran Kustom (Bebas)</option>
                  <option value="fixed">Anggaran Tetap Bulanan</option>
                  <option value="50_30_20">Metode 50/30/20</option>
                </select>
              </div>

              {/* Allocations Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300">Alokasi Tiap Kategori</span>
                  <span className="text-[10px] text-slate-400">
                    Total Dialokasikan: {formatRupiah(allocations.reduce((sum, a) => sum + (Number(a.allocated_amount) || 0), 0))}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allocations.map((alloc, idx) => (
                    <div
                      key={alloc.category_id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <span className="text-xs text-white font-semibold flex-1 truncate">
                        {alloc.name || `Kategori #${alloc.category_id}`}
                      </span>
                      <div className="w-36">
                        <input
                          type="number"
                          min="0"
                          value={alloc.allocated_amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, allocated_amount: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryAllocation(alloc.category_id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add remaining categories */}
                {unbudgetedCats.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1.5">
                      Tambah kategori ke anggaran:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unbudgetedCats
                        .filter((ub) => !allocations.some((a) => a.category_id === ub.id))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleAddCategoryAllocation(cat)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700 transition-colors"
                          >
                            + {cat.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 50/30/20 Calculator Modal */}
      {show503020Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Kalkulator Aturan 50/30/20</h3>
              </div>
              <button
                onClick={() => setShow503020Modal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Metode penganggaran populer yang membagi penghasilan bersih bulanan Anda menjadi 3 pos: Kebutuhan (50%), Keinginan (30%), dan Tabungan/Investasi (20%).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Penghasilan Bersih Bulanan (IDR)
              </label>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-400 block">50% Kebutuhan Pokok</span>
                  <span className="text-[10px] text-slate-400">Sewa, makan, listrik, transportasi, tagihan</span>
                </div>
                <span className="font-mono font-bold text-sm text-white">
                  {formatRupiah((Number(incomeInput) || 0) * 0.5)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 block">30% Keinginan & Hiburan</span>
                  <span className="text-[10px] text-slate-400">Hangout, belanja fashion, hobi, liburan</span>
                </div>
                <span className="font-mono font-bold text-sm text-white">
                  {formatRupiah((Number(incomeInput) || 0) * 0.3)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">20% Tabungan & Investasi</span>
                  <span className="text-[10px] text-slate-400">Dana darurat, reksadana, cicilan pelunasan</span>
                </div>
                <span className="font-mono font-bold text-sm text-white">
                  {formatRupiah((Number(incomeInput) || 0) * 0.2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setTotalBudgetInput((Number(incomeInput) || 0) * 0.8);
                  setMethod('50_30_20');
                  setShow503020Modal(false);
                  setShowConfigModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                Gunakan Angka Ini ke Anggaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
