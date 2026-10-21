import React, { useState } from 'react';
import {
  TrendingUp,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { localFallback } from '../services/localFallback';

export const AuthPages: React.FC = () => {
  const { login, register } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDemoFill = () => {
    setEmail('demo@fintrack.id');
    setPassword('password123');
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await login({ email, password });
    } catch (err: any) {
      console.warn('Backend login error, triggering client fallback session:', err);
      try {
        const fallbackRes = await localFallback.login({ email, password });
        if (fallbackRes?.user && fallbackRes?.token) {
          localStorage.setItem('fintrack_token', fallbackRes.token);
          localStorage.setItem('fintrack_user', JSON.stringify(fallbackRes.user));
          window.location.reload();
          return;
        }
      } catch (fErr) {
        console.error('Local fallback failed:', fErr);
      }
      setErrorMsg(err.message || 'Email atau password yang Anda masukkan salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (err: any) {
      console.warn('Backend register error, triggering client fallback session:', err);
      try {
        const fallbackRes = await localFallback.register({ name, email, password });
        if (fallbackRes?.user && fallbackRes?.token) {
          localStorage.setItem('fintrack_token', fallbackRes.token);
          localStorage.setItem('fintrack_user', JSON.stringify(fallbackRes.user));
          window.location.reload();
          return;
        }
      } catch (fErr) {
        console.error('Local fallback register failed:', fErr);
      }
      setErrorMsg(err.message || 'Gagal melakukan pendaftaran akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Email wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password baru minimal 8 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.resetPassword({
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccessMsg(res.message || 'Password berhasil direset. Silakan login.');
      setView('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mereset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl relative z-10 text-left">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-white">FinTrack</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Manajemen Keuangan Pribadi Cerdas</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* View Switch: LOGIN */}
        {view === 'login' && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white m-0">Selamat Datang Kembali</h2>
              <p className="text-xs text-slate-400 m-0">Masuk ke akun FinTrack Anda</p>
            </div>

            {/* Quick Demo Fill Pill */}
            <div className="mb-5 p-3 rounded-2xl bg-linear-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">Coba Akun Demo?</span>
              </div>
              <button
                type="button"
                onClick={handleDemoFill}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs"
              >
                Isi Kredensial Demo
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setView('forgot');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Masuk...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setView('register');
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
        )}

        {/* View Switch: REGISTER */}
        {view === 'register' && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white m-0">Buat Akun FinTrack</h2>
              <p className="text-xs text-slate-400 m-0">Kelola finansial Anda dengan tenang dan teratur</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 karakter"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Konfirmasi</label>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Baru</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setView('login');
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </div>
          </div>
        )}

        {/* View Switch: RESET PASSWORD */}
        {view === 'forgot' && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white m-0">Reset Password</h2>
              <p className="text-xs text-slate-400 m-0">Setel ulang kata sandi akun FinTrack Anda</p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Akun</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 karakter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <span>Simpan Password Baru</span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              Ingat password Anda?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setView('login');
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
