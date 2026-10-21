import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Landmark,
  Smartphone,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  Edit2,
  Archive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { Account } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AccountsPageProps {
  onRefreshGlobalData: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onRefreshGlobalData }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Form states for Account modal
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Account['type']>('bank');
  const [formNumber, setFormNumber] = useState('');
  const [formInitialBalance, setFormInitialBalance] = useState<number | ''>('');
  const [formColor, setFormColor] = useState('#10B981');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Transfer modal
  const [transferFrom, setTransferFrom] = useState<number>(0);
  const [transferTo, setTransferTo] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAccounts(true);
      setAccounts(res.accounts || []);
      setTotalBalance(res.total_balance || 0);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('bank');
    setFormNumber('');
    setFormInitialBalance('');
    setFormColor('#10B981');
    setFormDesc('');
    setFormError('');
    setShowAccountModal(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormNumber(acc.account_number || '');
    setFormInitialBalance(acc.initial_balance);
    setFormColor(acc.color || '#10B981');
    setFormDesc(acc.description || '');
    setFormError('');
    setShowAccountModal(true);
  };

  const openTransferModal = (defaultFromId?: number) => {
    setTransferFrom(defaultFromId || accounts[0]?.id || 0);
    setTransferTo(accounts.find((a) => a.id !== (defaultFromId || accounts[0]?.id))?.id || 0);
    setTransferAmount('');
    setTransferNotes('');
    setTransferError('');
    setShowTransferModal(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama akun tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: any = {
        name: formName.trim(),
        type: formType,
        account_number: formNumber.trim() || null,
        color: formColor,
        description: formDesc.trim() || null,
      };

      if (!editingAccount) {
        payload.initial_balance = Number(formInitialBalance) || 0;
        await api.createAccount(payload);
      } else {
        await api.updateAccount(editingAccount.id, payload);
      }

      setShowAccountModal(false);
      fetchAccounts();
      onRefreshGlobalData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      setTransferError('Pilih dua akun yang berbeda.');
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferError('Nominal transfer harus lebih dari Rp 0.');
      return;
    }

    setIsTransferring(true);
    setTransferError('');

    try {
      await api.transferBetweenAccounts({
        from_account_id: transferFrom,
        to_account_id: transferTo,
        amount: Number(transferAmount),
        notes: transferNotes.trim() || 'Transfer antar akun',
      });

      setShowTransferModal(false);
      fetchAccounts();
      onRefreshGlobalData();
    } catch (err: any) {
      setTransferError(err.message || 'Gagal melakukan transfer.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleArchiveAccount = async (id: number) => {
    if (!window.confirm('Arsipkan akun ini? Riwayat transaksi tetap tersimpan dengan aman.')) return;
    try {
      await api.deleteAccountRecord(id);
      fetchAccounts();
      onRefreshGlobalData();
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-5 h-5 text-sky-400" />;
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-indigo-400" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAccountTypeLabel = (type: Account['type']) => {
    switch (type) {
      case 'bank': return 'Rekening Bank';
      case 'cash': return 'Uang Tunai';
      case 'ewallet': return 'Dompet Digital';
      case 'savings': return 'Tabungan Berjangka';
      case 'investment': return 'Investasi & Portofolio';
      default: return 'Lainnya';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Akun, Bank & Dompet Keuangan</h2>
          <p className="text-xs text-slate-400 m-0">
            Total Likuiditas Seluruh Akun: <span className="font-bold text-emerald-400 font-mono">{formatRupiah(totalBalance)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTransferModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transfer Antar Akun</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-xs">Memuat akun keuangan Anda...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Belum ada akun keuangan terdaftar.
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className={`p-5 rounded-3xl bg-slate-900 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                acc.is_archived
                  ? 'border-slate-800/40 opacity-60'
                  : 'border-slate-800 hover:border-slate-700 hover:shadow-xl'
              }`}
            >
              {/* Account Color Stripe Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: acc.color || '#10B981' }}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-xs">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white m-0 truncate max-w-[150px]">
                        {acc.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        {getAccountTypeLabel(acc.type)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      title="Edit Akun"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!acc.is_archived && (
                      <button
                        onClick={() => handleArchiveAccount(acc.id)}
                        title="Arsipkan Akun"
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {acc.account_number && (
                  <p className="text-[11px] font-mono text-slate-400 mb-2">
                    No: {acc.account_number}
                  </p>
                )}

                {acc.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {acc.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Saldo Saat Ini
                </span>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {formatRupiah(acc.balance)}
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/40">
                  <span>Saldo Awal: {formatRupiah(acc.initial_balance)}</span>
                  <button
                    onClick={() => openTransferModal(acc.id)}
                    className="text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Transfer</span>
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Account Modal (Create & Edit) */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Baru'}
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Akun / Bank <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: BCA Prioritas, Dompet Tunai, Bibit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Jenis Akun
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="cash">Uang Tunai</option>
                    <option value="ewallet">Dompet Digital</option>
                    <option value="savings">Tabungan</option>
                    <option value="investment">Investasi</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Warna Aksen
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
                    />
                    <span className="font-mono text-slate-400">{formColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nomor Rekening / ID Akun (Opsional)
                </label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="Contoh: 8210492817"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Saldo Awal (IDR)
                  </label>
                  <input
                    type="number"
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                  />
                  {formInitialBalance !== '' && Number(formInitialBalance) > 0 && (
                    <span className="text-emerald-400 mt-1 block">
                      {formatRupiah(formInitialBalance)}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Deskripsi / Catatan Akun
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Keterangan peruntukan akun..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Transfer Antar Akun</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Dari Akun Sumber
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  {accounts.filter((a) => !a.is_archived).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ke Akun Tujuan
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                >
                  {accounts.filter((a) => !a.is_archived).map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === transferFrom}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nominal Transfer (IDR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm font-bold focus:border-emerald-500 focus:outline-hidden"
                  required
                />
                {transferAmount !== '' && Number(transferAmount) > 0 && (
                  <span className="text-cyan-400 mt-1 block font-semibold">
                    {formatRupiah(transferAmount)}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Top Up e-Wallet mingguan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="flex-1 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold disabled:opacity-50"
                >
                  {isTransferring ? 'Memproses...' : 'Kirim Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
