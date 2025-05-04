// Directory: /src/fileHandler.js

import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "./uiManager.js";

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

export async function handleFileUpload(file) {
  const fileExtension = file.name.split(".").pop().toLowerCase();

  console.log("Uploading file:", file.name, "File type:", fileExtension);

  let data;
  try {
    if (fileExtension === "xml") {
      data = await parseXMLFile(file);
    } else if (fileExtension === "xls" || fileExtension === "xlsx") {
      data = await parseExcelFile(file);
    } else {
      throw new Error("Unsupported file format. Please upload an XML or Excel file.");
    }

    if (!data || data.length === 0) {
      throw new Error("No valid data found in the file.");
    }

    // Validate and clean data
    data = validateFileData(data);
    return data;
  } catch (error) {
    console.error("Error handling file upload:", error);
    showToast(error.message, "error");
    throw error;
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

export function addMergedFile(data, headerMapping, fileName, signature, dataRow = 1) {
  console.log("Saving file with signature:", signature);

  if (AppState.mergedFiles.some(f => f.signature === signature)) {
    console.log("File with the same structure already exists:", signature);
    return;
  }

  const merged = {
    fileName,
    headerMapping,
    data,
    headerRow: dataRow,
    dataRow,
    selected: true,
    signature,
  };
  AppState.mergedFiles.push(merged);
  saveMergedFiles();
}

// Update the generateFileSignature function
export function generateFileSignature(fileName, data, headerMapping = null) {
  try {
    // Use consistent naming and structure
    const result = {
      formatSig: null,
      contentSig: null,
      mappingSig: null,
      structureSig: null
    };
    
    // 1. Generate format signature (for recognizing similar files)
    result.formatSig = createFormatSignature(fileName, data);
    
    // For backward compatibility
    result.structureSig = result.formatSig;
    
    // 2. Generate content signature (for detecting duplicate uploads)
    result.contentSig = createContentSignature(fileName, data);
    
    // 3. If we have mapping info, generate a mapping signature too
    if (headerMapping) {
      result.mappingSig = createMappingSignature(fileName, headerMapping);
    }
    
    return result;
  } catch (error) {
    console.error("Error generating file signature:", error);
    return { 
      formatSig: null, 
      contentSig: null, 
      mappingSig: null,
      structureSig: null 
    };
  }
}

// Format signature - based purely on column count and file type
function createFormatSignature(fileName, data) {
  const fileFormat = fileName.split('.').pop().toLowerCase();
  const columnCount = data[0]?.length || 0;
  return simpleHash(`${fileFormat}:${columnCount}:format`);
}

// Content signature - based on actual data samples
function createContentSignature(fileName, data) {
  // Use a sample of the actual content to identify duplicates
  const sampleSize = Math.min(3, data.length);
  let contentSample = [];
  
  for (let i = 0; i < sampleSize; i++) {
    if (i < data.length) {
      contentSample.push(data[i]);
    }
  }
  
  return simpleHash(fileName + JSON.stringify(contentSample));
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