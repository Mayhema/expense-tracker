import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "../ui/uiManager.js";
import { updateChartsWithCurrentData } from "../charts/chartManager.js"; // Fixed import
import { updateTransactions } from "../ui/transactionManager.js";
import { renderMergedFiles } from "../ui/fileListUI.js";
import { renderMappingList } from "../mappings/mappingsManager.js";
import { autoCategorizeTransactions } from "../ui/categoryMapping.js";

/**
 * Adds a file to the merged files list
 * @param {Array<Array>} data - The file data
 * @param {Array<string>} mapping - The header mapping
 * @param {string} name - The file name
 * @param {string|Object} signature - The file signature
 * @param {number|null} headerRowIndex - The header row index (0-based)
 * @param {number|null} dataRowIndex - The data row index (0-based)
 * @param {string} currency - The currency code for this file
 */
export function addMergedFile(data, mapping, name, signature, headerRowIndex = null, dataRowIndex = null, currency = "USD") {
  // Use provided indices or get from DOM
  const headerRow = headerRowIndex !== null ? headerRowIndex :
    parseInt(document.getElementById("headerRowInput").value, 10) - 1;

  const dataRow = dataRowIndex !== null ? dataRowIndex :
    parseInt(document.getElementById("dataRowInput").value, 10) - 1;

  // Get currency from dropdown or use provided currency
  const currencySelect = document.getElementById("fileCurrency");
  const fileCurrency = currencySelect ? currencySelect.value : currency;

  console.log(`Adding merged file with headerRow=${headerRow + 1}, dataRow=${dataRow + 1}, currency=${fileCurrency}`);

  // Use our signature normalization helper
  const sigString = typeof signature === 'object'
    ? (signature.mappingSig || signature.formatSig || signature.contentSig || JSON.stringify(signature))
    : String(signature);

  // Improved duplicate detection - check for same name AND content, not just format
  const isDuplicate = AppState.mergedFiles.some(f =>
    f.fileName === name &&
    // If we have content signatures, use those for better comparison
    (typeof signature === 'object' && signature.contentSig && f.contentSignature === signature.contentSig)
  );

  if (isDuplicate) {
    showToast("This file is already merged.", "error");
    return;
  }

  // Create a clean copy of mapping to avoid reference issues
  const cleanMapping = [...mapping];

  // Create map of which columns to keep and their types
  const columnMap = {};
  cleanMapping.forEach((headerType, index) => {
    if (headerType !== "–") {
      columnMap[index] = headerType;
    }
  });

  // Process the data based on the data row index
  const processedData = dataRow > 0 ? data.slice(dataRow) : data;

  // Transform the data to only include mapped columns and handle special formats
  const transformedData = processedData.map(row => {
    const processedRow = [];
    Object.entries(columnMap).forEach(([origIndex, headerType]) => {
      const colIndex = parseInt(origIndex, 10);
      let cellValue = colIndex < row.length ? row[colIndex] : '';

      // Convert Excel dates in Date columns
      if (headerType === "Date" && !isNaN(parseFloat(cellValue)) &&
        parseFloat(cellValue) > 30000 && parseFloat(cellValue) < 50000) {
        const excelDate = parseFloat(cellValue);
        cellValue = excelDateToJSDate(excelDate);
      }

      processedRow.push(cellValue);
    });
    return processedRow;
  });

  // Only include mappings for columns we're keeping
  const processedMapping = Object.values(columnMap);

  console.log("Processed mapping:", processedMapping);
  console.log("Sample processed data:", transformedData.slice(0, 2));

  const merged = {
    fileName: name,
    headerMapping: processedMapping,
    data: transformedData,
    dataRow: dataRow,
    headerRow: headerRow,
    signature: sigString,  // Store as string
    // Store content signature separately to better detect duplicates
    contentSignature: typeof signature === 'object' ? signature.contentSig : null,
    selected: true,
    currency: fileCurrency, // Store currency with the file
    dateAdded: new Date().toISOString() // Add this line
  };

  console.log("Adding merged file:", merged);
  AppState.mergedFiles.push(merged);
  saveMergedFiles();

  // Also update mapping system with this file
  const mappingKey = processedMapping.filter(m => m !== "–").sort().join(",");
  const fileType = name.split('.').pop().toLowerCase();

  updateMappingWithFile(merged, mappingKey, fileType, headerRow, dataRow);

  // Update the UI components in the correct order
  renderMergedFiles();
  renderMappingList();

  // Apply auto-categorization before updating transactions
  autoCategorizeNewTransactions(AppState.mergedFiles[AppState.mergedFiles.length - 1]);

  updateTransactions();
  showToast("File merged successfully!", "success");

  // Update charts with new transaction data
  updateChartsWithCurrentData(AppState.transactions);
}

/**
 * Updates mapping records with newly added file
 */
function updateMappingWithFile(file, mappingKey, fileType, headerRow, dataRow) {
  try {
    const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "[]");

    // Find matching mapping by key or signature
    const existingIndex = mappings.findIndex(m =>
      m.mappingKey === mappingKey ||
      String(m.signature) === file.signature
    );

    if (existingIndex !== -1) {
      // Update existing mapping with this file and ensure row indices are saved
      if (!mappings[existingIndex].files) {
        mappings[existingIndex].files = [];
      }
      if (!mappings[existingIndex].files.includes(file.fileName)) {
        mappings[existingIndex].files.push(file.fileName);
      }

      // Add file type if needed
      if (!mappings[existingIndex].fileTypes) {
        mappings[existingIndex].fileTypes = [];
      }
      if (!mappings[existingIndex].fileTypes.includes(fileType)) {
        mappings[existingIndex].fileTypes.push(fileType);
      }

      // Make sure row indices are stored
      if (typeof mappings[existingIndex].headerRowIndex !== 'number') {
        mappings[existingIndex].headerRowIndex = headerRow;
      }
      if (typeof mappings[existingIndex].dataRowIndex !== 'number') {
        mappings[existingIndex].dataRowIndex = dataRow;
      }

      localStorage.setItem("fileFormatMappings", JSON.stringify(mappings));
    }
  } catch (err) {
    console.error("Error updating mapping system with new file:", err);
  }
}

/**
 * Converts Excel date to JavaScript date string
 */
function excelDateToJSDate(excelDate) {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
}

/**
 * Auto-categorizes transactions in a newly added file
 * @param {Object} fileEntry - The merged file entry
 */
function autoCategorizeNewTransactions(fileEntry) {
  if (!fileEntry || !fileEntry.data) return;

  import("../ui/categoryMapping.js").then(module => {
    if (module.getCategoryForDescription) {
      let categorizedCount = 0;
      const descriptionIndex = fileEntry.headerMapping.findIndex(h => h.toLowerCase() === "description");

      if (descriptionIndex >= 0) {
        fileEntry.data.forEach(row => {
          if (row.length > descriptionIndex) {
            const description = row[descriptionIndex];
            if (description) {
              const category = module.getCategoryForDescription(description);
              if (category) {
                // Store category info with the row for use during transaction creation
                row.autoCategorized = true;
                row.category = category;
                categorizedCount++;
              }
            }
          }
        });
      }

      if (categorizedCount > 0) {
        console.log(`Auto-categorized ${categorizedCount} rows in newly added file`);
      }
    }
  });
}
