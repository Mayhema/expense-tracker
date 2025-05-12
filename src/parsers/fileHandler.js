// Directory: /src/parsers/fileHandler.js

// Update imports
import { AppState, saveMergedFiles } from "../core/appState.js";
import { showToast } from "../ui/uiManager.js";
import { FILE_TYPES } from "../core/constants.js";

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
  if (!file) {
    return Promise.reject(new Error("No file provided"));
  }

  const fileName = file.name.toLowerCase();
  console.log(`Uploading file: ${file.name} File type: ${fileName.split('.').pop()}`);

  try {
    // Handle XML files
    if (fileName.endsWith('.xml')) {
      return await parseXMLFile(file);
    }
    // Handle Excel files
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await parseExcelFile(file);
    }
    // Handle CSV files
    else if (fileName.endsWith('.csv')) {
      return await parseCSVFile(file);
    }
    else {
      return Promise.reject(new Error("Unsupported file type. Please upload XML, Excel, or CSV files."));
    }
  } catch (error) {
    console.error("Error handling file:", error);
    return Promise.reject(new Error(`Error processing file: ${error.message}`));
  }
}

// Update XML file handling with better detection
async function parseXMLFile(file) {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error("Invalid XML format");
    }

    // Improved automatic row detection - preserves ALL rows including empty ones
    const possibleRows = [
      Array.from(xmlDoc.getElementsByTagName("row")),
      Array.from(xmlDoc.getElementsByTagName("entry")),
      Array.from(xmlDoc.getElementsByTagName("transaction")),
      Array.from(xmlDoc.getElementsByTagName("record"))
    ];

    // Find the first valid row set
    let rows = [];
    for (const rowSet of possibleRows) {
      if (rowSet.length > 0) {
        rows = rowSet.map(row => {
          return Array.from(row.children).map(cell => cell.textContent.trim());
        });
        console.log(`Found ${rows.length} rows in XML using ${rowSet[0].tagName} tags`);
        break;
      }
    }

    // If no common patterns found, use a more general approach
    if (rows.length === 0) {
      // Find repeating elements that likely represent rows
      const allElements = xmlDoc.getElementsByTagName("*");
      const tagCounts = {};

      // Count occurrences of each tag
      for (let i = 0; i < allElements.length; i++) {
        const tag = allElements[i].tagName;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }

      // Find tags with multiple occurrences (likely rows)
      const repeatingTags = Object.entries(tagCounts)
        .filter(([tag, count]) => count > 1 && count < 100) // Avoid too few or too many
        .sort((a, b) => b[1] - a[1]); // Sort by frequency

      if (repeatingTags.length > 0) {
        const mostLikelyRowTag = repeatingTags[0][0];
        const rowElements = xmlDoc.getElementsByTagName(mostLikelyRowTag);

        rows = Array.from(rowElements).map(elem => {
          // Get all immediate children as cells
          return Array.from(elem.children).map(child => child.textContent.trim());
        });
        console.log(`Found ${rows.length} rows in XML using ${mostLikelyRowTag} tags (general approach)`);
      }
    }

    // IMPORTANT: Don't filter out empty rows here
    console.log("Parsed XML data:", rows);
    return rows; // Return all rows, including potentially empty ones
  } catch (error) {
    console.error("Error parsing XML file:", error);
    throw new Error(`XML parsing error: ${error.message}`);
  }
}

// Replace the parseExcelFile function with this improved version

async function parseExcelFile(file) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, {
      type: "array",
      cellDates: true,
      dateNF: 'yyyy-mm-dd'
    });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with better options for international text and date handling
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: '',  // Use empty string for empty cells
      // This ensures proper encoding for non-Latin characters like Hebrew
      codepage: 65001  // UTF-8
    });

    // Remove empty rows but keep empty cells
    const cleanedRows = rows.filter(row =>
      row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
    );

    // Process Excel dates and improve Hebrew text handling
    const processedRows = cleanedRows.map(row =>
      row.map(cell => {
        // Always convert to string first for text operations
        const cellStr = String(cell || '');

        // Trim and normalize whitespace
        const trimmedCell = cellStr.trim().replace(/\s+/g, ' ');

        // Handle Excel date values
        if (typeof cell === 'number' && cell > 35000 && cell < 50000) {
          try {
            const jsDate = new Date((cell - 25569) * 86400 * 1000);
            return jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } catch (e) {
            return trimmedCell; // Keep original if conversion fails
          }
        }

        // Special handling for RTL text (like Hebrew)
        if (/[\u0590-\u05FF\u0600-\u06FF]/.test(trimmedCell)) {
          // Add RTL mark for better rendering
          return '\u200F' + trimmedCell;
        }

        return trimmedCell;
      })
    );

    console.log("Parsed Excel data:", processedRows);
    return processedRows;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(`Excel parsing error: ${error.message}`);
  }
}

/**
 * Parses a CSV file into a 2D array
 */
async function parseCSVFile(file) {
  try {
    const text = await file.text();

    // Simple CSV parser
    const lines = text.split(/\r?\n/);
    const data = lines.map(line => {
      // Handle quoted values containing commas
      const result = [];
      let inQuote = false;
      let currentValue = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      result.push(currentValue);
      return result;
    });

    // Filter out empty rows
    const filteredData = data.filter(row => row.some(cell => cell !== ''));

    console.log("Parsed CSV data:", filteredData);
    return filteredData;
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw new Error(`CSV parsing error: ${error.message}`);
  }
}

// Modify addMergedFile to ensure we're using a string signature
export function addMergedFile(data, headerMapping, fileName, signature) {
  // Make sure signature is a string
  const sigString = typeof signature === 'object' ?
    (signature.mappingSig || signature.formatSig || signature.contentSig || JSON.stringify(signature)) :
    signature;

  console.log("Saving file with signature:", sigString);

  if (AppState.mergedFiles.some(f => f.signature === sigString)) {
    console.log("File with the same structure already exists:", sigString);
    return;
  }

  const merged = {
    fileName,
    headerMapping,
    data,
    headerRow: dataRow,
    dataRow,
    selected: true,
    signature: sigString,  // Ensure it's a string
  };
  AppState.mergedFiles.push(merged);
  saveMergedFiles();
}

// Update the generateFileSignature function
/**
 * Generates a signature for a file based on its structure
 * @param {string} fileName - The file name
 * @param {Array<Array>} data - File data as 2D array
 * @param {Array<string>} [mapping] - Optional column mapping
 * @returns {Object} File signature
 */
export function generateFileSignature(fileName, data, mapping = null) {
  if (!data || !data[0]) {
    return { formatSig: "empty" };
  }

  try {
    // Create a format signature based on the header structure
    let formatSig;
    if (mapping) {
      // If mapping is provided, use that for signature
      formatSig = JSON.stringify(mapping);
    } else {
      // Otherwise, use the first row (header)
      formatSig = JSON.stringify(data[0].map(cell => String(cell).toLowerCase()));
    }

    // Create a content signature with a sample of data
    const contentSig = createContentSignature(data);

    // Create a mapping signature if mapping provided
    const mappingSig = mapping ? JSON.stringify(mapping) : null;

    return {
      formatSig,
      contentSig,
      mappingSig
    };
  } catch (error) {
    console.error("Error generating signature:", error);
    return { formatSig: "error" };
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
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 12);
}

function excelDateToJSDate(excelDate) {
  const date = new Date((excelDate - 25569) * 86400 * 1000); // Excel epoch starts on 1900-01-01
  return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
}

// Helper function to check if a value is a potential Excel date
export function isExcelDate(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 40000 && num < 50000;
}

// Helper function to be used in transactionManager.js
export function convertExcelDates(transactions) {
  return transactions.map(tx => {
    if (tx.date && isExcelDate(tx.date)) {
      tx.date = excelDateToJSDate(parseFloat(tx.date));
    }
    return tx;
  });
}

// Export the excelDateToJSDate function for use in transactionManager.js
export { excelDateToJSDate };

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
