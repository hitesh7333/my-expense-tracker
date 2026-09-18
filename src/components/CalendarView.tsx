import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Category, TransactionItem } from '../types';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionItem[];
  categories: Category[];
  currencySymbol: string;
  onSelectTransaction: (item: TransactionItem) => void;
}

export const CalendarView: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  currencySymbol,
  onSelectTransaction,
}) => {
  if (!isOpen) return null;

  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Days calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Transactions on selected date
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDateStr);
  }, [transactions, selectedDateStr]);

  const { dayIncome, dayExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of selectedDateTransactions) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { dayIncome: inc, dayExpense: exp };
  }, [selectedDateTransactions]);

  // Aggregate dates in current month that have activity
  const dateActivityMap = useMemo(() => {
    const map: { [d: string]: { hasIncome: boolean; hasExpense: boolean } } = {};
    for (const t of transactions) {
      if (!map[t.date]) {
        map[t.date] = { hasIncome: false, hasExpense: false };
      }
      if (t.type === 'income') map[t.date].hasIncome = true;
      else map[t.date].hasExpense = true;
    }
    return map;
  }, [transactions]);

  const getCategory = (catId: number) => categories.find((c) => c.id === catId);

  return (
    <div
      id="modal-calendar-view"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Financial Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {monthName}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
          <div>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank leading days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="h-9" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = selectedDateStr === dStr;
                const activity = dateActivityMap[dStr];

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDateStr(dStr)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>

                    {/* Activity dots */}
                    {activity && (
                      <div className="flex space-x-0.5 mt-0.5">
                        {activity.hasIncome && (
                          <span
                            className={`w-1 h-1 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                        {activity.hasExpense && (
                          <span
                            className={`w-1 h-1 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-rose-500'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Summary & Transactions */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-teal-800 dark:text-teal-400">
                {selectedDateStr}
              </span>
              <div className="flex items-center space-x-3 text-[11px] font-semibold">
                <span className="flex items-center text-emerald-600">
                  <ArrowDownLeft className="w-3 h-3 mr-0.5" />
                  {formatCurrency(dayIncome, currencySymbol)}
                </span>
                <span className="flex items-center text-rose-600">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {formatCurrency(dayExpense, currencySymbol)}
                </span>
              </div>
            </div>

            {selectedDateTransactions.length === 0 ? (
              <p className="text-center text-slate-400 py-3 text-xs">
                No transactions recorded on this date.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDateTransactions.map((tx) => {
                  const cat = getCategory(tx.categoryId);
                  const isExpense = tx.type === 'expense';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        onClose();
                        onSelectTransaction(tx);
                      }}
                      role="button"
                      tabIndex={0}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat ? `${cat.colorHex}20` : '#0F766E20',
                            color: cat ? cat.colorHex : '#0F766E',
                          }}
                        >
                          <CategoryIcon name={cat?.icon || 'Tag'} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {cat?.name || 'Category'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {tx.note || tx.paymentMethod} • {tx.time}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`font-bold text-xs shrink-0 ${
                          isExpense ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(tx.amount, currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
