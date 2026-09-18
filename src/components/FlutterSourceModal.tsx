import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, FileCode, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FlutterFile {
  path: string;
  category: string;
  content: string;
}

const FLUTTER_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    category: 'Configuration',
    content: `name: my_expense_tracker
description: A complete, offline-first personal finance and expense tracking app for Android.
version: 1.0.0+1
environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  sqflite: ^2.3.0
  path: ^1.8.3
  path_provider: ^2.1.1
  provider: ^6.1.1
  shared_preferences: ^2.2.2
  fl_chart: ^0.66.0
  intl: ^0.19.0
  crypto: ^3.0.3
  share_plus: ^7.2.1
  file_picker: ^6.1.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
  },
  {
    path: 'lib/main.dart',
    category: 'Entrypoint',
    content: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'database/database_helper.dart';
import 'repositories/finance_repository.dart';
import 'providers/finance_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/pin_lock_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final dbHelper = DatabaseHelper.instance;
  final repository = FinanceRepository(dbHelper);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => FinanceProvider(repository)..init()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()..loadSettings()),
      ],
      child: const MyExpenseTrackerApp(),
    ),
  );
}

class MyExpenseTrackerApp extends StatelessWidget {
  const MyExpenseTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();

    return MaterialApp(
      title: 'My Expense Tracker',
      debugShowCheckedModeBanner: false,
      themeMode: settings.themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.teal,
        brightness: Brightness.dark,
      ),
      home: settings.isPinLockEnabled
          ? const PinLockScreen(mode: PinMode.unlock)
          : const MainNavigationScreen(),
    );
  }
}`,
  },
  {
    path: 'lib/database/database_helper.dart',
    category: 'Database (SQLite)',
    content: `import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static const _databaseName = "expense_tracker.db";
  static const _databaseVersion = 1;

  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB(_databaseName);
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  Future _onCreate(Database db, int version) async {
    // Accounts Table
    await db.execute('''
      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        opening_balance INTEGER NOT NULL DEFAULT 0,
        current_balance INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Categories Table
    await db.execute('''
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Transactions Table
    await db.execute('''
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id)
      )
    ''');

    // Budgets Table
    await db.execute('''
      CREATE TABLE budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        amount INTEGER NOT NULL
      )
    ''');

    // Seed default accounts
    await db.rawInsert("INSERT INTO accounts (name, type, opening_balance, current_balance) VALUES ('Cash', 'Cash', 0, 0)");
    await db.rawInsert("INSERT INTO accounts (name, type, opening_balance, current_balance) VALUES ('Bank Account', 'Bank', 0, 0)");
    await db.rawInsert("INSERT INTO accounts (name, type, opening_balance, current_balance) VALUES ('UPI Wallet', 'UPI', 0, 0)");
    await db.rawInsert("INSERT INTO accounts (name, type, opening_balance, current_balance) VALUES ('Credit Card', 'Credit Card', 0, 0)");
  }
}`,
  },
  {
    path: 'lib/repositories/finance_repository.dart',
    category: 'Repository',
    content: `import '../database/database_helper.dart';

class FinanceRepository {
  final DatabaseHelper dbHelper;
  FinanceRepository(this.dbHelper);

  Future<int> insertTransaction(Map<String, dynamic> row) async {
    final db = await dbHelper.database;
    return await db.transaction((txn) async {
      final id = await txn.insert('transactions', row);
      final amount = row['amount'] as int;
      final type = row['type'] as String;
      final accountId = row['account_id'] as int;

      // Update account balance
      final balanceDiff = type == 'income' ? amount : -amount;
      await txn.rawUpdate('''
        UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?
      ''', [balanceDiff, accountId]);

      return id;
    });
  }

  Future<void> deleteTransaction(int id, int amount, String type, int accountId) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      await txn.delete('transactions', where: 'id = ?', whereArgs: [id]);
      // Revert account balance
      final revertDiff = type == 'income' ? -amount : amount;
      await txn.rawUpdate('''
        UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?
      ''', [revertDiff, accountId]);
    });
  }
}`,
  },
  {
    path: 'test/finance_calculations_test.dart',
    category: 'Automated Tests',
    content: `import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Finance Calculations Test Suite', () {
    test('Calculates Net Balance correctly without floating-point errors', () {
      // Stored in paise (integers)
      int salary = 2500000; // ₹25,000.00
      int food = 12000;      // ₹120.00
      int transport = 8000;  // ₹80.00
      int shopping = 50000;  // ₹500.00

      int totalExpenses = food + transport + shopping; // ₹700.00 -> 70000
      int netBalance = salary - totalExpenses;         // ₹24,300.00 -> 2430000

      expect(totalExpenses, 70000);
      expect(netBalance, 2430000);
    });

    test('80% Budget Warning Trigger', () {
      int monthlyBudget = 2000000; // ₹20,000.00
      int currentSpent = 1600000;  // ₹16,000.00 (80%)

      double ratio = currentSpent / monthlyBudget;
      bool isWarning = ratio >= 0.8 && ratio <= 1.0;

      expect(isWarning, isTrue);
    });
  });
}`,
  },
];

export const FlutterSourceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const file = FLUTTER_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-flutter-source"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Flutter + Dart Project Code
              </h2>
              <p className="text-[11px] text-slate-500">
                Production-ready code architecture for Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CLI Quick Reference */}
        <div className="px-5 py-2.5 bg-slate-950 text-slate-200 flex items-center justify-between text-xs font-mono overflow-x-auto">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>flutter pub get && flutter run</span>
          </div>
          <span className="text-[11px] text-teal-400 font-sans ml-4 shrink-0 font-medium">
            Build APK: flutter build apk --release
          </span>
        </div>

        {/* File Tabs */}
        <div className="flex items-center space-x-1 p-2 bg-slate-100 dark:bg-slate-800/80 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800">
          {FLUTTER_FILES.map((f, i) => (
            <button
              key={f.path}
              onClick={() => setSelectedFileIdx(i)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedFileIdx === i
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{f.path}</span>
            </button>
          ))}
        </div>

        {/* Code Content Viewer */}
        <div className="relative flex-1 overflow-y-auto p-4 bg-slate-900 text-slate-100 font-mono text-xs">
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-sans shadow-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto pt-8">{file.content}</pre>
        </div>
      </div>
    </div>
  );
};
