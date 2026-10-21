const API_BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
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

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && (contentType.includes('text/csv') || contentType.includes('octet-stream'))) {
    return (await response.blob()) as unknown as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Terjadi kesalahan sistem.');
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<any>('/logout', { method: 'POST' }),
  getMe: () => request<any>('/me'),
  updateProfile: (payload: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request<any>('/password', { method: 'PUT', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) => request<any>('/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  exportPersonalData: () => request<any>('/export-data'),
  deleteAccount: (payload: any) => request<any>('/account-delete', { method: 'DELETE', body: JSON.stringify(payload) }),

  // Accounts
  getAccounts: (includeArchived = false) => request<any>(`/accounts?include_archived=${includeArchived ? '1' : '0'}`),
  createAccount: (payload: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(payload) }),
  getAccount: (id: number) => request<any>(`/accounts/${id}`),
  updateAccount: (id: number, payload: any) => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAccountRecord: (id: number) => request<any>(`/accounts/${id}`, { method: 'DELETE' }),
  transferBetweenAccounts: (payload: any) => request<any>('/accounts/transfer', { method: 'POST', body: JSON.stringify(payload) }),

  // Categories
  getCategories: (type?: string, includeArchived = false) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (includeArchived) params.set('include_archived', '1');
    return request<any>(`/categories?${params.toString()}`);
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
    return request<any>(`/transactions?${params.toString()}`);
  },
  createTransaction: (payload: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  getTransaction: (id: number) => request<any>(`/transactions/${id}`),
  updateTransaction: (id: number, payload: any) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (id: number) => request<any>(`/transactions/${id}`, { method: 'DELETE' }),
  duplicateTransaction: (id: number, date?: string) => request<any>(`/transactions/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ date }) }),
  interpretVoice: (text: string) => request<any>('/transactions/voice-interpret', { method: 'POST', body: JSON.stringify({ text }) }),
  exportCsv: () => request<Blob>('/transactions/export-csv'),
  importCsv: (formData: FormData) => request<any>('/transactions/import-csv', { method: 'POST', body: formData }),

  // Budgets
  getBudgets: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return request<any>(`/budgets?${params.toString()}`);
  },
  saveBudget: (payload: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(payload) }),
  copyPreviousBudget: (month: number, year: number) => request<any>('/budgets/copy-previous', { method: 'POST', body: JSON.stringify({ month, year }) }),

  // Saving Goals
  getSavingGoals: () => request<any>('/saving-goals'),
  createSavingGoal: (payload: any) => request<any>('/saving-goals', { method: 'POST', body: JSON.stringify(payload) }),
  getSavingGoal: (id: number) => request<any>(`/saving-goals/${id}`),
  updateSavingGoal: (id: number, payload: any) => request<any>(`/saving-goals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSavingGoal: (id: number) => request<any>(`/saving-goals/${id}`, { method: 'DELETE' }),
  contributeToGoal: (id: number, payload: any) => request<any>(`/saving-goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(payload) }),

  // Bills
  getBills: (status?: string) => request<any>(`/bills${status ? `?status=${status}` : ''}`),
  createBill: (payload: any) => request<any>('/bills', { method: 'POST', body: JSON.stringify(payload) }),
  updateBill: (id: number, payload: any) => request<any>(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBill: (id: number) => request<any>(`/bills/${id}`, { method: 'DELETE' }),
  markBillAsPaid: (id: number, account_id?: number) => request<any>(`/bills/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ account_id }) }),
  markBillAsUnpaid: (id: number) => request<any>(`/bills/${id}/mark-unpaid`, { method: 'POST' }),

  // Recurring Transactions
  getRecurringTransactions: () => request<any>('/recurring-transactions'),
  createRecurringTransaction: (payload: any) => request<any>('/recurring-transactions', { method: 'POST', body: JSON.stringify(payload) }),
  updateRecurringTransaction: (id: number, payload: any) => request<any>(`/recurring-transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRecurringTransaction: (id: number) => request<any>(`/recurring-transactions/${id}`, { method: 'DELETE' }),
  processRecurringNow: (id: number) => request<any>(`/recurring-transactions/${id}/process-now`, { method: 'POST' }),

  // Reports
  getReportsSummary: (period = 'this_month', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return request<any>(`/reports/summary?${params.toString()}`);
  },

  // Insights
  getInsights: () => request<any>('/insights'),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationAsRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsAsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
};
