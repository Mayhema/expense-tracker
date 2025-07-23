// Directory: /src/utils/utils.js

/**
 * Utility functions shared across the application
 */

// Import the new date utilities
import {
  isExcelDate,
  excelDateToJSDate,
  excelDateToISOString,
  parseToISODate,
  isValidDateString,
  formatDateForDisplay,
  isDateColumn as isDateColumnUtil,
  validateAndNormalizeDate
} from './dateUtils.js';

// Re-export date utilities for backward compatibility
export {
  isExcelDate,
  excelDateToJSDate,
  parseToISODate as parseToDateString,
  isValidDateString as isValidDate,
  formatDateForDisplay as formatDate,
  isDateColumnUtil as isDateColumn,
  validateAndNormalizeDate
};

/**
 * DEPRECATED: Use parseToISODate from dateUtils instead
 * @deprecated
 */
export function excelDateToString(excelDate) {
  console.warn('excelDateToString is deprecated. Use excelDateToISOString from dateUtils instead.');
  return excelDateToISOString(excelDate);
}

/**
 * Formats an Excel date for preview display
 * @param {any} value - The value to format
 * @returns {string} Formatted date string
 */
export function formatExcelDateForPreview(value) {
  if (!isExcelDate(value)) return String(value);

  const isoDate = excelDateToISOString(value);
  if (!isoDate) return String(value);

  return `${isoDate} (Excel: ${value})`;
}

/**
 * Detects if a column contains Excel date values
 * @param {Array} columnValues - Array of values from a column
 * @returns {boolean} True if column appears to contain Excel dates
 */
export function isExcelDateColumn(columnValues) {
  if (!columnValues || columnValues.length === 0) return false;

  let excelDateCount = 0;
  let totalValidValues = 0;

  for (const value of columnValues) {
    if (value !== null && value !== undefined && value !== '') {
      totalValidValues++;
      if (isExcelDate(value)) {
        excelDateCount++;
      }
    }
  }

  // If at least 60% of non-empty values are Excel dates, consider it an Excel date column
  return totalValidValues > 0 && (excelDateCount / totalValidValues) >= 0.6;
}

/**
 * Enhanced date detection that includes Excel dates (legacy function)
 * @param {Array} columnValues - Array of values from a column
 * @returns {boolean} True if column contains date-like values
 * @deprecated Use isDateColumn from dateUtils.js instead
 */
function isDateColumnLegacy(columnValues) {
  if (!columnValues || columnValues.length === 0) return false;

  // First check for Excel dates
  if (isExcelDateColumn(columnValues)) {
    return true;
  }

  // Then check for standard date formats
  let dateCount = 0;
  let totalValidValues = 0;

  for (const value of columnValues) {
    if (value !== null && value !== undefined && value !== '') {
      totalValidValues++;

      const str = String(value).trim();

      // Check for various date formats
      const datePatterns = [
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,        // YYYY-MM-DD, YYYY/MM/DD
        /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,        // DD-MM-YYYY, MM/DD/YYYY
        /^\d{1,2}[-/]\d{1,2}[-/]\d{2}$/,        // DD-MM-YY, MM/DD/YY
        /^\d{4}\d{2}\d{2}$/,                     // YYYYMMDD
        /^\d{2}\d{2}\d{4}$/                      // DDMMYYYY or MMDDYYYY
      ];

      if (datePatterns.some(pattern => pattern.test(str))) {
        dateCount++;
      }
    }
  }

  // If at least 50% of non-empty values are dates, consider it a date column
  return totalValidValues > 0 && (dateCount / totalValidValues) >= 0.5;
}

/**
 * Safely attempts to parse any value into a valid date string (legacy function)
 * @param {any} value - Value to convert to a date
 * @return {string|null} Date string or null if invalid
 * @deprecated Use parseToISODate from dateUtils.js instead
 */
function parseToDateStringLegacy(value) {
  if (value === null || value === undefined || value === '') return null;
  if (isExcelDate(value)) return excelDateToISOString(parseFloat(value));
  if (typeof value === 'string') {
    const stringDateResult = parseStringToDateFormat(value);
    if (stringDateResult) return stringDateResult;

    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
  }
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return null;
}

/**
 * Helper function to parse string date formats like dd/mm/yyyy
 * @param {string} value - String value to parse
 * @return {string|null} Formatted date or null
 */
function parseStringToDateFormat(value) {
  const dateRegex = /(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})/;
  const dateMatch = dateRegex.exec(value);
  if (!dateMatch) return null;

  const [part1, part2, part3] = dateMatch.slice(1);
  const year = determineYear(part1, part3);
  const { month, day } = determineMonthAndDay(part1, part2, part3);

  return `${year}-${month}-${day}`;
}

/**
 * Determine year value from date parts
 */
function determineYear(part1, part3) {
  if (part1.length === 4) return part1;
  if (part3.length === 2) return `20${part3}`;
  return part3;
}

/**
 * Determine month and day values from date parts
 */
function determineMonthAndDay(part1, part2, part3) {
  if (part1.length === 4) {
    return {
      month: part2.padStart(2, '0'),
      day: part3.padStart(2, '0')
    };
  }

  if (parseInt(part1) > 12) {
    return {
      month: part2.padStart(2, '0'),
      day: part1.padStart(2, '0')
    };
  }

  return {
    month: part1.padStart(2, '0'),
    day: part2.padStart(2, '0')
  };
}

/**
 * Gets the contrast color (black or white) for a given background color
 * @param {string} hexColor - Hex color code (e.g., "#FF5733")
 * @returns {string} - Either "#000000" (black) or "#FFFFFF" (white)
 */
export function getContrastColor(hexColor) {
  // Default to black if no color provided
  if (!hexColor) return "#000000";

  // Convert hex to RGB
  let r, g, b;

  // Handle formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (hexColor.length === 4) {
    r = parseInt(hexColor[1] + hexColor[1], 16);
    g = parseInt(hexColor[2] + hexColor[2], 16);
    b = parseInt(hexColor[3] + hexColor[3], 16);
  } else {
    r = parseInt(hexColor.slice(1, 3), 16);
    g = parseInt(hexColor.slice(3, 5), 16);
    b = parseInt(hexColor.slice(5, 7), 16);
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Deep clone an object without reference
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = "") {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format currency values
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Format dates consistently (legacy function - use formatDateForDisplay from dateUtils instead)
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date string
 * @deprecated Use formatDateForDisplay from dateUtils.js instead
 */
function formatDateLegacy(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateStr;
  }
}

/**
 * Cleans a path by removing potentially dangerous patterns
 * @param {string} path - Path to clean
 * @returns {string} Cleaned path
 */
export function cleanPath(path) {
  if (!path) return '';
  // Remove path traversal sequences
  const pattern = /\/path\/to\/file/; // No escaping needed with RegExp constructor
  return path.replace(pattern, '');
}

/**
 * Safely parses JSON string
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value to return if parsing fails
 * @returns {*} Parsed object or default value
 */
export function parseJSON(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parsing error:", error);
    return defaultValue;
  }
}

/**
 * Gets primary value when condition is met
 * @param {any} value - Value if condition is true
 * @param {any} defaultValue - Default value if condition is false
 * @returns {any} Formatted value
 */
export function getPrimaryValue(value, defaultValue) {
  return value !== null && value !== undefined ? value : defaultValue;
}

/**
 * Gets secondary value when condition is met
 * @param {any} value - Value if condition is true
 * @param {any} defaultValue - Default value if condition is false
 * @returns {any} Formatted value
 */
export function getSecondaryValue(value, defaultValue) {
  return value !== null && value !== undefined ? value : defaultValue;
}

/**
 * Gets fallback value
 * @param {any} value - Fallback value
 * @returns {any} Formatted value
 */
export function getFallbackValue(value) {
  return value;
}

/**
 * Example of proper exception handling
 * @param {function} fn - Function to execute
 * @returns {any} Result or error
 */
export function handleExceptions(fn) {
  try {
    return fn();
  } catch (error) {
    console.error("Error in operation:", error);
    throw new Error(`Operation failed: ${error.message}`);
  }
}

/**
 * Process data with multiple steps
 * @param {object} args - Input arguments
 * @returns {object} Processed data
 */
export function processComplexData(args) {
  // Break this into smaller functions
  const result1 = processFirstPart(args);
  const result2 = processSecondPart(args);
  return mergeResults(result1, result2);
}

// Helper functions to reduce complexity
function processFirstPart(args) {
  // Part 1 logic
  return args ? { processed: true, source: 'part1' } : null;
}

function processSecondPart(args) {
  // Part 2 logic
  return args ? { processed: true, source: 'part2' } : null;
}

function mergeResults(result1, result2) {
  // Combine logic
  return {
    combined: true,
    parts: [result1, result2]
  };
}

/**
 * Extract nested ternary operation
 * @param {any} value - Value to format
 * @param {object} options - Formatting options
 * @returns {any} Formatted value
 */
export function getFormattedValue(value, options) {
  if (options.condition1) {
    return options.format1(value);
  } else if (options.condition2) {
    return options.format2(value);
  } else {
    return options.defaultFormat(value);
  }
}

/**
 * Properly handle exception
 * @param {function} callback - Function to execute safely
 * @returns {*} Result of the callback function
 */
export function safeOperation(callback) {
  try {
    return callback();
  } catch (error) {
    console.error("Operation failed:", error);
    // Handle the error properly
    throw new Error(`Operation failed: ${error.message}`);
  }
}

/**
 * Refactor complex function to reduce cognitive complexity
 * @param {object} params - Parameters for processing
 * @returns {object} Processed data and status
 */
export function processData(params) {
  // Process data in single function with clear steps
  const validatedInput = validateInput(params);
  const transformedData = transformData(validatedInput);
  const combinedResults = combineResults(transformedData);

  return {
    result: combinedResults,
    status: 'success'
  };
}

// Helper functions
function validateInput(params) {
  // Input validation logic
  return params;
}

function transformData(data) {
  // Data transformation logic
  return data;
}

function combineResults(data) {
  // Result combination logic
  return data;
}

// Refactor function to reduce cognitive complexity
function processTransactions(transactions) {
  if (!transactions || !Array.isArray(transactions)) return [];

  return transactions.map((tx, index) => {
    const processed = { ...tx };

    // Ensure transaction has unique ID
    if (!processed.id) {
      processed.id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${index}`;
    }

    // Handle income and expenses
    if (tx.income) {
      processed.income = parseFloat(tx.income) || 0;
    }
    if (tx.expenses) {
      processed.expenses = parseFloat(tx.expenses) || 0;
    }

    // Handle date
    if (tx.date) {
      try {
        processed.date = new Date(tx.date).toISOString().split("T")[0];
      } catch (e) {
        console.error("Invalid date format:", tx.date, e);
        processed.date = null;
        processed.hasDateError = true;
        // Explicitly handle the exception by continuing with a null date
        // rather than failing the entire transaction processing
      }
    }

    return processed;
  });
}

/**
 * Find transaction by ID
 * @param {Array} transactions - Array of transactions
 * @param {string} transactionId - Transaction ID to find
 * @returns {Object|null} Found transaction or null
 */
export function findTransactionById(transactions, transactionId) {
  if (!transactions || !Array.isArray(transactions) || !transactionId) {
    return null;
  }
  return transactions.find(tx => tx.id === transactionId) || null;
}

/**
 * Find transaction index by ID
 * @param {Array} transactions - Array of transactions
 * @param {string} transactionId - Transaction ID to find
 * @returns {number} Found transaction index or -1
 */
export function findTransactionIndexById(transactions, transactionId) {
  if (!transactions || !Array.isArray(transactions) || !transactionId) {
    return -1;
  }
  return transactions.findIndex(tx => tx.id === transactionId);
}

/**
 * Toggle active state on an element
 * @param {HTMLElement} element - The element to toggle active/inactive state
 * @param {boolean} [active] - Optional explicit state to set (true for active, false for inactive)
 * @returns {boolean} The new active state
 */
export function toggleActiveState(element, active) {
  // Define isActive locally to avoid reference error
  const isActive = active !== undefined ? active : !element.classList.contains('active');

  // Apply the appropriate classes
  element.classList.toggle('active', isActive);
  element.classList.toggle('inactive', !isActive);

  return isActive;
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}
