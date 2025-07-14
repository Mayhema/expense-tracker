import { AppState } from '../../core/appState.js';
import { parseToISODate, formatDateToDDMMYYYY } from '../../utils/dateUtils.js';
import { CURRENCIES } from '../../constants/currencies.js';
import { showModal } from '../modalManager.js';

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

// Track if event listeners have been set up to prevent duplication
let eventListenersInitialized = false;

/**
 * Initialize advanced filters
 */
export function initializeAdvancedFilters() {
  console.log('Initializing advanced filters...');

  // Load saved filter preferences
  loadFilterPreferences();

  // Set up event listeners only once
  if (!eventListenersInitialized) {
    setupFilterEventListeners();
    eventListenersInitialized = true;
  }

  // Initialize filter status with current transaction count
  const transactions = AppState.transactions || [];
  updateFilterStatus(transactions.length, transactions.length);
}

/**
 * Create advanced filter section HTML
 */
export function createAdvancedFilterSection() {
  const categories = Object.keys(AppState.categories || {}).sort((a, b) => a.localeCompare(b));
  const currencies = [...new Set((AppState.transactions || []).map(tx => tx.currency).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  const presetNames = Object.keys(savedPresets);

  return `
    <div class="advanced-filters">
      <div class="filter-section">
        <div class="filter-header">
          <h4>🔍 Advanced Filters</h4>
          <div class="filter-preset-section">
            <select id="presetSelector" class="preset-selector">
              <option value="">Choose Saved Preset</option>
              ${presetNames.map(name => `<option value="${name}">📋 ${name}</option>`).join('')}
            </select>
            <button type="button" id="saveFilterPresetBtn" class="btn preset-btn" title="Save current filters as preset">
              💾 Save Preset
            </button>
            ${presetNames.length > 0 ? `
              <button type="button" id="managePresetsBtn" class="btn preset-btn" title="Manage saved presets">
                ⚙️ Manage
              </button>
            ` : ''}
          </div>
        </div>

        <div class="filter-grid">
          <!-- Date Range Section -->
          <div class="filter-card">
            <div class="filter-card-header">
              <span class="filter-icon">📅</span>
              <label>Date Range</label>
            </div>
            <div class="filter-card-content">
              <select id="dateRangePreset" class="filter-select modern-select">
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

              <div class="custom-date-inputs" style="display: none;">
                <div class="date-input-group">
                  <label>From</label>
                  <input type="text" id="customStartDate" class="filter-input date-field" placeholder="dd/mm/yyyy">
                </div>
                <div class="date-input-group">
                  <label>To</label>
                  <input type="text" id="customEndDate" class="filter-input date-field" placeholder="dd/mm/yyyy">
                </div>
              </div>
            </div>
          </div>

          <!-- Amount Range Section -->
          <div class="filter-card">
            <div class="filter-card-header">
              <span class="filter-icon">💰</span>
              <label>Amount Range</label>
            </div>
            <div class="filter-card-content">
              <div class="amount-inputs">
                <div class="amount-input-group">
                  <label>Min</label>
                  <input type="number" id="minAmount" class="filter-input modern-input" placeholder="0.00" step="0.01" min="0">
                </div>
                <div class="amount-input-group">
                  <label>Max</label>
                  <input type="number" id="maxAmount" class="filter-input modern-input" placeholder="0.00" step="0.01" min="0">
                </div>
              </div>
            </div>
          </div>

          <!-- Currency Section -->
          <div class="filter-card">
            <div class="filter-card-header">
              <span class="filter-icon">💱</span>
              <label>Currency</label>
            </div>
            <div class="filter-card-content">
              <select id="currencyFilter" class="filter-select modern-select">
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

          <!-- Search Section -->
          <div class="filter-card">
            <div class="filter-card-header">
              <span class="filter-icon">🔍</span>
              <label>Search</label>
            </div>
            <div class="filter-card-content">
              <div class="search-input-wrapper">
                <input type="text" id="descriptionSearch" class="filter-input search-input modern-input"
                       placeholder="Search descriptions..." autocomplete="off">
                <button type="button" class="search-clear-btn" title="Clear search">×</button>
              </div>
            </div>
          </div>

          <!-- Categories Section -->
          <div class="filter-card category-card">
            <div class="filter-card-header">
              <span class="filter-icon">🏷️</span>
              <label>Categories</label>
            </div>
            <div class="filter-card-content">
              <div class="category-filter-container">
                <button type="button" class="category-select-btn modern-btn" id="categorySelectBtn">
                  <span class="selected-count">All Categories</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div class="category-dropdown" id="categoryDropdown">
                  <div class="category-search">
                    <input type="text" placeholder="Search categories..." class="category-search-input modern-input">
                  </div>
                  <div class="category-options">
                    <label class="category-option">
                      <input type="checkbox" value="all" class="category-checkbox" checked>
                      <span class="category-checkmark"></span>
                      <span class="category-label">All Categories</span>
                    </label>
                    ${categories.map(category => {
    const categoryData = AppState.categories[category];
    const color = typeof categoryData === 'string' ? categoryData : categoryData?.color || '#cccccc';
    return `
                        <label class="category-option">
                          <input type="checkbox" value="${category}" class="category-checkbox">
                          <span class="category-checkmark"></span>
                          <span class="category-color" style="background-color: ${color}"></span>
                          <span class="category-label">${category}</span>
                        </label>
                      `;
  }).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="filter-actions">
          <button type="button" id="applyFiltersBtn" class="btn primary-btn action-btn">
            ✨ Apply Filters
          </button>
          <button type="button" id="clearAllFiltersBtn" class="btn secondary-btn action-btn">
            🧹 Clear All
          </button>
          <div class="filter-status" id="filterStatus">
            <span class="status-text">Loading filters...</span>
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
      showSavePresetModal();
    } else if (e.target.id === 'managePresetsBtn') {
      showManagePresetsModal();
    }
  });

  // Preset selector change
  document.addEventListener('change', (e) => {
    if (e.target.id === 'presetSelector') {
      if (e.target.value) {
        loadFilterPreset(e.target.value);
      }
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
    currentFilters.customStartDate = startDateInput.value ? parseToISODate(startDateInput.value) : null;
    currentFilters.customEndDate = endDateInput.value ? parseToISODate(endDateInput.value) : null;
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

  // Update filter status
  updateFilterStatus(transactions.length, filteredTransactions.length);

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
      if (chartsModule?.updateChartsWithFilteredData) {
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
 * Update the filter status display
 */
function updateFilterStatus(totalCount, filteredCount) {
  const statusElement = document.getElementById('filterStatus');
  if (!statusElement) return;

  const statusText = statusElement.querySelector('.status-text');
  if (!statusText) return;

  // Count active filters
  const activeFilters = getActiveFilterCount();

  if (activeFilters === 0) {
    statusText.textContent = `Showing all ${totalCount} transactions`;
    statusElement.className = 'filter-status';
  } else if (filteredCount === totalCount) {
    statusText.textContent = `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active, no results filtered`;
    statusElement.className = 'filter-status filter-active';
  } else {
    statusText.textContent = `Showing ${filteredCount} of ${totalCount} transactions (${activeFilters} filter${activeFilters > 1 ? 's' : ''})`;
    statusElement.className = 'filter-status filter-active';
  }
}

/**
 * Count the number of active filters
 */
function getActiveFilterCount() {
  let count = 0;

  // Date range filter
  if (currentFilters.dateRange && currentFilters.dateRange !== 'all') {
    count++;
  }

  // Categories filter
  if (currentFilters.categories && currentFilters.categories.length > 0) {
    count++;
  }

  // Amount range filter
  if (currentFilters.minAmount !== null || currentFilters.maxAmount !== null) {
    count++;
  }

  // Search filter
  if (currentFilters.searchText && currentFilters.searchText.trim() !== '') {
    count++;
  }

  // Currency filter
  if (currentFilters.currency && currentFilters.currency !== 'all') {
    count++;
  }

  return count;
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

  // Update status to show all transactions
  const totalTransactions = (AppState.transactions || []).length;
  updateFilterStatus(totalTransactions, totalTransactions);
}

/**
 * Show modal to save filter preset
 */
function showSavePresetModal() {
  const modal = showModal({
    title: '💾 Save Filter Preset',
    content: `
      <div class="preset-save-modal">
        <div class="form-group">
          <label for="presetName">Preset Name:</label>
          <input type="text" id="presetName" class="preset-input" placeholder="Enter preset name...">
        </div>
        <div class="form-group">
          <label>Current Filters:</label>
          <div class="current-filters-preview">
            ${getFiltersPreview()}
          </div>
        </div>
      </div>
    `,
    size: 'medium',
    showCloseButton: true,
    closeOnClickOutside: true
  });

  if (modal) {
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Save Preset';
    saveButton.className = 'btn primary-btn';
    saveButton.onclick = () => {
      const nameInput = document.getElementById('presetName');
      const presetName = nameInput?.value?.trim();

      if (!presetName) {
        nameInput?.focus();
        return;
      }

      // Save the preset
      const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
      savedPresets[presetName] = { ...currentFilters };
      localStorage.setItem('filterPresets', JSON.stringify(savedPresets));

      // Update UI
      updatePresetSelector();

      // Show success message
      import('../uiManager.js').then(module => {
        if (module.showToast) {
          module.showToast(`Filter preset "${presetName}" saved`, 'success');
        }
      });

      modal.close();
    };

    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn secondary-btn';
    cancelButton.onclick = () => modal.close();

    // Add buttons to modal
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    modal.content.appendChild(buttonContainer);

    // Focus on input
    setTimeout(() => {
      const nameInput = document.getElementById('presetName');
      nameInput?.focus();
    }, 100);
  }
}

/**
 * Show modal to manage existing presets
 */
function showManagePresetsModal() {
  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  const presetNames = Object.keys(savedPresets);

  if (presetNames.length === 0) {
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('No saved presets found', 'info');
      }
    });
    return;
  }

  const modal = showModal({
    title: '⚙️ Manage Filter Presets',
    content: `
      <div class="preset-manage-modal">
        <div class="preset-list">
          ${presetNames.map(name => `
            <div class="preset-item" data-preset="${name}">
              <div class="preset-info">
                <h4>📋 ${name}</h4>
                <p class="preset-description">${getPresetDescription(savedPresets[name])}</p>
              </div>
              <div class="preset-actions">
                <button class="btn small-btn primary-btn load-preset" data-preset="${name}">
                  📥 Load
                </button>
                <button class="btn small-btn danger-btn delete-preset" data-preset="${name}">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `,
    size: 'large',
    showCloseButton: true,
    closeOnClickOutside: true
  });

  if (modal) {
    // Handle preset actions
    modal.content.addEventListener('click', (e) => {
      const presetName = e.target.dataset.preset;

      if (e.target.classList.contains('load-preset')) {
        loadFilterPreset(presetName);
        modal.close();
      } else if (e.target.classList.contains('delete-preset')) {
        deleteFilterPreset(presetName);
        // Refresh the modal content
        modal.close();
        setTimeout(() => showManagePresetsModal(), 100);
      }
    });

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'btn secondary-btn';
    closeButton.onclick = () => modal.close();

    // Append button directly to modal content since addButton method doesn't exist
    const modalBody = modalOverlay.querySelector('.modal-body');
    if (modalBody) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'modal-button-container';
      buttonContainer.style.cssText = 'margin-top: 20px; text-align: right; padding-top: 15px; border-top: 1px solid #eee;';
      buttonContainer.appendChild(closeButton);
      modalBody.appendChild(buttonContainer);
    }
  }
}

/**
 * Load a filter preset
 */
function loadFilterPreset(presetName) {
  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  const preset = savedPresets[presetName];

  if (!preset) {
    import('../uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast(`Preset "${presetName}" not found`, 'error');
      }
    });
    return;
  }

  // Load the preset into current filters
  Object.assign(currentFilters, preset);

  // Update UI to reflect loaded filters
  updateUIFromCurrentFilters();

  // Apply the filters
  applyCurrentFilters();

  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Preset "${presetName}" loaded`, 'success');
    }
  });
}

/**
 * Delete a filter preset
 */
function deleteFilterPreset(presetName) {
  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  delete savedPresets[presetName];
  localStorage.setItem('filterPresets', JSON.stringify(savedPresets));

  // Update the preset selector
  updatePresetSelector();

  import('../uiManager.js').then(module => {
    if (module.showToast) {
      module.showToast(`Preset "${presetName}" deleted`, 'success');
    }
  });
}

/**
 * Update the preset selector dropdown
 */
function updatePresetSelector() {
  const selector = document.getElementById('presetSelector');
  if (!selector) return;

  const savedPresets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
  const presetNames = Object.keys(savedPresets);

  selector.innerHTML = `
    <option value="">Choose Saved Preset</option>
    ${presetNames.map(name => `<option value="${name}">📋 ${name}</option>`).join('')}
  `;
}

/**
 * Update UI elements to reflect current filters
 */
function updateUIFromCurrentFilters() {
  // Date range
  const dateRangeSelect = document.getElementById('dateRangePreset');
  if (dateRangeSelect) {
    dateRangeSelect.value = currentFilters.dateRange || 'all';
  }

  // Custom dates
  if (currentFilters.dateRange === 'custom') {
    const startInput = document.getElementById('customStartDate');
    const endInput = document.getElementById('customEndDate');
    if (startInput?.value !== undefined && currentFilters.customStartDate) {
      startInput.value = formatDateToDDMMYYYY(currentFilters.customStartDate);
    }
    if (endInput?.value !== undefined && currentFilters.customEndDate) {
      endInput.value = formatDateToDDMMYYYY(currentFilters.customEndDate);
    }
  }

  // Amount range
  const minAmount = document.getElementById('minAmount');
  const maxAmount = document.getElementById('maxAmount');
  if (minAmount) minAmount.value = currentFilters.minAmount || '';
  if (maxAmount) maxAmount.value = currentFilters.maxAmount || '';

  // Search text
  const searchInput = document.getElementById('descriptionSearch');
  if (searchInput) searchInput.value = currentFilters.searchText || '';

  // Currency
  const currencySelect = document.getElementById('currencyFilter');
  if (currencySelect) currencySelect.value = currentFilters.currency || 'all';

  // Categories - this would need more complex handling
  // For now, just trigger the category update
  updateCategoryButtonText();
}

/**
 * Get a preview of current filters for display
 */
function getFiltersPreview() {
  const previews = [];

  if (currentFilters.dateRange !== 'all') {
    previews.push(`📅 Date: ${currentFilters.dateRange}`);
  }

  if (currentFilters.categories?.length > 0) {
    previews.push(`🏷️ Categories: ${currentFilters.categories.length} selected`);
  }

  if (currentFilters.minAmount || currentFilters.maxAmount) {
    const min = currentFilters.minAmount || '0';
    const max = currentFilters.maxAmount || '∞';
    previews.push(`💰 Amount: ${min} - ${max}`);
  }

  if (currentFilters.currency !== 'all') {
    previews.push(`💱 Currency: ${currentFilters.currency}`);
  }

  if (currentFilters.searchText) {
    previews.push(`🔍 Search: "${currentFilters.searchText}"`);
  }

  return previews.length > 0
    ? `<ul>${previews.map(p => '<li>' + p + '</li>').join('')}</ul>`
    : '<p>No active filters</p>';
}

/**
 * Get a description of a preset for the manage modal
 */
function getPresetDescription(preset) {
  const descriptions = [];

  if (preset.dateRange !== 'all') {
    descriptions.push(`Date: ${preset.dateRange}`);
  }

  if (preset.categories?.length > 0) {
    descriptions.push(`${preset.categories.length} categories`);
  }

  if (preset.minAmount || preset.maxAmount) {
    descriptions.push('Amount range');
  }

  if (preset.currency !== 'all') {
    descriptions.push(`Currency: ${preset.currency}`);
  }

  if (preset.searchText) {
    descriptions.push('Search term');
  }

  return descriptions.length > 0 ? descriptions.join(', ') : 'No filters';
}

/**
 * Save filter preset (legacy function - now shows deprecation warning)
 */
function saveFilterPreset() {
  console.warn('DEPRECATED: saveFilterPreset() - Use showSavePresetModal() instead');
  showSavePresetModal();
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
  const currencies = [...new Set((AppState.transactions || []).map(tx => tx.currency).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
