// Moved from src/parser/excelParser.js
// No functional changes
"use strict";

// Modern ES6 module approach without problematic "this" bindings
const createBinding = (target, source, key, key2) => {
  if (key2 === undefined) key2 = key;
  let desc = Object.getOwnPropertyDescriptor(source, key);
  if (!desc || ("get" in desc ? !source.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: () => source[key] };
  }
  Object.defineProperty(target, key2, desc);
};

const setModuleDefault = (target, value) => {
  Object.defineProperty(target, "default", { enumerable: true, value: value });
};

const importStar = (mod) => {
  // Use Object.hasOwn instead of Object.prototype.hasOwnProperty.call
  const getOwnKeys = (obj) => {
    return Object.getOwnPropertyNames(obj);
  };

  if (mod && mod.__esModule) return mod;
  const result = {};
  if (mod != null) {
    const keys = getOwnKeys(mod);
    for (const key of keys) {
      if (key !== "default") createBinding(result, mod, key);
    }
  }
  setModuleDefault(result, mod);
  return result;
};

// Modern dynamic import approach
let XLSX;
let uuid;

// Initialize dependencies
const initializeDependencies = async () => {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment - assume XLSX is loaded globally
      XLSX = window.XLSX;

      // Generate UUID without external dependency
      uuid = {
        v4: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
    } else {
      // Node.js environment
      const xlsxModule = await import('xlsx');
      XLSX = xlsxModule.default || xlsxModule;

      const uuidModule = await import('uuid');
      uuid = uuidModule;
    }
  } catch (error) {
    console.error('Error initializing Excel parser dependencies:', error);
    throw new Error('Failed to load required dependencies for Excel parsing');
  }
};

class ExcelParser {
  constructor() {
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await initializeDependencies();
      this.initialized = true;
    }
  }

  async parse(fileContent) {
    try {
      await this.ensureInitialized();

      if (!XLSX) {
        throw new Error('XLSX library not available');
      }

      // Parse the Excel file
      const workbook = XLSX.read(fileContent, { type: 'string' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No worksheets found in Excel file');
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) {
        throw new Error('Could not access worksheet data');
      }

      // Convert sheet to JSON with error handling
      let rawData;
      try {
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      } catch (jsonError) {
        throw new Error('Failed to convert Excel data to JSON: ' + jsonError.message);
      }

      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('Excel file appears to be empty or has no readable data');
      }

      // Return raw data as 2D array for header mapping
      return rawData;

    } catch (error) {
      console.error('Error parsing Excel data:', error);

      // Provide more specific error messages
      if (error.message.includes('Unsupported file')) {
        throw new Error('Unsupported Excel file format. Please save as .xlsx or .xls');
      } else if (error.message.includes('Cannot read property')) {
        throw new Error('Excel file appears to be corrupted or has invalid structure');
      }

      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Excel file for transaction data with header mapping
   * @param {string|ArrayBuffer} fileContent - The file content
   * @param {Array<string>} headerMapping - Array mapping columns to fields
   * @param {number} headerRowIndex - Index of header row (0-based)
   * @param {number} dataRowIndex - Index of first data row (0-based)
   * @returns {Promise<Array>} Array of transaction objects
   */
  async parseWithMapping(fileContent, headerMapping, headerRowIndex = 0, dataRowIndex = 1) {
    try {
      const rawData = await this.parse(fileContent);
      this.validateRawData(rawData, dataRowIndex);

      const transactions = this.processDataRows(rawData, headerMapping, dataRowIndex);

      console.log(`Successfully parsed ${transactions.length} transactions from Excel file`);
      return transactions;

    } catch (error) {
      console.error('Error parsing Excel with mapping:', error);
      throw error;
    }
  }

  /**
   * Validate raw data has sufficient rows
   * @param {Array} rawData - Raw Excel data
   * @param {number} dataRowIndex - Index of first data row
   */
  validateRawData(rawData, dataRowIndex) {
    if (!rawData || rawData.length <= dataRowIndex) {
      throw new Error('Insufficient data rows in Excel file');
    }
  }

  /**
   * Process data rows and convert to transactions
   * @param {Array} rawData - Raw Excel data
   * @param {Array<string>} headerMapping - Header mapping array
   * @param {number} dataRowIndex - Index of first data row
   * @returns {Array} Array of transaction objects
   */
  processDataRows(rawData, headerMapping, dataRowIndex) {
    const transactions = [];

    for (let rowIndex = dataRowIndex; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];

      if (this.isEmptyRow(row)) continue;

      const transaction = this.createTransactionFromRow(row, headerMapping, rowIndex);

      if (transaction.date) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  /**
   * Check if a row is empty
   * @param {Array} row - Excel row data
   * @returns {boolean} True if row is empty
   */
  isEmptyRow(row) {
    return !row || row.length === 0;
  }

  /**
   * Create transaction object from Excel row
   * @param {Array} row - Excel row data
   * @param {Array<string>} headerMapping - Header mapping array
   * @param {number} rowIndex - Current row index
   * @returns {Object} Transaction object
   */
  createTransactionFromRow(row, headerMapping, rowIndex) {
    const transaction = {
      id: uuid.v4(),
      fileName: 'excel-import',
      sourceRow: rowIndex + 1
    };

    this.mapRowToTransaction(row, headerMapping, transaction);
    return transaction;
  }

  /**
   * Map Excel row data to transaction fields
   * @param {Array} row - Excel row data
   * @param {Array<string>} headerMapping - Header mapping array
   * @param {Object} transaction - Transaction object to populate
   */
  mapRowToTransaction(row, headerMapping, transaction) {
    for (let colIndex = 0; colIndex < headerMapping.length && colIndex < row.length; colIndex++) {
      const fieldName = headerMapping[colIndex];
      const cellValue = row[colIndex];

      if (this.isValidFieldValue(fieldName, cellValue)) {
        transaction[fieldName.toLowerCase()] = this.convertCellValue(fieldName, cellValue);
      }
    }
  }

  /**
   * Check if field name and cell value are valid
   * @param {string} fieldName - Field name from header mapping
   * @param {any} cellValue - Cell value from Excel
   * @returns {boolean} True if valid
   */
  isValidFieldValue(fieldName, cellValue) {
    return fieldName && fieldName !== '–' && cellValue !== null && cellValue !== undefined;
  }

  /**
   * Convert cell value based on field type
   * @param {string} fieldName - Field name
   * @param {any} cellValue - Cell value
   * @returns {string} Converted value
   */
  convertCellValue(fieldName, cellValue) {
    if (fieldName.toLowerCase() === 'date' && this.isExcelDate(cellValue)) {
      return this.convertExcelDate(cellValue);
    }
    return String(cellValue).trim();
  }

  /**
   * Check if a value is an Excel date serial number
   * @param {any} value - Value to check
   * @returns {boolean} True if it appears to be an Excel date
   */
  isExcelDate(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    // FIXED: Only convert numbers that are actual Excel dates
    // Use the same range as the centralized dateUtils
    return num >= 25000 && num <= 100000 && Number.isInteger(num);
  }

  /**
   * Convert Excel date serial number to ISO date string
   * @param {number} excelDate - Excel date serial number
   * @returns {string} ISO date string (YYYY-MM-DD)
   */
  convertExcelDate(excelDate) {
    try {
      const num = parseFloat(excelDate);
      if (isNaN(num)) return String(excelDate);

      // FIXED: Use the correct Excel epoch and calculation
      // Excel's epoch is January 1, 1900, but Excel incorrectly considers 1900 a leap year
      const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
      const msPerDay = 24 * 60 * 60 * 1000;

      // FIXED: Use (excelDate - 1) instead of (excelDate - 2) for correct date calculation
      const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * msPerDay);

      if (isNaN(jsDate.getTime())) {
        return String(excelDate); // Return original if conversion fails
      }

      // Return ISO date string (YYYY-MM-DD)
      return jsDate.toISOString().split('T')[0];

    } catch (error) {
      console.error('Error converting Excel date:', error);
      return String(excelDate);
    }
  }

  /**
   * Get sheet names from Excel file
   * @param {string|ArrayBuffer} fileContent - The file content
   * @returns {Promise<Array<string>>} Array of sheet names
   */
  async getSheetNames(fileContent) {
    try {
      await this.ensureInitialized();

      if (!XLSX) {
        throw new Error('XLSX library not available');
      }

      const workbook = XLSX.read(fileContent, { type: 'string' });
      return workbook.SheetNames || [];

    } catch (error) {
      console.error('Error getting sheet names:', error);
      return [];
    }
  }

  /**
   * Parse specific sheet by name
   * @param {string|ArrayBuffer} fileContent - The file content
   * @param {string} sheetName - Name of the sheet to parse
   * @returns {Promise<Array>} 2D array of sheet data
   */
  async parseSheet(fileContent, sheetName) {
    try {
      await this.ensureInitialized();

      if (!XLSX) {
        throw new Error('XLSX library not available');
      }

      const workbook = XLSX.read(fileContent, { type: 'string' });

      if (!workbook.Sheets[sheetName]) {
        throw new Error(`Sheet '${sheetName}' not found`);
      }

      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      return rawData;

    } catch (error) {
      console.error('Error parsing specific sheet:', error);
      throw error;
    }
  }
}

// Export for both CommonJS and ES modules
const excelParser = new ExcelParser();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExcelParser;
  module.exports.default = ExcelParser;
  module.exports.excelParser = excelParser;
} else if (typeof window !== 'undefined') {
  window.ExcelParser = ExcelParser;
  window.excelParser = excelParser;
}

// ES6 export
export default ExcelParser;
export { excelParser };
