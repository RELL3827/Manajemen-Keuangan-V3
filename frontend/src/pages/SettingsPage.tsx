import React, { useState } from 'react';
import {
  UserCircle,
  Lock,
  Globe,
  Bell,
  Download,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'IDR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Jakarta');
  const [dateFormat, setDateFormat] = useState(user?.date_format || 'DD/MM/YYYY');
  const [notifyBills, setNotifyBills] = useState(user?.notify_bills ?? true);
  const [notifyBudgetAlerts, setNotifyBudgetAlerts] = useState(user?.notify_budget_alerts ?? true);
  const [profileMsg, setProfileMsg] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Export Data
  const [isExporting, setIsExporting] = useState(false);

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePwd, setDeletePwd] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg('');

    try {
      const res = await api.updateProfile({
        name,
        currency,
        timezone,
        date_format: dateFormat,
        notify_bills: notifyBills,
        notify_budget_alerts: notifyBudgetAlerts,
      });

      updateUser(res.user);
      setProfileMsg('Pengaturan profil berhasil diperbarui.');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (newPassword.length < 8) {
      setPwdError('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsChangingPwd(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setPwdMsg('Password berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMsg(''), 4000);
    } catch (err: any) {
      setPwdError(err.message || 'Gagal mengubah password.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportPersonalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_backup_${user?.email}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccountConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.deleteAccount({ password: deletePwd });
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Password salah atau gagal menghapus akun.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto text-left">
      <div>
        <h2 className="text-xl font-bold text-white m-0">Profil & Pengaturan Akun</h2>
        <p className="text-xs text-slate-400 m-0">
          Kelola preferensi akun, keamanan, tema tampilan, dan ekspor data pribadi Anda
        </p>
      </div>

      {/* User Info & Profile Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name || 'Pengguna FinTrack'}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Akun Personal Terverifikasi
            </span>
          </div>
        </div>

        {profileMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Terdaftar (Read-Only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-xs bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mata Uang Utama
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="IDR">Rupiah Indonesia (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zona Waktu
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Format Tanggal
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (21/10/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-21)</option>
              </select>
            </div>
          </div>

          {/* Theme & Notifications */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Preferensi & Notifikasi</h4>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <div>
                  <span className="text-xs font-semibold text-white block">Tema Tampilan</span>
                  <span className="text-[10px] text-slate-400">
                    Mode saat ini: {theme === 'dark' ? 'Dark Mode (Direkomendasikan)' : 'Light Mode'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold hover:bg-slate-800"
              >
                Ganti Tema
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Pengingat Tagihan</span>
                <span className="text-[10px] text-slate-400">
                  Kirim notifikasi in-app ketika tagihan mendekati jatuh tempo
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyBills}
                onChange={(e) => setNotifyBills(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Peringatan Kuota Anggaran</span>
                <span className="text-[10px] text-slate-400">
                  Kirim notifikasi saat pemakaian pos anggaran mencapai 50%, 80%, atau 100%
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyBudgetAlerts}
                onChange={(e) => setNotifyBudgetAlerts(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white m-0">Keamanan & Ubah Password</h3>
        </div>

        {pwdMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{pwdMsg}</span>
          </div>
        )}

        {pwdError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Password Baru (Min 8 Karakter)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPwd}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isChangingPwd ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Data Privacy */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white m-0">Privasi & Ekspor Cadangan Data</h3>
        </div>

        <p className="text-xs text-slate-400">
          Unduh seluruh data keuangan Anda (akun, riwayat transaksi, anggaran, tagihan, dan target tabungan) dalam satu file JSON terenkripsi.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Mengekspor...' : 'Unduh Cadangan JSON'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Logout & Delete Account */}
      <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-rose-400 m-0">Zona Bahaya</h3>
        <p className="text-xs text-slate-400">
          Penghapusan akun akan menghapus seluruh data transaksi, akun, dan anggaran secara permanen dan tidak dapat dipulihkan kembali.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>

          <button
            onClick={() => {
              setDeletePwd('');
              setDeleteError('');
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun Permanen</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi Hapus Akun</h3>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan password akun Anda untuk mengonfirmasi penghapusan seluruh data akun secara permanen.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountConfirm} className="space-y-3 text-left">
              <input
                type="password"
                placeholder="Password Anda..."
                value={deletePwd}
                onChange={(e) => setDeletePwd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-rose-500 focus:outline-hidden"
                required
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
