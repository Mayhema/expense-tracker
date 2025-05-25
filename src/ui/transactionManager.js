import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";

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
    } else if (category === 'Other') {
      filteredTransactions = allTransactions.filter(tx =>
        !tx.category ||
        tx.category.toLowerCase() === 'other' ||
        tx.category.trim() === ''
      );
    } else {
      filteredTransactions = allTransactions.filter(tx =>
        tx.category === category
      );
    }

    console.log(`Found ${filteredTransactions.length} transactions for category "${category}"`);

    // REMOVED: No more calls to updateCategoryFilterDropdown
    // Re-render transactions with filtered data
    renderTransactions(filteredTransactions, false);

    // Update currency filter with current filtered data
    updateCurrencyFilter(filteredTransactions);

  } catch (error) {
    console.error("Error filtering by category:", error);
    import("./uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast("Error filtering transactions", "error");
      }
    });
  }
}

/**
 * Renders transactions with proper container management - FIXED duplicate content
 */
export function renderTransactions(transactions, updateCharts = true) {
  console.log(`Rendering ${transactions.length} transactions`);

  const container = document.getElementById("transactionTableContainer");
  if (!container) {
    console.error("Transaction table container not found");
    return;
  }

  // Apply filters to get final transaction list
  const filteredTransactions = applyCurrentFilters(transactions);

  // CRITICAL FIX: Check if container already has content to prevent duplication
  const hasFilterSection = container.querySelector('.filter-section');

  if (!hasFilterSection) {
    // Only add filter section if it doesn't exist
    const filterHtml = createFilterSection();
    container.insertAdjacentHTML('afterbegin', filterHtml);

    // Initialize filters after adding them
    initializeFilters();
  }

  // Remove only the transaction content, keep the filter section
  const existingTable = container.querySelector('.transaction-table');
  const existingNoTransactions = container.querySelector('.no-transactions');

  if (existingTable) {
    existingTable.remove();
  }
  if (existingNoTransactions) {
    existingNoTransactions.remove();
  }

  // Generate and add NEW transaction content
  const tableHtml = generateTransactionTableHTML(filteredTransactions);
  container.insertAdjacentHTML('beforeend', tableHtml);

  // Update currency filter with current data
  updateCurrencyFilter(transactions);

  console.log(`Rendered ${filteredTransactions.length} filtered transactions`);

  // Update charts if requested
  if (updateCharts) {
    setTimeout(() => {
      if (typeof window.updateChartsWithCurrentData === 'function') {
        window.updateChartsWithCurrentData();
      }
    }, 100);
  }
}

/**
 * Creates the filter section HTML without category dropdown
 */
function createFilterSection() {
  return `
    <div class="filter-section">
      <div class="filter-group">
        <label for="filterStartDate">Start Date</label>
        <input type="date" id="filterStartDate" class="filter-input">
      </div>

      <div class="filter-group">
        <label for="filterEndDate">End Date</label>
        <input type="date" id="filterEndDate" class="filter-input">
      </div>

      <div class="filter-group">
        <label for="searchFilter">Search</label>
        <input type="text" id="searchFilter" class="filter-input" placeholder="Search descriptions...">
      </div>

      <div class="filter-group">
        <label for="currencyFilter">Currency</label>
        <select id="currencyFilter" class="filter-input">
          <option value="">All Currencies</option>
        </select>
      </div>

      <div class="filter-group">
        <button id="clearFiltersBtn" class="filter-input" style="background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 4px;">
          Clear All
        </button>
      </div>
    </div>
  `;
}

/**
 * Update currency filter dropdown with actual currencies from all transactions
 */
function updateCurrencyFilterDropdown() {
  const currencyFilter = document.getElementById("currencyFilter");
  if (!currencyFilter) {
    console.warn("Currency filter dropdown not found");
    return;
  }

  // Get unique currencies from transactions
  const currencies = new Set();
  if (AppState.transactions && AppState.transactions.length > 0) {
    AppState.transactions.forEach(tx => {
      if (tx.currency && tx.currency.trim() !== '') {
        currencies.add(tx.currency);
      }
    });
  }

  // Clear and rebuild
  currencyFilter.innerHTML = '<option value="">All Currencies</option>';

  if (currencies.size === 0) {
    // Add default option if no transactions have currencies
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "No currencies found";
    defaultOption.disabled = true;
    currencyFilter.appendChild(defaultOption);
    console.log("No currencies found in transactions");
  } else {
    Array.from(currencies).sort().forEach(currency => {
      const option = document.createElement("option");
      option.value = currency;
      option.textContent = currency;
      currencyFilter.appendChild(option);
    });
    console.log(`Currency filter updated with currencies: ${Array.from(currencies).join(', ')}`);
  }
}

/**
 * Generates transaction table HTML (fixed without Source File column and with proper date formatting)
 */
function generateTransactionTableHTML(transactions) {
  if (transactions.length === 0) {
    return `
      <div class="no-transactions">
        <p>No transactions found. Upload a file to get started!</p>
      </div>
    `;
  }

  let html = `
    <table class="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Currency</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
  `;

  transactions.forEach((tx, index) => {
    const category = tx.category || 'Uncategorized';
    const categoryColor = getCategoryColor(category);
    const formattedDate = formatDate(tx.date);

    html += `
      <tr data-index="${index}">
        <td>${formattedDate}</td>
        <td class="description-cell" title="${tx.description || ''}">${tx.description || 'N/A'}</td>
        <td class="income-cell">${formatCurrency(tx.income)}</td>
        <td class="expense-cell">${formatCurrency(tx.expenses)}</td>
        <td>${tx.currency || 'N/A'}</td>
        <td>
          <select class="category-select" data-index="${index}" style="background-color: ${categoryColor}; color: ${getContrastColor(categoryColor)}; border: none; padding: 4px 8px; border-radius: 4px;">
            ${generateCategoryOptions(category)}
          </select>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

/**
 * Format date properly handling Excel date numbers
 */
function formatDate(dateValue) {
  if (!dateValue) return 'N/A';

  // Handle Excel date numbers (days since 1900-01-01)
  if (typeof dateValue === 'number' && dateValue > 35000 && dateValue < 50000) {
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
    return jsDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  // Handle string dates
  const dateStr = String(dateValue).trim();
  const date = new Date(dateStr);

  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  // If all else fails, return as-is
  return dateStr;
}

/**
 * Generate category options for dropdown
 */
function generateCategoryOptions(selectedCategory) {
  const categories = AppState.categories || {};
  const categoryNames = Object.keys(categories)
    .filter(name => name.toLowerCase() !== 'other')
    .sort();

  let options = '<option value="">Uncategorized</option>';

  categoryNames.forEach(categoryName => {
    const isSelected = categoryName === selectedCategory ? 'selected' : '';
    options += `<option value="${categoryName}" ${isSelected}>${categoryName}</option>`;
  });

  return options;
}

/**
 * Creates the transaction table container if it doesn't exist
 */
function createTransactionTableContainer() {
  // Look for the transactions section
  const transactionsSection = document.getElementById("transactionsSection");
  if (!transactionsSection) {
    console.error("Transactions section not found");
    return null;
  }

  // Create the container
  const container = document.createElement("div");
  container.id = "transactionTableContainer";
  container.className = "transaction-table-container";

  // Add to section content
  const sectionContent = transactionsSection.querySelector(".section-content");
  if (sectionContent) {
    sectionContent.appendChild(container);
  } else {
    transactionsSection.appendChild(container);
  }

  console.log("Created transaction table container");
  return container;
}

/**
 * Get category color from AppState
 */
function getCategoryColor(categoryName) {
  if (!AppState.categories || !categoryName) return '#cccccc';

  const category = AppState.categories[categoryName];
  if (typeof category === 'string') {
    return category;
  } else if (typeof category === 'object' && category.color) {
    return category.color;
  }

  return '#cccccc';
}

/**
 * Get contrasting text color for background
 */
function getContrastColor(hexColor) {
  if (!hexColor || hexColor === '#cccccc') return '#000000';

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Format currency values
 */
function formatCurrency(value) {
  if (!value || value === '0' || value === 0) return '';

  const num = parseFloat(value);
  if (isNaN(num)) return '';

  return num.toFixed(2);
}

/**
 * Apply filters to transactions
 */
function applyFilters(transactions) {
  // For now, return all transactions
  // Filter logic would go here based on form inputs
  return transactions;
}

/**
 * Initialize filter event listeners and category change handlers
 */
function initializeFilters() {
  const filterIds = ['filterStartDate', 'filterEndDate', 'searchFilter', 'currencyFilter'];

  filterIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        renderTransactions(AppState.transactions, false);
      });

      if (id === 'searchFilter') {
        element.addEventListener('input', () => {
          renderTransactions(AppState.transactions, false);
        });
      }
    }
  });

  // Clear filters button
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.value = '';
        }
      });
      renderTransactions(AppState.transactions, false);
    });
  }

  // Add category change listeners
  addCategoryChangeListeners();
}

/**
 * Add category change listeners to transaction table
 */
function addCategoryChangeListeners() {
  // Use event delegation for category selects
  const transactionContainer = document.getElementById("transactionTableContainer");
  if (transactionContainer) {
    transactionContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('category-select')) {
        const index = parseInt(e.target.getAttribute('data-index'));
        const newCategory = e.target.value || 'Uncategorized';

        if (AppState.transactions && AppState.transactions[index]) {
          AppState.transactions[index].category = newCategory;

          // Save to localStorage
          localStorage.setItem("transactions", JSON.stringify(AppState.transactions));

          // Update select styling
          const categoryColor = getCategoryColor(newCategory);
          e.target.style.backgroundColor = categoryColor;
          e.target.style.color = getContrastColor(categoryColor);

          console.log(`Updated transaction ${index} category to: ${newCategory}`);
          showToast(`Transaction categorized as ${newCategory}`, "success");
        }
      }
    });
  }
}

/**
 * Initialize transaction UI event listeners
 */
export function initializeTransactionEventListeners() {
  // Listen for category order changes
  document.addEventListener('categoryOrderChanged', (event) => {
    console.log('Category order changed, updating category buttons');
    renderCategoryButtons();
  });

  // Listen for category updates
  document.addEventListener('categoriesUpdated', (event) => {
    console.log('Categories updated, refreshing UI');
    renderCategoryButtons();
  });

  console.log("Transaction event listeners initialized with category order support");
}

/**
 * Update transactions from merged files
 */
export function updateTransactions() {
  // Load transactions from merged files
  const allTransactions = [];

  if (AppState.mergedFiles && AppState.mergedFiles.length > 0) {
    AppState.mergedFiles.forEach(file => {
      if (file.selected && file.data && file.headerMapping) {
        // Process file data into transactions
        const fileTransactions = processFileToTransactions(file);
        allTransactions.push(...fileTransactions);
      }
    });
  }

  // Update AppState
  AppState.transactions = allTransactions;

  // Save to localStorage
  localStorage.setItem("transactions", JSON.stringify(allTransactions));

  // Re-render transactions
  renderTransactions(allTransactions, true);

  console.log(`Updated transactions: ${allTransactions.length} total`);
}

/**
 * Process file data into transaction objects
 */
function processFileToTransactions(file) {
  const transactions = [];

  if (!file.data || !file.headerMapping) return transactions;

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
          transaction[mapping.toLowerCase()] = String(value).trim();
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
 * Renders category filter buttons with proper colors and saved order
 */
export function renderCategoryButtons() {
  console.log("Rendering category buttons");

  let container = document.getElementById("categoryButtons");
  if (!container) {
    console.warn("Category buttons container not found, creating it");
    container = createCategoryButtonsContainer();
    if (!container) {
      console.error("Failed to create category buttons container");
      return;
    }
  }

  const categories = AppState.categories || {};

  // Get saved category order from localStorage
  const savedOrder = localStorage.getItem("categoryOrder");
  let categoryOrder = [];

  if (savedOrder) {
    try {
      categoryOrder = JSON.parse(savedOrder);
      // Validate that it's an array
      if (!Array.isArray(categoryOrder)) {
        throw new Error("Category order is not an array");
      }
    } catch (e) {
      console.warn("Invalid category order in localStorage, using default:", e.message);
      categoryOrder = [];
      // Clear the invalid data from localStorage
      localStorage.removeItem("categoryOrder");
    }
  }

  // Get ordered category names, filtering out removed categories
  let orderedCategoryNames = categoryOrder.filter(name => categories[name]);

  // Add any new categories not in the saved order
  Object.keys(categories).forEach(name => {
    if (!orderedCategoryNames.includes(name) && name.toLowerCase() !== 'other') {
      orderedCategoryNames.push(name);
    }
  });

  // Clear existing buttons
  container.innerHTML = '';

  // Add "All" button
  const allButton = document.createElement("button");
  allButton.className = "category-btn active";
  allButton.setAttribute("data-category", "");
  allButton.textContent = "All";
  allButton.style.background = "#6c757d";
  allButton.style.color = "white";
  container.appendChild(allButton);

  // Add category buttons in saved order
  orderedCategoryNames.forEach(categoryName => {
    const category = categories[categoryName];
    const color = typeof category === 'object' ? category.color : category;

    const button = document.createElement("button");
    button.className = "category-btn";
    button.setAttribute("data-category", categoryName);
    button.textContent = categoryName;
    button.style.background = color || "#cccccc";
    button.style.color = getContrastColor(color || "#cccccc");

    container.appendChild(button);
  });

  // Only add "Other" button if there are uncategorized transactions
  const hasUncategorized = (AppState.transactions || []).some(tx =>
    !tx.category || tx.category.toLowerCase() === 'other' || tx.category.trim() === ''
  );

  if (hasUncategorized) {
    const otherButton = document.createElement("button");
    otherButton.className = "category-btn";
    otherButton.setAttribute("data-category", "Other");
    otherButton.textContent = "Uncategorized";
    otherButton.style.background = "#6c757d";
    otherButton.style.color = "white";
    container.appendChild(otherButton);
  }

  // Attach event listeners
  attachCategoryButtonListeners();

  const totalButtons = orderedCategoryNames.length + 1 + (hasUncategorized ? 1 : 0);
  console.log(`Rendered ${totalButtons} category buttons in saved order`);
}
