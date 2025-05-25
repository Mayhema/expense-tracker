// Move from src/exports/exportManager.js

// Update imports
import { AppState } from "../core/appState.js";
import { showToast } from "../ui/uiManager.js";

/**
 * Export transactions as CSV with all visible columns
 */
export function exportMergedFilesAsCSV() {
  // Make sure we have transactions to export
  if (!AppState.transactions || AppState.transactions.length === 0) {
    showToast("No transactions to export", "error");
    return;
  }

  try {
    // Define all possible columns in the order they appear in the table
    const allColumns = [
      { key: 'date', header: 'Date' },
      { key: 'description', header: 'Description' },
      { key: 'income', header: 'Income' },
      { key: 'expenses', header: 'Expenses' },
      { key: 'currency', header: 'Currency' },
      { key: 'category', header: 'Category' },
      { key: 'subcategory', header: 'Subcategory' },
      { key: 'fileName', header: 'Source File' }
    ];

    // Check which columns have data
    const columnsWithData = allColumns.filter(col => {
      return AppState.transactions.some(tx => {
        const value = getTransactionValue(tx, col.key);
        return value !== null && value !== undefined && value !== '';
      });
    });

    console.log(`Exporting ${AppState.transactions.length} transactions with columns:`,
      columnsWithData.map(c => c.header));

    // Create CSV headers
    const headers = columnsWithData.map(col => col.header);

    // Create CSV rows
    const csvRows = [headers]; // Start with headers

    AppState.transactions.forEach(tx => {
      const row = columnsWithData.map(col => {
        const value = getTransactionValue(tx, col.key);
        return formatCsvValue(value);
      });
      csvRows.push(row);
    });

    // Add summary row
    const totalIncome = AppState.transactions.reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0);
    const totalExpenses = AppState.transactions.reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0);
    const balance = totalIncome - totalExpenses;

    csvRows.push([]); // Empty row
    csvRows.push(['SUMMARY', '', totalIncome.toFixed(2), totalExpenses.toFixed(2), '', `Balance: ${balance.toFixed(2)}`]);

    // Create CSV content with BOM for UTF-8 encoding
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.map(row => row.join(',')).join('\n');

    // Download the file
    downloadCsv(csvContent, `expense_transactions_${getCurrentDate()}.csv`);

    showToast(`Exported ${AppState.transactions.length} transactions with ${columnsWithData.length} columns`, "success");

  } catch (error) {
    console.error("Export error:", error);
    showToast("Error exporting transactions: " + error.message, "error");
  }
}

/**
 * Get value from transaction object
 */
function getTransactionValue(transaction, key) {
  switch (key) {
    case 'category':
      return transaction.subcategory ?
        `${transaction.category}:${transaction.subcategory}` :
        (transaction.category || '');
    case 'subcategory':
      return transaction.subcategory || '';
    case 'currency':
      return transaction.currency || AppState.settings?.defaultCurrency || 'USD';
    case 'fileName':
      return transaction.fileName || 'Unknown';
    default:
      return transaction[key] || '';
  }
}

/**
 * Format value for CSV
 */
function formatCsvValue(value) {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If string contains quotes, commas, or newlines, enclose in quotes and escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Download CSV file
 */
function downloadCsv(csvContent, fileName) {
  try {
    // Create blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

    // Create download link
    const a = document.createElement("a");
    a.style.display = 'none';
    a.href = URL.createObjectURL(blob);
    a.download = fileName;

    // Trigger download
    document.body.appendChild(a);

    showToast("Preparing CSV file for download...", "info");

    setTimeout(() => {
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);

      showToast("Export completed. Check your downloads folder.", "success");
    }, 100);

  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}

/**
 * Export transactions as JSON (alternative format)
 */
export function exportTransactionsAsJSON() {
  if (!AppState.transactions || AppState.transactions.length === 0) {
    showToast("No transactions to export", "error");
    return;
  }

  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTransactions: AppState.transactions.length,
      transactions: AppState.transactions,
      summary: {
        totalIncome: AppState.transactions.reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0),
        totalExpenses: AppState.transactions.reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0)
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `expense_transactions_${getCurrentDate()}.json`;
    a.click();

    showToast("JSON export completed", "success");

  } catch (error) {
    console.error("JSON export error:", error);
    showToast("Error exporting JSON: " + error.message, "error");
  }
}
