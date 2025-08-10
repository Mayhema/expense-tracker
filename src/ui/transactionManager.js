// Import the main coordinator which orchestrates all other modules
import {
  renderTransactions as coordinatorRenderTransactions,
  updateTransactionDisplay as coordinatorUpdateTransactionDisplay,
  initializeTransactionManager as coordinatorInitializeTransactionManager,
  updateTransactionsFromUpload as coordinatorUpdateTransactionsFromUpload,
} from "./transaction/transactionCoordinator.js";

// Re-export the main public API functions with the same signatures
// This ensures backward compatibility with existing code

/**
 * Main render function - delegates to coordinator
 */
export function renderTransactions(transactions = [], updateCharts = false) {
  return coordinatorRenderTransactions(transactions, updateCharts);
}

/**
 * Update transaction display - delegates to coordinator
 */
export function updateTransactionDisplay(filteredTransactions) {
  return coordinatorUpdateTransactionDisplay(filteredTransactions);
}

/**
 * Initialize transaction manager - delegates to coordinator
 */
export function initializeTransactionManager() {
  return coordinatorInitializeTransactionManager();
}

/**
 * Update transactions from upload - delegates to coordinator
 */
export function updateTransactionsFromUpload() {
  return coordinatorUpdateTransactionsFromUpload();
}

// Legacy support functions for backward compatibility
// These maintain the same API as the original monolithic file

/**
 * Legacy function for backward compatibility
 * @deprecated Use the new modular approach instead
 */
export function saveFieldChange(index, fieldName, newValue) {
  console.warn(
    "⚠️ saveFieldChange is deprecated. Use saveFieldChangeById from transactionEditor module instead."
  );

  // For backward compatibility, try to find transaction by index and use ID-based saving
  import("../core/appState.js").then(({ AppState }) => {
    if (AppState.transactions?.[index]) {
      const transaction = AppState.transactions[index];
      if (transaction.id) {
        import("./transaction/transactionEditor.js").then(
          ({ saveFieldChangeById }) => {
            saveFieldChangeById(transaction.id, fieldName, newValue);
          }
        );
      }
    }
  });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use applyFilters from transactionCoordinator module instead
 */
export function applyFilters(transactions) {
  console.warn(
    "⚠️ applyFilters is now internal to transactionCoordinator module."
  );
  // Return all transactions for backward compatibility
  return transactions || [];
}
