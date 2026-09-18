import React from 'react';
import { Settings, Calendar, Code2, Smartphone } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
  onOpenFlutterCode: () => void;
  isDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenSettings,
  onOpenCalendar,
  onOpenFlutterCode,
  isDeviceFrame,
  onToggleDeviceFrame,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center text-white shadow-sm font-bold text-base">
            ₹
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              My Expense Tracker
            </h1>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Offline-First • Material 3
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Toggle Device Frame / Fullscreen view */}
          <button
            id="btn-toggle-frame"
            onClick={onToggleDeviceFrame}
            title={isDeviceFrame ? 'Switch to Full Screen view' : 'Switch to Android Pixel Frame'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* View Flutter / Dart Code */}
          <button
            id="btn-view-flutter-code"
            onClick={onOpenFlutterCode}
            title="Inspect Flutter + Dart Source Code"
            className="p-2 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-full transition-colors"
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Calendar View */}
          <button
            id="btn-header-calendar"
            onClick={onOpenCalendar}
            title="Calendar View"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            id="btn-header-settings"
            onClick={onOpenSettings}
            title="Settings & Data Management"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
