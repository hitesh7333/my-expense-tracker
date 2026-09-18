import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Account, Category, PaymentMethod, TransactionItem, TransactionType } from '../types';
import { toMajorUnits, toMinorUnits } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onSave: (transactionData: Omit<TransactionItem, 'id' | 'createdAt' | 'updatedAt'>, editId?: number) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  transactionToEdit?: TransactionItem | null;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  currencySymbol,
  onSave,
  onAddCategory,
  transactionToEdit,
}) => {
  if (!isOpen) return null;

  const isEditing = !!transactionToEdit;
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [type, setType] = useState<TransactionType>(
    transactionToEdit ? transactionToEdit.type : 'expense'
  );
  const [amountStr, setAmountStr] = useState<string>(
    transactionToEdit ? toMajorUnits(transactionToEdit.amount).toString() : ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(() => {
    if (transactionToEdit) return transactionToEdit.categoryId;
    const firstMatching = categories.find((c) => c.type === (type || 'expense'));
    return firstMatching ? firstMatching.id : (categories[0]?.id ?? 1);
  });
  const [selectedAccountId, setSelectedAccountId] = useState<number>(() => {
    if (transactionToEdit) return transactionToEdit.accountId;
    return accounts[0]?.id ?? 1;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transactionToEdit ? transactionToEdit.paymentMethod : 'UPI'
  );
  const [date, setDate] = useState<string>(
    transactionToEdit ? transactionToEdit.date : todayStr
  );
  const [time, setTime] = useState<string>(
    transactionToEdit ? transactionToEdit.time : nowTime
  );
  const [note, setNote] = useState<string>(
    transactionToEdit ? transactionToEdit.note : ''
  );

  // New category creation mini-modal
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentCategories = categories.filter((c) => c.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstMatch = categories.find((c) => c.type === newType);
    if (firstMatch) {
      setSelectedCategoryId(firstMatch.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Please enter an amount greater than 0');
      return;
    }

    if (!selectedCategoryId) {
      setErrorMsg('Please select a category');
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg('Please select an account');
      return;
    }

    const minorAmount = toMinorUnits(parsed);

    onSave(
      {
        type,
        amount: minorAmount,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        paymentMethod,
        date,
        time,
        note: note.trim(),
      },
      transactionToEdit?.id
    );

    onClose();
  };

  const handleCreateCustomCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      type,
      icon: type === 'expense' ? 'Tag' : 'Wallet',
      colorHex: type === 'expense' ? '#8B5CF6' : '#10B981',
    });
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  return (
    <div
      id="modal-add-transaction"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900 text-xs">
              {errorMsg}
            </div>
          )}

          {/* 1. Transaction Type Segmented Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* 2. Amount Input (Prominent & Clear) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                id="input-amount"
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus={!isEditing}
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-extrabold text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 3. Category Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className="text-teal-600 dark:text-teal-400 text-[11px] font-semibold hover:underline flex items-center space-x-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Category</span>
              </button>
            </div>

            {isCreatingCategory && (
              <div className="mb-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="New Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomCategory}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
              {currentCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/70 border-2 border-teal-600 text-teal-900 dark:text-teal-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                      style={{
                        backgroundColor: `${cat.colorHex}22`,
                        color: cat.colorHex,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] truncate max-w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Payment Method & Account Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                id="select-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
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
                id="select-account"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 6. Note (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner with team, Grocery shopping"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-save-transaction"
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-xl font-bold shadow-md shadow-teal-600/20 text-sm flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Update Transaction' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
