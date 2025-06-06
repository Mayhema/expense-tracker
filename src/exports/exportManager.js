// Move from src/exports/exportManager.js

// Update imports
import { AppState } from '../core/appState.js';
import { showToast } from '../ui/uiManager.js';
import { formatDateToDDMMYYYY } from '../utils/dateUtils.js';

/**
 * Export transactions as CSV with improved formatting
 */
export function exportTransactionsAsCSV() {
  console.log("Exporting transactions as CSV...");

  const transactions = AppState.transactions || [];

  if (transactions.length === 0) {
    showToast("No transactions to export", "warning");
    return;
  }

  try {
    // FIXED: Match transaction data columns exactly
    const headers = ['Date', 'Description', 'Category', 'Income', 'Expenses', 'Currency', 'File Name'];

    // Create CSV content with improved data handling and Hebrew support
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => {
        // FIXED: Format date to dd/mm/yyyy for export
        const formattedDate = tx.date ? formatDateToDDMMYYYY(tx.date) : '';

        // Clean description for export
        const cleanDescription = (tx.description || '').trim();

        return [
          formattedDate,
          `"${cleanDescription.replace(/"/g, '""')}"`, // Proper CSV escaping
          `"${(tx.category || 'Uncategorized').replace(/"/g, '""')}"`,
          (parseFloat(tx.income) || 0).toFixed(2),
          (parseFloat(tx.expenses) || 0).toFixed(2),
          tx.currency || 'USD',
          `"${(tx.fileName || 'Unknown').replace(/"/g, '""')}"`
        ].join(',');
      })
    ];

    // CRITICAL FIX: Add UTF-8 BOM for proper Hebrew encoding
    const csvContent = '\uFEFF' + csvRows.join('\n');

    // Create and download file with dd/mm/yyyy in filename
    const currentDate = formatDateToDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadFile(csvContent, `transactions_${currentDate}.csv`, 'text/csv;charset=utf-8');
    showToast(`Exported ${transactions.length} transactions to CSV`, "success");

  } catch (error) {
    console.error("Error exporting CSV:", error);
    showToast("Error exporting transactions", "error");
  }
}

/**
 * Export transactions as JSON
 */
export function exportTransactionsAsJSON() {
  console.log("Exporting transactions as JSON...");

  const transactions = AppState.transactions || [];

  if (transactions.length === 0) {
    showToast("No transactions to export", "warning");
    return;
  }

  try {
    // FIXED: Format dates to dd/mm/yyyy in JSON export
    const formattedTransactions = transactions.map(tx => ({
      date: tx.date ? formatDateToDDMMYYYY(tx.date) : '',
      description: (tx.description || '').trim(),
      category: tx.category || 'Uncategorized',
      income: parseFloat(tx.income) || 0,
      expenses: parseFloat(tx.expenses) || 0,
      currency: tx.currency || 'USD',
      fileName: tx.fileName || 'Unknown'
    }));

    const jsonContent = JSON.stringify(formattedTransactions, null, 2);
    const currentDate = formatDateToDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadFile(jsonContent, `transactions_${currentDate}.json`, 'application/json;charset=utf-8');
    showToast(`Exported ${transactions.length} transactions to JSON`, "success");

  } catch (error) {
    console.error("Error exporting JSON:", error);
    showToast("Error exporting transactions", "error");
  }
}

/**
 * Export merged files data
 */
export function exportMergedFilesAsCSV() {
  console.log("Exporting merged files data...");

  const mergedFiles = AppState.mergedFiles || [];

  if (mergedFiles.length === 0) {
    showToast("No merged files to export", "warning");
    return;
  }

  try {
    // Create CSV header
    const headers = ['File Name', 'Currency', 'Transaction Count', 'Import Date', 'Signature'];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...mergedFiles.map(file => [
        `"${file.fileName || 'Unknown'}"`,
        file.currency || 'USD',
        (file.transactions ? file.transactions.length : 0),
        file.mergedAt || 'Unknown',
        `"${file.signature || 'None'}"`
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, `merged_files_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    showToast(`Exported ${mergedFiles.length} merged files info to CSV`, "success");

  } catch (error) {
    console.error("Error exporting merged files CSV:", error);
    showToast("Error exporting merged files", "error");
  }
}

/**
 * Download file helper function
 */
function downloadFile(content, filename, mimeType) {
  // FIXED: Ensure proper encoding for Hebrew text
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    throw new Error("Download not supported");
  }
}
