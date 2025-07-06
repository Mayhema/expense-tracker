import { AppState } from '../../core/appState.js';
import { parseToISODate, parseDDMMYYYY, formatDateToDDMMYYYY } from '../../utils/dateUtils.js';
import { CURRENCIES } from '../../constants/currencies.js';

// Current filter state
const currentFilters = {
  dateRange: 'all',
  customStartDate: null,
  customEndDate: null,
  categories: [],
  minAmount: null,
  maxAmount: null,
  searchText: '',
  currency: 'all'
};

/**
 * Initialize advanced filters
 */
export function initializeAdvancedFilters() {
  console.log('Initializing advanced filters...');

  // Load saved filter preferences
  loadFilterPreferences();

  // Set up event listeners
  setupFilterEventListeners();
}

/**
 * Create advanced filter section HTML
 */
export function createAdvancedFilterSection() {
  const categories = Object.keys(AppState.categories || {}).sort();
  const currencies = [...new Set((AppState.transactions || []).map(tx => tx.currency).filter(Boolean))].sort();

  return `
    <div class="advanced-filters">
      <div class="filter-section">
        <h4>🔍 Advanced Filters</h4>

        <div class="filter-row">
          <!-- Date Range Presets -->
          <div class="filter-group">
            <label for="dateRangePreset">Date Range</label>
            <select id="dateRangePreset" class="filter-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <!-- Custom Date Range - FIXED: Use text inputs with dd/mm/yyyy format -->
          <div class="filter-group custom-date-range" style="display: none;">
            <label for="customStartDate">From Date</label>
            <input type="text" id="customStartDate" class="filter-input date-field" placeholder="dd/mm/yyyy">
          </div>

          <div class="filter-group custom-date-range" style="display: none;">
            <label for="customEndDate">To Date</label>
            <input type="text" id="customEndDate" class="filter-input date-field" placeholder="dd/mm/yyyy">
          </div>

          <!-- Amount Range -->
          <div class="filter-group">
            <label for="minAmount">Min Amount</label>
            <input type="number" id="minAmount" class="filter-input" placeholder="0.00" step="0.01" min="0">
          </div>

          <div class="filter-group">
            <label for="maxAmount">Max Amount</label>
            <input type="number" id="maxAmount" class="filter-input" placeholder="0.00" step="0.01" min="0">
          </div>

          <!-- FIXED: Currency Filter with symbols like transaction table -->
          <div class="filter-group">
            <label for="currencyFilter">Currency</label>
            <select id="currencyFilter" class="filter-select">
              <option value="all">All Currencies</option>
              ${currencies.map(currency => {
    const currencyData = CURRENCIES[currency] || {};
    const symbol = currencyData.symbol || '💱';
    const name = currencyData.name || currency;
    return `<option value="${currency}">${symbol} ${currency} - ${name}</option>`;
  }).join('')}
            </select>
          </div>
        </div>

        <div class="filter-row">
          <!-- Description Search -->
          <div class="filter-group search-group">
            <label for="descriptionSearch">Search Description</label>
            <div class="search-input-wrapper">
              <input type="text" id="descriptionSearch" class="filter-input search-input"
                     placeholder="Search transactions..." autocomplete="off">
              <button type="button" class="search-clear-btn" title="Clear search">×</button>
            </div>
          </div>

          <!-- FIXED: Category Selection with checkboxes and colors like transaction table -->
          <div class="filter-group category-group">
            <label>Categories</label>
            <div class="category-filter-container">
              <button type="button" class="category-select-btn" id="categorySelectBtn">
                <span class="selected-count">All Categories</span>
                <span class="dropdown-arrow">▼</span>
              </button>
              <div class="category-dropdown" id="categoryDropdown">
                <div class="category-search">
                  <input type="text" placeholder="Search categories..." class="category-search-input">
                </div>
                <div class="category-options">
                  <label class="category-option">
                    <input type="checkbox" value="all" class="category-checkbox" checked>
                    <span class="category-label">All Categories</span>
                  </label>
                  ${categories.map(category => {
    const categoryData = AppState.categories[category];
    const color = typeof categoryData === 'string' ? categoryData : categoryData?.color || '#cccccc';
    return `
                      <label class="category-option">
                        <input type="checkbox" value="${category}" class="category-checkbox">
                        <span class="category-color" style="background-color: ${color}"></span>
                        <span class="category-label">● ${category}</span>
                      </label>
                    `;
  }).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Actions -->
          <div class="filter-group filter-actions">
            <button type="button" id="applyFiltersBtn" class="btn primary-btn">Apply Filters</button>
            <button type="button" id="clearAllFiltersBtn" class="btn secondary-btn">Clear All</button>
            <button type="button" id="saveFilterPresetBtn" class="btn secondary-btn">Save Preset</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners for all filter controls
 */
function setupFilterEventListeners() {
  // Date range preset change
  document.addEventListener('change', (e) => {
    if (e.target.id === 'dateRangePreset') {
      handleDateRangePresetChange(e.target.value);
    }
  });

  // Custom date inputs
  document.addEventListener('change', (e) => {
    if (e.target.id === 'customStartDate' || e.target.id === 'customEndDate') {
      handleCustomDateChange();
    }
  });

  // Amount range inputs
  document.addEventListener('input', (e) => {
    if (e.target.id === 'minAmount' || e.target.id === 'maxAmount') {
      handleAmountRangeChange();
    }
  });

  // Description search with debounce
  let searchTimeout;
  document.addEventListener('input', (e) => {
    if (e.target.id === 'descriptionSearch') {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleDescriptionSearch(e.target.value);
      }, 300);
    }
  });

  // Search clear button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('search-clear-btn')) {
      const searchInput = document.getElementById('descriptionSearch');
      if (searchInput) {
        searchInput.value = '';
        handleDescriptionSearch('');
      }
    }
  });

  // Category dropdown toggle
  document.addEventListener('click', (e) => {
    if (e.target.closest('#categorySelectBtn')) {
      toggleCategoryDropdown();
    }
  });

  // Category checkbox changes
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('category-checkbox')) {
      handleCategorySelection(e.target);
    }
  });

  // Currency filter
  document.addEventListener('change', (e) => {
    if (e.target.id === 'currencyFilter') {
      handleCurrencyFilter(e.target.value);
    }
  });

  // Filter action buttons
  document.addEventListener('click', (e) => {
    if (e.target.id === 'applyFiltersBtn') {
      applyCurrentFilters();
    } else if (e.target.id === 'clearAllFiltersBtn') {
      clearAllFilters();
    } else if (e.target.id === 'saveFilterPresetBtn') {
      saveFilterPreset();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-filter-container')) {
      closeCategoryDropdown();
    }
  });
}

/**
 * Handle date range preset changes
 */
function handleDateRangePresetChange(preset) {
  currentFilters.dateRange = preset;

  const customRangeElements = document.querySelectorAll('.custom-date-range');

  if (preset === 'custom') {
    customRangeElements.forEach(el => el.style.display = 'flex');
  } else {
    customRangeElements.forEach(el => el.style.display = 'none');

    // Calculate date range based on preset
    const { startDate, endDate } = calculateDateRange(preset);
    currentFilters.customStartDate = startDate;
    currentFilters.customEndDate = endDate;

    // FIXED: Update the custom date inputs with formatted dates
    const startDateInput = document.getElementById('customStartDate');
    const endDateInput = document.getElementById('customEndDate');

    if (startDateInput && startDate) {
      startDateInput.value = formatDateToDDMMYYYY(startDate.toISOString());
    }
    if (endDateInput && endDate) {
      endDateInput.value = formatDateToDDMMYYYY(endDate.toISOString());
    }
  }

  applyCurrentFilters();
}

/**
 * Calculate date range based on preset
 */
function calculateDateRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }

    case 'last7days': {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { startDate: last7, endDate: today };
    }

    case 'last30days': {
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { startDate: last30, endDate: today };
    }

    case 'thisWeek': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { startDate: startOfWeek, endDate: today };
    }

    case 'lastWeek': {
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { startDate: lastWeekStart, endDate: lastWeekEnd };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth, endDate: today };
    }

    case 'lastMonth': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    }

    case 'thisQuarter': {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { startDate: quarterStart, endDate: today };
    }

    case 'thisYear': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { startDate: yearStart, endDate: today };
    }

    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Handle custom date input changes - FIXED: Use dd/mm/yyyy format
 */
function handleCustomDateChange() {
  const startDateInput = document.getElementById('customStartDate');
  const endDateInput = document.getElementById('customEndDate');

  if (startDateInput && endDateInput) {
    // Parse dd/mm/yyyy format
    currentFilters.customStartDate = startDateInput.value ? parseDDMMYYYY(startDateInput.value) : null;
    currentFilters.customEndDate = endDateInput.value ? parseDDMMYYYY(endDateInput.value) : null;
    applyCurrentFilters();
  }
}

/**
 * Handle amount range changes
 */
function handleAmountRangeChange() {
  const minAmountInput = document.getElementById('minAmount');
  const maxAmountInput = document.getElementById('maxAmount');

  currentFilters.minAmount = minAmountInput?.value ? parseFloat(minAmountInput.value) : null;
  currentFilters.maxAmount = maxAmountInput?.value ? parseFloat(maxAmountInput.value) : null;

  applyCurrentFilters();
}

/**
 * Handle description search
 */
function handleDescriptionSearch(searchText) {
  currentFilters.searchText = searchText.toLowerCase().trim();

  // Update clear button visibility
  const clearBtn = document.querySelector('.search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = searchText ? 'block' : 'none';
  }

  applyCurrentFilters();
}

/**
 * Handle currency filter
 */
function handleCurrencyFilter(currency) {
  console.log(`CRITICAL: handleCurrencyFilter called with currency: "${currency}"`);
  console.log(`CRITICAL: Previous currency filter was: "${currentFilters.currency}"`);

  currentFilters.currency = currency;

  console.log(`CRITICAL: Updated currency filter to: "${currentFilters.currency}"`);
  console.log('CRITICAL: Calling applyCurrentFilters...');

  applyCurrentFilters();
}

/**
 * Toggle category dropdown
 */
function toggleCategoryDropdown() {
  const dropdown = document.getElementById('categoryDropdown');
  if (dropdown) {
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
  }
}

/**
 * Close category dropdown
 */
function closeCategoryDropdown() {
  const dropdown = document.getElementById('categoryDropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
}

/**
 * Handle category selection
 */
function handleCategorySelection(checkbox) {
  const value = checkbox.value;

  if (value === 'all') {
    handleAllCategoriesSelection(checkbox);
  } else {
    handleIndividualCategorySelection(checkbox, value);
  }

  updateCategoryButtonText();
  applyCurrentFilters();
}

/**
 * Handle "All Categories" checkbox selection
 */
function handleAllCategoriesSelection(checkbox) {
  const allCheckboxes = document.querySelectorAll('.category-checkbox');
  const isChecked = checkbox.checked;

  allCheckboxes.forEach(cb => {
    cb.checked = isChecked;
  });

  currentFilters.categories = isChecked ? [] : Object.keys(AppState.categories || {});
}

/**
 * Handle individual category checkbox selection
 */
function handleIndividualCategorySelection(checkbox, value) {
  const allCheckbox = document.querySelector('.category-checkbox[value="all"]');

  if (checkbox.checked) {
    addCategoryToFilter(value);
  } else {
    removeCategoryFromFilter(value, allCheckbox);
  }

  checkAllCategoriesIfNeeded(allCheckbox);
}

/**
 * Add category to filter if not already included
 */
function addCategoryToFilter(value) {
  if (!currentFilters.categories.includes(value)) {
    currentFilters.categories.push(value);
  }
}

/**
 * Remove category from filter and uncheck "All Categories"
 */
function removeCategoryFromFilter(value, allCheckbox) {
  currentFilters.categories = currentFilters.categories.filter(cat => cat !== value);

  if (allCheckbox) {
    allCheckbox.checked = false;
  }
}

/**
 * Check "All Categories" if all individual categories are selected
 */
function checkAllCategoriesIfNeeded(allCheckbox) {
  const totalCategories = Object.keys(AppState.categories || {}).length;
  if (currentFilters.categories.length === totalCategories && allCheckbox) {
    allCheckbox.checked = true;
    currentFilters.categories = [];
  }
}

/**
 * Update category button text based on selection
 */
function updateCategoryButtonText() {
  const button = document.querySelector('#categorySelectBtn .selected-count');
  if (!button) return;

  const totalCategories = Object.keys(AppState.categories || {}).length;
  const selectedCount = currentFilters.categories.length;

  if (selectedCount === 0 || selectedCount === totalCategories) {
    button.textContent = 'All Categories';
  } else if (selectedCount === 1) {
    button.textContent = currentFilters.categories[0];
  } else {
    button.textContent = `${selectedCount} Categories`;
  }
}

/**
 * Apply current filters to transactions
 */
export function applyCurrentFilters() {
  const transactions = AppState.transactions || [];
  const filteredTransactions = filterTransactions(transactions, currentFilters);

  console.log(`CRITICAL: applyCurrentFilters - filtering ${transactions.length} transactions to ${filteredTransactions.length} with currency: ${currentFilters.currency}`);

  // Update the transaction display
  import('../transactionManager.js').then(module => {
    if (module.updateTransactionDisplay) {
      console.log('CRITICAL: Calling updateTransactionDisplay with filtered transactions');
      module.updateTransactionDisplay(filteredTransactions);
    } else {
      console.error('CRITICAL ERROR: updateTransactionDisplay function not found in transaction manager');
    }
  }).catch(error => {
    console.error('CRITICAL ERROR: Failed to import transaction manager:', error);
  });

  // FIXED: Update charts with filtered data properly
  setTimeout(async () => {
    try {
      const chartsModule = await import('../charts.js');
      if (chartsModule && chartsModule.updateChartsWithFilteredData) {
        console.log('CRITICAL: Calling updateChartsWithFilteredData with filtered transactions');
        chartsModule.updateChartsWithFilteredData(filteredTransactions);
        console.log("Charts updated with filtered data");
      } else {
        console.error('CRITICAL ERROR: updateChartsWithFilteredData function not found in charts module');
      }
    } catch (error) {
      console.log('Charts not available for filter update:', error.message);
    }
  }, 100);

  console.log(`Applied filters: ${filteredTransactions.length} of ${transactions.length} transactions shown`);
}

/**
 * Check if transaction passes date range filter
 */
function passesDateFilter(tx, filters) {
  if (!filters.customStartDate && !filters.customEndDate) {
    return true;
  }

  const txDate = parseToISODate(tx.date);
  if (!txDate) return false;

  const transactionDate = new Date(txDate);

  if (filters.customStartDate && transactionDate < filters.customStartDate) {
    return false;
  }

  return !(filters.customEndDate && transactionDate > filters.customEndDate);
}

/**
 * Check if transaction passes amount range filter
 */
function passesAmountFilter(tx, filters) {
  const amount = parseFloat(tx.income || tx.expenses || 0);

  return !(filters.minAmount !== null && amount < filters.minAmount) &&
    !(filters.maxAmount !== null && amount > filters.maxAmount);
}

/**
 * Check if transaction passes category filter
 */
function passesCategoryFilter(tx, filters) {
  if (filters.categories.length === 0) {
    return true;
  }

  const txCategory = tx.category || 'Uncategorized';
  return filters.categories.includes(txCategory);
}

/**
 * Check if transaction passes currency filter
 */
function passesCurrencyFilter(tx, filters) {
  return filters.currency === 'all' || tx.currency === filters.currency;
}

/**
 * Check if transaction passes description search filter
 */
function passesDescriptionFilter(tx, filters) {
  if (!filters.searchText) {
    return true;
  }

  const description = (tx.description || '').toLowerCase();
  return description.includes(filters.searchText);
}

/**
 * Filter transactions based on current filters
 */
export function filterTransactions(transactions, filters = currentFilters) {
  return transactions.filter(tx => {
    return passesDateFilter(tx, filters) &&
      passesAmountFilter(tx, filters) &&
      passesCategoryFilter(tx, filters) &&
      passesCurrencyFilter(tx, filters) &&
      passesDescriptionFilter(tx, filters);
  });
}

/**
 * Clear all filters - FIXED: Reset date inputs to empty
 */
function clearAllFilters() {
  Object.assign(currentFilters, {
    dateRange: 'all',
    customStartDate: null,
    customEndDate: null,
    categories: [],
    minAmount: null,
    maxAmount: null,
    searchText: '',
    currency: 'all'
  });

  // Reset UI elements
  const dateRangeSelect = document.getElementById('dateRangePreset');
  if (dateRangeSelect) dateRangeSelect.value = 'all';

  const customDateInputs = document.querySelectorAll('.custom-date-range input');
  customDateInputs.forEach(input => input.value = '');

  // FIXED: Hide custom date range inputs
  const customRangeElements = document.querySelectorAll('.custom-date-range');
  customRangeElements.forEach(el => el.style.display = 'none');

  const amountInputs = document.querySelectorAll('#minAmount, #maxAmount');
  amountInputs.forEach(input => input.value = '');

  const searchInput = document.getElementById('descriptionSearch');
  if (searchInput) searchInput.value = '';

  const clearBtn = document.querySelector('.search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';

  const currencySelect = document.getElementById('currencyFilter');
  if (currencySelect) currencySelect.value = 'all';

  // Reset category checkboxes
  const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
  categoryCheckboxes.forEach(cb => {
    cb.checked = cb.value === 'all';
  });

  updateCategoryButtonText();
  applyCurrentFilters();
}

/**
 * Save filter preset
 */
function saveFilterPreset() {
  const presetName = prompt('Enter a name for this filter preset:');
  if (!presetName) return;

  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  savedPresets[presetName] = { ...currentFilters };

  localStorage.setItem('filterPresets', JSON.stringify(savedPresets));

  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Filter preset "${presetName}" saved`, 'success');
    }
  });
}

/**
 * Load filter preferences
 */
function loadFilterPreferences() {
  const savedFilters = localStorage.getItem('currentFilters');
  if (savedFilters) {
    try {
      Object.assign(currentFilters, JSON.parse(savedFilters));
    } catch (error) {
      console.warn('Error loading filter preferences:', error);
    }
  }
}

/**
 * Save filter preferences
 */
function saveFilterPreferences() {
  localStorage.setItem('currentFilters', JSON.stringify(currentFilters));
}

/**
 * Update currency filter dropdowns to include all currencies present in transactions
 */
export function updateCurrencyFilterOptions() {
  console.log('Updating currency filter dropdown options...');

  // Get all unique currencies from current transactions
  const currencies = [...new Set((AppState.transactions || []).map(tx => tx.currency).filter(Boolean))].sort();
  console.log('Available currencies:', currencies);

  // Update the advanced filter currency dropdown
  const currencyFilter = document.getElementById('currencyFilter');
  if (currencyFilter) {
    const currentValue = currencyFilter.value;

    // Rebuild options
    currencyFilter.innerHTML = `
      <option value="all">All Currencies</option>
      ${currencies.map(currency => {
      const currencyData = CURRENCIES[currency] || {};
      const symbol = currencyData.symbol || '💱';
      const name = currencyData.name || currency;
      return `<option value="${currency}">${symbol} ${currency} - ${name}</option>`;
    }).join('')}
    `;

    // Restore previous selection if still valid
    if (currentValue && (currentValue === 'all' || currencies.includes(currentValue))) {
      currencyFilter.value = currentValue;
    }

    console.log('Updated advanced currency filter with', currencies.length, 'currencies');
  }

  // Update the basic filter currency dropdown if it exists
  const basicCurrencyFilter = document.getElementById('filterCurrency');
  if (basicCurrencyFilter) {
    const currentBasicValue = basicCurrencyFilter.value;

    // Rebuild basic filter options
    basicCurrencyFilter.innerHTML = `
      <option value="">All Currencies</option>
      ${currencies.map(currency => `<option value="${currency}">${currency}</option>`).join('')}
    `;

    // Restore previous selection if still valid
    if (currentBasicValue && (currentBasicValue === '' || currencies.includes(currentBasicValue))) {
      basicCurrencyFilter.value = currentBasicValue;
    }

    console.log('Updated basic currency filter with', currencies.length, 'currencies');
  }
}

// Export current filters for external access
export { currentFilters };
