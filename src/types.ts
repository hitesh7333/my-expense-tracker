export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank' | 'Debit Card' | 'Credit Card' | 'Other';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  icon: string;
  colorHex: string;
  isDefault: boolean;
}

export interface Account {
  id: number;
  name: string;
  type: 'Cash' | 'Bank' | 'UPI' | 'Credit Card' | 'Other';
  openingBalance: number; // in paise (integer)
  currentBalance: number; // in paise (integer)
}

export interface TransactionItem {
  id: number;
  type: TransactionType;
  amount: number; // in paise (integer)
  categoryId: number;
  accountId: number;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: number;
  categoryId: number | null; // null for overall monthly budget
  month: number; // 1 - 12
  year: number;
  amount: number; // in paise (integer)
}

export interface Bill {
  id: number;
  name: string;
  amount: number; // in paise (integer)
  dueDate: string; // YYYY-MM-DD
  categoryId: number;
  status: 'Upcoming' | 'Due Soon' | 'Paid' | 'Overdue';
}

export interface RecurringTransaction {
  id: number;
  type: TransactionType;
  amount: number; // in paise
  categoryId: number;
  accountId: number;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  note: string;
  lastProcessedDate?: string;
}

export interface Transfer {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number; // in paise
  date: string; // YYYY-MM-DD
  note: string;
}

export interface AppSettings {
  currencySymbol: string;
  themeMode: 'light' | 'dark' | 'system';
  isPinLockEnabled: boolean;
  hashedPin: string;
}

export interface DatabaseState {
  accounts: Account[];
  categories: Category[];
  transactions: TransactionItem[];
  budgets: Budget[];
  bills: Bill[];
  recurring: RecurringTransaction[];
  transfers: Transfer[];
  settings: AppSettings;
}
