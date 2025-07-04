import { AppState } from '../core/appState.js';
import { formatDateToDDMMYYYY, convertDDMMYYYYToISO, parseDDMMYYYY } from '../utils/dateUtils.js';
import { CURRENCIES } from '../constants/currencies.js';
import { createAdvancedFilterSection, initializeAdvancedFilters } from './filters/advancedFilters.js';

/**
 * Helper function to get and update category counts
 */
function updateCategoryCounts(transactions) {
  const categoryCounts = {};

  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return categoryCounts;
}

/**
 * FIXED: Main render function - removed chart updates to prevent double loading
 */
export function renderTransactions(transactions = [], updateCharts = false) {
  console.log(`CRITICAL: renderTransactions called with ${transactions.length} transactions`);

  // Always use AppState.transactions if no transactions passed
  const actualTransactions = transactions.length > 0 ? transactions : (AppState.transactions || []);
  console.log(`CRITICAL: Using ${actualTransactions.length} transactions for rendering`);

  // Ensure main container exists first AND remove any duplicates
  let container = ensureTransactionContainer();
  if (!container) {
    console.error('CRITICAL: Could not create transaction container');
    return;
  }

  // Apply filters to get display transactions
  const filteredTransactions = applyFilters(actualTransactions);
  console.log(`CRITICAL: Filtered to ${filteredTransactions.length} transactions for display`);

  // Update summary
  updateTransactionSummary(filteredTransactions);

  // Render filters section
  renderFiltersSection(container, actualTransactions);

  // Render transaction table with proper structure
  renderTransactionTable(container, filteredTransactions);

  // FIXED: NEVER update charts from here - charts are updated once in main.js
  console.log(`CRITICAL: Transaction rendering complete - displayed ${filteredTransactions.length} transactions (no chart update)`);
}

/**
 * FIXED: Ensure transaction container exists with proper structure AND remove duplicates
 */
function ensureTransactionContainer() {
  // CRITICAL FIX: Remove ALL existing transaction sections first
  const existingSections = document.querySelectorAll('.transactions-section, #transactionsSection, [id*="transaction"]');
  existingSections.forEach(section => {
    console.log('CRITICAL: Removing duplicate transaction section:', section.className, section.id);
    section.remove();
  });

  const mainContent = document.querySelector('.main-content');
  if (!mainContent) {
    console.error('CRITICAL: Main content not found');
    return null;
  }

  // Create ONE clean transaction section - REMOVED old category buttons container
  const section = document.createElement('div');
  section.className = 'section transactions-section';
  section.id = 'transactionsSection'; // Give it a unique ID to prevent duplicates
  section.innerHTML = `
    <div class="section-header">
      <h2>💰 Transactions</h2>
      <div class="transaction-summary" id="transactionSummary">
        <!-- Summary will be updated dynamically -->
      </div>
    </div>
    <div class="section-content">
      <div id="transactionFilters" class="transaction-filters"></div>
      <div id="transactionTableWrapper" class="transaction-table-wrapper">
        <!-- Table will be rendered here -->
      </div>
    </div>
  `;

  mainContent.appendChild(section);
  console.log('CRITICAL: Created single clean transaction section');

  return section;
}

/**
 * FIXED: Render filters section using advanced filters
 */
function renderFiltersSection(container, transactions) {
  const filtersContainer = container.querySelector('#transactionFilters');
  if (!filtersContainer) return;

  // Use the new advanced filter section
  filtersContainer.innerHTML = createAdvancedFilterSection();

  // Initialize advanced filters
  initializeAdvancedFilters();

  console.log('CRITICAL: Advanced filters section rendered');
}

/**
 * FIXED: Render transaction table with guaranteed structure and proper date sorting
 */
function renderTransactionTable(container, transactions) {
  const tableWrapper = container.querySelector('#transactionTableWrapper');
  if (!tableWrapper) {
    console.error('CRITICAL: Table wrapper not found');
    return;
  }

  console.log(`CRITICAL: Rendering table for ${transactions.length} transactions`);

  if (transactions.length === 0) {
    tableWrapper.innerHTML = `
      <div class="no-transactions">
        <div class="empty-state-content">
          <h3>📄 No Transactions Available</h3>
          <p>Import transaction files using the "Upload File" button in the sidebar to see your data here.</p>
          <p>Supported formats: CSV, Excel (.xlsx, .xls), XML</p>
        </div>
      </div>
    `;
    console.log('CRITICAL: Rendered empty state');
    return;
  }

  // FIXED: Sort transactions by date (oldest to newest) - ensure proper date parsing
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || '1900-01-01');
    const dateB = new Date(b.date || '1900-01-01');
    return dateA - dateB;
  });

  // FIXED: Generate proper table HTML with sorted transactions
  const tableHTML = generateTransactionTableHTML(sortedTransactions);
  tableWrapper.innerHTML = tableHTML;

  // FIXED: Attach event listeners after DOM update
  setTimeout(() => {
    attachTransactionEventListeners();
    console.log('CRITICAL: Event listeners attached');
  }, 50);

  console.log(`CRITICAL: Transaction table rendered with ${sortedTransactions.length} rows (sorted by date)`);
}

/**
 * FIXED: Get category color helper function
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
 * CRITICAL FIX: Ensure all transactions have unique IDs and log the process
 */
function ensureTransactionIds(transactions) {
  console.group('🆔 ENSURING TRANSACTION IDS');
  let idsAdded = 0;
  let existingIds = 0;

  transactions.forEach((tx, index) => {
    if (!tx.id) {
      tx.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      idsAdded++;
      console.log(`🆔 ASSIGNED ID: ${tx.id} to transaction at index ${index}, description: "${tx.description?.substring(0, 30)}..."`);
    } else {
      existingIds++;
      console.log(`✓ EXISTING ID: ${tx.id} for transaction at index ${index}, description: "${tx.description?.substring(0, 30)}..."`);
    }
  });

  console.log(`🆔 SUMMARY: ${idsAdded} IDs added, ${existingIds} existing IDs found`);
  console.groupEnd();

  return transactions;
}

/**
 * Check if a row has any changes
 */
function checkRowForChanges(row) {
  const fields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');
  for (let field of fields) {
    if (field.value !== field.dataset.original) {
      return true;
    }
  }
  return false;
}

/**
 * CRITICAL FIX: Save individual field change using transaction ID instead of index
 */
function saveFieldChangeById(transactionId, fieldName, newValue) {
  console.group(`💾 SAVING FIELD CHANGE BY ID`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log(`📝 Field: ${fieldName}`);
  console.log(`🔄 New Value: "${newValue}"`);

  if (!AppState.transactions || !Array.isArray(AppState.transactions)) {
    console.error('❌ No transactions array in AppState');
    console.groupEnd();
    return;
  }

  // Find transaction by ID instead of using index
  const transactionIndex = AppState.transactions.findIndex(tx => tx.id === transactionId);

  if (transactionIndex === -1) {
    console.error(`❌ Transaction with ID ${transactionId} not found in AppState.transactions`);
    console.log(`📋 Available transaction IDs:`, AppState.transactions.map((tx, idx) => ({ index: idx, id: tx.id, desc: tx.description?.substring(0, 30) })));
    console.groupEnd();
    return;
  }

  const transaction = AppState.transactions[transactionIndex];
  console.log(`✓ Found transaction at index ${transactionIndex}:`);
  console.log(`  📝 Description: "${transaction.description?.substring(0, 50)}..."`);
  console.log(`  🏷️ Current category: "${transaction.category}"`);
  console.log(`  📂 Current subcategory: "${transaction.subcategory}"`);

  // FIXED: Store original data before first edit - only for data fields
  const isDataField = ['date', 'description', 'income', 'expenses'].includes(fieldName);

  if (isDataField && !transaction.originalData) {
    transaction.originalData = {
      date: transaction.date,
      description: transaction.description,
      income: transaction.income,
      expenses: transaction.expenses
    };
  }

  // Track which fields have been edited
  if (!transaction.editedFields) {
    transaction.editedFields = {};
  }

  // Handle category with subcategory parsing
  if (fieldName === 'category') {
    const oldCategory = transaction.category;
    const oldSubcategory = transaction.subcategory;

    // Store original category/subcategory only if not already stored
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

    // Mark category field as edited but don't mark as "edited" for revert button
    transaction.editedFields.category = true;
  } else {
    const oldValue = transaction[fieldName];
    transaction[fieldName] = newValue;
    console.log(`🔄 Updated field ${fieldName} from "${oldValue}" to "${newValue}"`);

    // Mark this specific field as edited
    transaction.editedFields[fieldName] = true;
  }

  // Mark as edited if it wasn't already - only for data fields
  if (isDataField && !transaction.edited) {
    transaction.edited = true;
    console.log(`✏️ Marked transaction ${transactionId} as edited`);
  }

  // Save to localStorage immediately and verify
  try {
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

    // Update display for category changes (update cell background color)
    if (fieldName === 'category') {
      const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
      if (row) {
        const categoryCell = row.querySelector('.category-cell');
        if (categoryCell && newValue) {
          const categoryColor = getCategoryColor(newValue);
          categoryCell.style.cssText = `background-color: ${categoryColor}20; border-left: 3px solid ${categoryColor};`;
        }
      }
      console.log('🔄 Category updated successfully');
    }

    // FIXED: Only mark cells and show revert button for data fields, not category/currency
    if (isDataField) {
      // Mark the edited cell and update UI immediately only for data fields
      const row = document.querySelector(`tr[data-transaction-id="${transactionId}"]`);
      if (row) {
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
          console.log(`✏️ Marked ${fieldName} cell as edited for transaction ${transactionId}`);
        }

        // Show revert-all button only when data edits are made
        const revertAllBtn = row.querySelector('.btn-revert-all');
        if (revertAllBtn) {
          revertAllBtn.style.display = 'inline-block';
        }
      }
    }

    // Update charts when data changes
    if (isDataField || fieldName === 'category') {
      setTimeout(async () => {
        try {
          const chartsModule = await import('./charts.js');
          if (chartsModule && chartsModule.updateCharts) {
            chartsModule.updateCharts();
            console.log("Charts updated after data change");
          }
        } catch (error) {
          console.log('Charts not available for update:', error.message);
        }
      }, 100);
    }

  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving transaction', 'error');
      }
    });
  }

  console.groupEnd();
}

/**
 * Save changes to a transaction
 */
function saveTransactionChanges(index) {
  if (!AppState.transactions || !AppState.transactions[index]) return;

  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  const fields = row.querySelectorAll('.edit-field:not(.currency-field):not(.category-select)');
  const transaction = AppState.transactions[index];

  // FIXED: Store original data before first edit - only for data fields
  if (!transaction.originalData) {
    transaction.originalData = {
      date: transaction.date,
      description: transaction.description,
      income: transaction.income,
      expenses: transaction.expenses
    };
  }

  // FIXED: Track which fields have been edited
  if (!transaction.editedFields) {
    transaction.editedFields = {};
  }

  let dateChanged = false;

  fields.forEach(field => {
    const fieldName = field.dataset.field;
    let newValue = field.value;
    const originalValue = field.dataset.original;

    // Skip if value hasn't changed
    if (newValue === originalValue) return;

    // FIXED: Convert date from dd/mm/yyyy to ISO format for storage - handle format correctly
    if (fieldName === 'date' && newValue) {
      // FIXED: Validate dd/mm/yyyy format before conversion
      const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = newValue.match(datePattern);

      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        console.log(`🔍 Date input parsed: Day=${day}, Month=${month}, Year=${year} from "${newValue}"`);

        // FIXED: Ensure proper dd/mm/yyyy to ISO conversion
        const isoDate = convertDDMMYYYYToISO(newValue);
        if (isoDate) {
          newValue = isoDate;
          dateChanged = true;
          console.log(`🔄 Date converted: ${field.value} (dd/mm/yyyy) → ${isoDate} (ISO)`);
          dateChanged = true;
          console.log(`🔄 Date converted: ${field.value} (dd/mm/yyyy) → ${isoDate} (ISO)`);
        } else {
          console.warn('Invalid date format:', newValue);
          return; // Skip invalid dates
        }
      } else {
        console.warn('Date does not match dd/mm/yyyy format:', newValue);
        return;
      }
    }

    // Update the transaction
    transaction[fieldName] = newValue;

    // FIXED: Mark this field as edited
    transaction.editedFields[fieldName] = true;

    // Update the original value (keep display format for dates)
    if (fieldName === 'date') {
      field.dataset.original = field.value; // Keep dd/mm/yyyy format
    } else {
      field.dataset.original = newValue;
    }

    // FIXED: Update display value in real-time with proper text content setting
    const cell = field.closest('td');
    const displayValue = cell.querySelector('.display-value');
    if (displayValue) {
      if (fieldName === 'income' || fieldName === 'expenses') {
        const numValue = parseFloat(newValue) || 0;
        displayValue.textContent = numValue > 0 ? numValue.toFixed(2) : '';
      } else if (fieldName === 'description') {
        // FIXED: Clean the description value and remove any data-field artifacts
        const cleanValue = String(newValue).replace(/\s*data-field=.*$/i, '').trim();
        displayValue.textContent = cleanValue;
        // Update the transaction with clean value
        transaction[fieldName] = cleanValue;
      } else {
        // FIXED: For other text fields, properly update display text
        displayValue.textContent = field.value;
      }
    }

    // FIXED: Mark the cell as edited
    if (cell) {
      cell.classList.add('edited-cell');
      console.log(`✏️ Marked ${fieldName} cell as edited for transaction at index ${index}`);
    }
  });

  // Mark as edited
  transaction.edited = true;

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    // Exit edit mode
    exitEditMode(index);

    // Mark row as edited
    row.classList.add('edited-row');

    // FIXED: Show revert-all button when edits are made
    const revertAllBtn = row.querySelector('.btn-revert-all');
    if (revertAllBtn) {
      revertAllBtn.style.display = 'inline-block';
    }

    // FIXED: Update summary in real-time
    const filteredTransactions = applyFilters(AppState.transactions);
    updateTransactionSummary(filteredTransactions);

    // FIXED: Re-sort and re-render table if date was changed
    if (dateChanged) {
      console.log('🔄 Date changed in batch edit, re-sorting table...');
      setTimeout(() => {
        // FIXED: Preserve all existing transaction state when re-rendering
        const currentTransactions = AppState.transactions || [];
        renderTransactions(currentTransactions, false);
      }, 100);
    }

    // FIXED: Update charts when data changes
    setTimeout(async () => {
      try {
        const chartsModule = await import('./charts.js');
        if (chartsModule && chartsModule.updateCharts) {
          chartsModule.updateCharts();
          console.log("Charts updated after transaction save");
        }
      } catch (error) {
        console.log('Charts not available for update:', error.message);
      }
    }, 100);

    // Show success feedback
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction updated', 'success');
      }
    });

  } catch (error) {
    console.error('Error saving transaction:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving changes', 'error');
      }
    });
  }
}

/**
 * Revert changes to a transaction
 */
function revertTransactionChanges(index) {
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
 * FIXED: Generate proper transaction table HTML with edit mode and counter
 */
function generateTransactionTableHTML(transactions) {
  console.log(`🔧 Generating table HTML for ${transactions.length} transactions`);

  // Ensure all transactions have IDs before rendering
  ensureTransactionIds(transactions);

  let html = `
    <div class="transaction-table-header">
      <div class="table-header-left">
        <h4>📋 Transaction Data (${transactions.length} transactions)</h4>
        <div class="table-info">
          <span>Use the Edit button to modify transactions • Changes are saved automatically</span>
        </div>
      </div>
      <div class="table-header-right">
        <button id="bulkEditToggle" class="btn secondary-btn">📝 Bulk Edit</button>
      </div>
    </div>

    <div id="bulkActions" class="bulk-actions" style="display: none;">
      <div class="bulk-selection">
        <input type="checkbox" id="selectAllCheckbox" class="bulk-checkbox" style="display: none;">
        <label for="selectAllCheckbox" style="display: none;">Select All</label>
        <span class="selected-count">0 selected</span>
      </div>

      <div class="bulk-category-assignment">
        <select id="bulkCategorySelect" class="bulk-action-btn">
          <option value="">Choose Category</option>
          ${Object.keys(AppState.categories || {}).sort().map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('')}
        </select>
        <button id="applyBulkCategory" class="bulk-action-btn primary-btn" disabled>Apply Category</button>
      </div>

      <div class="quick-categories">
        ${Object.entries(AppState.categories || {}).slice(0, 6).map(([cat, catData]) => {
    const color = typeof catData === 'string' ? catData : catData.color || '#cccccc';
    return `<button class="quick-category-btn" data-category="${cat}" style="background-color: ${color};">${cat}</button>`;
  }).join('')}
      </div>
    </div>

    <div class="table-container">
      <table class="transaction-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" id="selectAllCheckbox" class="bulk-checkbox" style="display: none;">
              #
            </th>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Currency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  transactions.forEach((tx, index) => {
    // Ensure each transaction has a unique ID
    if (!tx.id) {
      tx.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
      console.log(`🆔 GENERATED ID: ${tx.id} for transaction at index ${index}`);
    }

    // Log transaction details for debugging
    console.log(`🔧 Rendering transaction ID ${tx.id} at index ${index}, category: "${tx.category}", description: "${tx.description?.substring(0, 50)}..."`);

    // Format date to dd/mm/yyyy for display - ensure proper format
    const date = tx.date ? formatDateToDDMMYYYY(tx.date) : '';
    // Ensure description is clean and handle null/undefined with RTL detection
    const description = (tx.description || '').toString().replace(/\s*data-field=.*$/i, '').trim();
    const isRTL = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(description);
    const category = tx.category || '';
    const subcategory = tx.subcategory || '';
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;
    const currency = tx.currency || 'USD';
    const isEdited = tx.edited || false;

    // Get category color for cell background - preserve category styling
    const categoryColor = getCategoryColor(category);
    const categoryStyle = category ? `background-color: ${categoryColor}20; border-left: 3px solid ${categoryColor};` : '';

    // Generate currency dropdown with proper symbols
    const currencyOptions = Object.entries(CURRENCIES).sort(([a], [b]) => a.localeCompare(b)).map(([currencyCode, currencyData]) => {
      const isSelected = currency === currencyCode ? 'selected' : '';
      const symbol = currencyData.symbol || currencyCode;
      return `<option value="${currencyCode}" ${isSelected}>${symbol} ${currencyCode}</option>`;
    }).join('');

    // Check which fields have been edited for styling - preserve edited state
    const editedFields = tx.editedFields || {};
    const dateEditedClass = editedFields.date ? 'edited-cell' : '';
    const descEditedClass = editedFields.description ? 'edited-cell' : '';
    const categoryEditedClass = editedFields.category ? 'edited-cell' : '';
    const incomeEditedClass = editedFields.income ? 'edited-cell' : '';
    const expensesEditedClass = editedFields.expenses ? 'edited-cell' : '';

    // FIXED: Check if transaction has data field edits to show revert button - only for data fields
    const hasDataEdits = tx.originalData && Object.keys(tx.originalData).length > 0;

    html += `
      <tr data-transaction-id="${tx.id}" data-transaction-index="${index}" class="transaction-row ${isEdited ? 'edited-row' : ''}" data-edit-mode="false">
        <td class="counter-cell">
          <input type="checkbox" class="transaction-checkbox" data-transaction-id="${tx.id}" style="display: none;">
          ${index + 1}
        </td>
        <td class="date-cell ${dateEditedClass}">
          <span class="display-value">${date}</span>
          <input type="text"
                 class="edit-field date-field"
                 value="${date}"
                 data-field="date"
                 data-transaction-id="${tx.id}"
                 data-index="${index}"
                 data-original="${date}"
                 placeholder="dd/mm/yyyy"
                 style="display: none;">
        </td>
        <td class="description-cell ${descEditedClass}" ${isRTL ? 'dir="rtl"' : ''}>
          <span class="display-value" ${isRTL ? 'style="direction: rtl; text-align: right;"' : ''}>${description}</span>
          <input type="text"
                 class="edit-field description-field"
                 value="${description.replace(/"/g, '&quot;')}"
                 data-field="description"
                 data-transaction-id="${tx.id}"
                 data-index="${index}"
                 data-original="${description.replace(/"/g, '&quot;')}"
                 placeholder="Enter description"
                 ${isRTL ? 'dir="rtl"' : ''}
                 style="display: none; ${isRTL ? 'direction: rtl; text-align: right;' : ''}">
        </td>
        <td class="category-cell ${categoryEditedClass}" style="${categoryStyle}">
          ${generateCategoryDropdown(category, subcategory, tx.id)}
        </td>
        <td class="amount-cell ${incomeEditedClass}">
          <span class="display-value">${income > 0 ? income.toFixed(2) : ''}</span>
          <input type="number"
                 class="edit-field amount-field income-field"
                 value="${income > 0 ? income.toFixed(2) : ''}"
                 data-field="income"
                 data-transaction-id="${tx.id}"
                 data-index="${index}"
                 data-original="${income > 0 ? income.toFixed(2) : ''}"
                 placeholder="0.00"
                 step="0.01"
                 min="0"
                 style="display: none;">
        </td>
        <td class="amount-cell ${expensesEditedClass}">
          <span class="display-value">${expenses > 0 ? expenses.toFixed(2) : ''}</span>
          <input type="number"
                 class="edit-field amount-field expense-field"
                 value="${expenses > 0 ? expenses.toFixed(2) : ''}"
                 data-field="expenses"
                 data-transaction-id="${tx.id}"
                 data-index="${index}"
                 data-original="${expenses > 0 ? expenses.toFixed(2) : ''}"
                 placeholder="0.00"
                 step="0.01"
                 min="0"
                 style="display: none;">
        </td>
        <td class="currency-cell">
          <select class="edit-field currency-field"
                  data-field="currency"
                  data-transaction-id="${tx.id}"
                  data-index="${index}"
                  data-original="${currency}">
            ${currencyOptions}
          </select>
        </td>
        <td class="action-cell">
          <button class="btn-edit action-btn" data-transaction-id="${tx.id}" data-index="${index}" title="Edit transaction">✏️</button>
          <button class="btn-save action-btn" data-transaction-id="${tx.id}" data-index="${index}" style="display: none;" title="Save changes">💾</button>
          <button class="btn-revert action-btn" data-transaction-id="${tx.id}" data-index="${index}" style="display: none;" title="Cancel changes">↶</button>
          <button class="btn-revert-all action-btn" data-transaction-id="${tx.id}" data-index="${index}" ${hasDataEdits ? '' : 'style="display: none;"'} title="Revert all changes to original">🔄</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  console.log('✓ Generated table HTML successfully');
  return html;
}

/**
 * FIXED: Attach event listeners to transaction table fields
 */
function attachTransactionEventListeners() {
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

  // Handle edit buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const transactionId = e.target.dataset.transactionId;
      const index = parseInt(e.target.dataset.index);
      console.log(`✏️ Edit button clicked for transaction ID: ${transactionId}, index: ${index}`);
      enterEditMode(index);
    });
  });

  // Handle field changes (only for currency and category which are always editable)
  document.querySelectorAll('.edit-field').forEach(field => {
    if (field.classList.contains('currency-field') || field.classList.contains('category-select')) {
      field.addEventListener('change', (e) => {
        const transactionId = e.target.dataset.transactionId;
        const fieldName = e.target.dataset.field;
        const newValue = e.target.value;

        console.log(`🔄 Field change detected for transaction ID ${transactionId}, field ${fieldName}, new value: "${newValue}"`);

        // CRITICAL FIX: Use transaction ID to find the correct transaction
        saveFieldChangeById(transactionId, fieldName, newValue);
      });
    } else {
      // For other fields, only listen when in edit mode
      field.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        if (row.dataset.editMode === 'true') {
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
      });
    }
  });

  // Handle save buttons
  document.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const transactionId = e.target.dataset.transactionId;
      const index = parseInt(e.target.dataset.index);
      console.log(`💾 Save button clicked for transaction ID: ${transactionId}, index: ${index}`);
      saveTransactionChanges(index);
    });
  });

  // Handle revert buttons
  document.querySelectorAll('.btn-revert').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const transactionId = e.target.dataset.transactionId;
      const index = parseInt(e.target.dataset.index);
      console.log(`↶ Revert button clicked for transaction ID: ${transactionId}, index: ${index}`);
      revertTransactionChanges(index);
    });
  });

  // FIXED: Handle revert all buttons
  document.querySelectorAll('.btn-revert-all').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const transactionId = e.target.dataset.transactionId;
      const index = parseInt(e.target.dataset.index);
      console.log(`🔄 Revert all button clicked for transaction ID: ${transactionId}, index: ${index}`);
      revertAllChangesToOriginal(transactionId, index);
    });
  });

  console.log('✓ Transaction event listeners attached successfully');
}

/**
 * FIXED: Enter edit mode for a specific row
 */
function enterEditMode(index) {
  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  // Set edit mode
  row.dataset.editMode = 'true';
  row.classList.add('editing-mode');

  // FIXED: Hide display values and show input fields (except currency and category)
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
 * FIXED: Exit edit mode for a specific row
 */
function exitEditMode(index) {
  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  // Unset edit mode
  row.dataset.editMode = 'false';
  row.classList.remove('editing-mode', 'has-changes');

  // FIXED: Show display values and hide input fields (except currency and category)
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
 * CRITICAL FIX: Save individual field change (for category and currency) - UPDATED TO USE INDEX FOR BACKWARD COMPATIBILITY
 */
function saveFieldChange(index, fieldName, newValue) {
  if (!AppState.transactions || !AppState.transactions[index]) return;

  const transaction = AppState.transactions[index];

  // Get the transaction ID for logging
  const transactionId = transaction.id || `Unknown-${index}`;

  console.group(`💾 SAVING FIELD CHANGE (Legacy Index Method)`);
  console.log(`🆔 Transaction ID: ${transactionId}`);
  console.log(`📝 Index: ${index}`);
  console.log(`📝 Field: ${fieldName}`);
  console.log(`🔄 New Value: "${newValue}"`);

  // FIXED: Handle category with subcategory parsing
  if (fieldName === 'category') {
    const oldCategory = transaction.category;
    const oldSubcategory = transaction.subcategory;

    if (newValue.includes(':')) {
      const [category, subcategory] = newValue.split(':');
      transaction.category = category;
      transaction.subcategory = subcategory;
      console.log(`🔄 Updated category from "${oldCategory}:${oldSubcategory}" to "${category}:${subcategory}"`);
    } else {
      transaction.category = newValue;
      transaction.subcategory = '';
      console.log(`🔄 Updated category from "${oldCategory}" to "${newValue}", cleared subcategory`);
    }
  } else {
    const oldValue = transaction[fieldName];
    transaction[fieldName] = newValue;
    console.log(`🔄 Updated field ${fieldName} from "${oldValue}" to "${newValue}"`);
  }

  // Mark as edited if it wasn't already
  if (!transaction.edited) {
    transaction.edited = true;
    console.log(`✏️ Marked transaction ${transactionId} as edited`);
  }

  // CRITICAL FIX: Save to localStorage immediately and verify
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    console.log(`💾 Saved transaction ${transactionId} field ${fieldName} to localStorage`);

    // Verify the save worked
    const savedData = localStorage.getItem('transactions');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log(`✓ Verified save - transaction ${index} category:`, parsedData[index]?.category, parsedData[index]?.subcategory);
    }

    // Update display for category changes (update cell background color)
    if (fieldName === 'category') {
      const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
      const categoryCell = row.querySelector('.category-cell');
      const categoryColor = getCategoryColor(transaction.category);
      const categoryStyle = transaction.category ? `background-color: ${categoryColor}20; border-left: 3px solid ${categoryColor};` : '';
      categoryCell.style.cssText = categoryStyle;

      // Mark row as edited
      row.classList.add('edited-row');

      // CRITICAL FIX: Force update category buttons to refresh counts immediately
      setTimeout(() => {
        renderCategoryButtons();
        console.log('🔄 Category buttons re-rendered after category change');
      }, 50);
    }

    // FIXED: Update summary in real-time for currency changes
    if (fieldName === 'currency') {
      const filteredTransactions = applyFilters(AppState.transactions);
      updateTransactionSummary(filteredTransactions);
    }

    // Show success feedback
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast(`${fieldName} updated`, 'success');
      }
    });

  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving changes', 'error');
      }
    });
  }

  console.groupEnd();
}

/**
 * FIXED: Revert all changes to original values from file upload
 */
function revertAllChangesToOriginal(transactionId, index) {
  if (!AppState.transactions || !AppState.transactions[index]) return;

  const transaction = AppState.transactions[index];

  // Check if we have original data to revert to
  const hasOriginalData = transaction.originalData && Object.keys(transaction.originalData).length > 0;
  const hasEditedFields = transaction.editedFields && Object.keys(transaction.editedFields).length > 0;

  if (!hasOriginalData && !hasEditedFields) {
    import('./uiManager.js').then(module => {
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
    transaction.date = original.date;
    transaction.description = original.description;
    transaction.income = original.income;
    transaction.expenses = original.expenses;
  }

  // Clear edit tracking
  delete transaction.originalData;
  delete transaction.editedFields;
  delete transaction.edited;

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    // Update UI immediately
    const filteredTransactions = applyFilters(AppState.transactions);
    updateTransactionSummary(filteredTransactions);

    // Re-render the table to show reverted values
    renderTransactions(AppState.transactions, false);

    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction reverted to original values', 'success');
      }
    });
  } catch (error) {
    console.error('Error reverting transaction:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error reverting changes', 'error');
      }
    });
  }

  // FIXED: Update charts after reverting changes
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
 * FIXED: Add missing updateTransactionSummary function with multi-currency support
 */
function updateTransactionSummary(transactions) {
  const summaryContainer = document.getElementById('transactionSummary');
  if (!summaryContainer) return;

  // Group transactions by currency
  const currencyGroups = {};
  transactions.forEach(tx => {
    const currency = tx.currency || 'USD';
    if (!currencyGroups[currency]) {
      currencyGroups[currency] = {
        income: 0,
        expenses: 0,
        count: 0
      };
    }
    currencyGroups[currency].income += parseFloat(tx.income) || 0;
    currencyGroups[currency].expenses += parseFloat(tx.expenses) || 0;
    currencyGroups[currency].count += 1;
  });

  const currencies = Object.keys(currencyGroups);

  if (currencies.length === 1) {
    // Single currency - show traditional summary
    const currency = currencies[0];
    const data = currencyGroups[currency];
    const netBalance = data.income - data.expenses;
    const currencyIcon = CURRENCIES[currency]?.icon || '💱';

    summaryContainer.innerHTML = `
      <div class="summary-cards-row" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 1rem !important; justify-content: flex-start !important;">
        <div class="summary-card income" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(40, 167, 69, 0.1) !important; color: #28a745 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">💰</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Income</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #28a745 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${data.income.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card expenses" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(220, 53, 69, 0.1) !important; color: #dc3545 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">💸</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Expenses</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #dc3545 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${data.expenses.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card net ${netBalance >= 0 ? 'positive' : 'negative'}" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: ${netBalance >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'} !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">${netBalance >= 0 ? '📈' : '📉'}</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Net Balance</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${currencyIcon} ${netBalance.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card count" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 auto !important; min-width: 200px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(0, 123, 255, 0.1) !important; color: #007bff !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">📊</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important; min-width: 0 !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Transactions</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #007bff !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important; max-width: 100% !important;">${data.count}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    // Multiple currencies - show by currency
    let cardsHTML = '';
    currencies.forEach(currency => {
      const data = currencyGroups[currency];
      const netBalance = data.income - data.expenses;
      const currencyIcon = CURRENCIES[currency]?.icon || '💱';

      cardsHTML += `
        <div class="summary-card currency-summary" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important; flex: 1 1 auto !important; min-width: 220px !important; max-width: none !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
          <div class="currency-header" style="display: flex !important; align-items: center !important; gap: 0.5rem !important; font-weight: 600 !important; color: #495057 !important; white-space: nowrap !important;">
            <span style="font-size: 1.2rem !important;">${currencyIcon}</span>
            <span>${currency}</span>
          </div>
          <div class="currency-stats" style="display: flex !important; justify-content: space-between !important; gap: 0.5rem !important; flex-wrap: wrap !important;">
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Income</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: #28a745 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${data.income.toFixed(2)}</div>
            </div>
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Expenses</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: #dc3545 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${data.expenses.toFixed(2)}</div>
            </div>
            <div style="text-align: center !important; flex: 1 1 auto !important; min-width: 60px !important; word-wrap: break-word !important; overflow-wrap: break-word !important;">
              <div style="font-size: 0.75rem !important; color: #6c757d !important; text-transform: uppercase !important; white-space: nowrap !important;">Net</div>
              <div style="font-size: 1rem !important; font-weight: 600 !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.2 !important;">${netBalance.toFixed(2)}</div>
            </div>
          </div>
          <div style="text-align: center !important; font-size: 0.85rem !important; color: #6c757d !important;">${data.count} transactions</div>
        </div>
      `;
    });

    summaryContainer.innerHTML = `
      <div class="summary-cards-row" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 1rem !important; justify-content: flex-start !important;">
        ${cardsHTML}
      </div>
    `;
  }

  console.log('CRITICAL: Transaction summary updated with multi-currency support');
}

/**
 * FIXED: Applies current filters to the transaction list with dd/mm/yyyy date handling and subcategory support
 * @param {Array} transactions - The transactions to filter
 * @returns {Array} Filtered transactions
 */
function applyFilters(transactions = AppState.transactions || []) {
  console.log(`CRITICAL: Applying filters to ${transactions.length} transactions`);

  let filtered = [...transactions];

  // FIXED: Only apply UI filters if the elements exist, otherwise return all transactions
  const categoryFilter = document.getElementById('filterCategory');
  const currencyFilter = document.getElementById('filterCurrency');
  const dateFromFilter = document.getElementById('filterDateFrom');
  const dateToFilter = document.getElementById('filterDateTo');

  // Category filter - check both filter dropdown and category button filter
  const currentCategoryFilter = AppState.currentCategoryFilter || '';
  const activeFilter = currentCategoryFilter || (categoryFilter ? categoryFilter.value : '');

  if (activeFilter) {
    filtered = filtered.filter(tx => {
      const txCategory = tx.category || 'Uncategorized';
      const txSubcategory = tx.subcategory || '';

      // If filtering by main category, include all its subcategories
      if (txCategory === activeFilter) {
        return true;
      }

      // If transaction has subcategory, check if it matches the filter
      return txSubcategory && `${txCategory}:${txSubcategory}` === activeFilter;
    });
  }

  // Currency filter
  if (currencyFilter && currencyFilter.value) {
    filtered = filtered.filter(tx => (tx.currency || 'USD') === currencyFilter.value);
  }

  // Date filters - FIXED: Handle dd/mm/yyyy input format using dateUtils
  if (dateFromFilter && dateFromFilter.value) {
    const fromDate = parseDDMMYYYY(dateFromFilter.value);
    if (fromDate) {
      filtered = filtered.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        return !isNaN(txDate.getTime()) && txDate >= fromDate;
      });
    }
  }

  if (dateToFilter && dateToFilter.value) {
    const toDate = parseDDMMYYYY(dateToFilter.value);
    if (toDate) {
      // Set to end of day for inclusive filtering
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        return !isNaN(txDate.getTime()) && txDate <= toDate;
      });
    }
  }

  console.log(`CRITICAL: Applied filters: ${filtered.length} transactions after filtering from ${transactions.length}`);
  return filtered;
}

/**
 * FIXED: Initializes the filter controls with currency symbols
 */
function initializeFilters() {
  // Category filter - FIXED: Use AppState.categories with proper ordering
  const categoryFilter = document.getElementById('filterCategory');
  if (categoryFilter) {
    updateCategoryFilterDropdown(categoryFilter);

    categoryFilter.addEventListener('change', () => {
      AppState.currentCategoryFilter = categoryFilter.value;
      renderTransactions(AppState.transactions || [], false);
    });
  }

  // Currency filter - FIXED: Use CURRENCIES with proper symbols (fix symbol issue)
  const currencyFilter = document.getElementById('filterCurrency');
  if (currencyFilter) {
    // Clear existing options first
    currencyFilter.innerHTML = '<option value="">All Currencies</option>';

    // FIXED: Import and use CURRENCIES with proper symbols handling
    import('../constants/currencies.js').then(module => {
      const currencies = module.CURRENCIES || {};
      Object.entries(currencies).sort(([a], [b]) => a.localeCompare(b)).forEach(([currencyCode, currencyData]) => {
        const option = document.createElement('option');
        option.value = currencyCode;
        const symbol = currencyData?.symbol || '💱';
        const name = currencyData?.name || currencyCode;
        option.textContent = `${symbol} ${currencyCode} - ${name}`;
        currencyFilter.appendChild(option);
      });
    }).catch(error => {
      console.warn('Could not load currencies:', error);
    });
  }

  // Date filters - FIXED: Use dd/mm/yyyy format consistently
  const dateFromFilter = document.getElementById('filterDateFrom');
  const dateToFilter = document.getElementById('filterDateTo');

  if (dateFromFilter) {
    // Set placeholder to dd/mm/yyyy
    dateFromFilter.placeholder = 'dd/mm/yyyy';

    dateFromFilter.addEventListener('change', () => {
      renderTransactions(AppState.transactions || [], false);
    });
  }

  if (dateToFilter) {
    // Set placeholder to dd/mm/yyyy
    dateToFilter.placeholder = 'dd/mm/yyyy';

    dateToFilter.addEventListener('change', () => {
      renderTransactions(AppState.transactions || [], false);
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (categoryFilter) categoryFilter.value = '';
      if (currencyFilter) currencyFilter.value = '';
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';

      // Clear category button filter too
      AppState.currentCategoryFilter = '';

      renderTransactions(AppState.transactions || [], false);
    });
  }
}

/**
 * FIXED: Update category filter dropdown with current categories
 */
function updateCategoryFilterDropdown(categoryFilter) {
  if (!categoryFilter) return;

  // Save current selection
  const currentValue = categoryFilter.value;

  // Clear existing options
  categoryFilter.innerHTML = '<option value="">All Categories</option>';

  // Get categories from AppState with proper ordering
  const categories = AppState.categories || {};

  // Sort categories by order property, then alphabetically - FIXED: Same fix here
  const sortedCategories = Object.entries(categories)
    .sort(([nameA, a], [nameB, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // If same order, sort alphabetically - FIXED: Use nameA and nameB
      return nameA.localeCompare(nameB);
    });

  // Add category options with colors
  sortedCategories.forEach(([categoryName, categoryData]) => {
    // Get proper color from category data
    let color = '#cccccc';
    if (typeof categoryData === 'string') {
      color = categoryData;
    } else if (categoryData && categoryData.color) {
      color = categoryData.color;
    }

    const option = document.createElement('option');
    option.value = categoryName;
    option.textContent = `● ${categoryName}`;
    option.setAttribute('data-color', color);
    option.style.color = color;
    option.style.fontWeight = '500';
    categoryFilter.appendChild(option);
  });

  // Restore selection if it still exists
  if (currentValue && categoryFilter.querySelector(`option[value="${currentValue}"]`)) {
    categoryFilter.value = currentValue;
  }
}

/**
 * Creates the filter section HTML - FIXED: Use proper date input type
 */
function createFilterSection() {
  return `
    <div class="filter-row">
      <div class="filter-group">
        <label for="filterCategory">Category:</label>
        <select id="filterCategory" class="filter-select">
          <option value="">All Categories</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="filterCurrency">Currency:</label>
        <select id="filterCurrency" class="filter-select">
          <option value="">All Currencies</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="filterDateFrom">From:</label>
        <input type="text" id="filterDateFrom" class="filter-input" placeholder="dd/mm/yyyy">
      </div>
      <div class="filter-group">
        <label for="filterDateTo">To:</label>
        <input type="text" id="filterDateTo" class="filter-input" placeholder="dd/mm/yyyy">
      </div>
      <div class="filter-group">
        <button id="clearFiltersBtn" class="button secondary-btn">Clear Filters</button>
      </div>
    </div>
  `;
}

/**
 * FIXED: Generate category dropdown with subcategories - Use proper ordering and colors, save changes automatically
 */
function generateCategoryDropdown(selectedCategory, selectedSubcategory, transactionId) {
  const categories = AppState.categories || {};
  let html = `
    <select class="edit-field category-select"
            data-field="category"
            data-transaction-id="${transactionId}"
            data-original="${selectedCategory || ''}">
      <option value="">Select Category</option>
  `;

  // Get sorted categories by order - FIXED: Use same sorting logic as filter
  const sortedCategories = Object.entries(categories)
    .sort(([nameA, a], [nameB, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // If same order, sort alphabetically - FIXED: Use nameA and nameB instead of a[0] and b[0]
      return nameA.localeCompare(nameB);
    });

  sortedCategories.forEach(([categoryName, categoryData]) => {
    const isSelected = selectedCategory === categoryName;

    // FIXED: Get proper color for option styling
    let color = '#cccccc';
    if (typeof categoryData === 'string') {
      color = categoryData;
    } else if (categoryData && categoryData.color) {
      color = categoryData.color;
    }

    html += `<option value="${categoryName}" ${isSelected ? 'selected' : ''} data-color="${color}" style="color: ${color}; font-weight: 500;">● ${categoryName}</option>`;

    // FIXED: Add subcategories if they exist
    if (typeof categoryData === 'object' && categoryData.subcategories) {
      Object.entries(categoryData.subcategories).forEach(([subName, subColor]) => {
        const fullSubcategoryValue = `${categoryName}:${subName}`;
        const isSubSelected = selectedCategory === categoryName && selectedSubcategory === subName;
        html += `<option value="${fullSubcategoryValue}" ${isSubSelected ? 'selected' : ''} data-color="${subColor}" style="color: ${subColor}; padding-left: 20px;">  ➤ ${subName}</option>`;
      });
    }
  });

  html += '</select>';
  return html;
}

/**
 * FIXED: Update transaction display (called by filter module)
 */
export function updateTransactionDisplay(filteredTransactions) {
  console.log(`Updating transaction display with ${filteredTransactions.length} filtered transactions`);

  const container = document.querySelector('.transactions-section');
  if (!container) return;

  // Update summary with filtered transactions
  updateTransactionSummary(filteredTransactions);

  // Render transaction table with filtered data
  renderTransactionTable(container, filteredTransactions);

  // REMOVED: Category buttons update - no longer needed
}


/**
 * Save transaction edits
 */
async function saveTransactionEdit(index, newData) {
  try {
    // ...existing save logic...

    // FIXED: Update charts after saving transaction edits
    try {
      const chartsModule = await import('./charts.js');
      if (chartsModule && chartsModule.updateCharts) {
        chartsModule.updateCharts();
        console.log("Charts updated after transaction edit");
      }
    } catch (error) {
      console.log('Could not update charts after edit:', error.message);
    }

  } catch (error) {
    console.error('Error saving transaction edit:', error);
  }
}

// FIXED: Cache DOM elements to avoid repeated queries
const transactionCache = {
  container: null,
  filterElements: new Map(),
  eventListeners: new Map()
};

function getTransactionContainer() {
  // FIXED: Cache the main container
  if (!transactionCache.container) {
    transactionCache.container = document.getElementById('transactionsList') ||
      document.querySelector('.transactions-container') ||
      document.querySelector('#transactionsContainer');
  }
  return transactionCache.container;
}

function getCachedElement(id) {
  // FIXED: Cache frequently accessed filter elements
  if (!transactionCache.filterElements.has(id)) {
    transactionCache.filterElements.set(id, document.getElementById(id));
  }
  return transactionCache.filterElements.get(id);
}

// Removed duplicate renderTransactions function - using the main one defined earlier

// FIXED: Centralized event listener management - merged with existing function
function attachTransactionEventListenersV2() {
  const container = getTransactionContainer();
  if (!container) return;

  // FIXED: Use event delegation for better performance
  const handleTransactionClick = (e) => {
    const transactionElement = e.target.closest('.transaction-item');
    if (!transactionElement) return;

    const transactionId = transactionElement.dataset.transactionId;
    if (e.target.matches('.edit-btn')) {
      handleEditTransaction(transactionId);
    } else if (e.target.matches('.delete-btn')) {
      handleDeleteTransaction(transactionId);
    } else if (e.target.matches('.category-btn')) {
      handleCategoryChange(transactionId, e.target);
    }
  };

  container.addEventListener('click', handleTransactionClick);

  // FIXED: Track listeners for cleanup
  if (!transactionCache.eventListeners.has('main')) {
    transactionCache.eventListeners.set('main', []);
  }
  transactionCache.eventListeners.get('main').push({
    element: container,
    event: 'click',
    handler: handleTransactionClick
  });
}

// FIXED: Clean up event listeners to prevent memory leaks
function clearTransactionEventListeners() {
  transactionCache.eventListeners.forEach((listeners, key) => {
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
  });
  transactionCache.eventListeners.clear();
}

// FIXED: Cleanup function for component unmounting
export function cleanupTransactionManager() {
  clearTransactionEventListeners();
  transactionCache.container = null;
  transactionCache.filterElements.clear();
}

// FIXED: Initialize transaction manager and load existing data
export function initializeTransactionManager() {
  console.log("CRITICAL: Initializing transaction manager...");

  // FIXED: Force immediate render with current AppState data without chart updates
  setTimeout(() => {
    const transactions = AppState.transactions || [];
    if (transactions.length > 0) {
      console.log(`CRITICAL: Rendering ${transactions.length} existing transactions without chart updates`);
      renderTransactions(transactions, false); // FIXED: Never update charts from here
    } else {
      console.log("CRITICAL: No existing transactions to render");
      renderTransactions([], false);
    }
  }, 100);
}

/**
 * FIXED: Update transactions from merged files
 */
export function updateTransactions() {
  console.group("🔄 UPDATING TRANSACTIONS FROM MERGED FILES");
  console.log("Processing merged files...");

  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    console.log("No merged files to process");
    console.groupEnd();
    return;
  }

  // Combine all transaction data from merged files
  let allTransactions = [];

  AppState.mergedFiles.forEach(file => {
    if (file.transactions && Array.isArray(file.transactions)) {
      allTransactions = allTransactions.concat(file.transactions);
    }
  });

  console.log(`📊 Processed ${allTransactions.length} transactions from ${AppState.mergedFiles.length} files`);

  // Update AppState
  AppState.transactions = allTransactions;

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(allTransactions));
    console.log('✅ Transactions saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving transactions:', error);
  }

  // FORCE render with the actual transactions
  console.log(`🔧 Forcing render of ${allTransactions.length} transactions`);
  renderTransactions(allTransactions, true);

  // CRITICAL FIX: Update charts immediately after transactions are updated with longer delay
  if (allTransactions.length > 0) {
    setTimeout(async () => {
      try {
        const chartsModule = await import('./charts.js');
        if (chartsModule && chartsModule.updateCharts) {
          chartsModule.updateCharts();
          console.log("📊 Charts updated after transaction update from upload");
        }
      } catch (error) {
        console.log('Could not update charts:', error.message);
      }
    }, 500); // Increased delay to ensure DOM is fully ready
  }

  console.groupEnd();
}

/**
 * FIXED: Toggle bulk edit mode
 */
function toggleBulkEditMode() {
  const bulkActions = document.getElementById('bulkActions');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');

  if (bulkActions.style.display === 'none' || !bulkActions.style.display) {
    // Show bulk edit mode
    bulkActions.style.display = 'flex';
    selectAllCheckbox.style.display = 'inline-block';
    transactionCheckboxes.forEach(cb => cb.style.display = 'inline-block');
    document.getElementById('bulkEditToggle').textContent = '❌ Exit Bulk Edit';
  } else {
    // Hide bulk edit mode
    bulkActions.style.display = 'none';
    selectAllCheckbox.style.display = 'none';
    transactionCheckboxes.forEach(cb => {
      cb.style.display = 'none';
      cb.checked = false;
    });
    document.getElementById('bulkEditToggle').textContent = '📝 Bulk Edit';
    updateBulkActionState();
  }
}

/**
 * FIXED: Toggle select all checkboxes
 */
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const transactionCheckboxes = document.querySelectorAll('.transaction-checkbox');

  transactionCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });

  updateBulkActionState();
}

/**
 * FIXED: Update bulk action state based on selected checkboxes
 */
function updateBulkActionState() {
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
  const selectedCount = selectedCheckboxes.length;

  const selectedCountSpan = document.querySelector('.selected-count');
  const applyBulkCategory = document.getElementById('applyBulkCategory');

  if (selectedCountSpan) {
    selectedCountSpan.textContent = `${selectedCount} selected`;
  }

  if (applyBulkCategory) {
    applyBulkCategory.disabled = selectedCount === 0;
  }
}

/**
 * FIXED: Update bulk apply button state
 */
function updateBulkApplyButton() {
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  const applyBulkCategory = document.getElementById('applyBulkCategory');
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');

  if (applyBulkCategory) {
    applyBulkCategory.disabled = selectedCheckboxes.length === 0 || !bulkCategorySelect.value;
  }
}

/**
 * FIXED: Apply bulk category change to selected transactions
 */
function applyBulkCategoryChange() {
  const bulkCategorySelect = document.getElementById('bulkCategorySelect');
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');
  const selectedCategory = bulkCategorySelect.value;

  if (!selectedCategory || selectedCheckboxes.length === 0) {
    return;
  }

  selectedCheckboxes.forEach(checkbox => {
    const transactionId = checkbox.getAttribute('data-transaction-id');
    saveFieldChangeById(transactionId, 'category', selectedCategory);
  });

  // FIXED: Use import pattern for showToast
  import('./uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Applied category "${selectedCategory}" to ${selectedCheckboxes.length} transactions`, 'success');
    }
  });

  // Refresh the transaction display
  setTimeout(() => {
    renderTransactions(AppState.transactions, true);
  }, 100);
}

/**
 * FIXED: Apply quick category to selected transactions
 */
function applyQuickCategory(category) {
  const selectedCheckboxes = document.querySelectorAll('.transaction-checkbox:checked');

  if (selectedCheckboxes.length === 0) {
    // FIXED: Use import pattern for showToast
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Please select transactions first', 'warning');
      }
    });
    return;
  }

  selectedCheckboxes.forEach(checkbox => {
    const transactionId = checkbox.getAttribute('data-transaction-id');
    saveFieldChangeById(transactionId, 'category', category);
  });

  // FIXED: Use import pattern for showToast
  import('./uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Applied category "${category}" to ${selectedCheckboxes.length} transactions`, 'success');
    }
  });

  // Refresh the transaction display
  setTimeout(() => {
    renderTransactions(AppState.transactions, true);
  }, 100);
}
