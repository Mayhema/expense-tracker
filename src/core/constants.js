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
  "Food": "#4CAF50",
  "Transportation": "#2196F3",
  "Entertainment": "#FF9800",
  "Shopping": "#E91E63",
  "Bills": "#F44336",
  "Healthcare": "#9C27B0",
  "Education": "#607D8B",
  "Travel": "#00BCD4",
  "Savings": "#4CAF50"
  // "Other" completely removed - uncategorized transactions will be handled separately
};

/**
 * File format constants
 */
export const SUPPORTED_FILE_TYPES = ['.csv', '.xlsx', '.xls', '.xml'];

/**
 * Chart configuration constants
 */
export const CHART_COLORS = {
  income: '#4CAF50',
  expenses: '#F44336',
  primary: '#2196F3',
  secondary: '#FF9800',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
};

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  US: 'MM/DD/YYYY',
  EU: 'DD/MM/YYYY',
  DISPLAY: 'DD/MM/YYYY'
};

/**
 * Application settings
 */
export const APP_SETTINGS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTransactions: 50000,
  defaultCurrency: 'USD',
  dateFormat: DATE_FORMATS.DISPLAY,
  autoSave: true,
  debugMode: false
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  transactions: 'transactions',
  categories: 'expenseCategories',
  mergedFiles: 'mergedFiles',
  mappings: 'fileFormatMappings',
  settings: 'appSettings',
  darkMode: 'darkMode',
  debugMode: 'debugMode'
};

/**
 * Export constants for validation
 */
export const VALIDATION = {
  minDate: new Date('1900-01-01'),
  maxDate: new Date('2100-12-31'),
  maxDescriptionLength: 500,
  maxCategoryLength: 100
};
