// Move from src/core/constants.js

export const HEADERS = ["Date", "Income", "Expenses", "Description", "–"];

// Add more constants here
export const STORAGE_KEYS = {
  MERGED_FILES: "mergedFiles",
  TRANSACTIONS: "transactions",
  CATEGORIES: "expenseCategories",
  FORMAT_MAPPINGS: "fileFormatMappings",
  CATEGORY_MAPPINGS: "categoryMappings",
  DARK_MODE: "darkMode",
  COLLAPSED_SECTIONS: {
    MERGED_FILES: "mergedFilesSectionCollapsed"
  }
};

export const FILE_TYPES = {
  XML: "xml",
  XLSX: "xlsx",
  XLS: "xls",
  CSV: "csv"
};

export const EXCEL_DATE = {
  MIN: 35000,
  MAX: 50000
};

// Fix the DEFAULT_CATEGORIES definition - it was using an object format when an array was expected
export const DEFAULT_CATEGORIES = {
  "Food": "#FF6384",
  "Housing": "#36A2EB",
  "Transportation": "#FFCE56",
  "Entertainment": "#4BC0C0",
  "Healthcare": "#9966FF",
  "Shopping": "#FF9F40",
  "Personal Care": "#8AC249",
  "Education": "#EA526F",
  "Utilities": "#7B68EE",
  "Travel": "#2ECC71"
};
