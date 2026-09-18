import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Wallet,
  Building2,
  Smartphone,
  Check,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Account, Transfer } from '../types';
import { formatCurrency, toMajorUnits, toMinorUnits } from '../utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transfers?: Transfer[];
  currencySymbol: string;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onEditAccount?: (id: number, updated: { name: string; type: Account['type'] }) => void;
  onDeleteAccount?: (id: number) => void;
  onTransfer: (transfer: Omit<Transfer, 'id'>) => void;
  onDeleteTransfer?: (transferId: number) => void;
}

export const AccountsView: React.FC<Props> = ({
  isOpen,
  onClose,
  accounts,
  transfers = [],
  currencySymbol,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onTransfer,
  onDeleteTransfer,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'accounts' | 'transfer' | 'history'>('accounts');

  // Add Account State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('Bank');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('');

  // Delete Account Confirmation State
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);

  // Transfer State
  const [fromAccountId, setFromAccountId] = useState<number>(accounts[0]?.id ?? 1);
  const [toAccountId, setToAccountId] = useState<number>(accounts[1]?.id ?? 2);
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transferNote, setTransferNote] = useState('');
  const [transferMsg, setTransferMsg] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  // Delete Transfer Confirmation State
  const [confirmDeleteTransferId, setConfirmDeleteTransferId] = useState<number | null>(null);

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'Cash':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'Bank':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'UPI':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'Credit Card':
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    if (editingAccountId !== null && onEditAccount) {
      onEditAccount(editingAccountId, {
        name: accountName.trim(),
        type: accountType,
      });
      setEditingAccountId(null);
    } else {
      const parsed = parseFloat(openingBalanceStr || '0');
      const paise = toMinorUnits(parsed);

      onAddAccount({
        name: accountName.trim(),
        type: accountType,
        openingBalance: paise,
        currentBalance: paise,
      });
    }

    setAccountName('');
    setOpeningBalanceStr('');
    setIsAddingAccount(false);
  };

  const startEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setAccountName(acc.name);
    setAccountType(acc.type);
    setIsAddingAccount(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMsg(null);

    if (fromAccountId === toAccountId) {
      setTransferMsg({ text: 'Source and destination accounts must be different.', isError: true });
      return;
    }

    const amt = parseFloat(transferAmountStr);
    if (isNaN(amt) || amt <= 0) {
      setTransferMsg({ text: 'Please enter a valid transfer amount.', isError: true });
      return;
    }

    const minorAmt = toMinorUnits(amt);
    const fromAcc = accounts.find((a) => a.id === fromAccountId);

    if (fromAcc && fromAcc.currentBalance < minorAmt) {
      setTransferMsg({
        text: `Notice: Transfer amount exceeds current balance of ${fromAcc.name}. Transfer recorded.`,
        isError: false,
      });
    }

    onTransfer({
      fromAccountId,
      toAccountId,
      amount: minorAmt,
      date: transferDate,
      note: transferNote.trim() || 'Internal Account Transfer',
    });

    setTransferMsg({ text: 'Transfer completed successfully!', isError: false });
    setTransferAmountStr('');
    setTransferNote('');
    setTimeout(() => {
      setActiveTab('history');
      setTransferMsg(null);
    }, 1000);
  };

  const handleRevertTransfer = (transferId: number) => {
    if (onDeleteTransfer) {
      onDeleteTransfer(transferId);
      setConfirmDeleteTransferId(null);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div
      id="modal-accounts-view"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Accounts & Transfers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'accounts'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Accounts ({accounts.length})
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'transfer'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Transfer
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({transfers.length})</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'accounts' && (
            <>
              {/* Total Balance Card */}
              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                    Total Assets Balance
                  </span>
                  <p className="text-xl font-extrabold text-teal-900 dark:text-teal-100 mt-0.5">
                    {formatCurrency(totalBalance, currencySymbol)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAccountId(null);
                    setAccountName('');
                    setOpeningBalanceStr('');
                    setIsAddingAccount(!isAddingAccount);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center space-x-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>

              {/* Add / Edit Account Inline Form */}
              {isAddingAccount && (
                <form
                  onSubmit={handleCreateAccount}
                  className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {editingAccountId !== null ? 'Edit Account Details' : 'Create New Account'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Salary, Cash, Wallet"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Type
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="UPI">UPI</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {editingAccountId === null && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Opening Balance ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={openingBalanceStr}
                        onChange={(e) => setOpeningBalanceStr(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                    >
                      {editingAccountId !== null ? 'Update Account' : 'Save Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setEditingAccountId(null);
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Account Confirmation Dialog */}
              {deletingAccountId !== null && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Delete Account</span>
                  </div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200">
                    Are you sure you want to delete this account? Any associated transactions will be transferred to your default account.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (onDeleteAccount && deletingAccountId !== null) {
                          onDeleteAccount(deletingAccountId);
                          setDeletingAccountId(null);
                        }
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeletingAccountId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts List */}
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {acc.name}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {acc.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(acc.currentBalance, currencySymbol)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Opening: {formatCurrency(acc.openingBalance, currencySymbol)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 pl-1">
                        <button
                          onClick={() => startEditAccount(acc)}
                          title="Edit Account"
                          className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            onClick={() => setDeletingAccountId(acc.id)}
                            title="Delete Account"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'transfer' && (
            /* Transfer Tab */
            <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 rounded-xl text-teal-800 dark:text-teal-300 text-[11px]">
                Transfers move money between your accounts without affecting your Income or Expense reports.
              </div>

              {transferMsg && (
                <div
                  className={`p-2.5 rounded-xl border text-xs ${
                    transferMsg.isError
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                  }`}
                >
                  {transferMsg.text}
                </div>
              )}

              {/* Source Account */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  From Account (Deducted)
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance, currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Account */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  To Account (Credited)
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance, currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Amount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Transfer Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={transferAmountStr}
                  onChange={(e) => setTransferAmountStr(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATM cash withdrawal, Bank to wallet transfer"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Execute Transfer</span>
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            /* Transfer History Tab with Revert/Delete action */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                Record of internal account transfers. Deleting a transfer will reverse the balance adjustments on both source and destination accounts.
              </div>

              {confirmDeleteTransferId !== null && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Revert Transfer?</span>
                  </div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200">
                    This will undo the transfer: the transferred amount will be credited back to the source account and deducted from the destination account.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRevertTransfer(confirmDeleteTransferId)}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                    >
                      Confirm Revert
                    </button>
                    <button
                      onClick={() => setConfirmDeleteTransferId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {transfers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <ArrowRightLeft className="w-8 h-8 mx-auto opacity-40" />
                  <p className="font-semibold text-xs">No transfers yet</p>
                  <p className="text-[11px]">Move money between accounts using the Transfer tab.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...transfers].reverse().map((tr) => {
                    const fromAcc = accounts.find((a) => a.id === tr.fromAccountId)?.name || 'Account';
                    const toAcc = accounts.find((a) => a.id === tr.toAccountId)?.name || 'Account';
                    return (
                      <div
                        key={tr.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span>{fromAcc}</span>
                            <ArrowRightLeft className="w-3 h-3 text-teal-600" />
                            <span>{toAcc}</span>
                          </div>
                          <span className="font-extrabold text-xs text-teal-700 dark:text-teal-400">
                            {formatCurrency(tr.amount, currencySymbol)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>{tr.date} • {tr.note || 'Transfer'}</span>
                          <button
                            onClick={() => setConfirmDeleteTransferId(tr.id)}
                            title="Revert & Delete Transfer"
                            className="text-rose-500 hover:text-rose-700 font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
