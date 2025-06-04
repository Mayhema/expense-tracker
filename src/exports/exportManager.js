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
    // Create CSV header with better column names
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Currency', 'Source File'];

    // Create CSV content with improved data handling
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => {
        const amount = parseFloat(tx.expenses) || parseFloat(tx.income) || 0;
        const type = tx.expenses ? 'Expense' : 'Income';
        // FIXED: Format date to dd/mm/yyyy for export
        const formattedDate = tx.date ? formatDateToDDMMYYYY(tx.date) : '';

        return [
          formattedDate,
          `"${(tx.description || '').replace(/"/g, '""')}"`,
          amount.toFixed(2),
          type,
          tx.category || 'Uncategorized',
          tx.currency || 'USD',
          tx.fileName || 'Unknown'
        ].join(',');
      })
    ].join('\n');

    // Create and download file with dd/mm/yyyy in filename
    const currentDate = formatDateToDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadFile(csvContent, `transactions_${currentDate}.csv`, 'text/csv');
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
      ...tx,
      date: tx.date ? formatDateToDDMMYYYY(tx.date) : ''
    }));

    const jsonContent = JSON.stringify(formattedTransactions, null, 2);
    const currentDate = formatDateToDDMMYYYY(new Date()).replace(/\//g, '-');
    downloadFile(jsonContent, `transactions_${currentDate}.json`, 'application/json');
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
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
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
