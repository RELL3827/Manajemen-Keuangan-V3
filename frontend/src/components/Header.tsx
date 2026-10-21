import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Plus,
  Mic,
  Bell,
  Sun,
  Moon,
  CheckCheck,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { formatRelativeDate } from '../utils/formatters';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenAddTransaction: () => void;
  onOpenVoiceInput: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenAddTransaction,
  onOpenVoiceInput,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkSingleRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile menu toggle & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white m-0">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Quick actions, notifications, theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice Input Button */}
        <button
          onClick={onOpenVoiceInput}
          title="Input Transaksi dengan Suara"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800/80 text-emerald-400 text-xs sm:text-sm font-semibold transition-all shadow-xs group"
        >
          <span className="p-1 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400">
            <Mic className="w-4 h-4" />
          </span>
          <span className="hidden md:inline">Input Suara</span>
        </button>

        {/* Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Transaksi</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tandai Semua</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi saat ini
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
                      className={`p-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer flex gap-3 ${
                        !n.is_read ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-400" style={{ opacity: n.is_read ? 0.2 : 1 }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.is_read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatRelativeDate(n.created_at)}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkSingleRead(n.id);
                          }}
                          className="text-slate-400 hover:text-emerald-400 p-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl border border-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
