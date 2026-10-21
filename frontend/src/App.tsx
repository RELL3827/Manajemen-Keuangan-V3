import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { TransactionModal } from './components/TransactionModal';
import { VoiceTransactionModal } from './components/VoiceTransactionModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SavingGoalsPage } from './pages/SavingGoalsPage';
import { BillsPage } from './pages/BillsPage';
import { ReportsPage } from './pages/ReportsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPages } from './pages/AuthPages';

import { api } from './services/api';
import { Account, Category, Transaction } from './types';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Financial References (Accounts & Categories)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalRefreshTrigger, setGlobalRefreshTrigger] = useState(0);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const loadGlobalReferences = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
      ]);
      setAccounts(accRes.accounts || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load global references:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadGlobalReferences();
    }
  }, [user, globalRefreshTrigger]);

  const handleRefreshGlobalData = () => {
    setGlobalRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPages />;
  }

  const getPageTitle = (tab: NavItem) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Finansial';
      case 'transactions': return 'Kelola Transaksi';
      case 'accounts': return 'Akun & Rekening';
      case 'budgets': return 'Anggaran & Limit';
      case 'saving-goals': return 'Tujuan Tabungan';
      case 'bills': return 'Tagihan & Pengingat';
      case 'reports': return 'Laporan & Analitik';
      case 'insights': return 'Insight & Skor AI';
      case 'settings': return 'Pengaturan Profil';
      default: return 'FinTrack';
    }
  };

  const getPageSubtitle = (tab: NavItem) => {
    switch (tab) {
      case 'dashboard': return 'Pantau seluruh ringkasan kesehatan finansial Anda';
      case 'transactions': return 'Pencatatan pemasukan, pengeluaran, dan transfer';
      case 'accounts': return 'Kelola kas, bank, dan dompet digital dalam satu tempat';
      case 'budgets': return 'Kontrol belanja agar tetap dalam batas wajar';
      case 'saving-goals': return 'Wujudkan target tabungan impian Anda';
      case 'bills': return 'Jangan sampai lewat tanggal jatuh tempo';
      case 'reports': return 'Analisis grafik arus kas dan ekspor laporan';
      case 'insights': return 'Saran pintar otomatis dari pola transaksi nyata';
      case 'settings': return 'Ubah kata sandi, preferensi mata uang, dan backup';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          title={getPageTitle(currentTab)}
          subtitle={getPageSubtitle(currentTab)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddTransaction={() => {
            setEditingTransaction(null);
            setIsTxModalOpen(true);
          }}
          onOpenVoiceInput={() => setIsVoiceModalOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenAddTransaction={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
              onOpenVoiceInput={() => setIsVoiceModalOpen(true)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsPage onRefreshGlobalData={handleRefreshGlobalData} />
          )}

          {currentTab === 'budgets' && <BudgetsPage />}

          {currentTab === 'saving-goals' && (
            <SavingGoalsPage
              accounts={accounts}
              onRefreshGlobalData={handleRefreshGlobalData}
            />
          )}

          {currentTab === 'bills' && (
            <BillsPage
              accounts={accounts}
              categories={categories}
              onRefreshGlobalData={handleRefreshGlobalData}
            />
          )}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'insights' && <InsightsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAddTransaction={() => {
            setEditingTransaction(null);
            setIsTxModalOpen(true);
          }}
        />
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          handleRefreshGlobalData();
        }}
        transactionToEdit={editingTransaction}
        accounts={accounts}
        categories={categories}
      />

      <VoiceTransactionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={() => {
          handleRefreshGlobalData();
        }}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
