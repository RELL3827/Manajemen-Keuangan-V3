import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  ShieldCheck,
  Calendar,
  PiggyBank,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  X,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { SavingGoal, Account } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface SavingGoalsPageProps {
  accounts: Account[];
  onRefreshGlobalData: () => void;
}

export const SavingGoalsPage: React.FC<SavingGoalsPageProps> = ({
  accounts,
  onRefreshGlobalData,
}) => {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Goal Form Modal (Add / Edit)
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [periodicContribution, setPeriodicContribution] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number>(0);
  const [goalColor, setGoalColor] = useState('#10B981');
  const [goalError, setGoalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contribute / Withdraw Modal
  const [activeGoalForAction, setActiveGoalForAction] = useState<SavingGoal | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [actionAmount, setActionAmount] = useState<number | ''>('');
  const [actionAccountId, setActionAccountId] = useState<number>(0);
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSavingGoals();
      setGoals(res.goals || []);
      setSummary(res.summary || {});
    } catch (err) {
      console.error('Failed to load saving goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPeriodicContribution('');
    setAccountId(accounts[0]?.id || 0);
    setGoalColor('#10B981');
    setGoalError('');
    setShowGoalModal(true);
  };

  const openEditModal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(goal.target_amount);
    setCurrentAmount(goal.current_amount);
    setTargetDate(goal.target_date);
    setPeriodicContribution(goal.periodic_contribution || '');
    setAccountId(goal.account?.id || accounts[0]?.id || 0);
    setGoalColor(goal.color || '#10B981');
    setGoalError('');
    setShowGoalModal(true);
  };

  const openActionModal = (goal: SavingGoal, type: 'deposit' | 'withdraw') => {
    setActiveGoalForAction(goal);
    setActionType(type);
    setActionAmount(goal.periodic_contribution || '');
    setActionAccountId(goal.account?.id || accounts[0]?.id || 0);
    setActionNotes(type === 'deposit' ? 'Setoran rutin bulanan' : 'Tarik dana tujuan');
    setActionError('');
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setGoalError('Nama tujuan tabungan wajib diisi.');
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setGoalError('Target nominal harus lebih dari Rp 0.');
      return;
    }
    if (!targetDate) {
      setGoalError('Target tanggal penyelesaian wajib dipilih.');
      return;
    }

    setIsSubmitting(true);
    setGoalError('');

    try {
      const payload: any = {
        name: goalName.trim(),
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount) || 0,
        target_date: targetDate,
        periodic_contribution: periodicContribution ? Number(periodicContribution) : null,
        account_id: accountId || null,
        color: goalColor,
      };

      if (editingGoal) {
        await api.updateSavingGoal(editingGoal.id, payload);
      } else {
        await api.createSavingGoal(payload);
      }

      setShowGoalModal(false);
      fetchGoals();
      onRefreshGlobalData();
    } catch (err: any) {
      setGoalError(err.message || 'Gagal menyimpan target tabungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForAction) return;

    if (!actionAmount || Number(actionAmount) <= 0) {
      setActionError('Nominal harus lebih dari Rp 0.');
      return;
    }
    if (!actionAccountId) {
      setActionError('Pilih akun keuangan yang dipotong atau ditambah.');
      return;
    }

    setIsActionLoading(true);
    setActionError('');

    try {
      const res = await api.contributeToGoal(activeGoalForAction.id, {
        account_id: actionAccountId,
        amount: Number(actionAmount),
        type: actionType,
        notes: actionNotes,
      });

      // Check if newly completed! Trigger celebration confetti
      if (res.goal?.is_completed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setActiveGoalForAction(null);
      fetchGoals();
      onRefreshGlobalData();
    } catch (err: any) {
      setActionError(err.message || 'Gagal memproses kontribusi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!window.confirm('Hapus tujuan tabungan ini?')) return;
    try {
      await api.deleteSavingGoal(id);
      fetchGoals();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Tujuan Tabungan (Saving Goals)</h2>
          <p className="text-xs text-slate-400 m-0">
            Wujudkan impian finansial dengan rencana kontribusi berkala dan pelacakan otomatis
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Buat Tujuan Baru</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Target Finansial</span>
          <span className="text-xl font-black font-mono text-white">
            {formatRupiah(summary.total_target || 0)}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Dana Terkumpul</span>
          <span className="text-xl font-black font-mono text-emerald-400">
            {formatRupiah(summary.total_saved || 0)}
          </span>
        </div>
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Kemajuan Keseluruhan</span>
          <span className="text-xl font-black font-mono text-cyan-400">
            {summary.overall_percentage || 0}%
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-xs">Memuat tujuan tabungan...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Belum ada tujuan tabungan. Tekan tombol "+ Buat Tujuan Baru" untuk memulai.
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className={`p-5 rounded-3xl bg-slate-900 border transition-all relative overflow-hidden flex flex-col justify-between ${
                g.is_completed
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: g.color || '#10B981' }}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-bold"
                      style={{ backgroundColor: g.color || '#10B981' }}
                    >
                      <Target className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white m-0 truncate max-w-[150px]">
                        {g.name}
                      </h3>
                      {g.is_completed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Target Tercapai!</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {g.estimated_months_to_target
                              ? `Estimasi ${g.estimated_months_to_target} bln lagi`
                              : `Deadline: ${formatDate(g.target_date)}`}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Edit Tujuan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Hapus Tujuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="my-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300">
                      Terkumpul: <span className="font-mono text-emerald-400">{formatRupiah(g.current_amount)}</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {g.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-emerald-500 to-cyan-400"
                      style={{ width: `${Math.min(100, g.progress_percentage || 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Sisa: {formatRupiah(g.remaining_amount)}</span>
                    <span>Target: {formatRupiah(g.target_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => openActionModal(g, 'deposit')}
                  className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Setor Tabungan</span>
                </button>
                <button
                  onClick={() => openActionModal(g, 'withdraw')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  title="Tarik Dana dari Target"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Goal Add/Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingGoal ? 'Edit Tujuan Tabungan' : 'Buat Tujuan Tabungan Baru'}
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {goalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{goalError}</span>
              </div>
            )}

            <form onSubmit={handleGoalSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Tujuan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Contoh: Dana Darurat, Beli Laptop, Liburan Jepang"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Target Nominal (IDR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                  {targetAmount !== '' && Number(targetAmount) > 0 && (
                    <span className="text-emerald-400 mt-1 block">
                      {formatRupiah(targetAmount)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Saldo Awal Terkumpul
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Target Tanggal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Setoran Rutin Bulanan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={periodicContribution}
                    onChange={(e) => setPeriodicContribution(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 1500000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Akun Tabungan Utama Terkait (Opsional)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value={0}>Pilih Akun Terhubung...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Warna Kartu
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={goalColor}
                    onChange={(e) => setGoalColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
                  />
                  <span className="font-mono text-slate-400">{goalColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Tujuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute / Withdraw Modal */}
      {activeGoalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {actionType === 'deposit' ? 'Setor Dana ke Tujuan' : 'Tarik Dana dari Tujuan'}
              </h3>
              <button
                onClick={() => setActiveGoalForAction(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{activeGoalForAction.name}</span>
                <span className="text-[10px] text-slate-400">
                  Target: {formatRupiah(activeGoalForAction.target_amount)}
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                Terkumpul: {formatRupiah(activeGoalForAction.current_amount)}
              </span>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {actionType === 'deposit' ? 'Dipotong dari Akun' : 'Masuk ke Akun'} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={actionAccountId}
                  onChange={(e) => setActionAccountId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nominal (IDR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:border-emerald-500 focus:outline-hidden"
                  required
                />
                {actionAmount !== '' && Number(actionAmount) > 0 && (
                  <span className="text-emerald-400 font-semibold mt-1 block">
                    {formatRupiah(actionAmount)}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Catatan Transaksi
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveGoalForAction(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isActionLoading ? 'Memproses...' : 'Konfirmasi Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
