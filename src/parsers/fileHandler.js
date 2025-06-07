// Directory: /src/parsers/fileHandler.js

// Update imports
import { AppState } from "../core/appState.js";
import {
  isExcelDate,
  excelDateToJSDate,

  validateAndNormalizeDate
} from '../utils/dateUtils.js';

console.log("XLSX object:", XLSX);

// Add better file validation
function validateFileData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Invalid file format: Data must be an array.");
  }

  if (data.length < 2) {
    throw new Error("File must contain at least one header row and one data row.");
  }

  // Clean up data - remove empty rows and empty cells at the beginning
  const cleanedData = data.filter(row =>
    Array.isArray(row) &&
    row.length > 0 &&
    row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
  );

  if (cleanedData.length === 0) {
    throw new Error("File contains no valid data rows.");
  }

  // Find the first non-empty row to use as headers
  const headerIndex = cleanedData.findIndex(row =>
    row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
  );

  if (headerIndex === -1) {
    throw new Error("File must contain a valid header row.");
  }

  // Make sure there's at least one data row after the header
  if (cleanedData.length <= headerIndex + 1) {
    throw new Error("File must contain at least one data row after the header.");
  }

  return cleanedData;
}

// Add more robust error handling for file operations

/**
 * Handles all file uploads and parsing
 * @param {File} file - The file to handle
 * @returns {Promise<Array<Array>>} Parsed data as a 2D array
 */
export async function handleFileUpload(file) {
  console.log(`Processing file: ${file.name}`);

  if (!file) {
    throw new Error("No file provided");
  }

  const fileExtension = file.name.split('.').pop().toLowerCase();

  switch (fileExtension) {
    case 'csv':
      return await parseCSV(file);
    case 'xlsx':
    case 'xls':
      return await parseExcel(file);
    case 'xml':
      return await parseXML(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}

/**
 * Parse CSV file
 * @param {File} file - The CSV file
 * @returns {Promise<Array<Array>>} Parsed data
 */
async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => {
          // Simple CSV parsing - handles quoted fields
          return parseCSVRow(row);
        }).filter(row => row.length > 0);

        console.log(`Parsed CSV: ${rows.length} rows`);
        resolve(rows);
      } catch (error) {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read CSV file"));
    reader.readAsText(file);
  });
}

/**
 * Parse Excel file using SheetJS
 * @param {File} file - The Excel file
 * @returns {Promise<Array<Array>>} Parsed data
 */
async function parseExcel(file) {
  // Check if XLSX library is available
  if (typeof XLSX === 'undefined') {
    // Try to load XLSX dynamically
    try {
      await loadXLSXLibrary();
    } catch (error) {
      console.error("Failed to load XLSX library:", error);
      throw new Error(`Excel parsing requires XLSX library. Load failed: ${error.message}`);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Parsed Excel: ${jsonData.length} rows from sheet "${sheetName}"`);
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read Excel file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse XML file
 * @param {File} file - The XML file
 * @returns {Promise<Array<Array>>} Parsed data
 */
async function parseXML(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const text = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        // Basic XML parsing - you might need to customize this based on your XML structure
        const rows = parseXMLToRows(xmlDoc);

        console.log(`Parsed XML: ${rows.length} rows`);
        resolve(rows);
      } catch (error) {
        reject(new Error(`XML parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read XML file"));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV row handling quoted fields
 * @param {string} row - CSV row string
 * @returns {Array<string>} Parsed fields
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2; // Skip both quotes
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add last field
  result.push(current.trim());

  return result.filter(field => field !== '');
}

/**
 * Parse XML document to rows
 * @param {Document} xmlDoc - Parsed XML document
 * @returns {Array<Array>} Parsed rows
 */
function parseXMLToRows(xmlDoc) {
  // This is a basic implementation - customize based on your XML structure
  const rows = [];
  const elements = xmlDoc.getElementsByTagName('*');

  // Simple approach: treat each element as a potential row
  for (const element of elements) {
    if (element.children.length === 0 && element.textContent.trim()) {
      // Leaf element with text content
      rows.push([element.tagName, element.textContent.trim()]);
    }
  }

  return rows;
}

/**
 * Generates a signature for a file based on its structure
 * @param {string} fileName - The file name
 * @param {Array<Array>} data - File data as 2D array
 * @param {Array<string>} [mapping] - Optional column mapping
 * @param {string} currency - File currency (optional)
 * @returns {string} File signature
 */
export function generateFileSignature(fileName, data, mapping = null, currency = null) {
  if (!data || !data[0]) {
    return 'empty-file';
  }

  try {
    // CRITICAL FIX: Create consistent signature based on file structure and headers only
    const columnCount = data[0] ? data[0].length : 0;
    const fileExt = fileName.split('.').pop().toLowerCase();

    // Include header content in signature for better uniqueness
    const headerContent = data[0] ? data[0].map(cell =>
      String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ).join('|') : '';

    // CRITICAL FIX: Create signature based only on file structure, not mapping
    // This ensures files with the same structure get the same signature
    const structureData = {
      extension: fileExt,
      columnCount: columnCount,
      headerContent: headerContent.substring(0, 50), // Limit length but include content
      hasSecondRow: data.length > 1
      // REMOVED: mapping parameter to ensure consistent signatures
    };

    const structureString = JSON.stringify(structureData);

    // Create a simple hash that's consistent
    let hash = 0;
    for (let i = 0; i < structureString.length; i++) {
      const char = structureString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const signature = `sig_${Math.abs(hash).toString(36)}`;
    console.log('CRITICAL: Generated signature:', signature, 'for file:', fileName, 'structure:', structureData);

    return signature;
  } catch (error) {
    console.error('CRITICAL ERROR: Error generating signature:', error);
    return `fallback_${Date.now()}`;
  }
}

/**
 * Creates a signature based on content to detect duplicates
 */
function createContentSignature(data) {
  if (!data || data.length < 2) return "empty";

  try {
    // Use the first few data rows for the signature
    const sampleSize = Math.min(3, data.length - 1);
    const samples = [];

    for (let i = 1; i <= sampleSize; i++) {
      if (data[i]) {
        // Take the first few cells from each row
        const rowSample = data[i].slice(0, Math.min(3, data[i].length));
        samples.push(rowSample.join('|'));
      }
    }

    return samples.join('::');
  } catch (error) {
    console.error("Error creating content signature:", error);
    return "error";
  }
}

// Helper to get signature as string
export function getSignatureString(signature) {
  if (!signature) return "";

  if (typeof signature === 'string') {
    return signature;
  }

  // Use toString if available (for our new signature objects)
  if (typeof signature.toString === 'function' &&
    signature.toString !== Object.prototype.toString) {
    return signature.toString();
  }

  // Otherwise extract one of the signatures
  return signature.mappingSig ||
    signature.formatSig ||
    signature.contentSig ||
    signature.structureSig ||
    JSON.stringify(signature);
}

// Format signature - based purely on column count and file type
function createFormatSignature(fileName, data) {
  const fileFormat = fileName.split('.').pop().toLowerCase();
  const columnCount = data[0]?.length || 0;
  return simpleHash(`${fileFormat}:${columnCount}:format`);
}

// Mapping signature - based on user-defined header mapping
function createMappingSignature(fileName, headerMapping) {
  const fileFormat = fileName.split('.').pop().toLowerCase();
  const filterMapping = headerMapping.filter(h => h !== "–");
  const mappingString = filterMapping.join('|');
  return simpleHash(`${fileFormat}:${mappingString}:mapping`);
}

// Update the signature generation for XML files

function createSignatureFromStructure(fileName, data) {
  const fileFormat = fileName.split('.').pop().toLowerCase();

  // For XML files, use a more consistent approach
  if (fileFormat === 'xml') {
    // Focus on column count and pattern rather than specific content
    const columnCount = data[0]?.length || 0;

    // Create a signature based on column count and file extension
    return simpleHash(`xml:${columnCount}:columns`);
  }

  // Rest of the function for other file types...
}

function createSignatureFromMapping(fileName, headerMapping, data) {
  const fileFormat = fileName.split('.').pop().toLowerCase();
  const filterMapping = headerMapping.filter(h => h !== "–");
  const mappingString = filterMapping.join('|');

  // Create a signature that includes both structure and user-defined mapping
  const mappingSignature = `${fileFormat}:${filterMapping.length}:${mappingString}`;
  return simpleHash(mappingSignature);
}

function simpleHash(str) {
  let hash = 0;
  for (const char of str) {
    const charCode = char.charCodeAt(0);
    hash = ((hash << 5) - hash) + charCode;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 12);
}

/**
 * Helper function to check if a value is a potential Excel date
 * @deprecated Use isExcelDate from dateUtils instead
 */
export function isExcelDateLocal(value) {
  console.warn('fileHandler.isExcelDateLocal is deprecated. Use isExcelDate from dateUtils instead.');
  return isExcelDate(value);
}

/**
 * Helper function to be used in transactionManager.js
 */
export function convertExcelDates(transactions) {
  return transactions.map(tx => {
    if (tx.date) {
      const dateValidation = validateAndNormalizeDate(tx.date);
      if (dateValidation.isValid) {
        tx.date = dateValidation.normalizedDate;
      }
    }
    return tx;
  });
}

/**
 * Export the excelDateToJSDate function for use in transactionManager.js
 * @deprecated Use excelDateToISOString from dateUtils instead
 */
export function excelDateToJSDateLocal(excelDate) {
  console.warn('fileHandler.excelDateToJSDateLocal is deprecated. Use excelDateToISOString from dateUtils instead.');
  return excelDateToJSDate(excelDate);
}

// Update the isDuplicateFile function

/**
 * Checks if a file is already in the merged files list
 * @param {String} fileName - The name of the file
 * @param {Object|String} signature - The file signature
 * @returns {Object|null} - The duplicate file or null
 */
export function isDuplicateFile(fileName, signature) {
  // First check by exact file name
  const duplicateByName = AppState.mergedFiles.find(f => f.fileName === fileName);
  if (duplicateByName) return duplicateByName;

  // Next check by signature
  const duplicateBySig = AppState.mergedFiles.find(f => {
    // Normalizing signatures for comparison
    const fileSig = typeof f.signature === 'object'
      ? (f.signature.formatSig || f.signature.structureSig || f.signature.mappingSig)
      : f.signature;

    const checkSig = typeof signature === 'object'
      ? (signature.formatSig || signature.structureSig || signature.mappingSig)
      : signature;

    return fileSig === checkSig;
  });

  return duplicateBySig || null;
}

/**
 * Ensure all transactions have unique IDs
 * @param {Array} transactions - Array of transactions to process
 * @returns {Array} Transactions with guaranteed unique IDs
 */
export function ensureTransactionIds(transactions) {
  if (!Array.isArray(transactions)) return [];

  const usedIds = new Set();

  return transactions.map((tx, index) => {
    if (!tx.id || usedIds.has(tx.id)) {
      // Generate new unique ID
      let newId;
      do {
        newId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      } while (usedIds.has(newId));

      tx.id = newId;
    }

    usedIds.add(tx.id);
    return tx;
  });
}

// KEEP ONLY ONE VERSION of each function to fix duplicate declarations

// Keep only one getOption function
function getOption(options, name, defaultValue) {
  return options && options[name] !== undefined ? options[name] : defaultValue;
}

// Keep only one processDataRows function
function processDataRows(rows, format) {
  // Convert traditional for loop to for-of
  for (const row of rows) {
    // Process each row directly
    processRow(row, format);
  }
}

// Keep only one processItems function
function processItems(items) {
  // Convert traditional for loop to for-of
  for (const item of items) {
    // Process each item directly
    processItem(item);
  }
}

// Keep only one processRecords function
function processRecords(records) {
  // Convert traditional for loop to for-of
  for (const record of records) {
    // Process each record directly
    processRecord(record);
  }
}

// IMPORTANT: REMOVE ALL duplicate function declarations:
// - Any other getOption functions
// - Any other processDataRows functions
// - Any other processItems functions
// - Any other processRecords functions

// Fix exception handling
try {
  // ...existing code...
} catch (error) {
  console.error("Error processing file:", error);
  // Properly handle the exception
  throw new Error(`File processing failed: ${error.message}`);
}

// Fix unhandled exceptions
export function parseFile(file) {
  try {
    const content = readFile(file);
    return processFileContent(content);
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Failed to parse ${file.name}: ${error.message}`);
  }
}

function processFileContent(content) {
  try {
    // Processing logic
    return processedData;
  } catch (error) {
    console.error("Error processing file content:", error);
    throw new Error(`Content processing failed: ${error.message}`);
  }
}

/**
 * Load XLSX library dynamically
 * @returns {Promise} Promise that resolves when library is loaded
 */
async function loadXLSXLibrary() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof XLSX !== 'undefined') {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
    script.onload = () => {
      console.log("XLSX library loaded successfully");
      resolve();
    };
    script.onerror = () => {
      reject(new Error("Failed to load XLSX library"));
    };

    document.head.appendChild(script);
  });
}
