import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  DollarSign,
  Moon,
  Sun,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { AppSettings, DatabaseState } from '../types';
import { toMajorUnits } from '../utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  databaseState: DatabaseState;
  onRestoreDatabase: (restored: DatabaseState) => void;
  onLoadSampleData: () => void;
  onResetAllData: () => void;
  onOpenPinSetup: () => void;
}

export const SettingsView: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  databaseState,
  onRestoreDatabase,
  onLoadSampleData,
  onResetAllData,
  onOpenPinSetup,
}) => {
  if (!isOpen) return null;

  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<DatabaseState | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 1. Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(databaseState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_expense_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerSuccess('Backup JSON downloaded successfully!');
  };

  // 2. Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Type',
      'Amount',
      'Category',
      'Account',
      'Payment Method',
      'Date',
      'Time',
      'Note',
    ];

    const rows = databaseState.transactions.map((t) => {
      const cat = databaseState.categories.find((c) => c.id === t.categoryId)?.name || '';
      const acc = databaseState.accounts.find((a) => a.id === t.accountId)?.name || '';
      const amount = toMajorUnits(t.amount);
      return [
        t.id,
        t.type,
        amount,
        `"${cat.replace(/"/g, '""')}"`,
        `"${acc.replace(/"/g, '""')}"`,
        t.paymentMethod,
        t.date,
        t.time,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_expense_tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerSuccess('Transactions exported to CSV!');
  };

  // 3. Stage JSON Backup for Confirmation (Never overwrite without user confirmation)
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (
          parsed &&
          Array.isArray(parsed.accounts) &&
          Array.isArray(parsed.categories) &&
          Array.isArray(parsed.transactions)
        ) {
          setPendingRestore(parsed);
        } else {
          setRestoreError('Invalid backup file format: missing accounts, categories, or transactions.');
        }
      } catch (err) {
        setRestoreError('Could not parse JSON file. Please check file validity.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = () => {
    if (pendingRestore) {
      onRestoreDatabase(pendingRestore);
      setPendingRestore(null);
      setRestoreError(null);
      triggerSuccess('Database restored successfully from backup!');
    }
  };

  return (
    <div
      id="modal-settings-view"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Currency Selection */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>Currency Symbol</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Choose the primary currency symbol displayed across amounts.
            </p>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { sym: '₹', label: 'INR (₹)' },
                { sym: '$', label: 'USD ($)' },
                { sym: '€', label: 'EUR (€)' },
                { sym: '£', label: 'GBP (£)' },
                { sym: '¥', label: 'JPY (¥)' },
              ].map((c) => (
                <button
                  key={c.sym}
                  onClick={() => onUpdateSettings({ currencySymbol: c.sym })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.currencySymbol === c.sym
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.sym}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Theme & Appearance</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ themeMode: t })}
                  className={`py-2 rounded-xl font-bold capitalize transition-all ${
                    settings.themeMode === t
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* PIN Lock Security */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Security / PIN Lock</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.isPinLockEnabled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {settings.isPinLockEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Protect your personal financial data with a 4-digit PIN lock on opening.
            </p>
            <div className="pt-1">
              {settings.isPinLockEnabled ? (
                <div className="flex space-x-2">
                  <button
                    onClick={onOpenPinSetup}
                    className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={() => {
                      onUpdateSettings({ isPinLockEnabled: false, hashedPin: '' });
                      triggerSuccess('PIN lock disabled.');
                    }}
                    className="flex-1 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold"
                  >
                    Disable PIN
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenPinSetup}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Set Up 4-Digit PIN
                </button>
              )}
            </div>
          </div>

          {/* Backup & Export Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <Download className="w-4 h-4 text-teal-600" />
              <span>Data Backup & Export</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportCSV}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 font-bold"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 font-bold"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>Backup JSON</span>
              </button>
            </div>

            {/* Restore JSON input */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300"
              >
                <Upload className="w-4 h-4 text-purple-600" />
                <span>Restore from JSON File</span>
              </button>

              {restoreError && (
                <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900 text-xs flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {pendingRestore && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Confirm Overwrite Before Restoring</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Restoring this backup will replace current records with{' '}
                    <strong>{pendingRestore.transactions?.length || 0} transactions</strong>,{' '}
                    <strong>{pendingRestore.accounts?.length || 0} accounts</strong>, and{' '}
                    <strong>{pendingRestore.budgets?.length || 0} budgets</strong>. Current unsaved data will be replaced.
                  </p>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={executeRestore}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Confirm & Restore
                    </button>
                    <button
                      onClick={() => setPendingRestore(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sample Data & Reset */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Testing & Database Tools</span>
            </div>

            <button
              onClick={() => {
                onLoadSampleData();
                triggerSuccess('Sample test dataset loaded!');
              }}
              className="w-full py-2 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded-xl font-bold flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Specification Sample Data</span>
            </button>

            {/* Reset All Data with Confirmation */}
            {confirmReset ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Are you sure? All entries will be deleted!</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onResetAllData();
                      setConfirmReset(false);
                      triggerSuccess('All data reset to initial state.');
                    }}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl font-bold flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Data</span>
              </button>
            )}
          </div>

          {/* App Info Footer */}
          <div className="text-center pt-2 text-slate-400 space-y-1">
            <p className="font-bold text-slate-600 dark:text-slate-300">
              My Expense Tracker v1.0.0
            </p>
            <p className="text-[10px]">
              Offline-First Personal Finance • Flutter + Dart Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
