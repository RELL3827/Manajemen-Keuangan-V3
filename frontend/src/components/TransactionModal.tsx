import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Account, Category, Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: Transaction | null;
  accounts: Account[];
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  accounts,
  categories,
}) => {
  const isEdit = Boolean(transactionToEdit);

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountId, setAccountId] = useState<number>(0);
  const [toAccountId, setToAccountId] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setName(transactionToEdit.name);
      setAmount(transactionToEdit.amount);
      setAccountId(transactionToEdit.account_id);
      setToAccountId(transactionToEdit.to_account_id || accounts[1]?.id || accounts[0]?.id || 0);
      setCategoryId(transactionToEdit.category_id || 0);
      setDate(transactionToEdit.date);
      setTime(transactionToEdit.time || '12:00');
      setPaymentMethod(transactionToEdit.payment_method || 'transfer');
      setNotes(transactionToEdit.notes || '');
      setIsRecurring(transactionToEdit.is_recurring || false);
    } else {
      setType('expense');
      setName('');
      setAmount('');
      const defaultAcc = accounts[0]?.id || 0;
      setAccountId(defaultAcc);
      setToAccountId(accounts[1]?.id || defaultAcc);
      const defaultCat = categories.find((c) => c.type === 'expense')?.id || 0;
      setCategoryId(defaultCat);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setPaymentMethod('transfer');
      setNotes('');
      setIsRecurring(false);
    }
    setErrorMsg('');
  }, [transactionToEdit, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Nama transaksi wajib diisi.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari Rp 0.');
      return;
    }
    if (!accountId) {
      setErrorMsg('Akun sumber wajib dipilih.');
      return;
    }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setErrorMsg('Akun tujuan transfer harus berbeda dengan akun sumber.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload: any = {
        name,
        type,
        amount: Number(amount),
        account_id: accountId,
        date,
        time,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        is_recurring: isRecurring,
      };

      if (type === 'transfer') {
        payload.to_account_id = toAccountId;
        payload.category_id = null;
      } else {
        payload.category_id = categoryId || null;
      }

      if (isEdit && transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, payload);
      } else {
        await api.createTransaction(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white m-0">
              {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h2>
            <p className="text-[11px] text-slate-400 m-0">
              {isEdit ? 'Perbarui data transaksi yang dipilih' : 'Catat pemasukan, pengeluaran, atau transfer baru'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-left">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const defaultCat = categories.find((c) => c.type === 'expense')?.id || 0;
                setCategoryId(defaultCat);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const defaultCat = categories.find((c) => c.type === 'income')?.id || 0;
                setCategoryId(defaultCat);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'transfer'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal (IDR) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base font-bold focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
            {amount !== '' && Number(amount) > 0 && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                {formatRupiah(amount)}
              </p>
            )}
          </div>

          {/* Transaction Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Transaksi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Belanja Bulanan, Gaji Kantor, Makan Siang"
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden placeholder-slate-500"
              required
            />
          </div>

          {/* Accounts & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {type === 'transfer' ? 'Dari Akun (Sumber)' : 'Akun Pembayaran'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatRupiah(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ke Akun Tujuan
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === accountId}>
                      {a.name} {a.id === accountId ? '(Sama)' : `(${formatRupiah(a.balance)})`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Metode Pembayaran</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="transfer">Transfer Bank</option>
                <option value="qris">QRIS / E-Wallet</option>
                <option value="cash">Uang Tunai</option>
                <option value="debit_card">Kartu Debit</option>
                <option value="credit_card">Kartu Kredit</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Catatan Tambahan (Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kecil mengenai transaksi..."
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden resize-none placeholder-slate-500"
            />
          </div>

          {/* Recurring Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
            />
            <label htmlFor="is_recurring" className="text-xs text-slate-300 select-none cursor-pointer">
              Tandai sebagai pengeluaran/pemasukan rutin bulanan
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEdit ? 'Simpan Perubahan' : 'Catat Transaksi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
