/**
 * TRANSACTION EDITOR MODULE
 *
 * Handles transaction editing functionality including edit mode, field validation,
 * and save/revert operations. Extracted from transactionManager.js for better
 * separation of concerns.
 */

import { AppState } from '../../core/appState.js';
import { convertDDMMYYYYToISO } from '../../utils/dateUtils.js';

/**
 * Check if a row has any changes
 */
export function checkRowForChanges(row) {
  const fields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');
  for (let field of fields) {
    if (field.value !== field.dataset.original) {
      return true;
    }
  }
  return false;
}

/**
 * Save individual field change using transaction ID
 */
export function saveFieldChangeById(transactionId, fieldName, newValue) {
  console.group(`💾 SAVING FIELD CHANGE BY ID`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log(`📝 Field: ${fieldName}`);
  console.log(`🔄 New Value: "${newValue}"`);

  if (!AppState.transactions || !Array.isArray(AppState.transactions)) {
    console.error('❌ No transactions array in AppState');
    console.groupEnd();
    return;
  }

  const transactionIndex = findTransactionById(transactionId);
  if (transactionIndex === -1) {
    console.groupEnd();
    return;
  }

  const transaction = AppState.transactions[transactionIndex];
  logTransactionInfo(transaction, transactionIndex);

  prepareTransactionForEdit(transaction, fieldName);
  updateTransactionField(transaction, fieldName, newValue);

  try {
    saveTransactionToStorage(transactionId, fieldName, transaction);
    updateUIAfterFieldChange(transactionId, fieldName, newValue, transaction);
    handleSpecialFieldUpdates(transactionId, fieldName, newValue);
  } catch (error) {
    handleSaveError(error);
  }

  console.groupEnd();
}

/**
 * Helper function to find transaction by ID
 */
function findTransactionById(transactionId) {
  const transactionIndex = AppState.transactions.findIndex(tx => tx.id === transactionId);

  if (transactionIndex === -1) {
    console.error(`❌ Transaction with ID ${transactionId} not found in AppState.transactions`);
    console.log(`📋 Available transaction IDs:`, AppState.transactions.map((tx, idx) => ({ index: idx, id: tx.id, desc: tx.description?.substring(0, 30) })));
  }

  return transactionIndex;
}

/**
 * Helper function to log transaction info
 */
function logTransactionInfo(transaction, transactionIndex) {
  console.log(`✓ Found transaction at index ${transactionIndex}:`);
  console.log(`  📝 Description: "${transaction.description?.substring(0, 50)}..."`);
  console.log(`  🏷️ Current category: "${transaction.category}"`);
  console.log(`  📂 Current subcategory: "${transaction.subcategory}"`);
}

/**
 * Helper function to prepare transaction for editing
 */
function prepareTransactionForEdit(transaction, fieldName) {
  const isDataField = ['date', 'description', 'income', 'expenses'].includes(fieldName);

  if (isDataField && !transaction.originalData) {
    transaction.originalData = {
      date: transaction.date,
      description: transaction.description,
      income: transaction.income,
      expenses: transaction.expenses
    };
  }

  if (!transaction.editedFields) {
    transaction.editedFields = {};
  }
}

/**
 * Helper function to update transaction field
 */
function updateTransactionField(transaction, fieldName, newValue) {
  if (fieldName === 'category') {
    updateCategoryField(transaction, newValue);
  } else {
    const oldValue = transaction[fieldName];
    transaction[fieldName] = newValue;
    console.log(`🔄 Updated field ${fieldName} from "${oldValue}" to "${newValue}"`);
    transaction.editedFields[fieldName] = true;
  }

  const isDataField = ['date', 'description', 'income', 'expenses'].includes(fieldName);
  if (isDataField && !transaction.edited) {
    transaction.edited = true;
    console.log(`✏️ Marked transaction as edited`);
  }
}

/**
 * Helper function to update category field with subcategory handling
 */
function updateCategoryField(transaction, newValue) {
  const oldCategory = transaction.category;
  const oldSubcategory = transaction.subcategory;

  if (transaction.originalCategory === undefined) {
    transaction.originalCategory = oldCategory;
  }
  if (transaction.originalSubcategory === undefined) {
    transaction.originalSubcategory = oldSubcategory;
  }

  if (newValue.includes(':')) {
    const [mainCategory, subCategory] = newValue.split(':');
    transaction.category = mainCategory.trim();
    transaction.subcategory = subCategory.trim();
    console.log(`🔄 Updated category from "${oldCategory}:${oldSubcategory}" to "${mainCategory}:${subCategory}"`);
  } else {
    transaction.category = newValue;
    transaction.subcategory = '';
    console.log(`🔄 Updated category from "${oldCategory}" to "${newValue}", cleared subcategory`);
  }

  transaction.editedFields.category = true;
}

/**
 * Helper function to save transaction to localStorage
 */
function saveTransactionToStorage(transactionId, fieldName, transaction) {
  localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
  console.log(`💾 Saved transaction ${transactionId} field ${fieldName} to localStorage`);

  // Verify the save worked
  const savedData = localStorage.getItem('transactions');
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    const savedTransaction = parsedData.find(t => t.id === transactionId);
    if (savedTransaction) {
      console.log(`✅ Verified: ${fieldName} = "${savedTransaction[fieldName]}" in localStorage`);
    }
  }
}

/**
 * Helper function to update UI after field change
 */
function updateUIAfterFieldChange(transactionId, fieldName, newValue, transaction) {
  if (fieldName === 'category') {
    updateCategoryDisplay(transactionId, newValue);
  }

  const isDataField = ['date', 'description', 'income', 'expenses'].includes(fieldName);
  if (isDataField) {
    markCellAsEdited(transactionId, fieldName);
    showRevertButton(transactionId);
  }
}

/**
 * Helper function to update category display
 */
function updateCategoryDisplay(transactionId, categoryName) {
  const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
  if (row) {
    const categoryCell = row.querySelector('.category-cell');
    if (categoryCell && categoryName) {
      const categoryColor = getCategoryColor(categoryName);
      categoryCell.style.cssText = `background-color: ${categoryColor}20; border-left: 3px solid ${categoryColor};`;
    }
  }
  console.log('🔄 Category updated successfully');
}

/**
 * Helper function to mark cell as edited
 */
function markCellAsEdited(transactionId, fieldName) {
  const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
  if (!row) return;

  let cellClass;
  if (fieldName === 'income' || fieldName === 'expenses') {
    cellClass = '.amount-cell';
  } else if (fieldName === 'description') {
    cellClass = '.description-cell';
  } else if (fieldName === 'date') {
    cellClass = '.date-cell';
  } else {
    cellClass = `.${fieldName}-cell`;
  }

  let cell;
  if (fieldName === 'income') {
    cell = row.querySelectorAll('.amount-cell')[0];
  } else if (fieldName === 'expenses') {
    cell = row.querySelectorAll('.amount-cell')[1];
  } else {
    cell = row.querySelector(cellClass);
  }

  if (cell) {
    cell.classList.add('edited-cell');
    console.log(`✏️ Marked ${fieldName} cell as edited`);
  }
}

/**
 * Helper function to show revert button
 */
function showRevertButton(transactionId) {
  const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
  if (row) {
    const revertAllBtn = row.querySelector('.btn-revert-all');
    if (revertAllBtn) {
      revertAllBtn.style.display = 'inline-block';
    }
  }
}

/**
 * Helper function to handle special field updates
 */
function handleSpecialFieldUpdates(transactionId, fieldName, newValue) {
  if (fieldName === 'currency') {
    handleCurrencyUpdate(transactionId, newValue);
  }

  // Update charts for any data field changes
  const isDataField = ['date', 'description', 'income', 'expenses', 'category', 'currency'].includes(fieldName);
  if (isDataField) {
    setTimeout(async () => {
      try {
        const chartsModule = await import('../charts.js');
        if (chartsModule && chartsModule.updateCharts) {
          chartsModule.updateCharts();
          console.log("📊 Charts updated after field change");
        }
      } catch (error) {
        console.log('Charts not available for update:', error.message);
      }
    }, 200);
  }
}

/**
 * Helper function to handle currency updates
 */
function handleCurrencyUpdate(transactionId, newValue) {
  console.log(`💱 Currency changed for transaction ${transactionId} to ${newValue}`);

  // Update transaction summary to reflect new currency distribution
  setTimeout(async () => {
    try {
      const { updateTransactionSummary } = await import('./transactionSummary.js');
      const { applyFilters } = await import('../transactionManager.js');
      const filteredTransactions = applyFilters(AppState.transactions);
      updateTransactionSummary(filteredTransactions);
      console.log("🔄 Transaction summary updated after currency change");
    } catch (error) {
      console.log('Error updating transaction summary:', error.message);
    }
  }, 100);

  // Update currency filter dropdown options to include new currency
  setTimeout(async () => {
    try {
      const { updateCurrencyFilterOptions } = await import('../filters/advancedFilters.js');
      updateCurrencyFilterOptions();
      console.log("💱 Currency filter options updated after currency change");
    } catch (error) {
      console.log('Error updating currency filter options:', error.message);
    }
  }, 150);
}

/**
 * Helper function to handle save errors
 */
function handleSaveError(error) {
  console.error('❌ Error saving transaction:', error);
  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast('Error saving transaction', 'error');
    }
  });
}

/**
 * Get category color helper function
 */
function getCategoryColor(categoryName) {
  if (!categoryName || !AppState.categories) return '#cccccc';

  const categoryData = AppState.categories[categoryName];
  if (!categoryData) return '#cccccc';

  if (typeof categoryData === 'string') {
    return categoryData;
  } else if (typeof categoryData === 'object' && categoryData.color) {
    return categoryData.color;
  }

  return '#cccccc';
}

/**
 * Save changes to a transaction using transaction ID (safer than index)
 */
export function saveTransactionChangesById(transactionId) {
  console.log(`💾 SAVING BY ID: Transaction ${transactionId}`);

  if (!AppState.transactions || !Array.isArray(AppState.transactions)) {
    console.error('❌ No transactions array in AppState');
    return;
  }

  // Find transaction by ID instead of relying on index
  const transactionIndex = AppState.transactions.findIndex(tx => tx.id === transactionId);
  if (transactionIndex === -1) {
    console.error(`❌ Transaction with ID ${transactionId} not found`);
    return;
  }

  const transaction = AppState.transactions[transactionIndex];
  const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
  if (!row) {
    console.error(`❌ Row not found for transaction ID ${transactionId}`);
    return;
  }

  const fields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');

  // Store original data before first edit
  prepareTransactionForBatchEdit(transaction);

  const { hasChanges, dateChanged } = processFieldChanges(fields, transaction);

  if (!hasChanges) {
    console.log(`ℹ️ No changes detected for transaction ${transactionId}`);
    return;
  }

  // Mark as edited and save
  transaction.edited = true;
  saveBatchChanges(transactionId, transaction, row, dateChanged);
}

/**
 * Helper function to prepare transaction for batch editing
 */
function prepareTransactionForBatchEdit(transaction) {
  if (!transaction.originalData) {
    transaction.originalData = {
      date: transaction.date,
      description: transaction.description,
      income: transaction.income,
      expenses: transaction.expenses
    };
  }

  if (!transaction.editedFields) {
    transaction.editedFields = {};
  }
}

/**
 * Helper function to process field changes
 */
function processFieldChanges(fields, transaction) {
  let dateChanged = false;
  let hasChanges = false;

  fields.forEach(field => {
    const fieldName = field.dataset.field;
    let newValue = field.value;
    const originalValue = field.dataset.original;

    // Skip if value hasn't changed
    if (newValue === originalValue) return;

    hasChanges = true;

    // Handle date conversion for storage
    if (fieldName === 'date' && newValue) {
      const result = processDateField(field, newValue);
      if (result.success) {
        newValue = result.isoDate;
        dateChanged = true;
      } else {
        return; // Skip invalid dates
      }
    }

    // Update the transaction
    updateFieldInTransaction(transaction, fieldName, newValue, field);
  });

  return { hasChanges, dateChanged };
}

/**
 * Helper function to process date field conversion
 */
function processDateField(field, newValue) {
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = newValue.match(datePattern);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    console.log(`🔍 Date input parsed: Day=${day}, Month=${month}, Year=${year} from "${newValue}"`);

    const isoDate = convertDDMMYYYYToISO(newValue);
    if (isoDate) {
      console.log(`🔄 Date converted: ${field.value} (dd/mm/yyyy) → ${isoDate} (ISO)`);
      return { success: true, isoDate };
    } else {
      console.warn('Invalid date format:', newValue);
      return { success: false };
    }
  } else {
    console.warn('Date does not match dd/mm/yyyy format:', newValue);
    return { success: false };
  }
}

/**
 * Helper function to update field in transaction
 */
function updateFieldInTransaction(transaction, fieldName, newValue, field) {
  transaction[fieldName] = newValue;
  transaction.editedFields[fieldName] = true;

  // Update the original value
  if (fieldName === 'date') {
    field.dataset.original = field.value; // Keep dd/mm/yyyy format
  } else {
    field.dataset.original = newValue;
  }

  // Update display value
  updateFieldDisplayValue(field, fieldName, newValue, transaction);

  // Mark the cell as edited
  const cell = field.closest('td');
  if (cell) {
    cell.classList.add('edited-cell');
    console.log(`✏️ Marked ${fieldName} cell as edited`);
  }
}

/**
 * Helper function to update field display value
 */
function updateFieldDisplayValue(field, fieldName, newValue, transaction) {
  const cell = field.closest('td');
  const displayValue = cell.querySelector('.display-value');
  if (!displayValue) return;

  if (fieldName === 'income' || fieldName === 'expenses') {
    const numValue = parseFloat(newValue) || 0;
    displayValue.textContent = numValue > 0 ? numValue.toFixed(2) : '';
  } else if (fieldName === 'description') {
    const cleanValue = String(newValue).replace(/\s*data-field=.*$/i, '').trim();
    displayValue.textContent = cleanValue;
    transaction[fieldName] = cleanValue;
  } else {
    displayValue.textContent = field.value;
  }
}

/**
 * Helper function to save batch changes
 */
function saveBatchChanges(transactionId, transaction, row, dateChanged) {
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    console.log(`✅ TRANSACTION SAVED BY ID: ${transactionId} saved to localStorage`);
    console.log(`📝 SAVE VERIFICATION: Transaction marked as edited = ${transaction.edited}`);

    // Immediate verification
    verifyBatchSave(transactionId);

    // Exit edit mode using transaction ID for reliable lookup
    exitEditModeById(transactionId);

    // Update UI
    updateUIAfterBatchSave(row);

    // Update transaction summary with current filtered data
    setTimeout(async () => {
      try {
        const { updateTransactionSummary } = await import('./transactionSummary.js');
        const { applyFilters } = await import('../transactionManager.js');
        const filteredTransactions = applyFilters(AppState.transactions);
        updateTransactionSummary(filteredTransactions);
        console.log("🔄 Transaction summary updated after batch save");
      } catch (error) {
        console.log('Error updating transaction summary:', error.message);
      }
    }, 100);

    // Update charts after batch save
    setTimeout(async () => {
      try {
        const chartsModule = await import('../charts.js');
        if (chartsModule && chartsModule.updateCharts) {
          chartsModule.updateCharts();
          console.log("📊 Charts updated after batch save");
        }
      } catch (error) {
        console.log('Charts not available for update:', error.message);
      }
    }, 200);

    // Show success feedback
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction updated', 'success');
      }
    });

  } catch (error) {
    console.error('Error saving transaction by ID:', error);
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving changes', 'error');
      }
    });
  }
}

/**
 * Helper function to verify batch save
 */
function verifyBatchSave(transactionId) {
  const verification = localStorage.getItem('transactions');
  if (verification) {
    const parsed = JSON.parse(verification);
    const savedTx = parsed.find(tx => tx.id === transactionId);
    console.log(`🔍 VERIFICATION: Saved transaction has edited flag = ${savedTx ? savedTx.edited : 'NOT FOUND'}`);
  }
}

/**
 * Helper function to update UI after batch save
 */
function updateUIAfterBatchSave(row) {
  // Mark row as edited
  row.classList.add('edited-row');

  // Show revert-all button when edits are made
  const revertAllBtn = row.querySelector('.btn-revert-all');
  if (revertAllBtn) {
    revertAllBtn.style.display = 'inline-block';
  }
}

/**
 * Enter edit mode for a specific row
 */
export function enterEditMode(index) {
  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  // Set edit mode
  row.dataset.editMode = 'true';
  row.classList.add('editing-mode');

  // Hide display values and show input fields (except currency and category)
  const displayValues = row.querySelectorAll('.display-value');
  const editFields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');

  displayValues.forEach(span => span.style.display = 'none');
  editFields.forEach(input => input.style.display = 'block');

  // Hide edit button, show save/revert buttons
  const editBtn = row.querySelector('.btn-edit');
  const saveBtn = row.querySelector('.btn-save');
  const revertBtn = row.querySelector('.btn-revert');

  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  revertBtn.style.display = 'inline-block';
}

/**
 * Exit edit mode for a specific row
 */
export function exitEditMode(index) {
  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  // Unset edit mode
  row.dataset.editMode = 'false';
  row.classList.remove('editing-mode', 'has-changes');

  // Show display values and hide input fields (except currency and category)
  const displayValues = row.querySelectorAll('.display-value');
  const editFields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');

  displayValues.forEach(span => span.style.display = 'block');
  editFields.forEach(input => input.style.display = 'none');

  // Show edit button, hide save/revert buttons
  const editBtn = row.querySelector('.btn-edit');
  const saveBtn = row.querySelector('.btn-save');
  const revertBtn = row.querySelector('.btn-revert');

  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  revertBtn.style.display = 'none';
}

/**
 * Exit edit mode for a specific row using transaction ID (more reliable)
 */
export function exitEditModeById(transactionId) {
  const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
  if (!row) {
    console.warn(`⚠️ Row not found for transaction ID ${transactionId} in exitEditModeById`);
    return;
  }

  console.log(`🔄 EXITING EDIT MODE: Transaction ID ${transactionId}`);

  // Unset edit mode
  row.dataset.editMode = 'false';
  row.classList.remove('editing-mode', 'has-changes');

  // Show display values and hide input fields (except currency and category)
  const displayValues = row.querySelectorAll('.display-value');
  const editFields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');

  displayValues.forEach(span => span.style.display = 'block');
  editFields.forEach(input => input.style.display = 'none');

  // Show edit button, hide save/revert buttons
  const editBtn = row.querySelector('.btn-edit');
  const saveBtn = row.querySelector('.btn-save');
  const revertBtn = row.querySelector('.btn-revert'); // This is the "Cancel changes" button

  if (editBtn) editBtn.style.display = 'inline-block';
  if (saveBtn) saveBtn.style.display = 'none';
  if (revertBtn) {
    revertBtn.style.display = 'none';
    console.log(`✅ HIDDEN: Cancel changes button (↶) for transaction ${transactionId}`);
  }
}

/**
 * Revert changes to a transaction
 */
export function revertTransactionChanges(index) {
  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  const fields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');

  fields.forEach(field => {
    field.value = field.dataset.original;
  });

  // Exit edit mode
  exitEditMode(index);
}

/**
 * Revert all changes to original values from file upload using transaction ID
 */
export function revertAllChangesToOriginal(transactionId, index) {
  console.log(`🔄 REVERTING BY ID: Transaction ${transactionId}`);

  if (!AppState.transactions || !Array.isArray(AppState.transactions)) {
    console.error('❌ No transactions array in AppState');
    return;
  }

  // Find transaction by ID instead of relying on index
  const transactionIndex = AppState.transactions.findIndex(tx => tx.id === transactionId);
  if (transactionIndex === -1) {
    console.error(`❌ Transaction with ID ${transactionId} not found`);
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction not found', 'error');
      }
    });
    return;
  }

  const transaction = AppState.transactions[transactionIndex];

  // Check if we have original data to revert to
  const hasOriginalData = transaction.originalData && Object.keys(transaction.originalData).length > 0;
  const hasEditedFields = transaction.editedFields && Object.keys(transaction.editedFields).length > 0;

  console.log(`🔍 REVERT CHECK: Original data exists = ${hasOriginalData}, Edited fields exist = ${hasEditedFields}`);

  if (hasOriginalData) {
    console.log(`📋 ORIGINAL DATA:`, transaction.originalData);
  }

  if (hasEditedFields) {
    console.log(`📝 EDITED FIELDS:`, transaction.editedFields);
  }

  if (!hasOriginalData && !hasEditedFields) {
    console.log('ℹ️ No original data or edited fields found');
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('No changes to revert', 'info');
      }
    });
    return;
  }

  // Confirm with user
  if (!confirm('Revert all changes to the original values from the file upload?')) {
    return;
  }

  // Revert to original data if available
  if (hasOriginalData) {
    const original = transaction.originalData;
    console.log(`🔄 REVERTING TO ORIGINAL:`, original);
    transaction.date = original.date;
    transaction.description = original.description;
    transaction.income = original.income;
    transaction.expenses = original.expenses;
  }

  // Clear edit tracking
  delete transaction.originalData;
  delete transaction.editedFields;
  delete transaction.edited;

  console.log(`✅ REVERT COMPLETE: Transaction ${transactionId} reverted to original state`);

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    console.log(`💾 REVERT SAVED: Transaction ${transactionId} saved to localStorage`);

    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction reverted successfully', 'success');
      }
    });
  } catch (error) {
    console.error('Error reverting transaction:', error);
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error reverting transaction', 'error');
      }
    });
  }
}
