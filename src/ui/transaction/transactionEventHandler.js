/**
 * TRANSACTION EVENT HANDLER MODULE
 *
 * Handles all event listeners and user interactions for transaction management.
 * Extracted from transactionManager.js for better separation of concerns.
 */

import {
  checkRowForChanges,
  saveFieldChangeById,
  saveTransactionChangesById,
  enterEditMode,
  revertTransactionChanges,
  revertAllChangesToOriginal,
  deleteTransactionById
} from './transactionEditor.js';
import { AppState } from '../../core/appState.js';

/**
 * Attach event listeners to transaction table fields
 */
export function attachTransactionEventListeners() {
  console.log('🔧 Attaching transaction event listeners');

  // Bulk edit toggle
  const bulkEditToggle = document.getElementById('bulkEditToggle');
  if (bulkEditToggle) {
    bulkEditToggle.addEventListener('click', toggleBulkEditMode);
  }

  // Select all checkbox
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
  }

  // Individual transaction checkboxes
  document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateBulkActionState);
  });

  // Bulk category select
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  if (bulkCategorySelect) {
    bulkCategorySelect.addEventListener('change', updateBulkApplyButton);
  }

  // Apply bulk category button
  const applyBulkCategory = document.getElementById('applyBulkCategory');
  if (applyBulkCategory) {
    applyBulkCategory.addEventListener('click', applyBulkCategoryChange);
  }

  // Quick category buttons
  document.querySelectorAll('.quick-category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.target.getAttribute('data-category');
      applyQuickCategory(category);
    });
  });

  // Use event delegation for transaction buttons and fields
  const transactionTableWrapper = document.getElementById('transactionTableWrapper');
  if (transactionTableWrapper) {
    transactionTableWrapper.addEventListener('click', handleTransactionTableClick);
    transactionTableWrapper.addEventListener('change', handleTransactionFieldChange);
    transactionTableWrapper.addEventListener('input', handleTransactionFieldInput);
    console.log('✓ Event delegation attached to transaction table wrapper');
  } else {
    console.warn('⚠️ Transaction table wrapper not found, events may not work');
  }

  console.log('✓ Transaction event listeners attached successfully');
}

/**
 * Toggle bulk edit mode
 */
export function toggleBulkEditMode() {
  const bulkActions = document.getElementById('bulkActions');
  const bulkToggle = document.getElementById('bulkEditToggle');
  const checkboxes = document.querySelectorAll('.transaction-checkbox, #selectAllCheckbox');

  if (bulkActions.style.display === 'none' || !bulkActions.style.display) {
    // Enable bulk edit mode
    bulkActions.style.display = 'flex';
    bulkToggle.textContent = '❌ Exit Bulk Edit';
    bulkToggle.classList.add('active');

    // Show checkboxes
    checkboxes.forEach(checkbox => {
      checkbox.style.display = 'inline-block';
    });

    console.log('📝 Bulk edit mode enabled');
  } else {
    // Disable bulk edit mode
    bulkActions.style.display = 'none';
    bulkToggle.textContent = '📝 Bulk Edit';
    bulkToggle.classList.remove('active');

    // Hide checkboxes and uncheck all
    checkboxes.forEach(checkbox => {
      checkbox.style.display = 'none';
      checkbox.checked = false;
    });

    // Reset bulk action state
    updateBulkActionState();

    console.log('❌ Bulk edit mode disabled');
  }
}

/**
 * Toggle select all checkbox
 */
export function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');
  const isChecked = selectAllCheckbox.checked;

  transactionCheckboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });

  updateBulkActionState();
  console.log(`${isChecked ? '✅' : '❌'} Select all toggled: ${isChecked}`);
}

/**
 * Update bulk action state based on selections
 */
export function updateBulkActionState() {
  const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
  const selectedCount = selectedCheckboxes.length;

  // Update selected count display
  const selectedCountSpan = document.querySelector('.selected-count');
  if (selectedCountSpan) {
    selectedCountSpan.textContent = `${selectedCount} selected`;
  }

  // Update select all checkbox state
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    if (selectedCount === 0) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    } else if (selectedCount === transactionCheckboxes.length) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.indeterminate = true;
    }
  }

  // Enable/disable bulk actions based on selection
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  const applyBulkCategoryBtn = document.getElementById('applyBulkCategory');

  if (selectedCount > 0) {
    if (bulkCategorySelect) bulkCategorySelect.disabled = false;
    updateBulkApplyButton();
  } else {
    if (bulkCategorySelect) {
      bulkCategorySelect.disabled = true;
      bulkCategorySelect.value = '';
    }
    if (applyBulkCategoryBtn) applyBulkCategoryBtn.disabled = true;
  }

  console.log(`📊 Bulk action state updated: ${selectedCount} transactions selected`);
}

/**
 * Update bulk apply button state
 */
export function updateBulkApplyButton() {
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  const applyBulkCategoryBtn = document.getElementById('applyBulkCategory');
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');

  const hasSelection = selectedCheckboxes.length > 0;
  const hasCategory = bulkCategorySelect?.value !== '';

  if (applyBulkCategoryBtn) {
    applyBulkCategoryBtn.disabled = !(hasSelection && hasCategory);
  }

  console.log(`🔄 Bulk apply button updated: ${hasSelection && hasCategory ? 'enabled' : 'disabled'}`);
}

/**
 * Apply bulk category change to selected transactions
 */
export function applyBulkCategoryChange() {
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');

  if (!selectedCheckboxes.length || !bulkCategorySelect || !bulkCategorySelect.value) {
    console.warn('⚠️ No transactions selected or no category chosen for bulk update');
    return;
  }

  const selectedCategory = bulkCategorySelect.value;
  console.log(`🔄 Applying category "${selectedCategory}" to ${selectedCheckboxes.length} transactions`);

  selectedCheckboxes.forEach(checkbox => {
    const transactionId = checkbox.dataset.transactionId;
    if (transactionId) {
      saveFieldChangeById(transactionId, 'category', selectedCategory);
    }
  });

  // Reset bulk selection
  bulkCategorySelect.value = '';
  selectedCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updateBulkActionState();

  // Show success message
  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Applied category "${selectedCategory}" to ${selectedCheckboxes.length} transactions`, 'success');
    }
  });

  console.log(`✅ Bulk category update completed for ${selectedCheckboxes.length} transactions`);
}

/**
 * Apply quick category to selected transactions
 */
export function applyQuickCategory(category) {
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');

  if (!selectedCheckboxes.length) {
    // Show warning message
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Please select transactions first', 'warning');
      }
    });
    console.warn('⚠️ No transactions selected for quick category application');
    return;
  }

  console.log(`⚡ Applying quick category "${category}" to ${selectedCheckboxes.length} transactions`);

  selectedCheckboxes.forEach(checkbox => {
    const transactionId = checkbox.dataset.transactionId;
    if (transactionId) {
      saveFieldChangeById(transactionId, 'category', category);
    }
  });

  // Reset bulk selection
  selectedCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updateBulkActionState();

  // Show success message
  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Applied category "${category}" to ${selectedCheckboxes.length} transactions`, 'success');
    }
  });

  console.log(`✅ Quick category update completed for ${selectedCheckboxes.length} transactions`);
}

/**
 * Legacy save function for backward compatibility
 */
function saveTransactionChanges(index) {
  console.warn('⚠️ Using legacy saveTransactionChanges function - should migrate to ID-based saving');

  if (!AppState.transactions || !AppState.transactions[index]) {
    console.error('❌ Transaction not found at index:', index);
    return;
  }

  const transaction = AppState.transactions[index];
  const transactionId = transaction.id;

  if (transactionId) {
    // Redirect to ID-based saving if transaction has ID
    saveTransactionChangesById(transactionId);
  } else {
    console.error('❌ Transaction has no ID, cannot save safely');
  }
}

/**
 * Handle click events on transaction table buttons
 */
function handleTransactionTableClick(e) {
  const target = e.target;
  const transactionId = target.dataset.transactionId;
  const index = parseInt(target.dataset.index);

  if (target.classList.contains('btn-edit')) {
    handleEditButtonClick(transactionId, index);
  } else if (target.classList.contains('btn-save')) {
    handleSaveButtonClick(transactionId);
  } else if (target.classList.contains('btn-revert')) {
    handleRevertButtonClick(index);
  } else if (target.classList.contains('btn-revert-all')) {
    handleRevertAllButtonClick(transactionId, index);
  } else if (target.classList.contains('btn-delete')) {
    handleDeleteButtonClick(transactionId);
  }
}

/**
 * Handle edit button click
 */
function handleEditButtonClick(transactionId, index) {
  console.log(`✏️ Edit button clicked for transaction ID: ${transactionId}, index: ${index}`);
  if (index !== undefined && !isNaN(index)) {
    enterEditMode(index);
  }
}

/**
 * Handle save button click
 */
function handleSaveButtonClick(transactionId) {
  console.log(`💾 Save button clicked for transaction ID: ${transactionId}`);
  if (transactionId) {
    saveTransactionChangesById(transactionId);
  } else {
    console.warn('⚠️ No transaction ID found for save button');
  }
}

/**
 * Handle revert button click
 */
function handleRevertButtonClick(index) {
  console.log(`↶ Revert button clicked for index: ${index}`);
  if (index !== undefined && !isNaN(index)) {
    revertTransactionChanges(index);
  }
}

/**
 * Handle revert all button click
 */
function handleRevertAllButtonClick(transactionId, index) {
  console.log(`🔄 Revert all button clicked for transaction ID: ${transactionId}, index: ${index}`);
  if (transactionId) {
    revertAllChangesToOriginal(transactionId, index);
  } else {
    console.warn('⚠️ No transaction ID found for revert all button');
  }
}

/**
 * Handle delete button click
 */
function handleDeleteButtonClick(transactionId) {
  console.log(`🗑️ Delete button clicked for transaction ID: ${transactionId}`);
  if (transactionId) {
    deleteTransactionById(transactionId);
  } else {
    console.warn('⚠️ No transaction ID found for delete button');
  }
}

/**
 * Handle change events on transaction form fields
 */
function handleTransactionFieldChange(e) {
  const target = e.target;
  if (target.classList.contains('edit-field')) {
    const transactionId = target.dataset.transactionId;
    const fieldName = target.dataset.field;
    const newValue = target.value;

    if (target.classList.contains('currency-field') || target.classList.contains('category-select')) {
      console.log(`🔄 Field change detected for transaction ID ${transactionId}, field ${fieldName}, new value: "${newValue}"`);
      if (transactionId && fieldName) {
        saveFieldChangeById(transactionId, fieldName, newValue);
      }
    }
  }
}

/**
 * Handle input events on transaction text fields
 */
function handleTransactionFieldInput(e) {
  const target = e.target;
  if (target.classList.contains('edit-field') &&
    !target.classList.contains('currency-field') &&
    !target.classList.contains('category-select')) {

    const row = target.closest('tr');
    if (row && row.dataset.editMode === 'true') {
      const saveBtn = row.querySelector('.btn-save');
      const revertBtn = row.querySelector('.btn-revert');

      const hasChanges = checkRowForChanges(row);

      if (hasChanges) {
        saveBtn.style.display = 'inline-block';
        revertBtn.style.display = 'inline-block';
        row.classList.add('has-changes');
      } else {
        saveBtn.style.display = 'none';
        revertBtn.style.display = 'none';
        row.classList.remove('has-changes');
      }
    }
  }
}
