import React, { useState } from 'react';
import { X, Edit, Trash2, Calendar, Clock, CreditCard, Tag, AlertTriangle } from 'lucide-react';
import { Account, Category, TransactionItem } from '../types';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  transaction: TransactionItem | null;
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onClose: () => void;
  onEdit: (tx: TransactionItem) => void;
  onDelete: (tx: TransactionItem) => void;
}

export const TransactionDetailsModal: React.FC<Props> = ({
  transaction,
  categories,
  accounts,
  currencySymbol,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const isExpense = transaction.type === 'expense';

  return (
    <div
      id="modal-transaction-details"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Transaction Details
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Type Hero */}
        <div className="text-center py-2">
          <div
            className={`text-3xl font-extrabold ${
              isExpense
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isExpense ? '-' : '+'}
            {formatCurrency(transaction.amount, currencySymbol)}
          </div>
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isExpense
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {isExpense ? 'Expense' : 'Income'}
            </span>
          </div>
        </div>

        {/* Details Table */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <span>Category</span>
            </span>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-100">
              <CategoryIcon
                name={category ? category.icon : 'Tag'}
                className="w-4 h-4 text-teal-600"
              />
              <span>{category?.name || 'Uncategorized'}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/60" />

          {/* Payment Method */}
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Method</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {transaction.paymentMethod}
            </span>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/60" />

          {/* Account */}
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Account</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {account?.name || 'Default Account'}
            </span>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/60" />

          {/* Date & Time */}
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date & Time</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {transaction.date} • {transaction.time}
            </span>
          </div>

          {/* Note */}
          {transaction.note && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700/60" />
              <div className="flex flex-col space-y-1">
                <span className="text-slate-500 dark:text-slate-400">Note</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {transaction.note}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Box */}
        {showConfirmDelete ? (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Are you sure you want to delete this transaction?</span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-300">
              Account balance will automatically be updated to revert this transaction.
            </p>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDelete(transaction);
                  onClose();
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Action Buttons: Edit & Delete */
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="btn-edit-transaction"
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              <Edit className="w-4 h-4 text-teal-600" />
              <span>Edit</span>
            </button>

            <button
              id="btn-delete-transaction"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center justify-center space-x-1.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors border border-rose-200 dark:border-rose-900"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
