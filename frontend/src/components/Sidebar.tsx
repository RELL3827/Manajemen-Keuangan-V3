import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'saving-goals'
  | 'bills'
  | 'reports'
  | 'insights'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();

  const navItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transaksi', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'accounts', label: 'Akun & Dompet', icon: <Wallet className="w-5 h-5" /> },
    { id: 'budgets', label: 'Anggaran', icon: <PieChart className="w-5 h-5" /> },
    { id: 'saving-goals', label: 'Tujuan Tabungan', icon: <Target className="w-5 h-5" /> },
    { id: 'bills', label: 'Tagihan & Rutin', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'Laporan Keuangan', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'insights', label: 'Insight Cerdas', icon: <Sparkles className="w-5 h-5 text-amber-400" />, badge: 'AI' },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">FinTrack</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Personal Finance</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group text-left ${
                  isActive
                    ? 'bg-linear-to-r from-emerald-500/15 to-blue-500/10 text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-900/40">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-emerald-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
