import { AppState } from '../core/appState.js';
import { showToast } from './uiManager.js';

/**
 * Filters transactions by category
 * @param {string} category - Category to filter by (empty string for all)
 */
function filterByCategory(category) {
  console.log(`Filtering by category: "${category}"`);

  try {
    const allTransactions = AppState.transactions || [];
    let filteredTransactions;

    if (!category || category === '') {
      filteredTransactions = allTransactions;
    } else {
      filteredTransactions = allTransactions.filter(tx => {
        const txCategory = tx.category || 'Uncategorized';
        return txCategory === category;
      });
    }

    // Re-render with filtered transactions
    renderTransactions(filteredTransactions, false);

    console.log(`Filtered to ${filteredTransactions.length} transactions for category: ${category}`);
  } catch (error) {
    console.error('Error filtering by category:', error);
    showToast('Error filtering transactions', 'error');
  }
}


/**
 * Renders transactions with proper container management - FIXED duplicate content
 */
export function renderTransactions(transactions = [], updateCharts = true) {
  // Fix: Ensure transactions is always an array
  const transactionArray = Array.isArray(transactions) ? transactions : [];

  console.log(`Rendering ${transactionArray.length} transactions`);

  // Ensure container exists
  let container = createTransactionTableContainer();
  if (!container) {
    console.error("Could not create or find transaction table container");
    return;
  }

  // Apply filters to transactions
  const filteredTransactions = applyFilters(transactionArray);

  // Update transaction summary
  updateTransactionSummary(filteredTransactions);

  // Update filters section - ensure it exists first
  let filtersContainer = container.querySelector('#transactionFilters');
  if (filtersContainer) {
    filtersContainer.innerHTML = createFilterSection();
    // Initialize filters after adding HTML
    setTimeout(() => initializeFilters(), 100);
  }

  // Generate and render transaction table first
  const tableContainer = container.querySelector('#transactionTable');
  if (tableContainer) {
    tableContainer.innerHTML = generateTransactionTableHTML(filteredTransactions);
  }

  // Update currency filter dropdown
  updateCurrencyFilter(transactionArray);

  // Render category buttons AFTER DOM is updated - increased delay
  setTimeout(() => {
    const categoryContainer = createCategoryButtonsContainer();
    if (categoryContainer) {
      renderCategoryButtons();
    } else {
      console.warn("Category buttons container still not ready, trying again...");
      setTimeout(() => renderCategoryButtons(), 300);
    }
  }, 200);

  // Update charts if requested and available
  if (updateCharts) {
    import('./charts.js').then(module => {
      if (module.updateCharts && typeof module.updateCharts === 'function') {
        module.updateCharts(filteredTransactions);
      }
    }).catch(error => {
      console.log('Charts module not available:', error.message);
    });
  }

  console.log(`Transaction rendering complete: ${filteredTransactions.length} transactions displayed`);
}

/**
 * Creates the transaction table container if it doesn't exist
 */
function createTransactionTableContainer() {
  let container = document.getElementById("transactionTableContainer");

  if (!container) {
    console.log("Creating transaction table container...");

    // Find or create the main content area
    let mainContent = document.querySelector('.main-content');
    if (!mainContent) {
      // Create main content if it doesn't exist
      mainContent = document.createElement('div');
      mainContent.className = 'main-content';
      document.body.appendChild(mainContent);
      console.log("Created main content area");
    }

    // Find existing transactions section or create it
    let transactionsSection = document.getElementById('transactionsSection');
    if (!transactionsSection) {
      transactionsSection = document.createElement('div');
      transactionsSection.id = 'transactionsSection';
      transactionsSection.className = 'section';
      mainContent.appendChild(transactionsSection);
      console.log("Created transactions section");
    }

    // Create the container with proper structure - FIXED
    container = document.createElement("div");
    container.id = "transactionTableContainer";
    container.className = "transaction-container";

    // Create the complete structure with section-content - PROPER STRUCTURE
    container.innerHTML = `
      <div class="section-header">
        <h2>📊 Transactions</h2>
        <div class="transaction-summary" id="transactionSummary">
          <!-- Summary will be updated dynamically -->
        </div>
      </div>
      <div class="section-content">
        <!-- Filters will be added here -->
        <div id="transactionFilters" class="transaction-filters"></div>
        <!-- Category buttons will be added here -->
        <div id="categoryButtons" class="category-buttons"></div>
        <!-- Transaction table will be added here -->
        <div id="transactionTable" class="transaction-table-wrapper">
          <div class="no-transactions">
            <p>No transactions found. Upload a file to get started!</p>
          </div>
        </div>
      </div>
    `;

    // Replace the content of transactions section instead of appending
    transactionsSection.innerHTML = '';
    transactionsSection.appendChild(container);
    console.log("Created transaction table container with proper structure");
  }

  return container;
}

/**
 * Creates the category buttons container if it doesn't exist
 * @returns {HTMLElement|null} The category buttons container
 */
function createCategoryButtonsContainer() {
  const transactionContainer = document.getElementById("transactionTableContainer");
  if (!transactionContainer) {
    console.error("Failed to find transaction container");
    return null;
  }

  let container = document.getElementById('categoryButtons');
  if (container) {
    return container;
  }

  console.log("Creating category buttons container...");
  const sectionContent = findOrCreateSectionContent(transactionContainer);
  if (!sectionContent) {
    return null;
  }

  return findOrCreateCategoryContainer(sectionContent);
}

/**
 * Finds or creates the section content within the transaction container
 * @param {HTMLElement} transactionContainer - The main transaction container
 * @returns {HTMLElement|null} The section content element
 */
function findOrCreateSectionContent(transactionContainer) {
  let sectionContent = transactionContainer.querySelector('.section-content');
  if (sectionContent) {
    return sectionContent;
  }

  const parentSection = transactionContainer.closest('.section');
  if (!parentSection) {
    console.error("Could not find parent section for category buttons");
    return null;
  }

  sectionContent = document.createElement('div');
  sectionContent.className = 'section-content';
  sectionContent.innerHTML = createSectionContentHTML();
  parentSection.appendChild(sectionContent);
  console.log("Created section-content with proper structure");

  return sectionContent;
}

/**
 * Creates the HTML structure for section content
 * @returns {string} The HTML structure
 */
function createSectionContentHTML() {
  return `
    <div id="transactionFilters" class="transaction-filters"></div>
    <div id="categoryButtons" class="category-buttons"></div>
    <div id="transactionTable" class="transaction-table-wrapper">
      <div class="no-transactions">
        <p>No transactions found. Upload a file to get started!</p>
      </div>
    </div>
  `;
}

/**
 * Finds or creates the category buttons container within section content
 * @param {HTMLElement} sectionContent - The section content element
 * @returns {HTMLElement} The category buttons container
 */
function findOrCreateCategoryContainer(sectionContent) {
  let container = sectionContent.querySelector('#categoryButtons');
  if (container) {
    return container;
  }

  container = document.createElement('div');
  container.id = 'categoryButtons';
  container.className = 'category-buttons';

  insertCategoryContainer(sectionContent, container);
  return container;
}

/**
 * Inserts the category container in the appropriate position
 * @param {HTMLElement} sectionContent - The section content element
 * @param {HTMLElement} container - The category container to insert
 */
function insertCategoryContainer(sectionContent, container) {
  const filtersContainer = sectionContent.querySelector('#transactionFilters');
  const tableContainer = sectionContent.querySelector('#transactionTable');

  if (filtersContainer && tableContainer) {
    sectionContent.insertBefore(container, tableContainer);
    console.log("Category buttons container created and inserted between filters and table");
  } else if (filtersContainer) {
    filtersContainer.after(container);
    console.log("Category buttons container created and inserted after filters");
  } else {
    sectionContent.appendChild(container);
    console.log("Category buttons container created and appended to section content");
  }
}


/**
 * Updates the currency filter dropdown with available currencies
 * @param {Array} transactions - The transactions to analyze for currencies
 */
function updateCurrencyFilter(transactions) {
  // Get unique currencies from transactions
  const currencies = [...new Set(transactions.map(tx => tx.currency || 'USD'))];

  const filterSelect = document.querySelector('#currencyFilter');
  if (filterSelect && currencies.length > 1) {
    filterSelect.innerHTML = '<option value="">All Currencies</option>' +
      currencies.map(currency => `<option value="${currency}">${currency}</option>`).join('');
    filterSelect.style.display = 'block';
  } else if (filterSelect) {
    filterSelect.style.display = 'none';
  }
}

/**
 * Creates the filter section HTML
 * @returns {string} Filter section HTML
 */
function createFilterSection() {
  // Get current categories for the dropdown
  const categories = AppState.categories || {};
  const categoryOptions = Object.keys(categories).map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('');

  return `
    <div class="transaction-filters-row">
      <div class="filter-group">
        <label for="filterCategory">Category:</label>
        <select id="filterCategory" class="filter-select">
          <option value="">All Categories</option>
          ${categoryOptions}
        </select>
      </div>

      <div class="filter-group">
        <label for="filterCurrency">Currency:</label>
        <select id="filterCurrency" class="filter-select">
          <option value="">All Currencies</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filterStartDate">From:</label>
        <input type="date" id="filterStartDate" class="filter-input">
      </div>

      <div class="filter-group">
        <label for="filterEndDate">To:</label>
        <input type="date" id="filterEndDate" class="filter-input">
      </div>

      <div class="filter-group">
        <button id="clearFilters" class="button secondary-btn">Clear Filters</button>
      </div>
    </div>
  `;
}

/**
 * Initializes the filter controls
 */
function initializeFilters() {
  console.log("Initializing transaction filters...");

  // Category filter
  const categoryFilter = document.getElementById('filterCategory');
  if (categoryFilter) {
    // Remove existing listeners by cloning
    const newCategoryFilter = categoryFilter.cloneNode(true);
    categoryFilter.parentNode.replaceChild(newCategoryFilter, categoryFilter);

    newCategoryFilter.addEventListener('change', (e) => {
      filterByCategory(e.target.value);
    });
  }

  // Currency filter
  const currencyFilter = document.getElementById('filterCurrency');
  if (currencyFilter) {
    // Remove existing listeners by cloning
    const newCurrencyFilter = currencyFilter.cloneNode(true);
    currencyFilter.parentNode.replaceChild(newCurrencyFilter, currencyFilter);

    newCurrencyFilter.addEventListener('change', (e) => {
      const filteredTransactions = applyFilters();
      renderTransactions(filteredTransactions, true);
    });
  }

  // Date filters
  const startDateFilter = document.getElementById('filterStartDate');
  const endDateFilter = document.getElementById('filterEndDate');

  if (startDateFilter) {
    const newStartDateFilter = startDateFilter.cloneNode(true);
    startDateFilter.parentNode.replaceChild(newStartDateFilter, startDateFilter);

    newStartDateFilter.addEventListener('change', () => {
      const filteredTransactions = applyFilters();
      renderTransactions(filteredTransactions, true);
    });
  }

  if (endDateFilter) {
    const newEndDateFilter = endDateFilter.cloneNode(true);
    endDateFilter.parentNode.replaceChild(newEndDateFilter, endDateFilter);

    newEndDateFilter.addEventListener('change', () => {
      const filteredTransactions = applyFilters();
      renderTransactions(filteredTransactions, true);
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    const newClearFiltersBtn = clearFiltersBtn.cloneNode(true);
    clearFiltersBtn.parentNode.replaceChild(newClearFiltersBtn, clearFiltersBtn);

    newClearFiltersBtn.addEventListener('click', () => {
      // Clear all filter values
      const categoryFilterUpdated = document.getElementById('filterCategory');
      const currencyFilterUpdated = document.getElementById('filterCurrency');
      const startDateFilterUpdated = document.getElementById('filterStartDate');
      const endDateFilterUpdated = document.getElementById('filterEndDate');

      if (categoryFilterUpdated) categoryFilterUpdated.value = '';
      if (currencyFilterUpdated) currencyFilterUpdated.value = '';
      if (startDateFilterUpdated) startDateFilterUpdated.value = '';
      if (endDateFilterUpdated) endDateFilterUpdated.value = '';

      // Re-render with all transactions
      const allTransactions = AppState.transactions || [];
      renderTransactions(allTransactions, true);
    });
  }

  console.log("Transaction filters initialized successfully");
}

/**
 * Applies current filters to the transaction list
 * @param {Array} transactions - The transactions to filter
 * @returns {Array} Filtered transactions
 */
function applyFilters(transactions = AppState.transactions || []) {
  let filtered = [...transactions];

  // Get filter values
  const categoryFilter = document.getElementById('filterCategory')?.value || '';
  const currencyFilter = document.getElementById('filterCurrency')?.value || '';
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';

  // Apply category filter
  if (categoryFilter) {
    filtered = filtered.filter(tx => (tx.category || 'Uncategorized') === categoryFilter);
  }

  // Apply currency filter
  if (currencyFilter) {
    filtered = filtered.filter(tx => (tx.currency || 'USD') === currencyFilter);
  }

  // Apply date filters
  if (startDate) {
    filtered = filtered.filter(tx => new Date(tx.date) >= new Date(startDate));
  }

  if (endDate) {
    filtered = filtered.filter(tx => new Date(tx.date) <= new Date(endDate));
  }

  return filtered;
}

/**
 * Updates transaction summary display
 */
function updateTransactionSummary(transactions) {
  const summaryContainer = document.getElementById('transactionSummary');
  if (!summaryContainer) return;

  const totalIncome = transactions.reduce((sum, tx) => sum + (parseFloat(tx.income) || 0), 0);
  const totalExpenses = transactions.reduce((sum, tx) => sum + (parseFloat(tx.expenses) || 0), 0);
  const netAmount = totalIncome - totalExpenses;

  summaryContainer.innerHTML = `
    <div class="summary-stats">
      <div class="summary-item income">
        <span class="label">Income:</span>
        <span class="value">$${totalIncome.toLocaleString()}</span>
      </div>
      <div class="summary-item expenses">
        <span class="label">Expenses:</span>
        <span class="value">$${totalExpenses.toLocaleString()}</span>
      </div>
      <div class="summary-item net ${netAmount >= 0 ? 'positive' : 'negative'}">
        <span class="label">Net:</span>
        <span class="value">$${netAmount.toLocaleString()}</span>
      </div>
      <div class="summary-item count">
        <span class="label">Transactions:</span>
        <span class="value">${transactions.length}</span>
      </div>
    </div>
  `;
}

/**
 * Generates transaction table HTML
 */
function generateTransactionTableHTML(transactions) {
  if (!transactions || transactions.length === 0) {
    return `
      <div class="no-transactions">
        <p>📄 No transactions found</p>
        <p class="info-text">Upload a file or adjust your filters to see transactions</p>
      </div>
    `;
  }

  const tableHTML = `
    <table class="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Currency</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.description || 'N/A'}</td>
            <td>
              <span class="category-badge" style="background-color: ${getCategoryColor(tx.category)}">
                ${tx.category || 'Uncategorized'}
              </span>
            </td>
            <td class="amount income">${tx.income ? `$${parseFloat(tx.income).toFixed(2)}` : ''}</td>
            <td class="amount expenses">${tx.expenses ? `$${parseFloat(tx.expenses).toFixed(2)}` : ''}</td>
            <td>${tx.currency || 'USD'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  return tableHTML;
}

/**
 * Get category color from AppState
 */
function getCategoryColor(categoryName) {
  if (!categoryName) return '#cccccc';

  const category = AppState.categories[categoryName];
  if (typeof category === 'string') return category;
  if (category && category.color) return category.color;

  // Generate consistent color based on name
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
    hash = hash & hash;
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
}

/**
 * Render beautiful category buttons
 */
export function renderCategoryButtons() {
  console.log('Rendering category buttons...');

  const container = createCategoryButtonsContainer();
  if (!container) {
    console.warn('Category buttons container not found');
    return;
  }

  // Get categories from transactions and AppState
  const transactions = AppState.transactions || [];
  const transactionCategories = [...new Set(transactions.map(tx => tx.category || 'Uncategorized'))];
  const allCategories = Object.keys(AppState.categories || {});
  const categories = [...new Set([...transactionCategories, ...allCategories])].sort();

  if (categories.length === 0) {
    container.innerHTML = `
      <div class="category-buttons-empty">
        <p>No categories available. Upload transactions or create categories in the sidebar.</p>
      </div>
    `;
    return;
  }

  // Create beautiful category buttons
  const buttonsHTML = `
    <div class="category-buttons-header">
      <h4>Filter by Category</h4>
      <button class="category-btn all active" data-category="">All Categories</button>
    </div>
    <div class="category-buttons-grid">
      ${categories.map(category => {
    const count = transactions.filter(tx => (tx.category || 'Uncategorized') === category).length;
    const color = getCategoryColor(category);

    return `
          <button class="category-btn"
                  data-category="${category}"
                  style="--category-color: ${color}"
                  title="${category} (${count} transactions)">
            <span class="category-color" style="background-color: ${color}"></span>
            <span class="category-name">${category}</span>
            <span class="category-count">${count}</span>
          </button>
        `;
  }).join('')}
    </div>
  `;

  container.innerHTML = buttonsHTML;

  // Add event listeners
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.target.closest('.category-btn').classList.add('active');

      // Filter transactions
      const category = e.target.closest('.category-btn').dataset.category;
      filterByCategory(category);
    });
  });

  console.log(`Rendered ${categories.length} category buttons`);
}

/**
 * Update transactions from merged files - Fixed initialization
 */
export function updateTransactions() {
  console.log('Updating transactions from merged files...');

  // Ensure AppState is properly initialized
  if (!AppState) {
    console.error('AppState not available');
    return [];
  }

  // Load transactions from merged files
  const allTransactions = [];

  if (AppState.mergedFiles && AppState.mergedFiles.length > 0) {
    AppState.mergedFiles.forEach(file => {
      if (file.transactions && Array.isArray(file.transactions)) {
        // Use pre-processed transactions from the file
        allTransactions.push(...file.transactions);
      } else if (file.data && file.headerMapping) {
        // Process file data into transactions if not already processed
        const fileTransactions = processFileToTransactions(file);
        allTransactions.push(...fileTransactions);
      }
    });
  }

  // Update AppState
  AppState.transactions = allTransactions;

  // Save to localStorage
  try {
    localStorage.setItem("transactions", JSON.stringify(allTransactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving transactions', 'error');
      }
    });
  }

  // Re-render transactions only if we have a container
  const container = document.getElementById("transactionTableContainer");
  if (container || document.querySelector('.main-content')) {
    renderTransactions(allTransactions, true);
  } else {
    console.log('Transaction container not ready, skipping render');
  }

  console.log(`Updated transactions: ${allTransactions.length} total`);
  return allTransactions;
}

/**
 * Process file data into transaction objects
 */
function processFileToTransactions(file) {
  const transactions = [];

  if (!file.data || !file.headerMapping) {
    console.warn('File missing data or header mapping:', file.fileName);
    return transactions;
  }

  // Get the data starting from the specified row
  const dataStartIndex = file.dataRowIndex || 1;
  const dataRows = file.data.slice(dataStartIndex);

  dataRows.forEach((row, index) => {
    if (!row || row.length === 0) return;

    const transaction = {
      date: '',
      description: '',
      income: '',
      expenses: '',
      currency: file.currency || 'USD',
      category: '',
      fileName: file.fileName
    };

    // Map the row data to transaction fields based on header mapping
    file.headerMapping.forEach((mapping, colIndex) => {
      if (mapping && mapping !== '–' && colIndex < row.length) {
        const value = row[colIndex];
        if (value !== null && value !== undefined) {
          const mappingKey = mapping.toLowerCase();
          transaction[mappingKey] = String(value).trim();
        }
      }
    });

    // Only add if we have essential data
    if (transaction.date || transaction.description || transaction.income || transaction.expenses) {
      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Initialize transaction event listeners including category order changes
 */
export function initializeTransactionEventListeners() {
  console.log("Initializing transaction event listeners");

  // Transaction category change handlers
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('category-select')) {
      const index = parseInt(e.target.dataset.index, 10);
      const newCategory = e.target.value;

      if (AppState.transactions && AppState.transactions[index]) {
        AppState.transactions[index].category = newCategory;

        // Save updated transactions
        try {
          localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
          showToast(`Transaction category updated to ${newCategory}`, 'success');
        } catch (error) {
          console.error('Error saving updated transaction:', error);
          showToast('Error updating transaction category', 'error');
        }
      }
    }
  });

  console.log("Transaction event listeners initialized with category order support");
}
