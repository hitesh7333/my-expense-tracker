import React from 'react';
import { LayoutDashboard, ReceiptText, PlusCircle, BarChart3 } from 'lucide-react';

interface Props {
  activeTab: 'dashboard' | 'transactions' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'reports') => void;
  onOpenAdd: () => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, onSelectTab, onOpenAdd }) => {
  return (
    <nav
      id="bottom-navigation"
      aria-label="Main Navigation"
      className="sticky bottom-0 z-30 w-full border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {/* Dashboard */}
        <button
          id="nav-tab-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <div
            className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'dashboard'
                ? 'bg-teal-100 dark:bg-teal-950/70'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          id="nav-tab-transactions"
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'transactions'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <div
            className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'transactions'
                ? 'bg-teal-100 dark:bg-teal-950/70'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Transactions</span>
        </button>

        {/* Add Floating Action Button */}
        <button
          id="nav-tab-add"
          onClick={onOpenAdd}
          className="flex flex-col items-center justify-center py-0.5 text-teal-600 dark:text-teal-400 hover:opacity-90 active:scale-95 transition-transform"
          aria-label="Add Transaction"
        >
          <div className="bg-teal-600 dark:bg-teal-500 text-white rounded-full p-2.5 shadow-md shadow-teal-600/30">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] mt-0.5 font-medium">Add</span>
        </button>

        {/* Reports */}
        <button
          id="nav-tab-reports"
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'reports'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <div
            className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
              activeTab === 'reports'
                ? 'bg-teal-100 dark:bg-teal-950/70'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5">Reports</span>
        </button>
      </div>
    </nav>
  );
};
