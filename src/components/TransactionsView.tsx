import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  X,
  Calendar,
  Wallet,
} from 'lucide-react';
import { Account, Category, PaymentMethod, TransactionItem, TransactionType } from '../types';
import { formatCurrency, toMajorUnits } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  transactions: TransactionItem[];
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onSelectTransaction: (item: TransactionItem) => void;
  initialFilterCategory?: number | null;
}

export const TransactionsView: React.FC<Props> = ({
  transactions,
  categories,
  accounts,
  currencySymbol,
  onSelectTransaction,
  initialFilterCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>(
    initialFilterCategory ?? 'all'
  );
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<number | 'all'>('all');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const getCategory = (catId: number) => categories.find((c) => c.id === catId);
  const getAccount = (accId: number) => accounts.find((a) => a.id === accId);

  // Filter and sort
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
        if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
        if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
        if (dateFilter && t.date !== dateFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const cat = getCategory(t.categoryId);
          const acc = getAccount(t.accountId);
          const majorAmt = toMajorUnits(t.amount).toString();

          const matchNote = t.note.toLowerCase().includes(q);
          const matchCat = cat?.name.toLowerCase().includes(q);
          const matchAcc = acc?.name.toLowerCase().includes(q);
          const matchMethod = t.paymentMethod.toLowerCase().includes(q);
          const matchAmt = majorAmt.includes(q);

          if (!matchNote && !matchCat && !matchAcc && !matchMethod && !matchAmt) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const cmp = b.date.localeCompare(a.date);
        if (cmp !== 0) return isNewestFirst ? cmp : -cmp;
        return isNewestFirst ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time);
      });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    methodFilter,
    accountFilter,
    dateFilter,
    searchQuery,
    isNewestFirst,
    categories,
    accounts,
  ]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { [dateStr: string]: TransactionItem[] } = {};
    for (const item of filtered) {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    }
    return groups;
  }, [filtered]);

  const formatDateHeader = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const hasActiveFilters =
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    methodFilter !== 'all' ||
    accountFilter !== 'all' ||
    dateFilter !== '';

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setMethodFilter('all');
    setAccountFilter('all');
    setDateFilter('');
    setSearchQuery('');
  };

  return (
    <div id="transactions-view" className="space-y-3 pb-16">
      {/* Search and Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-transactions"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search note, category, amount..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters */}
          <button
            id="btn-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors ${
              hasActiveFilters || showFilters
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Filter options"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Sort Order Toggle */}
          <button
            id="btn-sort-order"
            onClick={() => setIsNewestFirst(!isNewestFirst)}
            className="p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title={isNewestFirst ? 'Sorting: Newest First' : 'Sorting: Oldest First'}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Type Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Expenses Only
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Income Only
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-teal-600 dark:text-teal-400 underline font-medium px-2 shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filter Panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                    )
                  }
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value as any)}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Account
                </label>
                <select
                  value={accountFilter}
                  onChange={(e) =>
                    setAccountFilter(
                      e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                    )
                  }
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Specific Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List Grouped by Date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No transactions match your search and filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(grouped).map((dateKey) => {
            const dateTxns = grouped[dateKey];
            return (
              <div key={dateKey} className="space-y-1.5">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-400">
                    {formatDateHeader(dateKey)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {dateTxns.length} {dateTxns.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Date Group Items */}
                <div className="space-y-1.5">
                  {dateTxns.map((tx) => {
                    const cat = getCategory(tx.categoryId);
                    const acc = getAccount(tx.accountId);
                    const isExpense = tx.type === 'expense';

                    return (
                      <div
                        key={tx.id}
                        id={`txn-item-${tx.id}`}
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
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {cat?.name || 'Category'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                {tx.paymentMethod}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {tx.note || (acc ? `Account: ${acc.name}` : '')}
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
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {tx.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
