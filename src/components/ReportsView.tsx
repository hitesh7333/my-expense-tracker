import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Tag,
  CreditCard,
  Calendar,
  Layers,
} from 'lucide-react';
import { Category, TransactionItem } from '../types';
import { formatCurrency, toMajorUnits } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  transactions: TransactionItem[];
  categories: Category[];
  currencySymbol: string;
  onFilterByCategory: (categoryId: number) => void;
}

export const ReportsView: React.FC<Props> = ({
  transactions,
  categories,
  currencySymbol,
  onFilterByCategory,
}) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Filter transactions according to selected range
  const filteredTransactions = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];

    if (timeRange === 'daily') {
      return transactions.filter((t) => t.date === todayStr);
    } else if (timeRange === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return transactions.filter((t) => t.date >= weekAgoStr && t.date <= todayStr);
    } else if (timeRange === 'monthly') {
      const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      return transactions.filter((t) => t.date.startsWith(monthPrefix));
    } else {
      // yearly
      return transactions.filter((t) => t.date.startsWith(`${currentYear}-`));
    }
  }, [transactions, timeRange, currentYear, currentMonth]);

  // Aggregate Metrics
  const {
    totalIncome,
    totalExpense,
    netSavings,
    highestSingleTxn,
    categorySpending,
    paymentMethodSpending,
    dailyExpenseMap,
    monthlyExpenseMap,
  } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let highestSingle: TransactionItem | null = null;
    const catMap: { [catId: number]: number } = {};
    const methodMap: { [method: string]: number } = {};
    const dailyMap: { [date: string]: number } = {};
    const monthlyMap: { [month: string]: number } = {};

    for (const t of filteredTransactions) {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
        if (!highestSingle || t.amount > highestSingle.amount) {
          highestSingle = t;
        }
        catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
        methodMap[t.paymentMethod] = (methodMap[t.paymentMethod] || 0) + t.amount;

        // Daily
        dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;

        // Month (YYYY-MM)
        const mKey = t.date.slice(0, 7);
        monthlyMap[mKey] = (monthlyMap[mKey] || 0) + t.amount;
      }
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: income - expense,
      highestSingleTxn: highestSingle,
      categorySpending: catMap,
      paymentMethodSpending: methodMap,
      dailyExpenseMap: dailyMap,
      monthlyExpenseMap: monthlyMap,
    };
  }, [filteredTransactions]);

  // Days divisor for average daily calculation
  const daysDivisor =
    timeRange === 'daily'
      ? 1
      : timeRange === 'weekly'
      ? 7
      : timeRange === 'monthly'
      ? new Date(currentYear, currentMonth, 0).getDate()
      : 365;
  const avgDailyExpense = Math.round(totalExpense / daysDivisor);

  // Top category
  const sortedCategories = useMemo(() => {
    return Object.entries(categorySpending)
      .map(([catIdStr, amount]) => {
        const catId = parseInt(catIdStr);
        const cat = categories.find((c) => c.id === catId);
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        return {
          catId,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'Tag',
          color: cat?.colorHex || '#94A3B8',
          amount,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [categorySpending, categories, totalExpense]);

  const highestSpendingCategory = sortedCategories[0] || null;

  // Sorted payment methods
  const sortedPaymentMethods = useMemo(() => {
    return Object.entries(paymentMethodSpending)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [paymentMethodSpending, totalExpense]);

  // Donut SVG Generator
  const donutSlices = useMemo(() => {
    let cumulative = 0;
    const slices = sortedCategories.map((c) => {
      const startAngle = cumulative;
      cumulative += c.percentage;
      return {
        ...c,
        startAngle,
        endAngle: cumulative,
      };
    });
    return slices;
  }, [sortedCategories]);

  // Daily Chart Points (last 7 or active dates)
  const dailyChartEntries = useMemo(() => {
    const dates = Object.keys(dailyExpenseMap).sort();
    const maxVal = Math.max(...Object.values(dailyExpenseMap), 1);
    return dates.map((date) => ({
      date,
      amount: dailyExpenseMap[date],
      heightRatio: dailyExpenseMap[date] / maxVal,
    }));
  }, [dailyExpenseMap]);

  return (
    <div id="reports-view" className="space-y-4 pb-16 text-xs">
      {/* Time Range Selector */}
      <div className="grid grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`py-1.5 text-xs font-bold capitalize rounded-lg transition-all ${
              timeRange === range
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Overview Stats Cards (6 metrics) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Total Income</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatCurrency(totalIncome, currencySymbol)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Total Expense</span>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {formatCurrency(totalExpense, currencySymbol)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Net Savings</span>
          <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            {formatCurrency(netSavings, currencySymbol)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Avg Daily Expense</span>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatCurrency(avgDailyExpense, currencySymbol)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Top Spending Category</span>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
            {highestSpendingCategory ? highestSpendingCategory.name : 'None'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Highest Transaction</span>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
            {highestSingleTxn
              ? formatCurrency(highestSingleTxn.amount, currencySymbol)
              : 'None'}
          </p>
        </div>
      </div>

      {/* Chart 1: Expense by Category (Interactive Donut & Breakdown) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <PieIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Expense by Category
          </h2>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            No expense data recorded for this period.
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Donut Visual */}
            <div className="flex items-center justify-center pt-2">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {donutSlices.map((slice, idx) => {
                    const strokeDasharray = `${slice.percentage} ${100 - slice.percentage}`;
                    const strokeDashoffset = -slice.startAngle;
                    return (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">
                    Total Exp
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(totalExpense, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tap Category to Filter notice */}
            <p className="text-[11px] text-slate-400 text-center italic">
              Tap any category below to view all its transactions
            </p>

            {/* Category Breakdown Table */}
            <div className="space-y-1.5 pt-1">
              {sortedCategories.map((c) => (
                <button
                  key={c.catId}
                  onClick={() => onFilterByCategory(c.catId)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${c.color}20`,
                        color: c.color,
                      }}
                    >
                      <CategoryIcon name={c.icon} className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {c.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(c.amount, currencySymbol)}
                    </span>
                    <span className="ml-2 text-slate-400 text-[11px]">
                      {c.percentage.toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart 2: Income vs Expense (Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Income vs Expense
          </h2>
        </div>

        <div className="pt-2 space-y-3">
          {/* Income Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Income
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalIncome, currencySymbol)}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    Math.max(totalIncome, totalExpense) > 0
                      ? (totalIncome / Math.max(totalIncome, totalExpense)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Expense Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-rose-700 dark:text-rose-400">
                Expense
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalExpense, currencySymbol)}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    Math.max(totalIncome, totalExpense) > 0
                      ? (totalExpense / Math.max(totalIncome, totalExpense)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Daily Expenses (Line / Step Trend) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Daily Expenses Breakdown
          </h2>
        </div>

        {dailyChartEntries.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            No daily expense points recorded.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-28 flex items-end justify-between space-x-1 pt-4 px-1 border-b border-slate-200 dark:border-slate-800">
              {dailyChartEntries.slice(-8).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div
                    className="w-full max-w-[20px] bg-teal-600 hover:bg-teal-500 rounded-t-sm transition-all relative"
                    style={{ height: `${Math.max(d.heightRatio * 100, 6)}%` }}
                  >
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                      {formatCurrency(d.amount, currencySymbol)}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 truncate max-w-[32px]">
                    {d.date.slice(8)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center">Day of Month</p>
          </div>
        )}
      </div>

      {/* Section 4: Payment Method Analysis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            4. Payment Method Analysis
          </h2>
        </div>

        {sortedPaymentMethods.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            No payment method data recorded.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPaymentMethods.map((m) => (
              <div key={m.method} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {m.method}
                  </span>
                  <div className="space-x-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(m.amount, currencySymbol)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({m.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
