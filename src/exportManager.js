import { AppState } from "./appState.js";
import { showToast } from "./uiManager.js";
import { HEADERS } from "./constants.js";

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

  const csvContent = allRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "expense_transactions.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Transactions exported successfully", "success");
}