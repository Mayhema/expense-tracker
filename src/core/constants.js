/**
 * Currency definitions
 */
export const CURRENCIES = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  MXN: { name: "Mexican Peso", symbol: "$" },
  ZAR: { name: "South African Rand", symbol: "R" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  DKK: { name: "Danish Krone", symbol: "kr" },
  PLN: { name: "Polish Zloty", symbol: "zł" },
  ILS: { name: "Israeli Shekel", symbol: "₪" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  SAR: { name: "Saudi Riyal", symbol: "﷼" }
};

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = "USD";

/**
 * Header mapping options for file import
 */
export const HEADERS = [
  "–", // Placeholder for unmapped columns
  "Date",
  "Description",
  "Income",
  "Expenses"
];

/**
 * Default expense categories with colors
 */
export const DEFAULT_CATEGORIES = {
  "Food & Dining": "#ff6b35",
  "Transportation": "#4ecdc4",
  "Shopping": "#45b7d1",
  "Entertainment": "#96ceb4",
  "Bills & Utilities": "#feca57",
  "Healthcare": "#ff9ff3",
  "Education": "#54a0ff",
  "Travel": "#5f27cd",
  "Income": "#00d2d3",
  "Other": "#ddd"
};

/**
 * File format constants
 */
export const SUPPORTED_FILE_TYPES = ['.csv', '.xlsx', '.xls', '.xml'];

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Date format patterns
 */
export const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,      // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/,    // DD/MM/YYYY or MM/DD/YYYY
  /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or M/D/YYYY
  /^\d{2}-\d{2}-\d{4}$/,      // DD-MM-YYYY or MM-DD-YYYY
  /^\d{1,2}-\d{1,2}-\d{4}$/   // D-M-YYYY or M-D-YYYY
];

/**
 * Excel date range (common business dates)
 */
export const EXCEL_DATE_RANGE = {
  MIN: 1,      // 1900-01-01
  MAX: 100000, // ~2173
  BUSINESS_MIN: 35000, // ~1995
  BUSINESS_MAX: 50000  // ~2037
};

/**
 * Application metadata
 */
export const APP_VERSION = "1.0.0";
export const APP_NAME = "Personal Expense Tracker";

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  TRANSACTIONS: 'expenseTrackerTransactions',
  MERGED_FILES: 'expenseTrackerMergedFiles',
  CATEGORIES: 'expenseTrackerCategories',
  CATEGORY_ORDER: 'categoryOrder',
  DARK_MODE: 'darkMode',
  DEBUG_MODE: 'debugMode',
  USER_PREFERENCES: 'userPreferences'
};
