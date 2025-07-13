/**
 * TRANSACTION TABLE GENERATOR MODULE
 *
 * Handles HTML generation for transaction tables.
 * Extracted from transactionManager.js for better separation of concerns.
 */

import { AppState } from '../../core/appState.js';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils.js';
import { CURRENCIES } from '../../constants/currencies.js';

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
 * Ensure all transactions have unique IDs and log the process
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
 * Generate category dropdown HTML
 */
function generateCategoryDropdown(selectedCategory, selectedSubcategory, transactionId) {
  const categories = AppState.categories || {};
  const categoryEntries = Object.entries(categories);

  let options = '<option value="">Select Category</option>';

  categoryEntries.forEach(([categoryName, categoryData]) => {
    const isSelected = selectedCategory === categoryName ? 'selected' : '';
    options += `<option value="${categoryName}" ${isSelected}>${categoryName}</option>`;
  });

  return `
    <select class="edit-field category-select"
            data-field="category"
            data-transaction-id="${transactionId}"
            data-original="${selectedCategory}">
      ${options}
    </select>
  `;
}

/**
 * Generate proper transaction table HTML with edit mode and counter
 */
/**
 * Generates the table header HTML
 */
function generateTableHeader(transactionCount) {
  return `
    <div class="transaction-table-header">
      <div class="table-header-left">
        <h4>📋 Transaction Data (${transactionCount} transactions)</h4>
        <div class="table-info">
          <span>Use the Edit button to modify transactions • Changes are saved automatically</span>
        </div>
      </div>
      <div class="table-header-right">
        <button id="bulkEditToggle" class="btn secondary-btn">📝 Bulk Edit</button>
      </div>
    </div>
  `;
}

/**
 * Generates the bulk actions section HTML
 */
function generateBulkActionsHTML() {
  return `
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
  `;
}

/**
 * Generates the table structure start HTML
 */
function generateTableStart() {
  return `
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
}

/**
 * Processes transaction data for display
 */
function processTransactionForDisplay(tx, index) {
  // Ensure each transaction has a unique ID
  if (!tx.id) {
    tx.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
    console.log(`🆔 GENERATED ID: ${tx.id} for transaction at index ${index}`);
  }

  console.log(`🔧 Rendering transaction ID ${tx.id} at index ${index}, category: "${tx.category}", description: "${tx.description?.substring(0, 50)}..."`);

  return {
    id: tx.id,
    date: tx.date ? formatDateToDDMMYYYY(tx.date) : '',
    description: (tx.description || '').toString().replace(/\s*data-field=.*$/i, '').trim(),
    isRTL: /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(tx.description || ''),
    category: tx.category || '',
    subcategory: tx.subcategory || '',
    income: parseFloat(tx.income) || 0,
    expenses: parseFloat(tx.expenses) || 0,
    currency: tx.currency || 'USD',
    isEdited: tx.edited || false,
    editedFields: tx.editedFields || {},
    hasDataEdits: tx.originalData && Object.keys(tx.originalData).length > 0
  };
}

export function generateTransactionTableHTML(transactions) {
  console.log(`🔧 Generating table HTML for ${transactions.length} transactions`);

  // Ensure all transactions have IDs before rendering
  ensureTransactionIds(transactions);

  let html = generateTableHeader(transactions.length);
  html += generateBulkActionsHTML();
  html += generateTableStart();

  transactions.forEach((tx, index) => {
    const processedTx = processTransactionForDisplay(tx, index);

    // Get category color for cell background - preserve category styling
    const categoryColor = getCategoryColor(processedTx.category);
    const categoryStyle = processedTx.category ? `background-color: ${categoryColor}20; border-left: 3px solid ${categoryColor};` : '';

    // Generate currency dropdown with proper symbols
    const currencyOptions = Object.entries(CURRENCIES).sort(([a], [b]) => a.localeCompare(b)).map(([currencyCode, currencyData]) => {
      const isSelected = processedTx.currency === currencyCode ? 'selected' : '';
      const symbol = currencyData.symbol || currencyCode;
      return `<option value="${currencyCode}" ${isSelected}>${symbol} ${currencyCode}</option>`;
    }).join('');

    // Check which fields have been edited for styling - preserve edited state
    const dateEditedClass = processedTx.editedFields.date ? 'edited-cell' : '';
    const descEditedClass = processedTx.editedFields.description ? 'edited-cell' : '';
    const categoryEditedClass = processedTx.editedFields.category ? 'edited-cell' : '';
    const incomeEditedClass = processedTx.editedFields.income ? 'edited-cell' : '';
    const expensesEditedClass = processedTx.editedFields.expenses ? 'edited-cell' : '';

    html += `
      <tr data-transaction-id="${processedTx.id}" data-transaction-index="${index}" class="transaction-row ${processedTx.isEdited ? 'edited-row' : ''}" data-edit-mode="false">
        <td class="counter-cell">
          <input type="checkbox" class="transaction-checkbox" data-transaction-id="${processedTx.id}" style="display: none;">
          ${index + 1}
        </td>
        <td class="date-cell ${dateEditedClass}">
          <span class="display-value">${processedTx.date}</span>
          <input type="text"
                 class="edit-field date-field"
                 value="${processedTx.date}"
                 data-transaction-id="${processedTx.id}"
                 data-field="date"
                 data-index="${index}"
                 style="display: none;"
                 placeholder="dd/mm/yyyy">
        </td>
        <td class="description-cell ${descEditedClass}" ${processedTx.isRTL ? 'dir="rtl"' : ''}>
          <span class="display-value" title="${processedTx.description}">${processedTx.description}</span>
          <input type="text"
                 class="edit-field description-field"
                 value="${processedTx.description.replace(/"/g, '&quot;')}"
                 data-transaction-id="${processedTx.id}"
                 data-field="description"
                 data-index="${index}"
                 style="display: none;"
                 ${processedTx.isRTL ? 'dir="rtl"' : ''}
                 placeholder="Transaction description">
        </td>
        <td class="category-cell ${categoryEditedClass}" style="${categoryStyle}">
          <span class="display-value">${processedTx.category}</span>
          ${generateCategoryDropdown(processedTx.category, processedTx.subcategory, processedTx.id)}
        </td>
        <td class="income-cell ${incomeEditedClass}">
          <span class="display-value">${processedTx.income > 0 ? processedTx.income.toFixed(2) : ''}</span>
          <input type="number"
                 class="edit-field income-field"
                 value="${processedTx.income || ''}"
                 data-transaction-id="${processedTx.id}"
                 data-field="income"
                 data-index="${index}"
                 style="display: none;"
                 step="0.01"
                 min="0"
                 placeholder="0.00">
        </td>
        <td class="expenses-cell ${expensesEditedClass}">
          <span class="display-value">${processedTx.expenses > 0 ? processedTx.expenses.toFixed(2) : ''}</span>
          <input type="number"
                 class="edit-field expenses-field"
                 value="${processedTx.expenses || ''}"
                 data-transaction-id="${processedTx.id}"
                 data-field="expenses"
                 data-index="${index}"
                 style="display: none;"
                 step="0.01"
                 min="0"
                 placeholder="0.00">
        </td>
        <td class="currency-cell">
          <span class="display-value">${processedTx.currency}</span>
          <select class="edit-field currency-field"
                  data-transaction-id="${processedTx.id}"
                  data-field="currency"
                  data-index="${index}"
                  style="display: none;">
            ${currencyOptions}
          </select>
        </td>
        <td class="actions-cell">
          <button class="btn-edit action-btn" data-transaction-id="${processedTx.id}" data-index="${index}" title="Edit transaction">✏️</button>
          <button class="btn-delete action-btn" data-transaction-id="${processedTx.id}" data-index="${index}" title="Delete transaction">🗑️</button>
          <button class="btn-save action-btn" data-transaction-id="${processedTx.id}" data-index="${index}" style="display: none;" title="Save changes">💾</button>
          <button class="btn-revert action-btn" data-transaction-id="${processedTx.id}" data-index="${index}" style="display: none;" title="Cancel changes">↶</button>
          <button class="btn-revert-all action-btn" data-transaction-id="${processedTx.id}" data-index="${index}" ${processedTx.hasDataEdits ? '' : 'style="display: none;"'} title="Revert all changes to original">🔄</button>
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
