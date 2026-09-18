import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Receipt,
  AlertTriangle,
  CreditCard,
  PieChart,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { Account, Budget, Category, TransactionItem } from '../types';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  transactions: TransactionItem[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  currencySymbol: string;
  onOpenAdd: () => void;
  onViewAllTransactions: () => void;
  onSelectTransaction: (item: TransactionItem) => void;
  onOpenAccounts: () => void;
  onOpenBudgets: () => void;
  onOpenBills: () => void;
}

export const DashboardView: React.FC<Props> = ({
  transactions,
  accounts,
  categories,
  budgets,
  currencySymbol,
  onOpenAdd,
  onViewAllTransactions,
  onSelectTransaction,
  onOpenAccounts,
  onOpenBudgets,
  onOpenBills,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Current month transactions
  const monthTxns = transactions.filter((t) => t.date.startsWith(monthPrefix));

  let monthIncome = 0;
  let monthExpense = 0;
  for (const t of monthTxns) {
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else {
      monthExpense += t.amount;
    }
  }

  const monthSavings = monthIncome - monthExpense;

  // Net Balance: sum of current balance across all user accounts
  const netBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // Overall Monthly Budget
  const overallBudgetObj = budgets.find(
    (b) => b.categoryId === null && b.month === currentMonth && b.year === currentYear
  );
  const monthlyBudget = overallBudgetObj ? overallBudgetObj.amount : 0;
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - monthExpense : 0;
  const budgetRatio = monthlyBudget > 0 ? monthExpense / monthlyBudget : 0;
  const budgetPercent = Math.min(Math.round(budgetRatio * 100), 100);
  const isBudgetWarning = budgetRatio >= 0.8 && budgetRatio <= 1.0;
  const isBudgetExceeded = budgetRatio > 1.0;

  // Recent 6 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return b.time.localeCompare(a.time);
    })
    .slice(0, 6);

  const getCategory = (catId: number) => categories.find((c) => c.id === catId);

  return (
    <div id="dashboard-view" className="space-y-4 pb-12">
      {/* Quick Access Feature Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar text-xs">
        <button
          id="chip-accounts"
          onClick={onOpenAccounts}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Accounts ({accounts.length})</span>
        </button>

        <button
          id="chip-budgets"
          onClick={onOpenBudgets}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <PieChart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Monthly Budget</span>
        </button>

        <button
          id="chip-bills"
          onClick={onOpenBills}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <CalendarClock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Bills & Recurring</span>
        </button>
      </div>

      {/* Main Balance & Overview Card */}
      <div
        id="card-balance-summary"
        className="rounded-2xl p-5 bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between text-teal-100 text-xs font-medium uppercase tracking-wider">
            <span>Current Net Balance</span>
            <span className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
              <Wallet className="w-3 h-3" />
              <span>{accounts.length} Accounts</span>
            </span>
          </div>

          <div className="mt-2 text-3xl font-extrabold tracking-tight">
            {formatCurrency(netBalance, currencySymbol)}
          </div>

          {/* Submetrics Row */}
          <div className="mt-6 pt-4 border-t border-teal-600/50 grid grid-cols-3 gap-2">
            <div>
              <div className="flex items-center space-x-1 text-teal-200 text-[11px]">
                <ArrowDownLeft className="w-3 h-3 text-emerald-300" />
                <span>Income</span>
              </div>
              <div className="text-sm font-bold text-emerald-200 mt-0.5 truncate">
                {formatCurrency(monthIncome, currencySymbol)}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1 text-teal-200 text-[11px]">
                <ArrowUpRight className="w-3 h-3 text-rose-300" />
                <span>Expenses</span>
              </div>
              <div className="text-sm font-bold text-rose-200 mt-0.5 truncate">
                {formatCurrency(monthExpense, currencySymbol)}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1 text-teal-200 text-[11px]">
                <PiggyBank className="w-3 h-3 text-sky-300" />
                <span>Savings</span>
              </div>
              <div className="text-sm font-bold text-sky-200 mt-0.5 truncate">
                {formatCurrency(monthSavings, currencySymbol)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Card */}
      <div
        id="card-monthly-budget"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Monthly Budget
            </h2>
          </div>
          <button
            onClick={onOpenBudgets}
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center"
          >
            <span>Manage</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {monthlyBudget > 0 ? (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Spent: {formatCurrency(monthExpense, currencySymbol)}</span>
              <span>Budget: {formatCurrency(monthlyBudget, currencySymbol)}</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBudgetExceeded
                    ? 'bg-rose-500'
                    : isBudgetWarning
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {Math.round(budgetRatio * 100)}% used
              </span>
              <span
                className={`font-semibold ${
                  isBudgetExceeded
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-teal-700 dark:text-teal-400'
                }`}
              >
                {isBudgetExceeded
                  ? `Exceeded by ${formatCurrency(monthExpense - monthlyBudget, currencySymbol)}`
                  : `Remaining: ${formatCurrency(remainingBudget, currencySymbol)}`}
              </span>
            </div>

            {/* Warning or Alert Banner */}
            {isBudgetWarning && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Warning: You have reached 80% of your monthly budget limit.</span>
              </div>
            )}
            {isBudgetExceeded && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Notice: Monthly budget exceeded by {formatCurrency(monthExpense - monthlyBudget, currencySymbol)}.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>No budget set for {new Date().toLocaleString('default', { month: 'long' })}</span>
            <button
              onClick={onOpenBudgets}
              className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg font-medium"
            >
              Set Budget
            </button>
          </div>
        )}
      </div>

      {/* Prominent + Add Transaction Button */}
      <button
        id="btn-prominent-add"
        onClick={onOpenAdd}
        className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-xl font-bold shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">+ Add Transaction</span>
      </button>

      {/* Recent Transactions Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Transactions
          </h2>
          {transactions.length > 0 && (
            <button
              id="btn-view-all-txns"
              onClick={onViewAllTransactions}
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              View All ({transactions.length})
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div
            id="empty-transactions-state"
            className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3 bg-white/50 dark:bg-slate-900/50"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                No transactions yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Add your first income or expense to start tracking your money.
              </p>
            </div>
            <button
              onClick={onOpenAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const cat = getCategory(tx.categoryId);
              const isExpense = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  id={`recent-txn-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: cat ? `${cat.colorHex}18` : '#0F766E18',
                        color: cat ? cat.colorHex : '#0F766E',
                      }}
                    >
                      <CategoryIcon
                        name={cat ? cat.icon : 'Tag'}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cat ? cat.name : 'Unknown Category'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {tx.note ? tx.note : `${tx.paymentMethod} • ${tx.date}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <p
                      className={`text-xs font-bold ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(tx.amount, currencySymbol)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {tx.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
