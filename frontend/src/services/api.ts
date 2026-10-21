import { localFallback } from './localFallback';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function isFallbackEligible(error: any): boolean {
  if (error instanceof TypeError) return true; // fetch network error (offline, CORS, backend down)
  if (error?.isHtmlResponse) return true;
  if (
    error?.status === 404 ||
    error?.status === 405 ||
    error?.status === 500 ||
    error?.status === 502 ||
    error?.status === 503 ||
    error?.status === 504
  ) {
    return true;
  }
  const msg = String(error?.message || '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('kesalahan sistem') ||
    msg.includes('tidak merespon format json') ||
    msg.includes('not found') ||
    msg.includes('method not allowed')
  ) {
    return true;
  }
  return false;
}

async function withFallback<T>(apiFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    return await apiFn();
  } catch (error: any) {
    if (isFallbackEligible(error)) {
      console.warn('Backend server unreachable or static SPA host detected, operating in standalone demo mode:', error);
      return await fallbackFn();
    }
    throw error;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('fintrack_token');
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.dispatchEvent(new Event('fintrack_unauthorized'));
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else if (contentType.includes('text/csv') || contentType.includes('octet-stream')) {
    return (await response.blob()) as unknown as T;
  } else {
    data = await response.text();
    // If server returned an HTML file or 404/405 (typical on Vercel when static rewrite serves index.html)
    if (
      typeof data === 'string' &&
      (data.includes('<!doctype') || data.includes('<html') || response.status === 405 || response.status === 404)
    ) {
      const err = new ApiError('Backend API tidak merespon format JSON yang valid.', response.status, data);
      (err as any).isHtmlResponse = true;
      throw err;
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Terjadi kesalahan sistem.');
    const err = new ApiError(errorMsg, response.status, data);
    if (response.status === 404 || response.status === 405) {
      (err as any).isHtmlResponse = true;
    }
    throw err;
  }

  // Also check if data is an HTML document even if HTTP status was 200 (SPA catch-all rewrite)
  if (typeof data === 'string' && (data.includes('<!doctype') || data.includes('<html'))) {
    const err = new ApiError('Backend API tidak merespon format JSON yang valid.', 200, data);
    (err as any).isHtmlResponse = true;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) =>
    withFallback(
      () => request<any>('/register', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.register(payload)
    ),
  login: (payload: any) =>
    withFallback(
      () => request<any>('/login', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.login(payload)
    ),
  logout: () =>
    withFallback(
      () => request<any>('/logout', { method: 'POST' }),
      async () => ({ message: 'Logged out' })
    ),
  getMe: () =>
    withFallback(
      () => request<any>('/me'),
      () => localFallback.getMe()
    ),
  updateProfile: (payload: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request<any>('/password', { method: 'PUT', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) => request<any>('/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  exportPersonalData: () => request<any>('/export-data'),
  deleteAccount: (payload: any) => request<any>('/account-delete', { method: 'DELETE', body: JSON.stringify(payload) }),

  // Accounts
  getAccounts: (includeArchived = false) =>
    withFallback(
      () => request<any>(`/accounts?include_archived=${includeArchived ? '1' : '0'}`),
      () => localFallback.getAccounts()
    ),
  createAccount: (payload: any) =>
    withFallback(
      () => request<any>('/accounts', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.createAccount(payload)
    ),
  getAccount: (id: number) => request<any>(`/accounts/${id}`),
  updateAccount: (id: number, payload: any) =>
    withFallback(
      () => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
      () => localFallback.updateAccount(id, payload)
    ),
  deleteAccountRecord: (id: number) =>
    withFallback(
      () => request<any>(`/accounts/${id}`, { method: 'DELETE' }),
      () => localFallback.deleteAccount(id)
    ),
  transferBetweenAccounts: (payload: any) =>
    withFallback(
      () => request<any>('/accounts/transfer', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.transfer(payload)
    ),

  // Categories
  getCategories: (type?: string, includeArchived = false) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (includeArchived) params.set('include_archived', '1');
    return withFallback(
      () => request<any>(`/categories?${params.toString()}`),
      () => localFallback.getCategories()
    );
  },
  createCategory: (payload: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: number, payload: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: number) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      }
    });
    return withFallback(
      () => request<any>(`/transactions?${params.toString()}`),
      () => localFallback.getTransactions()
    );
  },
  createTransaction: (payload: any) =>
    withFallback(
      () => request<any>('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.createTransaction(payload)
    ),
  getTransaction: (id: number) => request<any>(`/transactions/${id}`),
  updateTransaction: (id: number, payload: any) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (id: number) =>
    withFallback(
      () => request<any>(`/transactions/${id}`, { method: 'DELETE' }),
      () => localFallback.deleteTransaction(id)
    ),
  duplicateTransaction: (id: number, date?: string) => request<any>(`/transactions/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ date }) }),
  interpretVoice: (text: string) =>
    withFallback(
      () => request<any>('/transactions/voice-interpret', { method: 'POST', body: JSON.stringify({ text }) }),
      () => localFallback.interpretVoice(text)
    ),
  exportCsv: () => request<Blob>('/transactions/export-csv'),
  importCsv: (formData: FormData) => request<any>('/transactions/import-csv', { method: 'POST', body: formData }),

  // Budgets
  getBudgets: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return withFallback(
      () => request<any>(`/budgets?${params.toString()}`),
      () => localFallback.getBudgets()
    );
  },
  saveBudget: (payload: any) =>
    withFallback(
      () => request<any>('/budgets', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.saveBudget(payload)
    ),
  copyPreviousBudget: (month: number, year: number) => request<any>('/budgets/copy-previous', { method: 'POST', body: JSON.stringify({ month, year }) }),

  // Saving Goals
  getSavingGoals: () =>
    withFallback(
      () => request<any>('/saving-goals'),
      () => localFallback.getSavingGoals()
    ),
  createSavingGoal: (payload: any) =>
    withFallback(
      () => request<any>('/saving-goals', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.createSavingGoal(payload)
    ),
  getSavingGoal: (id: number) => request<any>(`/saving-goals/${id}`),
  updateSavingGoal: (id: number, payload: any) => request<any>(`/saving-goals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSavingGoal: (id: number) => request<any>(`/saving-goals/${id}`, { method: 'DELETE' }),
  contributeToGoal: (id: number, payload: any) =>
    withFallback(
      () => request<any>(`/saving-goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.contributeToGoal(id, payload)
    ),

  // Bills
  getBills: (status?: string) =>
    withFallback(
      () => request<any>(`/bills${status ? `?status=${status}` : ''}`),
      () => localFallback.getBills()
    ),
  createBill: (payload: any) =>
    withFallback(
      () => request<any>('/bills', { method: 'POST', body: JSON.stringify(payload) }),
      () => localFallback.createBill(payload)
    ),
  updateBill: (id: number, payload: any) => request<any>(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBill: (id: number) => request<any>(`/bills/${id}`, { method: 'DELETE' }),
  markBillAsPaid: (id: number, account_id?: number) =>
    withFallback(
      () => request<any>(`/bills/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ account_id }) }),
      () => localFallback.markBillPaid(id)
    ),
  markBillAsUnpaid: (id: number) => request<any>(`/bills/${id}/mark-unpaid`, { method: 'POST' }),

  // Recurring Transactions
  getRecurringTransactions: () =>
    withFallback(
      () => request<any>('/recurring-transactions'),
      () => localFallback.getRecurring()
    ),
  createRecurringTransaction: (payload: any) => request<any>('/recurring-transactions', { method: 'POST', body: JSON.stringify(payload) }),
  updateRecurringTransaction: (id: number, payload: any) => request<any>(`/recurring-transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRecurringTransaction: (id: number) => request<any>(`/recurring-transactions/${id}`, { method: 'DELETE' }),
  processRecurringNow: (id: number) => request<any>(`/recurring-transactions/${id}/process-now`, { method: 'POST' }),

  // Reports
  getReportsSummary: (period = 'this_month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return withFallback(
      () => request<any>(`/reports/summary?${params.toString()}`),
      () => localFallback.getReportsSummary()
    );
  },

  // Insights
  getInsights: () =>
    withFallback(
      () => request<any>('/insights'),
      () => localFallback.getInsights()
    ),

  // Notifications
  getNotifications: () =>
    withFallback(
      () => request<any>('/notifications'),
      () => localFallback.getNotifications()
    ),
  markNotificationAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsAsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
};
