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
