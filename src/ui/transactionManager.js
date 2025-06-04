import { AppState } from '../core/appState.js';

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

  // Update summary
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
      import('./charts.js').then(module => {
        if (module.updateCharts) {
          module.updateCharts();
        }
      }).catch(error => {
        console.log('Charts module not available:', error.message);
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

  // Update currency filter with actual data
  updateCurrencyFilter(transactions);

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
 * FIXED: Generate proper transaction table HTML
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
    // FIXED: Properly handle transaction data
    const date = tx.date || '';
    const description = tx.description || '';
    const category = tx.category || '';
    const income = parseFloat(tx.income) || 0;
    const expenses = parseFloat(tx.expenses) || 0;
    const currency = tx.currency || 'USD';

    html += `
      <tr data-transaction-index="${index}" class="transaction-row">
        <td class="date-cell">
          <input type="date"
                 class="edit-field date-field"
                 value="${date}"
                 data-field="date"
                 data-index="${index}"
                 data-original="${date}">
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
            <option value="USD" ${currency === 'USD' ? 'selected' : ''}>USD</option>
            <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>EUR</option>
            <option value="GBP" ${currency === 'GBP' ? 'selected' : ''}>GBP</option>
            <option value="CAD" ${currency === 'CAD' ? 'selected' : ''}>CAD</option>
            <option value="AUD" ${currency === 'AUD' ? 'selected' : ''}>AUD</option>
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
    const newValue = field.value;

    // Update the transaction
    transaction[fieldName] = newValue;

    // Update the original value
    field.dataset.original = newValue;
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
 * FIXED: Updates the currency filter dropdown with available currencies
 * @param {Array} transactions - Array of transactions to extract currencies from
 */
function updateCurrencyFilter(transactions) {
  const currencies = new Set();
  transactions.forEach(tx => {
    if (tx.currency) {
      currencies.add(tx.currency);
    }
  });

  const currencyFilter = document.getElementById('filterCurrency');
  if (currencyFilter) {
    // Save current selection
    const currentValue = currencyFilter.value;

    // Clear existing options except "All"
    currencyFilter.innerHTML = '<option value="">All Currencies</option>';

    // Add currency options
    Array.from(currencies).sort().forEach(currency => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      currencyFilter.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentValue && currencyFilter.querySelector(`option[value="${currentValue}"]`)) {
      currencyFilter.value = currentValue;
    }
  }
}

/**
 * Creates the filter section HTML
 * @returns {string} Filter section HTML
 */
function createFilterSection() {
  return `
    <div class="filter-row">
      <div class="filter-group">
        <label for="filterCategory">Category:</label>
        <select id="filterCategory">
          <option value="">All Categories</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="filterCurrency">Currency:</label>
        <select id="filterCurrency">
          <option value="">All Currencies</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="filterDateFrom">From:</label>
        <input type="date" id="filterDateFrom">
      </div>
      <div class="filter-group">
        <label for="filterDateTo">To:</label>
        <input type="date" id="filterDateTo">
      </div>
      <div class="filter-group">
        <button id="clearFiltersBtn" class="button secondary-btn">Clear Filters</button>
      </div>
    </div>
  `;
}

/**
 * Initializes the filter controls
 */
function initializeFilters() {
  // Category filter
  const categoryFilter = document.getElementById('filterCategory');
  if (categoryFilter) {
    // FIXED: Populate only main categories (no subcategories in dropdown)
    const categories = AppState.categories || {};
    Object.keys(categories).sort().forEach(categoryName => {
      const option = document.createElement('option');
      option.value = categoryName;
      option.textContent = categoryName;
      categoryFilter.appendChild(option);
    });

    categoryFilter.addEventListener('change', () => {
      AppState.currentCategoryFilter = categoryFilter.value;
      renderTransactions(AppState.transactions || [], false);
    });
  }

  // Currency filter
  const currencyFilter = document.getElementById('filterCurrency');
  if (currencyFilter) {
    currencyFilter.addEventListener('change', () => {
      renderTransactions(AppState.transactions || [], false);
    });
  }

  // Date filters
  const dateFromFilter = document.getElementById('filterDateFrom');
  const dateToFilter = document.getElementById('filterDateTo');

  if (dateFromFilter) {
    dateFromFilter.addEventListener('change', () => {
      renderTransactions(AppState.transactions || [], false);
    });
  }

  if (dateToFilter) {
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
 * FIXED: Applies current filters to the transaction list
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

  // Date filters
  if (dateFromFilter && dateFromFilter.value) {
    const fromDate = new Date(dateFromFilter.value);
    filtered = filtered.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      return txDate >= fromDate;
    });
  }

  if (dateToFilter && dateToFilter.value) {
    const toDate = new Date(dateToFilter.value);
    filtered = filtered.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      return txDate <= toDate;
    });
  }

  console.log(`CRITICAL: Applied filters: ${filtered.length} transactions after filtering from ${transactions.length}`);
  return filtered;
}

/**
 * Updates transaction summary display
 */
function updateTransactionSummary(transactions) {
  const totalIncome = transactions.reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  // Update summary if it exists
  const summaryContainer = document.getElementById('transactionSummary');
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">Income:</span>
        <span class="summary-value income">${totalIncome.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Expenses:</span>
        <span class="summary-value expenses">${totalExpenses.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Net:</span>
        <span class="summary-value ${netBalance >= 0 ? 'income' : 'expenses'}">${netBalance.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Count:</span>
        <span class="summary-value">${transactions.length}</span>
      </div>
    `;
  }
}

/**
 * Generate category dropdown with subcategories
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

  // Get sorted categories by order
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;
      return orderA - orderB;
    });

  sortedCategories.forEach(([categoryName, categoryData]) => {
    const isSelected = selectedCategory === categoryName;
    html += `<option value="${categoryName}" ${isSelected ? 'selected' : ''}>${categoryName}</option>`;

    // Add subcategories if they exist
    if (typeof categoryData === 'object' && categoryData.subcategories) {
      Object.keys(categoryData.subcategories).sort().forEach(subName => {
        const subValue = `${categoryName} > ${subName}`;
        const isSubSelected = selectedCategory === categoryName && selectedSubcategory === subName;
        html += `<option value="${subValue}" ${isSubSelected ? 'selected' : ''}>&nbsp;&nbsp;→ ${subName}</option>`;
      });
    }
  });

  html += '</select>';
  return html;
}

/**
 * Render category buttons with improved styling - FIXED: Only main categories
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

  // FIXED: Only show main categories (no subcategories in filter buttons)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;
      return orderA - orderB;
    });

  sortedCategories.forEach(([categoryName, categoryData]) => {
    const count = categoryCounts[categoryName] || 0;
    let color = '#cccccc';

    if (typeof categoryData === 'string') {
      color = categoryData;
    } else if (typeof categoryData === 'object' && categoryData.color) {
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
      const category = e.currentTarget.getAttribute('data-category');

      // FIXED: Only handle main category filtering
      filterByCategory(category);

      // Update active state
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
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
      console.error("CRITICAL: Transaction section not found for category buttons");
      return null;
    }

    const sectionContent = transactionSection.querySelector('.section-content');
    if (!sectionContent) {
      console.error("CRITICAL: Section content not found for category buttons");
      return null;
    }

    // Create category buttons container
    container = document.createElement('div');
    container.id = 'categoryButtons';
    container.className = 'category-buttons-container';

    // Insert before the transaction table
    const tableWrapper = document.getElementById('transactionTableWrapper');
    if (tableWrapper) {
      sectionContent.insertBefore(container, tableWrapper);
    } else {
      sectionContent.appendChild(container);
    }

    console.log("CRITICAL: Category buttons container created");
  }

  return container;
}

/**
 * FIXED: Initialize transaction manager and load existing data
 */
export function initializeTransactionManager() {
  console.log("CRITICAL: Initializing transaction manager...");

  // FIXED: Force immediate render with current AppState data
  setTimeout(() => {
    const transactions = AppState.transactions || [];
    console.log(`CRITICAL: Transaction manager forcing render of ${transactions.length} transactions`);
    renderTransactions(transactions, true);
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
