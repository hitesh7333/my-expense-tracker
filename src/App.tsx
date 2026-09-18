import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReportsView } from './components/ReportsView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { BudgetsView } from './components/BudgetsView';
import { AccountsView } from './components/AccountsView';
import { BillsView } from './components/BillsView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { PinLockModal } from './components/PinLockModal';
import { FlutterSourceModal } from './components/FlutterSourceModal';
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
} from './types';
import {
  loadDatabase,
  saveDatabase,
  generateSampleData,
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
} from './services/storage';

export default function App() {
  const [db, setDb] = useState<DatabaseState>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'reports'>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  const [isBudgetsOpen, setIsBudgetsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFlutterCodeOpen, setIsFlutterCodeOpen] = useState(false);

  // Security / PIN lock state
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const loaded = loadDatabase();
    return loaded.settings.isPinLockEnabled;
  });
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);

  // Android Pixel Frame vs Fullscreen view toggle
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);

  // Filter category when clicked from reports
  const [filterCategoryFromReport, setFilterCategoryFromReport] = useState<number | null>(null);

  // Sync state to localStorage whenever DB changes
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Apply Theme Mode
  useEffect(() => {
    const mode = db.settings.themeMode;
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [db.settings.themeMode]);

  // Save Transaction (Add or Edit)
  const handleSaveTransaction = (
    data: Omit<TransactionItem, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: number
  ) => {
    const nowIso = new Date().toISOString();

    setDb((prev) => {
      let updatedAccounts = [...prev.accounts];
      let updatedTransactions: TransactionItem[];

      if (editId) {
        // Find existing transaction to reverse its account balance effect first
        const oldTx = prev.transactions.find((t) => t.id === editId);
        if (oldTx) {
          const oldAccountIdx = updatedAccounts.findIndex((a) => a.id === oldTx.accountId);
          if (oldAccountIdx !== -1) {
            const revertDiff = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            updatedAccounts[oldAccountIdx] = {
              ...updatedAccounts[oldAccountIdx],
              currentBalance: updatedAccounts[oldAccountIdx].currentBalance + revertDiff,
            };
          }
        }

        // Apply new transaction balance effect
        const targetAccountIdx = updatedAccounts.findIndex((a) => a.id === data.accountId);
        if (targetAccountIdx !== -1) {
          const applyDiff = data.type === 'income' ? data.amount : -data.amount;
          updatedAccounts[targetAccountIdx] = {
            ...updatedAccounts[targetAccountIdx],
            currentBalance: updatedAccounts[targetAccountIdx].currentBalance + applyDiff,
          };
        }

        updatedTransactions = prev.transactions.map((t) =>
          t.id === editId
            ? {
                ...t,
                ...data,
                updatedAt: nowIso,
              }
            : t
        );
      } else {
        // New transaction
        const newId =
          prev.transactions.length > 0
            ? Math.max(...prev.transactions.map((t) => t.id)) + 1
            : 1;

        const newTx: TransactionItem = {
          ...data,
          id: newId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        // Update account balance
        const targetAccountIdx = updatedAccounts.findIndex((a) => a.id === data.accountId);
        if (targetAccountIdx !== -1) {
          const applyDiff = data.type === 'income' ? data.amount : -data.amount;
          updatedAccounts[targetAccountIdx] = {
            ...updatedAccounts[targetAccountIdx],
            currentBalance: updatedAccounts[targetAccountIdx].currentBalance + applyDiff,
          };
        }

        updatedTransactions = [newTx, ...prev.transactions];
      }

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });

    setEditingTransaction(null);
    setIsAddModalOpen(false);
  };

  // Delete Transaction with Balance Reversal
  const handleDeleteTransaction = (tx: TransactionItem) => {
    setDb((prev) => {
      const updatedAccounts = [...prev.accounts];
      const accIdx = updatedAccounts.findIndex((a) => a.id === tx.accountId);
      if (accIdx !== -1) {
        // Revert balance: if it was income, remove it; if expense, restore it
        const revertDiff = tx.type === 'income' ? -tx.amount : tx.amount;
        updatedAccounts[accIdx] = {
          ...updatedAccounts[accIdx],
          currentBalance: updatedAccounts[accIdx].currentBalance + revertDiff,
        };
      }

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter((t) => t.id !== tx.id),
      };
    });

    setSelectedTransaction(null);
  };

  // Create Custom Category
  const handleAddCategory = (cat: Omit<Category, 'id' | 'isDefault'>) => {
    setDb((prev) => {
      const nextId =
        prev.categories.length > 0 ? Math.max(...prev.categories.map((c) => c.id)) + 1 : 1;
      return {
        ...prev,
        categories: [...prev.categories, { ...cat, id: nextId, isDefault: false }],
      };
    });
  };

  // Save Budget
  const handleSaveBudget = (bData: Omit<Budget, 'id'>, existingId?: number) => {
    setDb((prev) => {
      let nextBudgets: Budget[];
      if (existingId) {
        nextBudgets = prev.budgets.map((b) =>
          b.id === existingId ? { ...b, ...bData } : b
        );
      } else {
        const nextId =
          prev.budgets.length > 0 ? Math.max(...prev.budgets.map((b) => b.id)) + 1 : 1;
        nextBudgets = [...prev.budgets, { ...bData, id: nextId }];
      }
      return { ...prev, budgets: nextBudgets };
    });
  };

  // Delete Budget
  const handleDeleteBudget = (budgetId: number) => {
    setDb((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== budgetId),
    }));
  };

  // Add Account
  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    setDb((prev) => {
      const nextId =
        prev.accounts.length > 0 ? Math.max(...prev.accounts.map((a) => a.id)) + 1 : 1;
      return {
        ...prev,
        accounts: [...prev.accounts, { ...accData, id: nextId }],
      };
    });
  };

  // Account Transfer (does not affect income/expense, updates both accounts)
  const handleTransfer = (transData: Omit<Transfer, 'id'>) => {
    setDb((prev) => {
      const nextId =
        prev.transfers.length > 0 ? Math.max(...prev.transfers.map((t) => t.id)) + 1 : 1;
      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === transData.fromAccountId) {
          return { ...a, currentBalance: a.currentBalance - transData.amount };
        }
        if (a.id === transData.toAccountId) {
          return { ...a, currentBalance: a.currentBalance + transData.amount };
        }
        return a;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transfers: [...prev.transfers, { ...transData, id: nextId }],
      };
    });
  };

  // Delete Transfer and accurately reverse account balance movements
  const handleDeleteTransfer = (transferId: number) => {
    setDb((prev) => {
      const targetTransfer = prev.transfers.find((t) => t.id === transferId);
      if (!targetTransfer) return prev;

      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === targetTransfer.fromAccountId) {
          return { ...a, currentBalance: a.currentBalance + targetTransfer.amount };
        }
        if (a.id === targetTransfer.toAccountId) {
          return { ...a, currentBalance: a.currentBalance - targetTransfer.amount };
        }
        return a;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transfers: prev.transfers.filter((t) => t.id !== transferId),
      };
    });
  };

  // Edit Account details
  const handleEditAccount = (accId: number, updated: { name: string; type: Account['type'] }) => {
    setDb((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === accId ? { ...a, ...updated } : a)),
    }));
  };

  // Delete Account
  const handleDeleteAccount = (accId: number) => {
    setDb((prev) => {
      if (prev.accounts.length <= 1) return prev;
      const fallbackAccount = prev.accounts.find((a) => a.id !== accId)!;
      return {
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== accId),
        transactions: prev.transactions.map((t) =>
          t.accountId === accId ? { ...t, accountId: fallbackAccount.id } : t
        ),
        transfers: prev.transfers.filter((t) => t.fromAccountId !== accId && t.toAccountId !== accId),
      };
    });
  };

  // Add Bill
  const handleAddBill = (billData: Omit<Bill, 'id'>) => {
    setDb((prev) => {
      const nextId = prev.bills.length > 0 ? Math.max(...prev.bills.map((b) => b.id)) + 1 : 1;
      return {
        ...prev,
        bills: [...prev.bills, { ...billData, id: nextId }],
      };
    });
  };

  // Pay Bill (marks paid and records transaction)
  const handlePayBill = (bill: Bill, accountId: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);

    handleSaveTransaction({
      type: 'expense',
      amount: bill.amount,
      categoryId: bill.categoryId,
      accountId,
      paymentMethod: 'UPI',
      date: todayStr,
      time: timeStr,
      note: `Bill Paid: ${bill.name}`,
    });

    setDb((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === bill.id ? { ...b, status: 'Paid' } : b)),
    }));
  };

  // Add Recurring
  const handleAddRecurring = (recData: Omit<RecurringTransaction, 'id'>) => {
    setDb((prev) => {
      const nextId =
        prev.recurring.length > 0 ? Math.max(...prev.recurring.map((r) => r.id)) + 1 : 1;
      return {
        ...prev,
        recurring: [...prev.recurring, { ...recData, id: nextId }],
      };
    });
  };

  // Process Recurring Transaction
  const handleProcessRecurring = (item: RecurringTransaction) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0, 5);

    handleSaveTransaction({
      type: item.type,
      amount: item.amount,
      categoryId: item.categoryId,
      accountId: item.accountId,
      paymentMethod: 'UPI',
      date: todayStr,
      time: timeStr,
      note: `Recurring: ${item.note}`,
    });

    setDb((prev) => ({
      ...prev,
      recurring: prev.recurring.map((r) =>
        r.id === item.id ? { ...r, lastProcessedDate: todayStr } : r
      ),
    }));
  };

  // Delete Bill
  const handleDeleteBill = (billId: number) => {
    setDb((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== billId),
    }));
  };

  // Delete Recurring Schedule
  const handleDeleteRecurring = (recId: number) => {
    setDb((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((r) => r.id !== recId),
    }));
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  // Restore Database
  const handleRestoreDatabase = (restored: DatabaseState) => {
    setDb(restored);
  };

  // Load Specification Sample Data
  const handleLoadSampleData = () => {
    const now = new Date();
    const sample = generateSampleData(now.getFullYear(), now.getMonth() + 1);
    setDb(sample);
  };

  // Reset All Data
  const handleResetAllData = () => {
    const clean: DatabaseState = {
      accounts: DEFAULT_ACCOUNTS,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      budgets: [
        {
          id: 1,
          categoryId: null,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          amount: 2000000,
        },
      ],
      bills: [],
      recurring: [],
      transfers: [],
      settings: {
        currencySymbol: '₹',
        themeMode: 'system',
        isPinLockEnabled: false,
        hashedPin: '',
      },
    };
    setDb(clean);
  };

  // Filter Category Handler from Reports
  const handleFilterByCategory = (categoryId: number) => {
    setFilterCategoryFromReport(categoryId);
    setActiveTab('transactions');
  };

  // PIN Lock setup success
  const handlePinSetupSuccess = (newPinHash?: string) => {
    if (newPinHash) {
      handleUpdateSettings({
        isPinLockEnabled: true,
        hashedPin: newPinHash,
      });
      setIsPinSetupOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start p-0 sm:py-6 selection:bg-teal-500 selection:text-white font-sans">
      {/* PIN Lock Screen if locked */}
      {isAppLocked && (
        <PinLockModal
          isOpen={true}
          mode="unlock"
          correctPinHash={db.settings.hashedPin}
          onSuccess={() => setIsAppLocked(false)}
        />
      )}

      {/* PIN Lock Setup Modal */}
      {isPinSetupOpen && (
        <PinLockModal
          isOpen={true}
          mode="setup"
          onSuccess={handlePinSetupSuccess}
          onCancel={() => setIsPinSetupOpen(false)}
        />
      )}

      {/* Main App Container (Simulated Android Frame or Fullscreen) */}
      <div
        className={`w-full bg-white dark:bg-slate-900 transition-all duration-300 relative flex flex-col ${
          isDeviceFrame
            ? 'max-w-md sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] sm:border-slate-800 dark:sm:border-slate-700 min-h-[90vh] overflow-hidden'
            : 'max-w-3xl min-h-screen sm:min-h-[90vh] sm:rounded-2xl sm:shadow-xl sm:border border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Android Status Bar (When in Device Frame mode) */}
        {isDeviceFrame && (
          <div className="w-full bg-white dark:bg-slate-900 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none">
            <span>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 dark:bg-slate-700 mx-auto" />
            <div className="flex items-center space-x-1.5">
              <span>5G</span>
              <span className="font-bold">100%</span>
            </div>
          </div>
        )}

        {/* Top App Bar Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onOpenFlutterCode={() => setIsFlutterCodeOpen(true)}
          isDeviceFrame={isDeviceFrame}
          onToggleDeviceFrame={() => setIsDeviceFrame(!isDeviceFrame)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 pt-3">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={db.transactions}
              accounts={db.accounts}
              categories={db.categories}
              budgets={db.budgets}
              currencySymbol={db.settings.currencySymbol}
              onOpenAdd={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              onViewAllTransactions={() => setActiveTab('transactions')}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              onOpenAccounts={() => setIsAccountsOpen(true)}
              onOpenBudgets={() => setIsBudgetsOpen(true)}
              onOpenBills={() => setIsBillsOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={db.transactions}
              categories={db.categories}
              accounts={db.accounts}
              currencySymbol={db.settings.currencySymbol}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              initialFilterCategory={filterCategoryFromReport}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={db.transactions}
              categories={db.categories}
              currencySymbol={db.settings.currencySymbol}
              onFilterByCategory={handleFilterByCategory}
            />
          )}
        </main>

        {/* Material 3 Bottom Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setFilterCategoryFromReport(null);
            setActiveTab(tab);
          }}
          onOpenAdd={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
      {/* 1. Add / Edit Transaction */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        categories={db.categories}
        accounts={db.accounts}
        currencySymbol={db.settings.currencySymbol}
        onSave={handleSaveTransaction}
        onAddCategory={handleAddCategory}
        transactionToEdit={editingTransaction}
      />

      {/* 2. Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        categories={db.categories}
        accounts={db.accounts}
        currencySymbol={db.settings.currencySymbol}
        onClose={() => setSelectedTransaction(null)}
        onEdit={(tx) => {
          setEditingTransaction(tx);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteTransaction}
      />

      {/* 3. Budgets Management Modal */}
      <BudgetsView
        isOpen={isBudgetsOpen}
        onClose={() => setIsBudgetsOpen(false)}
        budgets={db.budgets}
        categories={db.categories}
        transactions={db.transactions}
        currencySymbol={db.settings.currencySymbol}
        onSaveBudget={handleSaveBudget}
        onDeleteBudget={handleDeleteBudget}
      />

      {/* 4. Accounts & Transfers Modal */}
      <AccountsView
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        accounts={db.accounts}
        transfers={db.transfers}
        currencySymbol={db.settings.currencySymbol}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
        onTransfer={handleTransfer}
        onDeleteTransfer={handleDeleteTransfer}
      />

      {/* 5. Bills & Recurring Modal */}
      <BillsView
        isOpen={isBillsOpen}
        onClose={() => setIsBillsOpen(false)}
        bills={db.bills}
        recurring={db.recurring}
        categories={db.categories}
        accounts={db.accounts}
        currencySymbol={db.settings.currencySymbol}
        onAddBill={handleAddBill}
        onPayBill={handlePayBill}
        onDeleteBill={handleDeleteBill}
        onAddRecurring={handleAddRecurring}
        onProcessRecurring={handleProcessRecurring}
        onDeleteRecurring={handleDeleteRecurring}
      />

      {/* 6. Calendar View Modal */}
      <CalendarView
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        transactions={db.transactions}
        categories={db.categories}
        currencySymbol={db.settings.currencySymbol}
        onSelectTransaction={(tx) => setSelectedTransaction(tx)}
      />

      {/* 7. Settings Modal */}
      <SettingsView
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={db.settings}
        onUpdateSettings={handleUpdateSettings}
        databaseState={db}
        onRestoreDatabase={handleRestoreDatabase}
        onLoadSampleData={handleLoadSampleData}
        onResetAllData={handleResetAllData}
        onOpenPinSetup={() => setIsPinSetupOpen(true)}
      />

      {/* 8. Flutter Source Code Modal */}
      <FlutterSourceModal
        isOpen={isFlutterCodeOpen}
        onClose={() => setIsFlutterCodeOpen(false)}
      />
    </div>
  );
}
