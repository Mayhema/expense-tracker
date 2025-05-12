// Move from src/exports/exportManager.js

// Update imports
import { AppState } from "../core/appState.js";
import { showToast } from "../ui/uiManager.js";
import { HEADERS } from "../core/constants.js";

// Update the export functionality

export function exportMergedFilesAsCSV() {
  // Make sure we have transactions to export
  if (!AppState.transactions || AppState.transactions.length === 0) {
    showToast("No transactions to export", "error");
    return;
  }

  // Determine which fields are actually used in the transactions
  const usedFields = {
    date: false,
    description: false,
    category: false,
    income: false,
    expenses: false
  };

  // Check which fields are used in at least one transaction
  AppState.transactions.forEach(tx => {
    if (tx.date) usedFields.date = true;
    if (tx.description) usedFields.description = true;
    if (tx.category) usedFields.category = true;
    if (tx.income) usedFields.income = true;
    if (tx.expenses) usedFields.expenses = true;
  });

  // Create headers based on used fields
  const exportHeaders = [];
  if (usedFields.date) exportHeaders.push("Date");
  if (usedFields.description) exportHeaders.push("Description");
  if (usedFields.category) exportHeaders.push("Category");
  if (usedFields.income) exportHeaders.push("Income");
  if (usedFields.expenses) exportHeaders.push("Expenses");

  const allRows = [exportHeaders]; // First row is headers

  // Add transaction data in the same order as headers
  AppState.transactions.forEach(tx => {
    const rowData = [];

    if (usedFields.date) rowData.push(tx.date || "");
    if (usedFields.description) rowData.push(tx.description || "");
    if (usedFields.category) rowData.push(tx.category || "");
    if (usedFields.income) rowData.push(tx.income || "");
    if (usedFields.expenses) rowData.push(tx.expenses || "");

    allRows.push(rowData);
  });

  // Add BOM for UTF-8 encoding support (fixes Hebrew characters)
  const BOM = '\uFEFF';

  // Escape CSV cells properly
  function escapeCsvValue(val) {
    if (val === null || val === undefined) return '';
    // Convert to string and properly escape quotes
    const str = String(val);
    // If string contains quotes, commas, or newlines, enclose in quotes
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Create CSV content with proper escaping
  const csvRows = allRows.map(row => row.map(escapeCsvValue).join(","));
  const csvContent = BOM + csvRows.join("\n");

  // Use download attribute approach instead of blob URL
  try {
    // Create an invisible link element
    const a = document.createElement("a");
    a.style.display = 'none';

    // Create the blob with UTF-8 encoding
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

    // Use createObjectURL with explicit cleanup
    const url = URL.createObjectURL(blob);

    // Set download properties
    a.href = url;
    a.download = `expense_transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    // Append to body, click and remove
    document.body.appendChild(a);

    // Show more helpful message about the download
    showToast("Preparing CSV file for download. If prompted, choose 'Keep' or 'Save'", "info");

    // Slight delay before triggering download
    setTimeout(() => {
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      showToast("Export completed. Check your downloads folder.", "success");
    }, 100);
  } catch (error) {
    console.error("Export error:", error);
    showToast("Error exporting transactions: " + error.message, "error");
  }
}
