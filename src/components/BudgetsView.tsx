import React, { useState } from 'react';
import {
  X,
  PieChart,
  Plus,
  AlertTriangle,
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Budget, Category, TransactionItem } from '../types';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  categories: Category[];
  transactions: TransactionItem[];
  currencySymbol: string;
  onSaveBudget: (budget: Omit<Budget, 'id'>, existingId?: number) => void;
  onDeleteBudget: (budgetId: number) => void;
}

export const BudgetsView: React.FC<Props> = ({
  isOpen,
  onClose,
  budgets,
  categories,
  transactions,
  currencySymbol,
  onSaveBudget,
  onDeleteBudget,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentMonthTxns = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(monthPrefix)
  );

  const [isEditingModal, setIsEditingModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | 'overall'>('overall');
  const [amountInput, setAmountInput] = useState<string>('');
  const [editingBudgetId, setEditingBudgetId] = useState<number | undefined>(undefined);

  // Overall budget item
  const overallBudget = budgets.find(
    (b) => b.categoryId === null && b.month === currentMonth && b.year === currentYear
  );
  const totalMonthExpense = currentMonthTxns.reduce((sum, t) => sum + t.amount, 0);

  // Category budgets
  const categoryBudgets = budgets.filter(
    (b) => b.categoryId !== null && b.month === currentMonth && b.year === currentYear
  );

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleOpenAddOrEdit = (b?: Budget) => {
    if (b) {
      setEditingBudgetId(b.id);
      setSelectedCatId(b.categoryId === null ? 'overall' : b.categoryId);
      setAmountInput(toMajorUnits(b.amount).toString());
    } else {
      setEditingBudgetId(undefined);
      setSelectedCatId('overall');
      setAmountInput('');
    }
    setIsEditingModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed <= 0) return;

    onSaveBudget(
      {
        categoryId: selectedCatId === 'overall' ? null : selectedCatId,
        month: currentMonth,
        year: currentYear,
        amount: toMinorUnits(parsed),
      },
      editingBudgetId
    );

    setIsEditingModal(false);
  };

  return (
    <div
      id="modal-budgets-management"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Budgets ({new Date().toLocaleString('default', { month: 'long' })})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Overall Monthly Budget Card */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Total Monthly Budget
              </span>
              <button
                onClick={() => handleOpenAddOrEdit(overallBudget)}
                className="text-teal-600 dark:text-teal-400 hover:underline font-semibold text-xs flex items-center space-x-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{overallBudget ? 'Edit' : 'Set Budget'}</span>
              </button>
            </div>

            {overallBudget ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">
                    Spent: {formatCurrency(totalMonthExpense, currencySymbol)}
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    Limit: {formatCurrency(overallBudget.amount, currencySymbol)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      totalMonthExpense > overallBudget.amount
                        ? 'bg-rose-500'
                        : totalMonthExpense / overallBudget.amount >= 0.8
                        ? 'bg-amber-500'
                        : 'bg-teal-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        (totalMonthExpense / overallBudget.amount) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">
                    {Math.round((totalMonthExpense / overallBudget.amount) * 100)}% consumed
                  </span>
                  <span
                    className={
                      totalMonthExpense > overallBudget.amount
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-teal-700 dark:text-teal-400'
                    }
                  >
                    {totalMonthExpense > overallBudget.amount
                      ? `Exceeded by ${formatCurrency(
                          totalMonthExpense - overallBudget.amount,
                          currencySymbol
                        )}`
                      : `Remaining: ${formatCurrency(
                          overallBudget.amount - totalMonthExpense,
                          currencySymbol
                        )}`}
                  </span>
                </div>

                {totalMonthExpense / overallBudget.amount >= 0.8 &&
                  totalMonthExpense <= overallBudget.amount && (
                    <div className="flex items-center space-x-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Warning: 80% threshold reached for overall budget.</span>
                    </div>
                  )}

                {totalMonthExpense > overallBudget.amount && (
                  <div className="flex items-center space-x-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>Monthly budget exceeded! You can continue tracking expenses.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">
                No overall monthly budget set. Setting a budget helps keep spending disciplined.
              </p>
            )}
          </div>

          {/* Category-Specific Budgets Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Category Budgets
              </h3>
              <button
                onClick={() => {
                  setSelectedCatId(expenseCategories[0]?.id ?? 1);
                  setEditingBudgetId(undefined);
                  setAmountInput('');
                  setIsEditingModal(true);
                }}
                className="text-teal-600 dark:text-teal-400 hover:underline font-semibold text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category Budget</span>
              </button>
            </div>

            {categoryBudgets.length === 0 ? (
              <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No category-specific budgets configured yet.
              </div>
            ) : (
              <div className="space-y-2">
                {categoryBudgets.map((cb) => {
                  const cat = categories.find((c) => c.id === cb.categoryId);
                  const spent = currentMonthTxns
                    .filter((t) => t.categoryId === cb.categoryId)
                    .reduce((sum, t) => sum + t.amount, 0);
                  const ratio = cb.amount > 0 ? spent / cb.amount : 0;
                  const isWarn = ratio >= 0.8 && ratio <= 1.0;
                  const isExceeded = ratio > 1.0;

                  return (
                    <div
                      key={cb.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: cat ? `${cat.colorHex}22` : '#0F766E22',
                              color: cat ? cat.colorHex : '#0F766E',
                            }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {cat?.name || 'Category'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenAddOrEdit(cb)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBudget(cb.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">
                          Spent: {formatCurrency(spent, currencySymbol)}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Budget: {formatCurrency(cb.amount, currencySymbol)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isExceeded
                              ? 'bg-rose-500'
                              : isWarn
                              ? 'bg-amber-500'
                              : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{Math.round(ratio * 100)}%</span>
                        <span
                          className={`font-semibold ${
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-teal-700 dark:text-teal-400'
                          }`}
                        >
                          {isExceeded
                            ? `Exceeded by ${formatCurrency(spent - cb.amount, currencySymbol)}`
                            : `Remaining: ${formatCurrency(cb.amount - spent, currencySymbol)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mini Edit / Create Sub-Modal */}
        {isEditingModal && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              {editingBudgetId ? 'Update Budget' : 'Add New Budget'}
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Budget Target
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) =>
                    setSelectedCatId(
                      e.target.value === 'overall' ? 'overall' : parseInt(e.target.value)
                    )
                  }
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                >
                  <option value="overall">Overall Total Monthly Budget</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Budget Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold text-xs shadow-xs"
              >
                Save Budget
              </button>
              <button
                type="button"
                onClick={() => setIsEditingModal(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
