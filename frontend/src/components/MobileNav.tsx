import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  UserCircle,
  Plus,
} from 'lucide-react';
import { NavItem } from './Sidebar';

interface MobileNavProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenAddTransaction: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
          currentTab === 'dashboard'
            ? 'text-emerald-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Dashboard</span>
      </button>

      <button
        onClick={() => onSelectTab('transactions')}
        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
          currentTab === 'transactions'
            ? 'text-emerald-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span className="text-[10px] font-medium">Transaksi</span>
      </button>

      {/* Floating Plus Button */}
      <button
        onClick={onOpenAddTransaction}
        className="-mt-5 w-12 h-12 rounded-full bg-linear-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        aria-label="Tambah Transaksi Cepat"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      <button
        onClick={() => onSelectTab('budgets')}
        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
          currentTab === 'budgets'
            ? 'text-emerald-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span className="text-[10px] font-medium">Anggaran</span>
      </button>

      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
          currentTab === 'settings'
            ? 'text-emerald-400'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <UserCircle className="w-5 h-5" />
        <span className="text-[10px] font-medium">Profil</span>
      </button>
    </div>
  );
};
