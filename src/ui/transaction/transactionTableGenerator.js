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
export function generateTransactionTableHTML(transactions) {
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

    // Check if transaction has data field edits to show revert button - only for data fields
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
