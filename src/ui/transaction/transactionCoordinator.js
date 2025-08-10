/**
 * TRANSACTION MANAGER COORDINATOR
 *
 * Main coordinator for transaction management functionality.
 * This module orchestrates the interaction between renderer, summary, table generator,
 * editor, and event handler modules.
 */

import { AppState } from "../../core/appState.js";
import {
  ensureTransactionContainer,
  renderFiltersSection,
  renderTransactionTable,
} from "./transactionRenderer.js";
import { updateTransactionSummary } from "./transactionSummary.js";
import { attachTransactionEventListeners } from "./transactionEventHandler.js";

/**
 * Main render function - orchestrates all transaction rendering
 */
export function renderTransactions(transactions = [], updateCharts = false) {
  console.log(
    `CRITICAL: renderTransactions called with ${transactions.length} transactions`
  );

  // Always use AppState.transactions if no transactions passed
  const actualTransactions =
    transactions.length > 0 ? transactions : AppState.transactions || [];
  console.log(
    `CRITICAL: Using ${actualTransactions.length} transactions for rendering`
  );

  // Ensure all transactions have IDs before rendering
  ensureTransactionIds(actualTransactions);

  // Ensure main container exists first AND remove any duplicates
  let container = ensureTransactionContainer();
  if (!container) {
    console.error("CRITICAL: Could not create transaction container");
    return;
  }

  // Apply filters to get display transactions
  const filteredTransactions = applyFilters(actualTransactions);
  console.log(
    `CRITICAL: Filtered to ${filteredTransactions.length} transactions for display`
  );

  // Update summary
  updateTransactionSummary(filteredTransactions);

  // Render filters section
  renderFiltersSection(container, actualTransactions);

  // Render transaction table with proper structure
  renderTransactionTable(container, filteredTransactions);

  // Update category dropdown options from transaction data
  setTimeout(async () => {
    try {
      const { updateCategoryFilterOptions } = await import(
        "../filters/advancedFilters.js"
      );
      updateCategoryFilterOptions();
      console.log(
        "CRITICAL: Category filter options updated from transaction data"
      );
    } catch (error) {
      console.log(
        "Info: Could not update category filter options:",
        error.message
      );
    }
  }, 25);

  // Attach event listeners after DOM update
  setTimeout(() => {
    attachTransactionEventListeners();
    console.log("CRITICAL: Event listeners attached");
  }, 50);

  // FIXED: NEVER update charts from here - charts are updated once in main.js
  console.log(
    `CRITICAL: Transaction rendering complete - displayed ${filteredTransactions.length} transactions (no chart update)`
  );
}

/**
 * Update transaction display with filtered transactions
 * This function is called by the filter system when filters change
 */
export function updateTransactionDisplay(filteredTransactions) {
  console.log(
    `CRITICAL: updateTransactionDisplay called with ${filteredTransactions.length} filtered transactions`
  );

  try {
    // Update the transaction summary with the filtered transactions
    updateTransactionSummary(filteredTransactions);

    // Update the transaction table to show only filtered transactions
    const tableWrapper = document.getElementById("transactionTableWrapper");
    if (tableWrapper) {
      renderTransactionTable(
        { querySelector: () => tableWrapper },
        filteredTransactions
      );

      // Re-attach event listeners after table update
      setTimeout(() => {
        attachTransactionEventListeners();
        console.log(
          "CRITICAL: Event listeners re-attached after filter update"
        );
      }, 50);
    }

    console.log(
      `CRITICAL: Transaction display updated successfully for ${filteredTransactions.length} transactions`
    );
  } catch (error) {
    console.error(
      "CRITICAL ERROR: Failed to update transaction display:",
      error
    );
  }
}

/**
 * Initialize transaction manager and load existing data
 */
export function initializeTransactionManager() {
  console.log("CRITICAL: Initializing transaction manager...");

  // Render immediately without setTimeout to prevent blinking
  const transactions = AppState.transactions || [];
  if (transactions.length > 0) {
    console.log(
      `CRITICAL: Rendering ${transactions.length} existing transactions without chart updates`
    );
    renderTransactions(transactions, false); // FIXED: Never update charts from here
  } else {
    console.log("CRITICAL: No existing transactions to render");
    renderTransactions([], false);
  }
}

/**
 * Update transactions from file upload
 */
export function updateTransactionsFromUpload() {
  console.log("🔄 UPDATING TRANSACTIONS FROM UPLOAD");

  if (!AppState.transactions || AppState.transactions.length === 0) {
    console.log("ℹ️ No transactions to update from upload");
    return;
  }

  console.log(
    `📊 Processing ${AppState.transactions.length} transactions from upload`
  );

  // Ensure all transactions have proper IDs
  ensureTransactionIds(AppState.transactions);

  // Save to localStorage
  try {
    localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
    console.log(
      `💾 Saved ${AppState.transactions.length} transactions to localStorage after upload`
    );
  } catch (error) {
    console.error("❌ Error saving transactions after upload:", error);
  }

  // Re-render with the new transactions
  renderTransactions(AppState.transactions, false);

  // Update category dropdown options after upload to include categories from new transactions
  setTimeout(async () => {
    try {
      const { updateCategoryFilterOptions } = await import(
        "../filters/advancedFilters.js"
      );
      updateCategoryFilterOptions();
      console.log(
        "CRITICAL: Category filter options updated after file upload"
      );
    } catch (error) {
      console.log(
        "Info: Could not update category filter options after upload:",
        error.message
      );
    }
  }, 100);

  // Show success message
  import("./uiManager.js").then((module) => {
    if (module.showToast) {
      module.showToast(
        `Loaded ${AppState.transactions.length} transactions`,
        "success"
      );
    }
  });

  console.log(
    `✅ UPLOAD UPDATE COMPLETE: ${AppState.transactions.length} transactions processed`
  );
}

/**
 * Apply filters to transactions
 */
function applyFilters(transactions = AppState.transactions || []) {
  console.log(`🔍 APPLYING FILTERS to ${transactions.length} transactions`);

  if (!transactions || transactions.length === 0) {
    console.log("ℹ️ No transactions to filter");
    return [];
  }

  let filteredTransactions = [...transactions];

  try {
    filteredTransactions = applyDateFilter(filteredTransactions);
    filteredTransactions = applyCategoryFilter(filteredTransactions);
    filteredTransactions = applyCurrencyFilter(filteredTransactions);
    filteredTransactions = applyAmountFilter(filteredTransactions);
    filteredTransactions = applyDescriptionFilter(filteredTransactions);
  } catch (error) {
    console.error("❌ Error applying filters:", error);
    return transactions;
  }

  console.log(
    `✅ FILTER COMPLETE: ${filteredTransactions.length} of ${transactions.length} transactions match criteria`
  );
  return filteredTransactions;
}

/**
 * Apply date range filter
 */
function applyDateFilter(transactions) {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  if (!startDateInput?.value && !endDateInput?.value) {
    return transactions;
  }

  const startDate = startDateInput?.value
    ? new Date(startDateInput.value)
    : null;
  const endDate = endDateInput?.value ? new Date(endDateInput.value) : null;

  const filtered = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)
    );
  });

  console.log(
    `📅 Date filter applied: ${filtered.length} transactions remaining`
  );
  return filtered;
}

/**
 * Apply category filter
 */
function applyCategoryFilter(transactions) {
  const categoryFilter = document.getElementById("categoryFilter");

  if (!categoryFilter?.value || categoryFilter.value === "") {
    return transactions;
  }

  const filtered = transactions.filter(
    (tx) => tx.category === categoryFilter.value
  );
  console.log(
    `🏷️ Category filter applied: ${filtered.length} transactions remaining`
  );
  return filtered;
}

/**
 * Apply currency filter
 */
function applyCurrencyFilter(transactions) {
  const currencyFilter = document.getElementById("currencyFilter");

  if (!currencyFilter?.value || currencyFilter.value === "") {
    return transactions;
  }

  const filtered = transactions.filter(
    (tx) => tx.currency === currencyFilter.value
  );
  console.log(
    `💱 Currency filter applied: ${filtered.length} transactions remaining`
  );
  return filtered;
}

/**
 * Apply amount range filter
 */
function applyAmountFilter(transactions) {
  const amountMinInput = document.getElementById("amountMin");
  const amountMaxInput = document.getElementById("amountMax");

  if (!amountMinInput?.value && !amountMaxInput?.value) {
    return transactions;
  }

  const minAmount = amountMinInput?.value
    ? parseFloat(amountMinInput.value)
    : null;
  const maxAmount = amountMaxInput?.value
    ? parseFloat(amountMaxInput.value)
    : null;

  const filtered = transactions.filter((tx) => {
    const totalAmount =
      (parseFloat(tx.income) || 0) + (parseFloat(tx.expenses) || 0);
    return (
      (!minAmount || totalAmount >= minAmount) &&
      (!maxAmount || totalAmount <= maxAmount)
    );
  });

  console.log(
    `💰 Amount filter applied: ${filtered.length} transactions remaining`
  );
  return filtered;
}

/**
 * Apply description filter
 */
function applyDescriptionFilter(transactions) {
  const descriptionFilter = document.getElementById("descriptionFilter");

  if (!descriptionFilter?.value || descriptionFilter.value.trim() === "") {
    return transactions;
  }

  const searchTerm = descriptionFilter.value.toLowerCase().trim();
  const filtered = transactions.filter((tx) => {
    return tx.description?.toLowerCase().includes(searchTerm);
  });

  console.log(
    `📝 Description filter applied: ${filtered.length} transactions remaining`
  );
  return filtered;
}

/**
 * Ensure all transactions have unique IDs
 */
function ensureTransactionIds(transactions) {
  console.group("🆔 ENSURING TRANSACTION IDS");
  let idsAdded = 0;
  let existingIds = 0;

  transactions.forEach((tx, index) => {
    if (!tx.id) {
      tx.id = `tx_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}_${index}`;
      idsAdded++;
      // Only log when IDs are actually added, not for every transaction
    } else {
      existingIds++;
    }
  });

  // Only log summary if IDs were actually added
  if (idsAdded > 0) {
    console.log(
      `🆔 SUMMARY: ${idsAdded} new IDs added, ${existingIds} existing IDs preserved`
    );
  }
  console.groupEnd();

  return transactions;
}

/**
 * Helper function to get and update category counts
 */
function updateCategoryCounts(transactions) {
  const categoryCounts = {};

  transactions.forEach((tx) => {
    const category = tx.category || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return categoryCounts;
}
