import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { renderTransactions } from "./transactionManager.js";
import { findTransactionById } from "../utils/utils.js";

/**
 * Reverts a transaction to its original state by ID
 * @param {string} transactionId - ID of the transaction to revert
 */
export function revertTransactionById(transactionId) {
  const tx = findTransactionById(AppState.transactions, transactionId);
  if (!tx) {
    showToast("Transaction not found", "error");
    return;
  }

  // Check if we have original data to revert to - ONLY data fields count
  const hasOriginalData = tx.originalData &&
    Object.keys(tx.originalData).length > 0;

  // If no actual data field edits, just return
  if (!hasOriginalData) {
    showToast("No data changes to revert", "info");
    return;
  }

  // Confirm with user
  if (!confirm("Revert this transaction to its original state?")) return;

  // Revert actual data fields only
  if (hasOriginalData) {
    const original = tx.originalData;

    // Only revert actual data fields, not category/currency
    if (original.date !== undefined) tx.date = original.date;
    if (original.description !== undefined) tx.description = original.description;
    if (original.income !== undefined) tx.income = original.income;
    if (original.expenses !== undefined) tx.expenses = original.expenses;

    // Remove edit markers
    delete tx.originalData;
    delete tx.edited;

    showToast("Transaction data reverted to original", "success");
  }

  // Category and currency changes are separate and don't trigger revert button
  // Only handle them if they exist but don't show revert button for these
  if (tx.originalCategory !== undefined) {
    tx.category = tx.originalCategory;
    delete tx.originalCategory;
  }

  if (tx.originalSubcategory !== undefined) {
    tx.subcategory = tx.originalSubcategory;
    delete tx.originalSubcategory;
  }

  // Save to localStorage
  localStorage.setItem("transactions", JSON.stringify(AppState.transactions));

  // Update UI
  renderTransactions(AppState.transactions);

  // Update charts after reverting
  setTimeout(async () => {
    try {
      const chartsModule = await import('./charts.js');
      if (chartsModule && chartsModule.updateCharts) {
        chartsModule.updateCharts();
        console.log("Charts updated after revert");
      }
    } catch (error) {
      console.log('Charts not available for update:', error.message);
    }
  }, 100);
}

/**
 * Helper function to perform the actual revert logic
 * @param {Object} tx - Transaction to revert
 */
function performRevert(tx) {
  const hasOriginalData = tx.originalData && Object.keys(tx.originalData).length > 0;

  if (!hasOriginalData) {
    showToast("No data changes to revert", "info");
    return false;
  }

  if (!confirm("Revert this transaction to its original state?")) return false;

  const original = tx.originalData;
  if (original.date !== undefined) tx.date = original.date;
  if (original.description !== undefined) tx.description = original.description;
  if (original.income !== undefined) tx.income = original.income;
  if (original.expenses !== undefined) tx.expenses = original.expenses;

  delete tx.originalData;
  delete tx.edited;

  if (tx.originalCategory !== undefined) {
    tx.category = tx.originalCategory;
    delete tx.originalCategory;
  }

  if (tx.originalSubcategory !== undefined) {
    tx.subcategory = tx.originalSubcategory;
    delete tx.originalSubcategory;
  }

  showToast("Transaction data reverted to original", "success");
  return true;
}

/**
 * Reverts a transaction to its original state (legacy index-based)
 * @param {number} index - Index of the transaction to revert
 */
export function revertTransaction(index) {
  const tx = AppState.transactions[index];
  if (!tx) return;

  if (tx.id) {
    revertTransactionById(tx.id);
    return;
  }

  if (!performRevert(tx)) return;

  localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
  renderTransactions(AppState.transactions);

  setTimeout(async () => {
    try {
      const chartsModule = await import('./charts.js');
      if (chartsModule && chartsModule.updateCharts) {
        chartsModule.updateCharts();
        console.log("Charts updated after revert");
      }
    } catch (error) {
      console.log('Charts not available for update:', error.message);
    }
  }, 100);
}

// Attach both functions to window for global access
window.revertTransaction = revertTransaction;
window.revertTransactionById = revertTransactionById;
