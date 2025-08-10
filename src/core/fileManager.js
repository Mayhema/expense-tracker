import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "../ui/uiManager.js";

/**
 * Adds or updates a merged file in the AppState
 * @param {Array<Array>} fileData - The parsed file data
 * @param {Array<string>} headerMapping - Header mapping array
 * @param {string} fileName - Name of the file
 * @param {string} signature - Unique file signature
 * @param {number} headerRowIndex - Index of header row (0-based)
 * @param {number} dataRowIndex - Index where data starts (0-based)
 * @param {string} currency - Currency for this file
 */
export function addMergedFile(
  fileData,
  headerMapping,
  fileName,
  signature,
  headerRowIndex = 0,
  dataRowIndex = 1,
  currency = "USD"
) {
  if (!fileData || !headerMapping || !fileName || !signature) {
    console.error("addMergedFile: Missing required parameters.", {
      fileName,
      signature,
      headerMapping,
      fileData,
    });
    showToast("Error: Could not add file due to missing data.", "error");
    return;
  }

  try {
    // Process the file data into transactions immediately
    const transactions = processFileDataToTransactions(
      fileData,
      headerMapping,
      dataRowIndex,
      fileName,
      currency
    );

    const fileEntry = {
      fileName,
      data: fileData,
      headerMapping,
      signature,
      headerRowIndex,
      dataRowIndex,
      currency,
      transactions, // Store processed transactions
      dateAdded: new Date().toISOString(),
      selected: true,
    };

    // Ensure AppState.mergedFiles is an array
    if (!Array.isArray(AppState.mergedFiles)) {
      AppState.mergedFiles = [];
    }

    // Check for existing file by signature to prevent exact duplicates if desired,
    // or replace by name if that's the policy (current policy seems to be replace by name via UI confirm)
    const existingFileIndex = AppState.mergedFiles.findIndex(
      (f) => f.fileName === fileName
    );
    if (existingFileIndex !== -1) {
      console.log(`Replacing existing file: ${fileName}`);
      AppState.mergedFiles[existingFileIndex] = fileEntry;
    } else {
      AppState.mergedFiles.push(fileEntry);
    }

    saveMergedFiles(); // Save to localStorage
    console.log(
      `File "${fileName}" added/updated in mergedFiles. Total: ${AppState.mergedFiles.length}`
    );
    console.log(`Processed ${transactions.length} transactions from file`);
  } catch (error) {
    console.error("Error adding merged file:", error);
    throw error;
  }
}

/**
 * Process file data into transaction objects
 * @param {Array<Array>} fileData - Raw file data
 * @param {Array<string>} headerMapping - Header mapping
 * @param {number} dataRowIndex - Starting data row index
 * @param {string} fileName - Source file name
 * @param {string} currency - Currency for transactions
 * @returns {Array} Processed transactions
 */
function processFileDataToTransactions(
  fileData,
  headerMapping,
  dataRowIndex,
  fileName,
  currency
) {
  const transactions = [];

  if (!fileData || !headerMapping) {
    console.warn("Missing file data or header mapping");
    return transactions;
  }

  // Get data rows starting from the specified index
  const dataRows = fileData.slice(dataRowIndex);

  dataRows.forEach((row, index) => {
    if (!row || row.length === 0) return;

    const transaction = {
      date: "",
      description: "",
      income: "",
      expenses: "",
      currency: currency,
      category: "Uncategorized",
      fileName: fileName,
    };

    // Map row data to transaction fields
    headerMapping.forEach((mapping, colIndex) => {
      if (mapping && mapping !== "–" && colIndex < row.length) {
        const value = row[colIndex];
        if (value !== null && value !== undefined && value !== "") {
          const fieldName = mapping.toLowerCase();
          transaction[fieldName] = String(value).trim();
        }
      }
    });

    // Validate and clean up the transaction
    if (
      transaction.date ||
      transaction.description ||
      transaction.income ||
      transaction.expenses
    ) {
      // Clean up amounts
      if (transaction.income) {
        transaction.income = cleanAmount(transaction.income);
      }
      if (transaction.expenses) {
        transaction.expenses = cleanAmount(transaction.expenses);
      }

      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Clean and validate monetary amounts
 * @param {string} amount - Amount to clean
 * @returns {string} Cleaned amount
 */
function cleanAmount(amount) {
  if (!amount) return "";

  // Remove currency symbols and extra spaces
  let cleaned = String(amount).replace(/[$€£¥₪,\s]/g, "");

  // Parse as float to validate
  const num = parseFloat(cleaned);
  if (isNaN(num)) return "";

  return num.toString();
}
