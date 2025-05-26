import { AppState } from "../core/appState.js";

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
 * Applies current filters to the transaction list
 * @param {Array} transactions - The transactions to filter
 * @returns {Array} Filtered transactions
 */
function applyCurrentFilters(transactions) {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }

  let filteredTransactions = [...transactions];

  // Apply any active filters here
  // For now, return all transactions since no specific filters are implemented
  return filteredTransactions;
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
 * Updates the currency filter dropdown with available currencies
 * @param {Array} transactions - The transactions to analyze for currencies
 */
function updateCurrencyFilter(transactions) {
  const currencyFilter = document.getElementById("currencyFilter");
  if (!currencyFilter) {
    console.warn("Currency filter element not found");
    return;
  }

  // Get unique currencies from transactions
  const currencies = new Set();
  if (transactions && Array.isArray(transactions)) {
    transactions.forEach(tx => {
      if (tx.currency && tx.currency.trim()) {
        currencies.add(tx.currency);
      }
    });
  }

  // Clear existing options except "All Currencies"
  currencyFilter.innerHTML = '<option value="">All Currencies</option>';

  // Add currency options
  const sortedCurrencies = Array.from(currencies).sort();
  sortedCurrencies.forEach(currency => {
    const option = document.createElement("option");
    option.value = currency;
    option.textContent = currency;
    currencyFilter.appendChild(option);
  });

  console.log(`Currency filter updated with currencies: ${sortedCurrencies.join(', ')}`);
}

/**
 * Creates the filter section HTML
 * @returns {string} Filter section HTML
 */
function createFilterSection() {
  return `
    <div class="filter-section">
      <div id="categoryButtons" class="category-buttons-container">
        <!-- Category buttons will be rendered here -->
      </div>
      <div class="currency-filter">
        <label for="currencyFilter">Currency:</label>
        <select id="currencyFilter" class="filter-input">
          <option value="">All Currencies</option>
        </select>
      </div>
    </div>
  `;
}

/**
 * Initializes the filter controls
 */
function initializeFilters() {
  // Initialize currency filter
  const currencyFilter = document.getElementById("currencyFilter");
  if (currencyFilter) {
    currencyFilter.addEventListener('change', handleCurrencyFilterChange);
  }

  // Render category buttons
  renderCategoryButtons();
}

/**
 * Handles currency filter changes
 * @param {Event} event - The change event
 */
function handleCurrencyFilterChange(event) {
  const selectedCurrency = event.target.value;
  console.log(`Currency filter changed to: ${selectedCurrency}`);

  // Apply currency filter to transactions
  const allTransactions = AppState.transactions || [];
  let filteredTransactions;

  if (!selectedCurrency) {
    filteredTransactions = allTransactions;
  } else {
    filteredTransactions = allTransactions.filter(tx => tx.currency === selectedCurrency);
  }

  // Re-render with filtered transactions
  renderTransactions(filteredTransactions, false);
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
 * Attaches event listeners to category filter buttons
 */
function attachCategoryButtonListeners() {
  const categoryButtons = document.querySelectorAll(".category-btn");

  categoryButtons.forEach(button => {
    // Remove any existing listeners by cloning the button
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add the click event listener
    newButton.addEventListener("click", handleCategoryButtonClick);
  });

  console.log(`Attached listeners to ${categoryButtons.length} category buttons`);
}

/**
 * Handles category button click events
 * @param {Event} event - The click event
 */
function handleCategoryButtonClick(event) {
  const button = event.target;
  const category = button.getAttribute("data-category");

  console.log(`Category button clicked: ${category || "All"}`);

  // Update active state
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  button.classList.add("active");

  // Filter transactions by category
  filterByCategory(category);
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
        categoryOrder = [];
      }
    } catch (e) {
      console.warn("Invalid category order in localStorage, clearing corrupted data:", e.message);
      categoryOrder = [];
      // Clear the corrupted data
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

/**
 * Creates the category buttons container if it doesn't exist
 * @returns {HTMLElement|null} The category buttons container
 */
function createCategoryButtonsContainer() {
  const filterSection = document.querySelector(".filter-section");
  if (!filterSection) {
    console.error("Filter section not found, cannot create category buttons container");
    return null;
  }

  const container = document.createElement("div");
  container.id = "categoryButtons";
  container.className = "category-buttons-container";
  container.innerHTML = '<h4>Filter by Category:</h4>';

  filterSection.appendChild(container);
  console.log("Created category buttons container");

  return container;
}

/**
 * Initialize transaction event listeners including category order changes
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
