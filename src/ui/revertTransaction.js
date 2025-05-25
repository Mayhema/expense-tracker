import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { renderTransactions } from "./transactionManager.js";

/**
 * Reverts a transaction to its original state
 * @param {number} index - Index of the transaction to revert
 */
export function revertTransaction(index) {
  const tx = AppState.transactions[index];
  if (!tx) return;

  // Check if we have original data to revert to
  const hasOriginalData = tx.originalData &&
    Object.keys(tx.originalData).length > 0;

  // If no actual edit data, just return
  if (!hasOriginalData && !tx.originalCategory && !tx.originalSubcategory) {
    showToast("No changes to revert", "info");
    return;
  }

  // Confirm with user if there are actual data edits
  if (hasOriginalData) {
    if (!confirm("Revert this transaction to its original state?")) return;
  }

  // Revert actual data if present
  if (hasOriginalData) {
    const original = tx.originalData;
    tx.date = original.date;
    tx.description = original.description;
    tx.income = original.income;
    tx.expenses = original.expenses;

    // Remove edit markers
    delete tx.originalData;
    delete tx.edited;

    showToast("Transaction data reverted to original", "success");
  }

  // Also revert category data if present
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
}

// Attach the function to window for global access
window.revertTransaction = revertTransaction;
