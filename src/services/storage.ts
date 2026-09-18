import {
  Account,
  AppSettings,
  Bill,
  Budget,
  Category,
  DatabaseState,
  RecurringTransaction,
  TransactionItem,
  Transfer,
} from '../types';
import { toMinorUnits } from '../utils/currency';

const DB_KEY = 'my_expense_tracker_db_v1';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 1, name: 'Cash', type: 'Cash', openingBalance: 0, currentBalance: 0 },
  { id: 2, name: 'Bank Account', type: 'Bank', openingBalance: 0, currentBalance: 0 },
  { id: 3, name: 'UPI Wallet', type: 'UPI', openingBalance: 0, currentBalance: 0 },
  { id: 4, name: 'Credit Card', type: 'Credit Card', openingBalance: 0, currentBalance: 0 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: 1, name: 'Food', type: 'expense', icon: 'Utensils', colorHex: '#EF4444', isDefault: true },
  { id: 2, name: 'Grocery', type: 'expense', icon: 'ShoppingCart', colorHex: '#F97316', isDefault: true },
  { id: 3, name: 'Rent', type: 'expense', icon: 'Home', colorHex: '#8B5CF6', isDefault: true },
  { id: 4, name: 'Electricity', type: 'expense', icon: 'Zap', colorHex: '#FBBF24', isDefault: true },
  { id: 5, name: 'Water', type: 'expense', icon: 'Droplets', colorHex: '#38BDF8', isDefault: true },
  { id: 6, name: 'Mobile Recharge', type: 'expense', icon: 'Smartphone', colorHex: '#06B6D4', isDefault: true },
  { id: 7, name: 'Internet', type: 'expense', icon: 'Wifi', colorHex: '#6366F1', isDefault: true },
  { id: 8, name: 'Transport', type: 'expense', icon: 'Bus', colorHex: '#14B8A6', isDefault: true },
  { id: 9, name: 'Fuel', type: 'expense', icon: 'Fuel', colorHex: '#EAB308', isDefault: true },
  { id: 10, name: 'Medical', type: 'expense', icon: 'Stethoscope', colorHex: '#EC4899', isDefault: true },
  { id: 11, name: 'Education', type: 'expense', icon: 'GraduationCap', colorHex: '#3B82F6', isDefault: true },
  { id: 12, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', colorHex: '#A855F7', isDefault: true },
  { id: 13, name: 'Entertainment', type: 'expense', icon: 'Film', colorHex: '#F43F5E', isDefault: true },
  { id: 14, name: 'EMI / Loan', type: 'expense', icon: 'Landmark', colorHex: '#64748B', isDefault: true },
  { id: 15, name: 'Subscription', type: 'expense', icon: 'RotateCw', colorHex: '#84CC16', isDefault: true },
  { id: 16, name: 'Other', type: 'expense', icon: 'Tag', colorHex: '#94A3B8', isDefault: true },
  // Income categories
  { id: 17, name: 'Salary', type: 'income', icon: 'Wallet', colorHex: '#10B981', isDefault: true },
  { id: 18, name: 'Business', type: 'income', icon: 'Store', colorHex: '#059669', isDefault: true },
  { id: 19, name: 'Freelance', type: 'income', icon: 'Laptop', colorHex: '#0D9488', isDefault: true },
  { id: 20, name: 'Interest', type: 'income', icon: 'PiggyBank', colorHex: '#0284C7', isDefault: true },
  { id: 21, name: 'Investment', type: 'income', icon: 'TrendingUp', colorHex: '#16A34A', isDefault: true },
  { id: 22, name: 'Other', type: 'income', icon: 'Tag', colorHex: '#64748B', isDefault: true },
];

const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '₹',
  themeMode: 'system',
  isPinLockEnabled: false,
  hashedPin: '',
};

export function loadDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial: DatabaseState = {
        accounts: DEFAULT_ACCOUNTS,
        categories: DEFAULT_CATEGORIES,
        transactions: [],
        budgets: [
          {
            id: 1,
            categoryId: null,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: toMinorUnits(20000), // Default budget of ₹20,000
          },
        ],
        bills: [],
        recurring: [],
        transfers: [],
        settings: DEFAULT_SETTINGS,
      };
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return {
      accounts: parsed.accounts || DEFAULT_ACCOUNTS,
      categories: parsed.categories || DEFAULT_CATEGORIES,
      transactions: parsed.transactions || [],
      budgets: parsed.budgets || [],
      bills: parsed.bills || [],
      recurring: parsed.recurring || [],
      transfers: parsed.transfers || [],
      settings: parsed.settings || DEFAULT_SETTINGS,
    };
  } catch (err) {
    console.error('Failed to load database from localStorage:', err);
    return {
      accounts: DEFAULT_ACCOUNTS,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      budgets: [],
      bills: [],
      recurring: [],
      transfers: [],
      settings: DEFAULT_SETTINGS,
    };
  }
}

export function saveDatabase(data: DatabaseState): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

export function generateSampleData(currentYear: number, currentMonth: number): DatabaseState {
  const monthStr = String(currentMonth).padStart(2, '0');
  const d18 = `${currentYear}-${monthStr}-18`;
  const d17 = `${currentYear}-${monthStr}-17`;

  const accounts: Account[] = [
    { id: 1, name: 'Cash', type: 'Cash', openingBalance: toMinorUnits(5000), currentBalance: toMinorUnits(4800) },
    { id: 2, name: 'Bank Account', type: 'Bank', openingBalance: toMinorUnits(15000), currentBalance: toMinorUnits(38650) },
    { id: 3, name: 'UPI Wallet', type: 'UPI', openingBalance: toMinorUnits(2000), currentBalance: toMinorUnits(2000) },
    { id: 4, name: 'Credit Card', type: 'Credit Card', openingBalance: 0, currentBalance: 0 },
  ];

  // Transactions requested in specification:
  // Salary ₹25,000, Food ₹120, Transport ₹80, Shopping ₹500, Recharge ₹299, Electricity ₹1,200
  const transactions: TransactionItem[] = [
    {
      id: 1,
      type: 'income',
      amount: toMinorUnits(25000),
      categoryId: 17, // Salary
      accountId: 2, // Bank Account
      paymentMethod: 'Bank',
      date: d18,
      time: '09:00',
      note: 'Monthly Salary credited',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'expense',
      amount: toMinorUnits(120),
      categoryId: 1, // Food
      accountId: 1, // Cash
      paymentMethod: 'Cash',
      date: d18,
      time: '13:15',
      note: 'Lunch at café',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      type: 'expense',
      amount: toMinorUnits(80),
      categoryId: 8, // Transport
      accountId: 1, // Cash
      paymentMethod: 'Cash',
      date: d18,
      time: '17:30',
      note: 'Metro pass recharge',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      type: 'expense',
      amount: toMinorUnits(500),
      categoryId: 12, // Shopping
      accountId: 2, // Bank
      paymentMethod: 'Debit Card',
      date: d17,
      time: '16:20',
      note: 'Weekend clothing store',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      type: 'expense',
      amount: toMinorUnits(299),
      categoryId: 6, // Mobile Recharge
      accountId: 2, // Bank
      paymentMethod: 'UPI',
      date: d17,
      time: '11:00',
      note: 'Monthly 5G data plan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 6,
      type: 'expense',
      amount: toMinorUnits(1200),
      categoryId: 4, // Electricity
      accountId: 2, // Bank
      paymentMethod: 'UPI',
      date: d17,
      time: '10:15',
      note: 'Apartment electricity bill',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const budgets: Budget[] = [
    {
      id: 1,
      categoryId: null, // Overall
      month: currentMonth,
      year: currentYear,
      amount: toMinorUnits(20000),
    },
    {
      id: 2,
      categoryId: 1, // Food
      month: currentMonth,
      year: currentYear,
      amount: toMinorUnits(5000),
    },
    {
      id: 3,
      categoryId: 8, // Transport
      month: currentMonth,
      year: currentYear,
      amount: toMinorUnits(2000),
    },
    {
      id: 4,
      categoryId: 12, // Shopping
      month: currentMonth,
      year: currentYear,
      amount: toMinorUnits(3000),
    },
    {
      id: 5,
      categoryId: 13, // Entertainment
      month: currentMonth,
      year: currentYear,
      amount: toMinorUnits(1000),
    },
  ];

  const bills: Bill[] = [
    {
      id: 1,
      name: 'Broadband Fiber',
      amount: toMinorUnits(799),
      dueDate: `${currentYear}-${monthStr}-25`,
      categoryId: 7,
      status: 'Upcoming',
    },
    {
      id: 2,
      name: 'Credit Card Bill',
      amount: toMinorUnits(3450),
      dueDate: `${currentYear}-${monthStr}-22`,
      categoryId: 14,
      status: 'Due Soon',
    },
  ];

  const recurring: RecurringTransaction[] = [
    {
      id: 1,
      type: 'expense',
      amount: toMinorUnits(12000),
      categoryId: 3, // Rent
      accountId: 2,
      frequency: 'Monthly',
      startDate: `${currentYear}-${monthStr}-01`,
      note: 'House Rent',
    },
    {
      id: 2,
      type: 'expense',
      amount: toMinorUnits(499),
      categoryId: 15, // Subscription
      accountId: 2,
      frequency: 'Monthly',
      startDate: `${currentYear}-${monthStr}-05`,
      note: 'Music & Streaming',
    },
  ];

  return {
    accounts,
    categories: DEFAULT_CATEGORIES,
    transactions,
    budgets,
    bills,
    recurring,
    transfers: [],
    settings: DEFAULT_SETTINGS,
  };
}
