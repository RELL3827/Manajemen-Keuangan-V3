import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  RefreshCw,
  Repeat,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Play,
} from 'lucide-react';
import { api } from '../services/api';
import { Bill, RecurringTransaction, Account, Category } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface BillsPageProps {
  accounts: Account[];
  categories: Category[];
  onRefreshGlobalData: () => void;
}

export const BillsPage: React.FC<BillsPageProps> = ({
  accounts,
  categories,
  onRefreshGlobalData,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Bill Modal states
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState<number | ''>('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billFrequency, setBillFrequency] = useState<Bill['frequency']>('monthly');
  const [billAccountId, setBillAccountId] = useState<number>(0);
  const [billCategoryId, setBillCategoryId] = useState<number>(0);
  const [billReminderDays, setBillReminderDays] = useState<number>(3);
  const [billNotes, setBillNotes] = useState('');
  const [billError, setBillError] = useState('');
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  // Pay Modal
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);

  const fetchBillsAndRecurring = async () => {
    setIsLoading(true);
    try {
      const [billsRes, recurRes] = await Promise.all([
        api.getBills(statusFilter === 'all' ? undefined : statusFilter),
        api.getRecurringTransactions(),
      ]);

      setBills(billsRes.bills || []);
      setSummary(billsRes.summary || {});
      setRecurringTxs(recurRes.recurring_transactions || []);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndRecurring();
  }, [statusFilter]);

  const openAddBillModal = () => {
    setEditingBill(null);
    setBillTitle('');
    setBillAmount('');
    setBillDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setBillFrequency('monthly');
    setBillAccountId(accounts[0]?.id || 0);
    setBillCategoryId(categories.find((c) => c.name.toLowerCase().includes('tagihan'))?.id || categories[0]?.id || 0);
    setBillReminderDays(3);
    setBillNotes('');
    setBillError('');
    setShowBillModal(true);
  };

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim()) {
      setBillError('Judul tagihan wajib diisi.');
      return;
    }
    if (!billAmount || Number(billAmount) <= 0) {
      setBillError('Nominal tagihan harus lebih dari Rp 0.');
      return;
    }
    if (!billDueDate) {
      setBillError('Tanggal jatuh tempo wajib ditentukan.');
      return;
    }

    setIsSubmittingBill(true);
    setBillError('');

    try {
      const payload: any = {
        title: billTitle.trim(),
        amount: Number(billAmount),
        due_date: billDueDate,
        frequency: billFrequency,
        account_id: billAccountId || null,
        category_id: billCategoryId || null,
        reminder_days_before: billReminderDays,
        notes: billNotes.trim() || null,
      };

      if (editingBill) {
        await api.updateBill(editingBill.id, payload);
      } else {
        await api.createBill(payload);
      }

      setShowBillModal(false);
      fetchBillsAndRecurring();
    } catch (err: any) {
      setBillError(err.message || 'Gagal menyimpan tagihan.');
    } finally {
      setIsSubmittingBill(false);
    }
  };

  const handlePayConfirm = async () => {
    if (!payingBill) return;
    setIsPaying(true);
    try {
      await api.markBillAsPaid(payingBill.id, payAccountId || payingBill.account_id || undefined);
      setPayingBill(null);
      fetchBillsAndRecurring();
      onRefreshGlobalData();
    } catch (err: any) {
      alert(err.message || 'Gagal menandai pembayaran.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleMarkUnpaid = async (id: number) => {
    if (!window.confirm('Batalkan status lunas? Transaksi pembayaran terkait akan dihapus dan saldo akun dikembalikan.')) return;
    try {
      await api.markBillAsUnpaid(id);
      fetchBillsAndRecurring();
      onRefreshGlobalData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pembayaran.');
    }
  };

  const handleDeleteBill = async (id: number) => {
    if (!window.confirm('Hapus jadwal tagihan ini?')) return;
    try {
      await api.deleteBill(id);
      fetchBillsAndRecurring();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleProcessRecurring = async (id: number) => {
    try {
      await api.processRecurringNow(id);
      alert('Transaksi berulang berhasil dieksekusi!');
      fetchBillsAndRecurring();
      onRefreshGlobalData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi rutin.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Tagihan & Transaksi Berulang</h2>
          <p className="text-xs text-slate-400 m-0">
            Hindari denda keterlambatan dengan pengingat jatuh tempo otomatis
          </p>
        </div>

        <button
          onClick={openAddBillModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Tagihan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Tagihan Belum Dibayar</span>
          <span className="text-xl font-black font-mono text-rose-400">
            {formatRupiah(summary.total_unpaid_amount || 0)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {summary.unpaid_count || 0} tagihan aktif menunggu pembayaran
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Mendekati Jatuh Tempo (&lt;=3 Hari)</span>
          <span className="text-xl font-black font-mono text-amber-400">
            {summary.due_soon_count || 0} Tagihan
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Segera siapkan saldo pembayaran
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Status Lewat Batas (Overdue)</span>
          <span className="text-xl font-black font-mono text-rose-500">
            {summary.overdue_count || 0} Tagihan
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Prioritaskan untuk segera dilunasi
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
        {[
          { id: 'all', label: 'Semua Status' },
          { id: 'unpaid', label: 'Belum Lunas' },
          { id: 'paid', label: 'Sudah Lunas' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === f.id
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bills List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-xs">Memuat daftar tagihan...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Tidak ada tagihan pada kategori filter ini.
          </div>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className={`p-5 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
                bill.is_paid
                  ? 'border-slate-800/60 opacity-60'
                  : bill.is_overdue
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : bill.is_due_soon
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white m-0 truncate max-w-[150px]">
                        {bill.title}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        Rutin: {bill.frequency === 'monthly' ? 'Bulanan' : bill.frequency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-2">
                  <div className="text-2xl font-black font-mono text-white">
                    {formatRupiah(bill.amount)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mt-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300">
                      Jatuh tempo: <span className="font-semibold">{formatDate(bill.due_date)}</span>
                    </span>
                  </div>
                  {bill.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {bill.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Status and Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <div>
                  {bill.is_paid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Lunas</span>
                    </span>
                  ) : bill.is_overdue ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Lewat {Math.abs(bill.days_left || 0)} Hari</span>
                    </span>
                  ) : bill.is_due_soon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      <span>{bill.days_left} Hari Lagi</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {bill.days_left} hari lagi
                    </span>
                  )}
                </div>

                {bill.is_paid ? (
                  <button
                    onClick={() => handleMarkUnpaid(bill.id)}
                    className="text-xs text-slate-400 hover:text-rose-400 underline"
                  >
                    Batal Lunas
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPayingBill(bill);
                      setPayAccountId(bill.account_id || accounts[0]?.id || 0);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    Tandai Lunas
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recurring Transactions Section */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white m-0">Transaksi Berulang Otomatis</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringTxs.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-white">{rec.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-emerald-400 font-semibold">{formatRupiah(rec.amount)}</span>
                  <span>•</span>
                  <span className="capitalize">{rec.frequency}</span>
                  <span>•</span>
                  <span>Berikutnya: {formatDate(rec.next_due_date)}</span>
                </div>
              </div>

              <button
                onClick={() => handleProcessRecurring(rec.id)}
                title="Proses Transaksi Sekarang"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Proses</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Modal Confirmation */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Konfirmasi Pembayaran</h3>
              <button onClick={() => setPayingBill(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Membayar <span className="font-bold text-white">"{payingBill.title}"</span> sebesar{' '}
              <span className="font-bold font-mono text-emerald-400">{formatRupiah(payingBill.amount)}</span>.
              Pilih rekening/dompet yang akan dipotong:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Rekening Pembayaran
              </label>
              <select
                value={payAccountId}
                onChange={(e) => setPayAccountId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatRupiah(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePayConfirm}
                disabled={isPaying}
                className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold disabled:opacity-50"
              >
                {isPaying ? 'Memproses...' : 'Bayar & Potong Saldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Add / Edit Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingBill ? 'Edit Tagihan' : 'Tambah Tagihan Baru'}
              </h3>
              <button onClick={() => setShowBillModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {billError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{billError}</span>
              </div>
            )}

            <form onSubmit={handleBillSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Tagihan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="Contoh: Listrik PLN, WiFi IndiHome, Cicilan Motor"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nominal (IDR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs font-bold focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                  {billAmount !== '' && Number(billAmount) > 0 && (
                    <span className="text-emerald-400 font-semibold mt-1 block">
                      {formatRupiah(billAmount)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tanggal Jatuh Tempo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Frekuensi Pengulangan
                  </label>
                  <select
                    value={billFrequency}
                    onChange={(e) => setBillFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="one_time">Sekali Bayar</option>
                    <option value="monthly">Bulanan</option>
                    <option value="weekly">Mingguan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Ingatkan (Hari Sebelum)
                  </label>
                  <select
                    value={billReminderDays}
                    onChange={(e) => setBillReminderDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value={1}>1 Hari Sebelumnya</option>
                    <option value={3}>3 Hari Sebelumnya</option>
                    <option value={5}>5 Hari Sebelumnya</option>
                    <option value={7}>7 Hari Sebelumnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Catatan / Nomor Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="Contoh: No ID Pelanggan 142091823"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBill}
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isSubmittingBill ? 'Menyimpan...' : 'Simpan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
