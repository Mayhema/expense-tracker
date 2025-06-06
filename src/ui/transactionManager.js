import { AppState } from '../core/appState.js';
import { formatDateToDDMMYYYY, convertDDMMYYYYToISO, parseDDMMYYYY } from '../utils/dateUtils.js';
import { CURRENCIES } from '../constants/currencies.js';

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
 * Filters transactions by category
 * @param {string} category - Category to filter by (empty string for all)
 */
function filterByCategory(category) {
  console.log(`Filtering by category: "${category}"`);

  try {
    // Set the current filter in AppState
    AppState.currentCategoryFilter = category;

    // Apply the filter and re-render
    renderTransactions(AppState.transactions || [], false);
  } catch (error) {
    console.error("Error filtering by category:", error);
  }
}

/**
 * FIXED: Main render function with improved container management
 */
export function renderTransactions(transactions = [], updateCharts = true) {
  console.log(`CRITICAL: renderTransactions called with ${transactions.length} transactions`);

  // FIXED: Always use AppState.transactions if no transactions passed
  const actualTransactions = transactions.length > 0 ? transactions : (AppState.transactions || []);
  console.log(`CRITICAL: Using ${actualTransactions.length} transactions for rendering`);

  // FIXED: Ensure main container exists first AND remove any duplicates
  let container = ensureTransactionContainer();
  if (!container) {
    console.error('CRITICAL: Could not create transaction container');
    return;
  }

  // Apply filters to get display transactions
  const filteredTransactions = applyFilters(actualTransactions);
  console.log(`CRITICAL: Filtered to ${filteredTransactions.length} transactions for display`);

  // Update summary - FIXED: Add missing function
  updateTransactionSummary(filteredTransactions);

  // FIXED: Render filters section
  renderFiltersSection(container, actualTransactions);

  // FIXED: Render transaction table with proper structure
  renderTransactionTable(container, filteredTransactions);

  // Render category buttons
  setTimeout(() => {
    renderCategoryButtons();
  }, 100);

  // Update charts if requested
  if (updateCharts) {
    setTimeout(() => {
      import('../charts/chartManager.js').then(module => {
        if (module.updateChartsWithCurrentData) {
          module.updateChartsWithCurrentData();
        }
      }).catch(error => {
        console.warn('Could not update charts:', error);
      });
    }, 300);
  }

  console.log(`CRITICAL: Transaction rendering complete - displayed ${filteredTransactions.length} transactions`);
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

  // Create ONE clean transaction section
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
      <div id="categoryButtons" class="category-buttons-container"></div>
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
 * FIXED: Render filters section
 */
function renderFiltersSection(container, transactions) {
  const filtersContainer = container.querySelector('#transactionFilters');
  if (!filtersContainer) return;

  filtersContainer.innerHTML = createFilterSection();

  // Initialize filter controls
  initializeFilters();

  console.log('CRITICAL: Filters section rendered');
}

/**
 * FIXED: Render transaction table with guaranteed structure
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

  // FIXED: Generate proper table HTML
  const tableHTML = generateTransactionTableHTML(transactions);
  tableWrapper.innerHTML = tableHTML;

  // FIXED: Attach event listeners after DOM update
  setTimeout(() => {
    attachTransactionEventListeners();
    console.log('CRITICAL: Event listeners attached');
  }, 50);

  console.log(`CRITICAL: Transaction table rendered with ${transactions.length} rows`);
}

/**
 * FIXED: Generate proper transaction table HTML with dd/mm/yyyy dates
 */
function generateTransactionTableHTML(transactions) {
  console.log(`CRITICAL: Generating table HTML for ${transactions.length} transactions`);

  let html = `
    <div class="transaction-table-header">
      <h4>📋 Transaction Data (${transactions.length} transactions)</h4>
      <div class="table-info">
        <span>Click on any field to edit • Changes are saved automatically</span>
      </div>
    </div>
    <div class="table-container">
      <table class="transaction-table">
        <thead>
          <tr>
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
    // FIXED: Format date to dd/mm/yyyy for display
    const date = tx.date ? formatDateToDDMMYYYY(tx.date) : '';
    const description = tx.description || '';
    const category = tx.category || '';
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;
    const currency = tx.currency || 'USD';

    // FIXED: Generate currency dropdown from CURRENCIES constant
    const currencyOptions = Object.keys(CURRENCIES).sort().map(currencyCode => {
      const isSelected = currency === currencyCode;
      return `<option value="${currencyCode}" ${isSelected ? 'selected' : ''}>${currencyCode}</option>`;
    }).join('');

    html += `
      <tr data-transaction-index="${index}" class="transaction-row">
        <td class="date-cell">
          <input type="text"
                 class="edit-field date-field"
                 value="${date}"
                 data-field="date"
                 data-index="${index}"
                 data-original="${date}"
                 placeholder="dd/mm/yyyy">
        </td>
        <td class="description-cell">
          <input type="text"
                 class="edit-field description-field"
                 value="${description.replace(/"/g, '&quot;')}
                 data-field="description"
                 data-index="${index}"
                 data-original="${description.replace(/"/g, '&quot;')}"
                 placeholder="Enter description">
        </td>
        <td class="category-cell">
          ${generateCategoryDropdown(category, tx.subcategory, index)}
        </td>
        <td class="amount-cell">
          <input type="number"
                 class="edit-field amount-field income-field"
                 value="${income > 0 ? income.toFixed(2) : ''}"
                 data-field="income"
                 data-index="${index}"
                 data-original="${income > 0 ? income.toFixed(2) : ''}"
                 placeholder="0.00"
                 step="0.01"
                 min="0">
        </td>
        <td class="amount-cell">
          <input type="number"
                 class="edit-field amount-field expense-field"
                 value="${expenses > 0 ? expenses.toFixed(2) : ''}"
                 data-field="expenses"
                 data-index="${index}"
                 data-original="${expenses > 0 ? expenses.toFixed(2) : ''}"
                 placeholder="0.00"
                 step="0.01"
                 min="0">
        </td>
        <td class="currency-cell">
          <select class="edit-field currency-field"
                  data-field="currency"
                  data-index="${index}"
                  data-original="${currency}">
            ${currencyOptions}
          </select>
        </td>
        <td class="action-cell">
          <button class="btn-save action-btn" data-index="${index}" style="display: none;" title="Save changes">💾</button>
          <button class="btn-revert action-btn" data-index="${index}" style="display: none;" title="Cancel changes">↶</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  console.log('CRITICAL: Generated table HTML successfully');
  return html;
}

/**
 * Attach event listeners to transaction table fields
 */
function attachTransactionEventListeners() {
  console.log('CRITICAL: Attaching transaction event listeners');

  // Handle field changes
  document.querySelectorAll('.edit-field').forEach(field => {
    field.addEventListener('input', (e) => {
      const row = e.target.closest('tr');
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
    });
  });

  // Handle save buttons
  document.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      saveTransactionChanges(index);
    });
  });

  // Handle revert buttons
  document.querySelectorAll('.btn-revert').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      revertTransactionChanges(index);
    });
  });

  console.log('CRITICAL: Transaction event listeners attached successfully');
}

/**
 * Check if a row has any changes
 */
function checkRowForChanges(row) {
  const fields = row.querySelectorAll('.edit-field');
  for (let field of fields) {
    if (field.value !== field.dataset.original) {
      return true;
    }
  }
  return false;
}

/**
 * Save changes to a transaction
 */
function saveTransactionChanges(index) {
  if (!AppState.transactions || !AppState.transactions[index]) return;

  const row = document.querySelector(`tr[data-transaction-index="${index}"]`);
  if (!row) return;

  const fields = row.querySelectorAll('.edit-field');
  const transaction = AppState.transactions[index];

  fields.forEach(field => {
    const fieldName = field.dataset.field;
    let newValue = field.value;

    // FIXED: Convert date from dd/mm/yyyy to ISO format for storage
    if (fieldName === 'date' && newValue) {
      const isoDate = convertDDMMYYYYToISO(newValue);
      if (isoDate) {
        newValue = isoDate;
      } else {
        console.warn('Invalid date format:', newValue);
        return; // Skip invalid dates
      }
    }

    // Update the transaction
    transaction[fieldName] = newValue;

    // Update the original value (keep display format for dates)
    if (fieldName === 'date') {
      field.dataset.original = field.value; // Keep dd/mm/yyyy format
    } else {
      field.dataset.original = newValue;
    }
  });

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    // Hide save/revert buttons
    row.querySelector('.btn-save').style.display = 'none';
    row.querySelector('.btn-revert').style.display = 'none';
    row.classList.remove('has-changes');

    // Show success feedback
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Transaction updated', 'success');
      }
    });

    // Update category buttons if category changed
    setTimeout(() => {
      renderCategoryButtons();
    }, 100);

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

  const fields = row.querySelectorAll('.edit-field');

  fields.forEach(field => {
    field.value = field.dataset.original;
  });

  // Hide save/revert buttons
  row.querySelector('.btn-save').style.display = 'none';
  row.querySelector('.btn-revert').style.display = 'none';
  row.classList.remove('has-changes');
}

/**
 * FIXED: Add missing updateTransactionSummary function
 */
function updateTransactionSummary(transactions) {
  const totalIncome = transactions.reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  // Update summary if it exists
  const summaryContainer = document.getElementById('transactionSummary');
  if (summaryContainer) {
    // FIXED: Force the exact structure with proper classes and force display as flex row
    summaryContainer.innerHTML = `
      <div class="summary-cards-row" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 1rem !important; justify-content: space-between !important;">
        <div class="summary-card income" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 calc(25% - 0.75rem) !important; min-width: 180px !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(40, 167, 69, 0.1) !important; color: #28a745 !important; display: flex !important; align-items: center !important; justify-content: center !important;">💰</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important;">Income</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #28a745 !important;">${totalIncome.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card expenses" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 calc(25% - 0.75rem) !important; min-width: 180px !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(220, 53, 69, 0.1) !important; color: #dc3545 !important; display: flex !important; align-items: center !important; justify-content: center !important;">💸</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important;">Expenses</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #dc3545 !important;">${totalExpenses.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card net ${netBalance >= 0 ? 'positive' : 'negative'}" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 calc(25% - 0.75rem) !important; min-width: 180px !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: ${netBalance >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'} !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important; display: flex !important; align-items: center !important; justify-content: center !important;">${netBalance >= 0 ? '📈' : '📉'}</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important;">Net Balance</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: ${netBalance >= 0 ? '#28a745' : '#dc3545'} !important;">${netBalance.toFixed(2)}</span>
          </div>
        </div>
        <div class="summary-card count" style="display: flex !important; align-items: center !important; gap: 0.75rem !important; flex: 1 1 calc(25% - 0.75rem) !important; min-width: 180px !important; padding: 1rem !important; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important; border: 1px solid #e9ecef !important; border-radius: 10px !important;">
          <div class="summary-icon" style="font-size: 1.5rem !important; width: 40px !important; height: 40px !important; border-radius: 50% !important; background: rgba(0, 123, 255, 0.1) !important; color: #007bff !important; display: flex !important; align-items: center !important; justify-content: center !important;">📊</div>
          <div class="summary-content" style="display: flex !important; flex-direction: column !important; gap: 0.25rem !important; flex: 1 !important;">
            <span class="summary-label" style="font-size: 0.85rem !important; font-weight: 500 !important; color: #6c757d !important; text-transform: uppercase !important;">Transactions</span>
            <span class="summary-value" style="font-size: 1.25rem !important; font-weight: 700 !important; color: #007bff !important;">${transactions.length}</span>
          </div>
        </div>
      </div>
    `;

    console.log('CRITICAL: Transaction summary updated with inline styles to force horizontal layout');
  }
}

/**
 * FIXED: Applies current filters to the transaction list with dd/mm/yyyy date handling
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
      if (activeFilter.includes(' > ')) {
        // Subcategory filter
        const [parentCat, subCat] = activeFilter.split(' > ');
        return tx.category === parentCat && tx.subcategory === subCat;
      } else {
        // Main category filter
        return (tx.category || 'Uncategorized') === activeFilter;
      }
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
 * FIXED: Initializes the filter controls
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

  // Currency filter - FIXED: Use CURRENCIES from currencies.js
  const currencyFilter = document.getElementById('filterCurrency');
  if (currencyFilter) {
    // Clear existing options first
    currencyFilter.innerHTML = '<option value="">All Currencies</option>';

    // FIXED: Import and use CURRENCIES
    import('../constants/currencies.js').then(module => {
      const currencies = module.CURRENCIES || {};
      Object.keys(currencies).sort().forEach(currencyCode => {
        const option = document.createElement('option');
        option.value = currencyCode;
        option.textContent = `${currencyCode} - ${currencies[currencyCode].name}`;
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
 * Generate category dropdown with subcategories - FIXED: Use proper ordering and colors
 */
function generateCategoryDropdown(selectedCategory, selectedSubcategory, transactionIndex) {
  const categories = AppState.categories || {};
  let html = `
    <select class="edit-field category-select"
            data-field="category"
            data-index="${transactionIndex}"
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

    // Add subcategories if they exist
    if (typeof categoryData === 'object' && categoryData.subcategories) {
      Object.entries(categoryData.subcategories).forEach(([subName, subColor]) => {
        const isSubSelected = selectedCategory === categoryName && selectedSubcategory === subName;
        html += `<option value="${categoryName}:${subName}" ${isSubSelected ? 'selected' : ''} data-color="${subColor}" style="color: ${subColor}; padding-left: 20px;">  ➤ ${subName}</option>`;
      });
    }
  });

  html += '</select>';
  return html;
}

/**
 * Render category buttons with improved styling - FIXED: Use proper ordering
 */
export function renderCategoryButtons() {
  console.log("CRITICAL: Rendering category buttons...");

  const categories = AppState.categories || {};
  const transactions = AppState.transactions || [];

  // Find or create category buttons container
  const container = createCategoryButtonsContainer();
  if (!container) {
    console.error("CRITICAL: Could not create category buttons container");
    return;
  }

  // Count transactions by category
  const categoryCounts = updateCategoryCounts(transactions);

  if (Object.keys(categories).length === 0 && transactions.length === 0) {
    container.innerHTML = `
      <div class="category-filter-header">
        <h4>No categories available. Create categories in the sidebar.</h4>
      </div>
    `;
    return;
  }

  // Build category buttons HTML with improved styling
  let buttonsHTML = `
    <div class="category-buttons-header">
      <h4>📊 Filter by Category</h4>
    </div>
    <div class="category-buttons-grid">
  `;

  // Add "All" button
  const totalCount = transactions.length;
  const isAllActive = !AppState.currentCategoryFilter;
  buttonsHTML += `
    <button class="category-btn all ${isAllActive ? 'active' : ''}" data-category="">
      <span class="category-color" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></span>
      <div class="category-info">
        <span class="category-name">All Categories</span>
        <span class="category-count">${totalCount}</span>
      </div>
    </button>
  `;

  // FIXED: Use proper ordering for category buttons with same fix
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

  sortedCategories.forEach(([categoryName, categoryData]) => {
    const count = categoryCounts[categoryName] || 0;
    let color = '#cccccc';

    if (typeof categoryData === 'string') {
      color = categoryData;
    } else if (categoryData && categoryData.color) {
      color = categoryData.color;
    }

    const isActive = AppState.currentCategoryFilter === categoryName;
    buttonsHTML += `
      <button class="category-btn ${isActive ? 'active' : ''}" data-category="${categoryName}">
        <span class="category-color" style="background: ${color};"></span>
        <div class="category-info">
          <span class="category-name">${categoryName}</span>
          <span class="category-count">${count}</span>
        </div>
      </button>
    `;
  });

  buttonsHTML += `</div>`;

  container.innerHTML = buttonsHTML;

  // Add event listeners - FIXED: Only handle main category clicks
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.category;
      filterByCategory(category);
    });
  });

  console.log("CRITICAL: Category buttons rendered successfully");
}

/**
 * Creates the category buttons container if it doesn't exist
 */
function createCategoryButtonsContainer() {
  let container = document.getElementById('categoryButtons');

  if (!container) {
    // Find the transaction section
    const transactionSection = document.querySelector('.transactions-section');
    if (!transactionSection) {
      console.error('Transaction section not found');
      return null;
    }

    const sectionContent = transactionSection.querySelector('.section-content');
    if (!sectionContent) {
      console.error('Section content not found');
      return null;
    }

    // Create category buttons container
    container = document.createElement('div');
    container.id = 'categoryButtons';
    container.className = 'category-buttons-container';
    sectionContent.appendChild(container);
  }

  return container;
}

/**
 * FIXED: Function to update all category UI elements when categories change
 */
export function updateAllCategoryUI() {
  // Update category filter dropdown
  const categoryFilter = document.getElementById('filterCategory');
  if (categoryFilter) {
    updateCategoryFilterDropdown(categoryFilter);
  }

  // Update category buttons directly instead of importing
  renderCategoryButtons();

  // Re-render transactions to update category displays
  renderTransactions(AppState.transactions || [], false);
}

/**
 * FIXED: Initialize transaction manager and load existing data
 */
export function initializeTransactionManager() {
  console.log("CRITICAL: Initializing transaction manager...");

  // FIXED: Force immediate render with current AppState data
  setTimeout(() => {
    renderTransactions(AppState.transactions || [], true);
  }, 100);
}

/**
 * FIXED: Update transactions from merged files
 */
export function updateTransactions() {
  console.log("CRITICAL: updateTransactions called - processing merged files...");

  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    console.log("CRITICAL: No merged files found");
    AppState.transactions = [];
    renderTransactions([]);
    return;
  }

  // CRITICAL FIX: Process all merged files into transactions
  let allTransactions = [];

  AppState.mergedFiles.forEach(file => {
    try {
      console.log(`CRITICAL: Processing file: ${file.fileName}`, file);

      // Use pre-processed transactions if available
      if (file.transactions && Array.isArray(file.transactions) && file.transactions.length > 0) {
        allTransactions = allTransactions.concat(file.transactions);
        console.log(`CRITICAL: Loaded ${file.transactions.length} pre-processed transactions from ${file.fileName}`);
      } else {
        console.warn(`CRITICAL: File ${file.fileName} has no valid transaction data`);
      }
    } catch (error) {
      console.error(`CRITICAL: Error processing file ${file.fileName}:`, error);
    }
  });

  console.log(`CRITICAL: Total transactions processed: ${allTransactions.length}`);

  // CRITICAL: Store in AppState immediately
  AppState.transactions = allTransactions;

  // Save to localStorage
  try {
    localStorage.setItem('transactions', JSON.stringify(allTransactions));
    console.log(`CRITICAL: Saved ${allTransactions.length} transactions to localStorage`);
  } catch (error) {
    console.error('CRITICAL: Error saving transactions to localStorage:', error);
  }

  // FORCE render with the actual transactions
  console.log(`CRITICAL: Forcing render of ${allTransactions.length} transactions`);
  renderTransactions(allTransactions, true);
}
