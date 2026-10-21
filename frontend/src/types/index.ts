export interface User {
  id: number;
  name: string;
  email: string;
  profile_photo?: string | null;
  currency: string;
  timezone: string;
  date_format: string;
  theme: 'dark' | 'light';
  notify_bills: boolean;
  notify_budget_alerts: boolean;
  created_at?: string;
}

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'investment' | 'other';

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: AccountType;
  account_number?: string | null;
  balance: number;
  initial_balance: number;
  color?: string;
  icon?: string;
  is_active: boolean;
  is_archived: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: number;
  user_id?: number | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  name: string;
  type: TransactionType;
  amount: number;
  date: string;
  time?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  attachment_url?: string | null;
  is_recurring: boolean;
  recurring_id?: number | null;
  account?: Account;
  to_account?: Account;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCategory {
  id: number;
  budget_id: number;
  category_id: number;
  allocated_amount: number;
  spent_amount?: number;
  remaining_amount?: number;
  percentage?: number;
  is_over_budget?: boolean;
  is_critical?: boolean;
  is_warning?: boolean;
  category?: Category;
}

export interface Budget {
  id: number;
  user_id: number;
  month: number;
  year: number;
  total_budget: number;
  method: string;
  budget_categories?: BudgetCategory[];
}

export interface SavingGoal {
  id: number;
  user_id: number;
  account_id?: number | null;
  name: string;
  target_amount: number;
  current_amount: number;
  remaining_amount?: number;
  progress_percentage?: number;
  target_date: string;
  periodic_contribution?: number | null;
  color?: string;
  icon?: string;
  is_completed: boolean;
  months_remaining_deadline?: number;
  estimated_months_to_target?: number | null;
  account?: Account;
  contributions?: SavingGoalContribution[];
}

export interface SavingGoalContribution {
  id: number;
  saving_goal_id: number;
  user_id: number;
  account_id: number;
  transaction_id?: number | null;
  amount: number;
  type: 'deposit' | 'withdraw';
  notes?: string | null;
  date: string;
  account?: Account;
  created_at?: string;
}

export interface Bill {
  id: number;
  user_id: number;
  account_id?: number | null;
  category_id?: number | null;
  title: string;
  amount: number;
  due_date: string;
  reminder_days_before: number;
  is_paid: boolean;
  paid_at?: string | null;
  frequency: 'one_time' | 'weekly' | 'monthly' | 'yearly';
  notes?: string | null;
  days_left?: number;
  is_overdue?: boolean;
  is_due_soon?: boolean;
  account?: Account;
  category?: Category;
}

export interface RecurringTransaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id?: number | null;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  last_processed?: string | null;
  next_due_date: string;
  is_active: boolean;
  notes?: string | null;
  account?: Account;
  category?: Category;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'bill' | 'budget_warning' | 'goal' | 'system' | 'insight';
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

export interface InsightItem {
  id: string;
  type: 'warning' | 'success' | 'alert' | 'info' | 'danger' | 'goal';
  icon: string;
  title: string;
  message: string;
  metric?: string;
  priority: number;
}

export interface FinancialHealth {
  score: number;
  status: string;
  savings_rate: number;
  summary: string;
}
