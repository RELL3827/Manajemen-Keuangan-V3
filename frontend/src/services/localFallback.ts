import { Account, Category, Transaction, Budget, SavingGoal, Bill, RecurringTransaction, NotificationItem } from '../types';

interface LocalDataState {
  user: any;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  bills: Bill[];
  recurring: RecurringTransaction[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'fintrack_local_state_v1';

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Gaji & Pendapatan', type: 'income', icon: 'wallet', color: '#10b981', is_archived: false },
  { id: 2, name: 'Bonus & Dividen', type: 'income', icon: 'trending-up', color: '#06b6d4', is_archived: false },
  { id: 3, name: 'Makanan & Minuman', type: 'expense', icon: 'coffee', color: '#f59e0b', is_archived: false },
  { id: 4, name: 'Transportasi', type: 'expense', icon: 'car', color: '#3b82f6', is_archived: false },
  { id: 5, name: 'Tagihan & Utilitas', type: 'expense', icon: 'receipt', color: '#ec4899', is_archived: false },
  { id: 6, name: 'Belanja & Kebutuhan', type: 'expense', icon: 'shopping-bag', color: '#8b5cf6', is_archived: false },
  { id: 7, name: 'Hiburan & Liburan', type: 'expense', icon: 'film', color: '#14b8a6', is_archived: false },
  { id: 8, name: 'Kesehatan & Obat', type: 'expense', icon: 'activity', color: '#ef4444', is_archived: false },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: 1, user_id: 1, name: 'BCA Prioritas', type: 'bank', account_number: '8271928371', balance: 24500000, initial_balance: 20000000, color: '#005baa', icon: 'credit-card', is_active: true, is_archived: false },
  { id: 2, user_id: 1, name: 'Mandiri Livin', type: 'bank', account_number: '137001928371', balance: 12850000, initial_balance: 10000000, color: '#003366', icon: 'building', is_active: true, is_archived: false },
  { id: 3, user_id: 1, name: 'GoPay / GoTo', type: 'ewallet', account_number: '081234567890', balance: 1450000, initial_balance: 500000, color: '#00aa13', icon: 'smartphone', is_active: true, is_archived: false },
  { id: 4, user_id: 1, name: 'Dompet Tunai (Kas)', type: 'cash', balance: 750000, initial_balance: 1000000, color: '#10b981', icon: 'dollar-sign', is_active: true, is_archived: false },
];

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();
const todayStr = now.toISOString().split('T')[0];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, user_id: 1, account_id: 1, category_id: 1, name: 'Gaji Bulanan Utama', type: 'income', amount: 18500000, date: todayStr, is_recurring: true, created_at: todayStr },
  { id: 2, user_id: 1, account_id: 1, category_id: 5, name: 'Listrik PLN & Token', type: 'expense', amount: 650000, date: todayStr, is_recurring: false, created_at: todayStr },
  { id: 3, user_id: 1, account_id: 3, category_id: 3, name: 'Makan Siang Resto', type: 'expense', amount: 85000, date: todayStr, is_recurring: false, created_at: todayStr },
  { id: 4, user_id: 1, account_id: 3, category_id: 4, name: 'Topup Flazz & Tol', type: 'expense', amount: 200000, date: todayStr, is_recurring: false, created_at: todayStr },
  { id: 5, user_id: 1, account_id: 2, category_id: 6, name: 'Belanja Bulanan Supermarket', type: 'expense', amount: 1250000, date: todayStr, is_recurring: false, created_at: todayStr },
  { id: 6, user_id: 1, account_id: 1, category_id: 2, name: 'Dividen Reksa Dana Pasar Uang', type: 'income', amount: 450000, date: todayStr, is_recurring: false, created_at: todayStr },
];

const INITIAL_SAVING_GOALS: SavingGoal[] = [
  { id: 1, user_id: 1, account_id: 1, name: 'Dana Darurat 6 Bulan', target_amount: 50000000, current_amount: 32000000, target_date: `${currentYear}-12-31`, color: '#10b981', is_completed: false },
  { id: 2, user_id: 1, account_id: 2, name: 'Liburan Akhir Tahun Jepang', target_amount: 25000000, current_amount: 14500000, target_date: `${currentYear}-11-30`, color: '#06b6d4', is_completed: false },
];

const INITIAL_BILLS: Bill[] = [
  { id: 1, user_id: 1, account_id: 1, category_id: 5, title: 'Internet Indihome Fiber', amount: 485000, due_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`, reminder_days_before: 3, is_paid: false, frequency: 'monthly' },
  { id: 2, user_id: 1, account_id: 1, category_id: 5, title: 'Iuran Pengelolaan Lingkungan (IPL)', amount: 350000, due_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-28`, reminder_days_before: 2, is_paid: false, frequency: 'monthly' },
];

function getStoredState(): LocalDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load local state:', err);
  }

  const defaultState: LocalDataState = {
    user: {
      id: 1,
      name: 'Budi Santoso',
      email: 'demo@fintrack.id',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      date_format: 'DD/MM/YYYY',
      theme: 'dark',
      notify_bills: true,
      notify_budget_alerts: true,
    },
    accounts: INITIAL_ACCOUNTS,
    categories: INITIAL_CATEGORIES,
    transactions: INITIAL_TRANSACTIONS,
    budgets: [
      {
        id: 1,
        user_id: 1,
        month: currentMonth,
        year: currentYear,
        total_budget: 10000000,
        method: 'custom',
        budget_categories: [
          { id: 1, budget_id: 1, category_id: 3, allocated_amount: 3000000, spent_amount: 85000, remaining_amount: 2915000, percentage: 2.8, is_over_budget: false },
          { id: 2, budget_id: 1, category_id: 4, allocated_amount: 2000000, spent_amount: 200000, remaining_amount: 1800000, percentage: 10.0, is_over_budget: false },
          { id: 3, budget_id: 1, category_id: 5, allocated_amount: 2500000, spent_amount: 650000, remaining_amount: 1850000, percentage: 26.0, is_over_budget: false },
          { id: 4, budget_id: 1, category_id: 6, allocated_amount: 2500000, spent_amount: 1250000, remaining_amount: 1250000, percentage: 50.0, is_over_budget: false },
        ]
      }
    ],
    savingGoals: INITIAL_SAVING_GOALS,
    bills: INITIAL_BILLS,
    recurring: [],
    notifications: [
      { id: 1, user_id: 1, title: 'Selamat Datang di FinTrack', message: 'Aplikasi aktif dalam mode online demo. Data tersimpan di browser Anda.', type: 'system', is_read: false, created_at: todayStr }
    ]
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  return defaultState;
}

function saveState(state: LocalDataState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

export const localFallback = {
  login: async (credentials: any) => {
    const state = getStoredState();
    const user = {
      ...state.user,
      email: credentials?.email || 'demo@fintrack.id',
      name: credentials?.email ? credentials.email.split('@')[0] : 'Pengguna FinTrack',
    };
    state.user = user;
    saveState(state);
    return { token: 'demo-local-token-fintrack', user };
  },

  register: async (payload: any) => {
    const state = getStoredState();
    const user = {
      ...state.user,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
    state.user = user;
    saveState(state);
    return { token: 'demo-local-token-fintrack', user };
  },

  getMe: async () => {
    const state = getStoredState();
    return { user: state.user };
  },

  getAccounts: async () => {
    const state = getStoredState();
    return { accounts: state.accounts };
  },

  createAccount: async (payload: any) => {
    const state = getStoredState();
    const newAccount: Account = {
      id: Date.now(),
      user_id: 1,
      name: payload.name,
      type: payload.type || 'bank',
      account_number: payload.account_number || '',
      balance: Number(payload.initial_balance || payload.balance || 0),
      initial_balance: Number(payload.initial_balance || 0),
      color: payload.color || '#10b981',
      icon: payload.icon || 'wallet',
      is_active: true,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    state.accounts.push(newAccount);
    saveState(state);
    return { account: newAccount };
  },

  updateAccount: async (id: number, payload: any) => {
    const state = getStoredState();
    state.accounts = state.accounts.map((acc) => (acc.id === id ? { ...acc, ...payload } : acc));
    saveState(state);
    const updated = state.accounts.find((a) => a.id === id);
    return { account: updated };
  },

  deleteAccount: async (id: number) => {
    const state = getStoredState();
    state.accounts = state.accounts.filter((a) => a.id !== id);
    saveState(state);
    return { message: 'Akun berhasil dihapus' };
  },

  transfer: async (payload: any) => {
    const state = getStoredState();
    const amount = Number(payload.amount);
    state.accounts = state.accounts.map((acc) => {
      if (acc.id === Number(payload.from_account_id)) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === Number(payload.to_account_id)) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    const tx: Transaction = {
      id: Date.now(),
      user_id: 1,
      account_id: Number(payload.from_account_id),
      to_account_id: Number(payload.to_account_id),
      name: payload.notes || 'Transfer Antar Rekening',
      type: 'transfer',
      amount,
      date: payload.date || new Date().toISOString().split('T')[0],
      is_recurring: false,
      created_at: new Date().toISOString(),
    };
    state.transactions.unshift(tx);
    saveState(state);
    return { message: 'Transfer berhasil', transaction: tx };
  },

  getCategories: async () => {
    const state = getStoredState();
    return { categories: state.categories };
  },

  getTransactions: async () => {
    const state = getStoredState();
    // attach relations
    const enriched = state.transactions.map((tx) => ({
      ...tx,
      account: state.accounts.find((a) => a.id === tx.account_id),
      category: state.categories.find((c) => c.id === tx.category_id),
    }));
    return { transactions: enriched };
  },

  createTransaction: async (payload: any) => {
    const state = getStoredState();
    const amount = Number(payload.amount);
    const newTx: Transaction = {
      id: Date.now(),
      user_id: 1,
      account_id: Number(payload.account_id),
      category_id: payload.category_id ? Number(payload.category_id) : null,
      to_account_id: payload.to_account_id ? Number(payload.to_account_id) : null,
      name: payload.name,
      type: payload.type,
      amount,
      date: payload.date || new Date().toISOString().split('T')[0],
      payment_method: payload.payment_method || 'transfer',
      notes: payload.notes || '',
      is_recurring: Boolean(payload.is_recurring),
      created_at: new Date().toISOString(),
    };

    // Update account balance
    state.accounts = state.accounts.map((acc) => {
      if (acc.id === newTx.account_id) {
        if (newTx.type === 'income') return { ...acc, balance: acc.balance + amount };
        if (newTx.type === 'expense' || newTx.type === 'transfer') return { ...acc, balance: acc.balance - amount };
      }
      if (newTx.type === 'transfer' && acc.id === newTx.to_account_id) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    state.transactions.unshift(newTx);
    saveState(state);
    return { transaction: newTx };
  },

  deleteTransaction: async (id: number) => {
    const state = getStoredState();
    const tx = state.transactions.find((t) => t.id === id);
    if (tx) {
      state.accounts = state.accounts.map((acc) => {
        if (acc.id === tx.account_id) {
          if (tx.type === 'income') return { ...acc, balance: acc.balance - tx.amount };
          if (tx.type === 'expense') return { ...acc, balance: acc.balance + tx.amount };
        }
        return acc;
      });
      state.transactions = state.transactions.filter((t) => t.id !== id);
      saveState(state);
    }
    return { message: 'Transaksi berhasil dihapus' };
  },

  interpretVoice: async (text: string) => {
    const state = getStoredState();
    const lower = text.toLowerCase();
    const numMatch = text.replace(/[^0-9]/g, '');
    const amount = numMatch ? parseInt(numMatch, 10) : 50000;
    const isIncome = lower.includes('gaji') || lower.includes('dapat') || lower.includes('masuk') || lower.includes('bonus');

    return {
      parsed: {
        name: text.length > 30 ? text.substring(0, 30) : text,
        type: isIncome ? 'income' : 'expense',
        amount,
        account_id: state.accounts[0]?.id || 1,
        category_id: isIncome ? 1 : 3,
        date: new Date().toISOString().split('T')[0],
      }
    };
  },

  getBudgets: async () => {
    const state = getStoredState();
    return { budgets: state.budgets };
  },

  saveBudget: async (payload: any) => {
    const state = getStoredState();
    const existing = state.budgets.find((b) => b.month === payload.month && b.year === payload.year);
    if (existing) {
      existing.total_budget = payload.categories?.reduce((s: number, c: any) => s + Number(c.allocated_amount || 0), 0) || 10000000;
      existing.budget_categories = (payload.categories || []).map((c: any, idx: number) => ({
        id: idx + 1,
        budget_id: existing.id,
        category_id: c.category_id,
        allocated_amount: Number(c.allocated_amount),
        spent_amount: 0,
        remaining_amount: Number(c.allocated_amount),
        percentage: 0,
      }));
    } else {
      state.budgets.push({
        id: Date.now(),
        user_id: 1,
        month: payload.month,
        year: payload.year,
        total_budget: payload.categories?.reduce((s: number, c: any) => s + Number(c.allocated_amount || 0), 0) || 10000000,
        method: 'custom',
        budget_categories: (payload.categories || []).map((c: any, idx: number) => ({
          id: idx + 1,
          budget_id: 1,
          category_id: c.category_id,
          allocated_amount: Number(c.allocated_amount),
          spent_amount: 0,
          remaining_amount: Number(c.allocated_amount),
          percentage: 0,
        })),
      });
    }
    saveState(state);
    return { message: 'Anggaran berhasil disimpan' };
  },

  getSavingGoals: async () => {
    const state = getStoredState();
    return { saving_goals: state.savingGoals };
  },

  createSavingGoal: async (payload: any) => {
    const state = getStoredState();
    const newGoal: SavingGoal = {
      id: Date.now(),
      user_id: 1,
      account_id: payload.account_id ? Number(payload.account_id) : null,
      name: payload.name,
      target_amount: Number(payload.target_amount),
      current_amount: Number(payload.current_amount || 0),
      target_date: payload.target_date,
      color: payload.color || '#10b981',
      is_completed: false,
    };
    state.savingGoals.push(newGoal);
    saveState(state);
    return { saving_goal: newGoal };
  },

  contributeToGoal: async (id: number, payload: any) => {
    const state = getStoredState();
    const goal = state.savingGoals.find((g) => g.id === id);
    const amount = Number(payload.amount);
    if (goal) {
      if (payload.type === 'deposit') {
        goal.current_amount += amount;
      } else {
        goal.current_amount = Math.max(0, goal.current_amount - amount);
      }
      saveState(state);
    }
    return { message: 'Berhasil memperbarui tabungan' };
  },

  getBills: async () => {
    const state = getStoredState();
    return { bills: state.bills };
  },

  createBill: async (payload: any) => {
    const state = getStoredState();
    const newBill: Bill = {
      id: Date.now(),
      user_id: 1,
      title: payload.title,
      amount: Number(payload.amount),
      due_date: payload.due_date,
      reminder_days_before: Number(payload.reminder_days_before || 3),
      is_paid: false,
      frequency: payload.frequency || 'monthly',
      notes: payload.notes || '',
    };
    state.bills.push(newBill);
    saveState(state);
    return { bill: newBill };
  },

  markBillPaid: async (id: number) => {
    const state = getStoredState();
    state.bills = state.bills.map((b) => (b.id === id ? { ...b, is_paid: true, paid_at: new Date().toISOString() } : b));
    saveState(state);
    return { message: 'Tagihan ditandai lunas' };
  },

  getRecurring: async () => {
    const state = getStoredState();
    return { recurring_transactions: state.recurring };
  },

  getReportsSummary: async () => {
    const state = getStoredState();
    let totalIncome = 0;
    let totalExpense = 0;

    state.transactions.forEach((tx) => {
      if (tx.type === 'income') totalIncome += tx.amount;
      if (tx.type === 'expense') totalExpense += tx.amount;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const totalBalance = state.accounts.reduce((s, a) => s + a.balance, 0);

    return {
      period: 'this_month',
      total_balance: totalBalance,
      total_income: totalIncome,
      total_expense: totalExpense,
      net_savings: netSavings,
      savings_rate: Math.round(savingsRate * 10) / 10,
      cash_flow_trend: [
        { label: 'Minggu 1', income: totalIncome * 0.7, expense: totalExpense * 0.3, net: totalIncome * 0.7 - totalExpense * 0.3 },
        { label: 'Minggu 2', income: totalIncome * 0.1, expense: totalExpense * 0.4, net: totalIncome * 0.1 - totalExpense * 0.4 },
        { label: 'Minggu 3', income: totalIncome * 0.2, expense: totalExpense * 0.3, net: totalIncome * 0.2 - totalExpense * 0.3 },
      ],
      expenses_by_category: state.categories
        .filter((c) => c.type === 'expense')
        .map((c) => ({
          name: c.name,
          color: c.color,
          amount: Math.round(totalExpense * 0.25),
          percentage: 25,
        })),
      financial_health: {
        score: savingsRate > 20 ? 88 : 72,
        status: savingsRate > 20 ? 'Sangat Sehat' : 'Cukup Baik',
        savings_rate: Math.round(savingsRate),
        summary: 'Kondisi finansial Anda stabil dengan rasio tabungan yang positif.',
      },
    };
  },

  getInsights: async () => {
    return {
      health: {
        score: 86,
        status: 'Kondisi Prima',
        savings_rate: 34.5,
        summary: 'Pemasukan Anda melebihi pengeluaran bulanan. Arus kas dalam posisi sehat.',
      },
      insights: [
        {
          id: 'insight-1',
          type: 'success',
          icon: 'trending-up',
          title: 'Rasio Tabungan Sehat',
          message: 'Anda telah menyisihkan lebih dari 30% dari total pemasukan bulan ini.',
          priority: 1,
        },
        {
          id: 'insight-2',
          type: 'info',
          icon: 'target',
          title: 'Target Tabungan Aktif',
          message: 'Tujuan Dana Darurat Anda telah mencapai 64% dari target Rp 50.000.000.',
          priority: 2,
        },
      ],
    };
  },

  getNotifications: async () => {
    const state = getStoredState();
    return { notifications: state.notifications };
  },
};
