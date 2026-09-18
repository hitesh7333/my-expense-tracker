import React, { useState } from 'react';
import {
  X,
  CalendarClock,
  Plus,
  CheckCircle2,
  Clock,
  RotateCw,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Bill, Category, RecurringTransaction, Account } from '../types';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  recurring: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  currencySymbol: string;
  onAddBill: (bill: Omit<Bill, 'id'>) => void;
  onPayBill: (bill: Bill, accountId: number) => void;
  onDeleteBill?: (billId: number) => void;
  onAddRecurring: (item: Omit<RecurringTransaction, 'id'>) => void;
  onProcessRecurring: (item: RecurringTransaction) => void;
  onDeleteRecurring?: (recId: number) => void;
}

export const BillsView: React.FC<Props> = ({
  isOpen,
  onClose,
  bills,
  recurring,
  categories,
  accounts,
  currencySymbol,
  onAddBill,
  onPayBill,
  onDeleteBill,
  onAddRecurring,
  onProcessRecurring,
  onDeleteRecurring,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'bills' | 'recurring'>('bills');

  // Add Bill Modal State
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [billName, setBillName] = useState('');
  const [billAmountStr, setBillAmountStr] = useState('');
  const [billDueDate, setBillDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [billCatId, setBillCatId] = useState<number>(categories[0]?.id ?? 1);

  // Pay bill confirmation
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payFromAccountId, setPayFromAccountId] = useState<number>(accounts[0]?.id ?? 1);

  // Delete bill state
  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);

  // Add Recurring State
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [recAmountStr, setRecAmountStr] = useState('');
  const [recCatId, setRecCatId] = useState<number>(categories[0]?.id ?? 1);
  const [recAccountId, setRecAccountId] = useState<number>(accounts[0]?.id ?? 1);
  const [recFreq, setRecFreq] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [recNote, setRecNote] = useState('');

  // Delete recurring state
  const [deletingRecId, setDeletingRecId] = useState<number | null>(null);

  // Duplicate process confirmation
  const [confirmProcessItem, setConfirmProcessItem] = useState<RecurringTransaction | null>(null);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(billAmountStr);
    if (isNaN(amt) || amt <= 0 || !billName.trim()) return;

    onAddBill({
      name: billName.trim(),
      amount: toMinorUnits(amt),
      dueDate: billDueDate,
      categoryId: billCatId,
      status: 'Upcoming',
    });

    setBillName('');
    setBillAmountStr('');
    setIsAddingBill(false);
  };

  const handleConfirmPay = () => {
    if (!payingBill) return;
    onPayBill(payingBill, payFromAccountId);
    setPayingBill(null);
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmountStr);
    if (isNaN(amt) || amt <= 0) return;

    onAddRecurring({
      type: recType,
      amount: toMinorUnits(amt),
      categoryId: recCatId,
      accountId: recAccountId,
      frequency: recFreq,
      startDate: new Date().toISOString().split('T')[0],
      note: recNote.trim() || 'Recurring entry',
    });

    setRecAmountStr('');
    setRecNote('');
    setIsAddingRecurring(false);
  };

  const handleTriggerProcess = (item: RecurringTransaction) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (item.lastProcessedDate === todayStr) {
      setConfirmProcessItem(item);
    } else {
      onProcessRecurring(item);
    }
  };

  const computeBillStatus = (bill: Bill): Bill['status'] => {
    if (bill.status === 'Paid') return 'Paid';
    const today = new Date().toISOString().split('T')[0];
    if (bill.dueDate < today) return 'Overdue';
    const todayMs = new Date(today).getTime();
    const dueMs = new Date(bill.dueDate).getTime();
    const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'Due Soon';
    return 'Upcoming';
  };

  const getStatusBadge = (status: Bill['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Paid
          </span>
        );
      case 'Due Soon':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            Due Soon
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div
      id="modal-bills-view"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <CalendarClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bills & Recurring
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('bills')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Upcoming Bills ({bills.length})
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'recurring'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Recurring ({recurring.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'bills' ? (
            <>
              {/* Header with Add Bill Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Due Bills Tracker
                </span>
                <button
                  onClick={() => setIsAddingBill(!isAddingBill)}
                  className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bill</span>
                </button>
              </div>

              {/* Add Bill Form */}
              {isAddingBill && (
                <form
                  onSubmit={handleCreateBill}
                  className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Track New Bill
                  </h4>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Bill Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WiFi Fiber, Gym Membership"
                      value={billName}
                      onChange={(e) => setBillName(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Amount ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={billAmountStr}
                        onChange={(e) => setBillAmountStr(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required
                        value={billDueDate}
                        onChange={(e) => setBillDueDate(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      value={billCatId}
                      onChange={(e) => setBillCatId(parseInt(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                    >
                      Save Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingBill(false)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Pay Bill Confirmation Overlay / Card */}
              {payingBill && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 font-bold text-teal-900 dark:text-teal-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Pay Bill: {payingBill.name}</span>
                  </div>
                  <p className="text-[11px] text-teal-800 dark:text-teal-300">
                    Amount: {formatCurrency(payingBill.amount, currencySymbol)}
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Deduct from Account:
                    </label>
                    <select
                      value={payFromAccountId}
                      onChange={(e) => setPayFromAccountId(parseInt(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-lg text-xs"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatCurrency(a.currentBalance, currencySymbol)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleConfirmPay}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                    >
                      Confirm Payment
                    </button>
                    <button
                      onClick={() => setPayingBill(null)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Bill Confirmation */}
              {deletingBillId !== null && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Delete Bill?</span>
                  </div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200">
                    Are you sure you want to remove this tracked bill?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (onDeleteBill && deletingBillId !== null) {
                          onDeleteBill(deletingBillId);
                          setDeletingBillId(null);
                        }
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeletingBillId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Bills List */}
              {bills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No upcoming bills recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {bills.map((bill) => {
                    const cat = categories.find((c) => c.id === bill.categoryId);
                    const effectiveStatus = computeBillStatus(bill);
                    const isPaid = effectiveStatus === 'Paid';

                    return (
                      <div
                        key={bill.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: cat ? `${cat.colorHex}20` : '#0F766E20',
                              color: cat ? cat.colorHex : '#0F766E',
                            }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {bill.name}
                              </span>
                              {getStatusBadge(effectiveStatus)}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Due: {bill.dueDate}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {formatCurrency(bill.amount, currencySymbol)}
                          </p>
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            {!isPaid ? (
                              <button
                                onClick={() => setPayingBill(bill)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                Settled ✓
                              </span>
                            )}
                            {onDeleteBill && (
                              <button
                                onClick={() => setDeletingBillId(bill.id)}
                                title="Delete Bill"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Recurring Transactions Tab */
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Recurring Schedules
                </span>
                <button
                  onClick={() => setIsAddingRecurring(!isAddingRecurring)}
                  className="text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Recurring</span>
                </button>
              </div>

              {/* Add Recurring Form */}
              {isAddingRecurring && (
                <form
                  onSubmit={handleCreateRecurring}
                  className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Setup Recurring Transaction
                  </h4>

                  <div className="grid grid-cols-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRecType('expense')}
                      className={`py-1 text-xs font-bold rounded-md ${
                        recType === 'expense'
                          ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecType('income')}
                      className={`py-1 text-xs font-bold rounded-md ${
                        recType === 'income'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Income
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Amount ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={recAmountStr}
                        onChange={(e) => setRecAmountStr(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Frequency
                      </label>
                      <select
                        value={recFreq}
                        onChange={(e) => setRecFreq(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Category
                      </label>
                      <select
                        value={recCatId}
                        onChange={(e) => setRecCatId(parseInt(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Account
                      </label>
                      <select
                        value={recAccountId}
                        onChange={(e) => setRecAccountId(parseInt(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Note / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Netflix Subscription, House Rent"
                      value={recNote}
                      onChange={(e) => setRecNote(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                    >
                      Save Recurring
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingRecurring(false)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Duplicate Recurring Process Confirmation Dialog */}
              {confirmProcessItem && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-900 dark:text-amber-200 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Already Processed Today</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    "{confirmProcessItem.note}" was already processed on {confirmProcessItem.lastProcessedDate}. Do you want to process an additional transaction?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onProcessRecurring(confirmProcessItem);
                        setConfirmProcessItem(null);
                      }}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Process Anyway
                    </button>
                    <button
                      onClick={() => setConfirmProcessItem(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Recurring Confirmation Dialog */}
              {deletingRecId !== null && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Delete Recurring Schedule?</span>
                  </div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200">
                    Are you sure you want to stop this recurring schedule?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (onDeleteRecurring && deletingRecId !== null) {
                          onDeleteRecurring(deletingRecId);
                          setDeletingRecId(null);
                        }
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeletingRecId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Recurring List */}
              {recurring.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No recurring payments setup yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recurring.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    const acc = accounts.find((a) => a.id === item.accountId);
                    const isExpense = item.type === 'expense';
                    const isProcessedToday = item.lastProcessedDate === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: cat ? `${cat.colorHex}20` : '#0F766E20',
                              color: cat ? cat.colorHex : '#0F766E',
                            }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {item.note || cat?.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                {item.frequency}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {acc ? `Account: ${acc.name}` : ''}
                              {item.lastProcessedDate ? ` • Last: ${item.lastProcessedDate}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <p
                            className={`font-extrabold text-sm ${
                              isExpense ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(item.amount, currencySymbol)}
                          </p>
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            <button
                              onClick={() => handleTriggerProcess(item)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center space-x-1 ${
                                isProcessedToday
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border-teal-200 dark:border-teal-800 shadow-xs'
                              }`}
                            >
                              <RotateCw className="w-2.5 h-2.5" />
                              <span>{isProcessedToday ? 'Processed' : 'Process Now'}</span>
                            </button>
                            {onDeleteRecurring && (
                              <button
                                onClick={() => setDeletingRecId(item.id)}
                                title="Delete Schedule"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
