import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { Account, Category } from '../types';
import { formatRupiah } from '../utils/formatters';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  categories: Category[];
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Parsed / Editable Form Fields
  const [step, setStep] = useState<'listen' | 'confirm'>('listen');
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    amount: 0,
    account_id: accounts[0]?.id || 0,
    to_account_id: accounts[1]?.id || accounts[0]?.id || 0,
    category_id: categories[0]?.id || 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Izin mikrofon ditolak oleh browser.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Error suara: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!speechSupported) {
      setErrorMsg('Browser Anda belum mendukung Web Speech API. Silakan gunakan tombol simulasi atau ketik langsung.');
      return;
    }
    setErrorMsg('');
    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch {
      // recognition already active
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleInterpret = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) {
      setErrorMsg('Mohon katakan atau masukkan teks perintah suara terlebih dahulu.');
      return;
    }

    setIsInterpreting(true);
    setErrorMsg('');

    try {
      const res = await api.interpretVoice(text);
      const parsed = res.interpreted;

      setFormData({
        name: parsed.name || text,
        type: parsed.type || 'expense',
        amount: parsed.amount || 0,
        account_id: parsed.account_id || accounts[0]?.id || 0,
        to_account_id: parsed.to_account_id || accounts[1]?.id || accounts[0]?.id || 0,
        category_id: parsed.category_id || categories.find((c) => c.type === parsed.type)?.id || categories[0]?.id || 0,
        date: parsed.date || new Date().toISOString().split('T')[0],
        notes: `Input suara: "${text}"`,
      });

      setStep('confirm');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menginterpretasi perintah suara.');
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (formData.amount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari 0.');
      return;
    }
    if (!formData.name) {
      setErrorMsg('Nama transaksi tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.createTransaction({
        name: formData.name,
        type: formData.type,
        amount: formData.amount,
        account_id: formData.account_id,
        to_account_id: formData.type === 'transfer' ? formData.to_account_id : undefined,
        category_id: formData.type !== 'transfer' ? formData.category_id : undefined,
        date: formData.date,
        notes: formData.notes,
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopListening();
    setStep('listen');
    setTranscript('');
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  const samplePrompts = [
    'Tadi beli makan 25 ribu',
    'Gaji masuk 5 juta ke rekening BCA',
    'Bayar bensin 30 ribu dari dompet tunai',
    'Nabung 100 ribu ke rekening tabungan',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white m-0">Input Transaksi dengan Suara</h2>
              <p className="text-[11px] text-slate-400 m-0">Cukup bicara, FinTrack yang mencatatnya</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'listen' ? (
            <div className="flex flex-col items-center text-center">
              {/* Mic pulse container */}
              <div className="relative my-6 flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                    <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
                  </>
                )}
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 relative z-10 ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                      : 'bg-linear-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-emerald-500/30 hover:scale-105'
                  }`}
                  aria-label="Toggle Microphone"
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8 animate-pulse" />
                  ) : (
                    <Mic className="w-8 h-8 stroke-[2.5]" />
                  )}
                </button>
              </div>

              <p className="text-sm font-semibold text-slate-200">
                {isListening
                  ? 'Mendengarkan suara Anda... (Bicara sekarang)'
                  : 'Klik mikrofon di atas untuk mulai berbicara'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Gunakan bahasa Indonesia alami seperti contoh di bawah ini.
              </p>

              {/* Live Transcript / Manual input preview */}
              <div className="w-full mt-5">
                <label className="block text-left text-xs font-semibold text-slate-300 mb-1.5">
                  Teks Terdeteksi / Input Langsung:
                </label>
                <div className="relative">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Contoh: 'Tadi siang beli makan 25 ribu dari dompet tunai'..."
                    rows={2}
                    className="w-full p-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 resize-none"
                  />
                  {transcript && (
                    <button
                      onClick={() => setTranscript('')}
                      className="absolute right-2 top-2 p-1 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="w-full mt-4 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coba klik contoh perintah:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTranscript(p);
                        handleInterpret(p);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/30 text-slate-300 transition-colors text-left"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Interpret Action button */}
              <div className="w-full mt-6">
                <button
                  onClick={() => handleInterpret(transcript)}
                  disabled={!transcript.trim() || isInterpreting}
                  className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-cyan-400 transition-all"
                >
                  {isInterpreting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menginterpretasi dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <span>Proses Perintah</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-300 block">
                    Interpretasi Berhasil Dikenali
                  </span>
                  <span className="text-slate-300">
                    Periksa & sesuaikan hasil interpretasi di bawah ini sebelum menyimpan.
                  </span>
                </div>
              </div>

              {/* Form Confirmation */}
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Transaksi
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Jenis Transaksi
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                      <option value="transfer">Transfer Antar Akun</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nominal (IDR)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-[11px] text-emerald-400 mt-0.5 block font-semibold">
                      {formatRupiah(formData.amount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {formData.type === 'transfer' ? 'Dari Akun' : 'Akun Sumber'}
                    </label>
                    <select
                      value={formData.account_id}
                      onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatRupiah(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.type === 'transfer' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Ke Akun Tujuan
                      </label>
                      <select
                        value={formData.to_account_id}
                        onChange={(e) => setFormData({ ...formData, to_account_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
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
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                      >
                        {categories
                          .filter((c) => c.type === formData.type)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep('listen')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Kembali Bicara
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransaction}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Konfirmasi & Simpan</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
