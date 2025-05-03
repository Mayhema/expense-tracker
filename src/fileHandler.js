// Directory: /src/fileHandler.js

import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "./uiManager.js";

console.log("XLSX object:", XLSX);

function validateFileData(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("File must contain at least one header row and one data row.");
  }

  // Clean up data - remove empty rows and empty cells at the beginning
  const cleanedData = data.filter(row => row && row.length > 0);
  
  // Find the first non-empty row to use as headers
  const headerIndex = cleanedData.findIndex(row => 
    row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
  );
  
  if (headerIndex === -1) {
    throw new Error("File must contain a valid header row.");
  }

  // Make sure there's at least one data row after the header
  if (cleanedData.length <= headerIndex + 1) {
    throw new Error("File must contain at least one data row.");
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

    // Try multiple approaches to extract data
    let rows = [];

    // Approach 1: Look for <row> elements
    rows = Array.from(xmlDoc.getElementsByTagName("row")).map(row => {
      return Array.from(row.children).map(cell => cell.textContent.trim());
    });

    // Approach 2: Look for <entry> elements
    if (rows.length === 0) {
      rows = Array.from(xmlDoc.getElementsByTagName("entry")).map(entry => {
        return Array.from(entry.children).map(cell => cell.textContent.trim());
      });
    }

    // Approach 3: Look for table structure
    if (rows.length === 0) {
      const tables = xmlDoc.getElementsByTagName('table');
      if (tables.length > 0) {
        const tableRows = tables[0].getElementsByTagName('tr');
        rows = Array.from(tableRows).map(tr => {
          return Array.from(tr.getElementsByTagName('td')).map(td => td.textContent.trim());
        });
      }
    }

    // Approach 4: Try to extract from any elements with consistent patterns
    if (rows.length === 0) {
      // Find all elements that might contain transaction data
      const possibleTransactionContainers = Array.from(xmlDoc.documentElement.children);
      if (possibleTransactionContainers.length > 0) {
        // Get all children of the first container to use as a template
        const firstContainer = possibleTransactionContainers[0];
        const childNames = Array.from(firstContainer.children).map(c => c.nodeName);
        
        // Check if all containers have the same structure
        if (possibleTransactionContainers.every(container => 
          container.children.length === childNames.length)) {
          
          rows = possibleTransactionContainers.map(container => {
            return Array.from(container.children).map(child => child.textContent.trim());
          });
        }
      }
    }
    
    // Approach 5: Last resort - try to find ANY elements with similar structure
    if (rows.length === 0) {
      // Get all elements in the document
      const allElements = xmlDoc.getElementsByTagName("*");
      
      // Group elements by tag name
      const elementGroups = {};
      for (let i = 0; i < allElements.length; i++) {
        const tagName = allElements[i].tagName;
        if (!elementGroups[tagName]) elementGroups[tagName] = [];
        elementGroups[tagName].push(allElements[i]);
      }
      
      // Find the group with most elements (potential rows)
      let mostCommonTag = null;
      let maxCount = 0;
      
      for (const tag in elementGroups) {
        if (elementGroups[tag].length > maxCount) {
          maxCount = elementGroups[tag].length;
          mostCommonTag = tag;
        }
      }
      
      if (mostCommonTag && maxCount > 1) {
        rows = elementGroups[mostCommonTag].map(element => {
          // If element has child elements, use them as cells
          if (element.children.length > 0) {
            return Array.from(element.children).map(child => child.textContent.trim());
          }
          // Otherwise use text content as a single cell
          return [element.textContent.trim()];
        });
      }
    }

    console.log("Parsed XML data:", rows);
    if (rows.length === 0) {
      throw new Error("No valid rows found in the XML file.");
    }
    
    return rows.filter(row => row.length > 0); // Filter out empty rows
  } catch (error) {
    console.error("Error parsing XML file:", error);
    throw new Error(`XML parsing error: ${error.message}`);
  }
}

// Update the parseExcelFile function

async function parseExcelFile(file) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array", dateNF: 'yyyy-mm-dd' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with specific options for better date handling
    const rows = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      raw: false, 
      dateNF: 'yyyy-mm-dd'
    });

    // Remove empty rows
    const cleanedRows = rows.filter(row => 
      row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
    );
    
    // Process Excel dates
    const processedRows = cleanedRows.map(row => 
      row.map(cell => {
        // Handle Excel date values
        if (typeof cell === 'number' && cell > 35000 && cell < 50000) {
          try {
            const jsDate = new Date((cell - 25569) * 86400 * 1000);
            return jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } catch (e) {
            return cell; // Keep original if conversion fails
          }
        }
        return cell;
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
    // 1. Generate format signature (for recognizing similar files)
    const formatSig = createFormatSignature(fileName, data);
    
    // 2. Generate content signature (for detecting duplicate uploads)
    const contentSig = createContentSignature(fileName, data);
    
    // 3. If we have mapping info, generate a mapping signature too
    if (headerMapping) {
      const mappingSig = createMappingSignature(fileName, headerMapping);
      
      // IMPORTANT: For backwards compatibility
      return { 
        formatSig, 
        contentSig, 
        mappingSig,
        structureSig: formatSig  // Add this for compatibility with older code
      };
    }
    
    // IMPORTANT: For backwards compatibility
    return { 
      formatSig, 
      contentSig,
      structureSig: formatSig  // Add this for compatibility with older code
    };
  } catch (error) {
    console.error("Error generating file signature:", error);
    return { formatSig: null, contentSig: null, structureSig: null };
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