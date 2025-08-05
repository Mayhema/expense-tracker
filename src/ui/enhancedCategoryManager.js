/**
 * 🎨 Enhanced Category Manager - Modern UI/UX with Advanced Functionality
 * Features: Improved design, accessibility, bulk operations, drag & drop, validation
 */

import { AppState, saveCategories } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';

// Singleton pattern to ensure only one modal is open
let enhancedCategoryModalInstance = null;

/**
 * 🎯 Main function to show the enhanced category manager modal
 */
export async function showEnhancedCategoryManagerModal() {
  // Prevent multiple modals
  if (enhancedCategoryModalInstance) {
    console.log('Enhanced category manager modal already open');
    return enhancedCategoryModalInstance;
  }

  console.log("Opening enhanced category manager modal...");

  // Ensure categories are loaded before showing the modal (now async)
  await ensureCategoriesLoaded();

  const categories = AppState.categories || {};
  const categoryCount = Object.keys(categories).length;
  console.log(`Enhanced Category Manager: Found ${categoryCount} categories`, categories);

  const modalContent = document.createElement('div');
  modalContent.className = 'enhanced-category-manager';
  modalContent.innerHTML = buildEnhancedCategoryManagerHTML();

  const modal = showModal({
    title: '🎨 Enhanced Category Manager',
    content: modalContent,
    size: 'xlarge',
    closeOnClickOutside: false
  });

  // Store reference and override close method
  enhancedCategoryModalInstance = modal;
  const originalClose = modal.close;
  modal.close = function () {
    enhancedCategoryModalInstance = null;
    originalClose.call(this);
  };

  // Apply styles and attach event listeners
  addEnhancedCategoryStyles();
  attachEnhancedEventListeners(modalContent, modal);
  initializeEnhancedFeatures(modalContent);

  // Ensure categories are displayed properly
  setTimeout(() => {
    refreshCategoriesGrid();
    console.log('Categories grid refreshed after modal display');
  }, 100);

  return modal;
}

/**
 * 🔄 Ensure categories are loaded and initialized
 */
async function ensureCategoriesLoaded() {
  // Check if categories are empty or not properly loaded
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    console.log('Categories not loaded, initializing from localStorage or defaults...');

    try {
      // Try to load from localStorage first
      const savedCategories = localStorage.getItem('categories');
      if (savedCategories) {
        AppState.categories = JSON.parse(savedCategories);
        console.log('Loaded categories from localStorage:', Object.keys(AppState.categories));
      } else {
        // If no saved categories, initialize with defaults
        const { DEFAULT_CATEGORIES } = await import('../constants/categories.js');
        AppState.categories = { ...DEFAULT_CATEGORIES };
        console.log('Initialized with default categories:', Object.keys(AppState.categories));

        // Save to localStorage for future use
        localStorage.setItem('categories', JSON.stringify(AppState.categories));
      }
    } catch (error) {
      console.error('Error loading categories:', error);

      // Fallback to a basic set of categories
      AppState.categories = {
        'Food & Dining': { color: '#FF6B6B', subcategories: {} },
        'Transportation': { color: '#4ECDC4', subcategories: {} },
        'Shopping': { color: '#45B7D1', subcategories: {} },
        'Bills & Utilities': { color: '#FFEAA7', subcategories: {} },
        'Entertainment': { color: '#96CEB4', subcategories: {} },
        'Healthcare': { color: '#FD79A8', subcategories: {} },
        'Income': { color: '#6C5CE7', subcategories: {} }
      };
      console.log('Used fallback categories');
    }
  }
}

/**
 * 🏗️ Build the enhanced HTML structure
 */
function buildEnhancedCategoryManagerHTML() {
  const categories = AppState.categories || {};
  const categoryCount = Object.keys(categories).length;

  return `
    <div class="enhanced-category-container">
      <!-- Header Section -->
      <div class="enhanced-header">
        <div class="header-content">
          <div class="header-text">
            <h2>Category Management</h2>
            <p>Organize and customize your expense categories</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-number">${categoryCount}</span>
              <span class="stat-label">Categories</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${getTotalSubcategories()}</span>
              <span class="stat-label">Subcategories</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar Section -->
      <div class="enhanced-toolbar">
        <div class="toolbar-left">
          <div class="search-container">
            <input type="text" id="categorySearch" placeholder="🔍 Search categories..." class="search-input">
            <button id="clearSearch" class="search-clear" aria-label="Clear search">×</button>
          </div>
          <div class="filter-container">
            <select id="categoryFilter" class="filter-select">
              <option value="all">All Categories</option>
              <option value="with-subcategories">With Subcategories</option>
              <option value="without-subcategories">Simple Categories</option>
              <option value="recently-used">Recently Used</option>
            </select>
          </div>
        </div>
        <div class="toolbar-right">
          <button id="bulkOperations" class="btn btn-secondary">
            <span class="btn-icon">📦</span>
            <span class="btn-text">Bulk Actions</span>
          </button>
          <button id="importExport" class="btn btn-secondary">
            <span class="btn-icon">⚡</span>
            <span class="btn-text">Import/Export</span>
          </button>
          <button id="addNewCategory" class="btn btn-primary">
            <span class="btn-icon">+</span>
            <span class="btn-text">Add Category</span>
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="enhanced-content">
        <div class="content-main">
          <!-- Categories Grid -->
          <div class="categories-grid" id="categoriesGrid">
            ${buildEnhancedCategoriesGrid(categories)}
          </div>

          <!-- Empty State -->
          <div class="empty-state" id="emptyState" style="display: ${categoryCount === 0 ? 'flex' : 'none'}">
            <div class="empty-content">
              <div class="empty-icon">📂</div>
              <h3>No Categories Yet</h3>
              <p>Create your first category to start organizing your expenses</p>
              <button class="btn btn-primary btn-large" id="createFirstCategory">
                <span class="btn-icon">✨</span>
                <span class="btn-text">Create First Category</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Panel (for bulk operations, etc.) -->
        <div class="content-sidebar" id="contentSidebar" style="display: none;">
          <div class="sidebar-content">
            <!-- Dynamic content based on selected action -->
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="enhanced-footer">
        <div class="footer-left">
          <span class="footer-info">
            <span id="selectedCount">0</span> categories selected
          </span>
        </div>
        <div class="footer-right">
          <button id="resetCategories" class="btn btn-ghost">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Reset to Defaults</span>
          </button>
          <button id="closeModal" class="btn btn-secondary">
            <span class="btn-icon">✕</span>
            <span class="btn-text">Close</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 🎨 Build enhanced categories grid
 */
function buildEnhancedCategoriesGrid(categories) {
  console.log('Building enhanced categories grid with:', categories);

  if (!categories || Object.keys(categories).length === 0) {
    console.log('No categories to display - showing empty state');
    return '';
  }

  const sortedCategories = Object.entries(categories)
    .sort(([a], [b]) => a.localeCompare(b));

  console.log(`Sorted categories for display:`, sortedCategories.map(([name]) => name));

  return sortedCategories.map(([name, value], index) => {
    const isComplexCategory = typeof value === 'object';
    const color = isComplexCategory ? value.color : value;
    const subcategories = isComplexCategory ? value.subcategories || {} : {};
    const subcategoryCount = Object.keys(subcategories).length;

    console.log(`Category ${name}: color=${color}, subcategories=${subcategoryCount}`);

    return `
      <div class="enhanced-category-card" data-category="${name}" data-color="${color}">
        <div class="category-card-header">
          <div class="category-visual">
            <div class="category-color" style="background-color: ${color}"></div>
            <div class="category-checkbox">
              <input type="checkbox" id="select-${index}" class="category-select">
            </div>
          </div>
          <div class="category-info">
            <h4 class="category-name">${name}</h4>
            <p class="category-meta">
              ${subcategoryCount > 0 ? `${subcategoryCount} subcategories` : 'Simple category'}
            </p>
          </div>
          <div class="category-actions">
            <button class="action-btn edit-btn" data-action="edit" data-category="${name}" title="Edit category">
              <span class="action-icon">✏️</span>
            </button>
            <button class="action-btn subcategory-btn" data-action="subcategories" data-category="${name}" title="Manage subcategories">
              <span class="action-icon">📁</span>
            </button>
            <button class="action-btn delete-btn" data-action="delete" data-category="${name}" title="Delete category">
              <span class="action-icon">🗑️</span>
            </button>
            <button class="action-btn drag-handle" title="Drag to reorder">
              <span class="action-icon">⋮⋮</span>
            </button>
          </div>
        </div>

        ${subcategoryCount > 0 ? buildSubcategoriesPreview(subcategories, subcategoryCount) : ''}
      </div>
    `;
  }).join('');
}

/**
 * 🏗️ Build subcategories preview section
 */
function buildSubcategoriesPreview(subcategories, subcategoryCount) {
  const moreText = subcategoryCount > 3 ? `<span class="subcategory-more">+${subcategoryCount - 3} more</span>` : '';

  return `
    <div class="category-card-body">
      <div class="subcategories-preview">
        <h5>Subcategories (${subcategoryCount})</h5>
        <div class="subcategories-list">
          ${Object.entries(subcategories).slice(0, 3).map(([subName, subColor]) => `
            <span class="subcategory-tag" style="border-left-color: ${subColor}">
              ${subName}
            </span>
          `).join('')}
          ${moreText}
        </div>
      </div>
    </div>
  `;
}

/**
 * 📊 Get total subcategories count
 */
function getTotalSubcategories() {
  const categories = AppState.categories || {};
  return Object.values(categories).reduce((total, category) => {
    if (typeof category === 'object' && category.subcategories) {
      return total + Object.keys(category.subcategories).length;
    }
    return total;
  }, 0);
}

/**
 * 🎨 Add enhanced styles
 */
function addEnhancedCategoryStyles() {
  if (document.getElementById('enhancedCategoryStyles')) return;

  const style = document.createElement('style');
  style.id = 'enhancedCategoryStyles';
  style.textContent = `
    /* 🎨 Enhanced Category Manager Styles */
    .enhanced-category-manager {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
    }

    body.dark-mode .enhanced-category-manager {
      background: #1a1a1a;
      color: #e0e0e0;
    }

    /* Header Styles */
    .enhanced-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-text h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .header-text p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .header-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    /* Toolbar Styles */
    .enhanced-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    body.dark-mode .enhanced-toolbar {
      background: #2a2a2a;
      border-bottom-color: #404040;
    }

    .toolbar-left {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .toolbar-right {
      display: flex;
      gap: 0.75rem;
    }

    /* Search Styles */
    .search-container {
      position: relative;
    }

    .search-input {
      padding: 0.75rem 2.5rem 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      width: 300px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    body.dark-mode .search-input {
      background: #333;
      border-color: #555;
      color: #e0e0e0;
    }

    .search-clear {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #999;
      display: none;
    }

    .search-clear:hover {
      color: #666;
    }

    .search-input:not(:placeholder-shown) + .search-clear {
      display: block;
    }

    /* Filter Styles */
    .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 0.95rem;
      cursor: pointer;
    }

    body.dark-mode .filter-select {
      background: #333;
      border-color: #555;
      color: #e0e0e0;
    }

    /* Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #e9ecef;
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    body.dark-mode .btn-secondary {
      background: #333;
      color: #e0e0e0;
      border-color: #555;
    }

    body.dark-mode .btn-secondary:hover {
      background: #404040;
    }

    .btn-ghost {
      background: transparent;
      color: #6c757d;
    }

    .btn-ghost:hover {
      background: #f8f9fa;
    }

    body.dark-mode .btn-ghost:hover {
      background: #333;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    /* Content Styles */
    .enhanced-content {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .content-main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .content-sidebar {
      width: 320px;
      background: #f8f9fa;
      border-left: 1px solid #e9ecef;
      padding: 2rem;
    }

    body.dark-mode .content-sidebar {
      background: #2a2a2a;
      border-left-color: #404040;
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .enhanced-category-card {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
      cursor: grab;
    }

    .enhanced-category-card:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .enhanced-category-card.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    body.dark-mode .enhanced-category-card {
      background: #333;
      border-color: #555;
    }

    /* Category Card Header */
    .category-card-header {
      display: flex;
      align-items: center;
      padding: 1.25rem;
      gap: 1rem;
    }

    .category-visual {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .category-color {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .category-checkbox input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .category-info {
      flex: 1;
    }

    .category-name {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #2d3748;
    }

    body.dark-mode .category-name {
      color: #e0e0e0;
    }

    .category-meta {
      margin: 0;
      font-size: 0.9rem;
      color: #718096;
    }

    body.dark-mode .category-meta {
      color: #a0a0a0;
    }

    .category-actions {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      padding: 0.5rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .action-btn:hover {
      background: #f8f9fa;
    }

    body.dark-mode .action-btn:hover {
      background: #404040;
    }

    .drag-handle {
      cursor: grab;
      color: #cbd5e0;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    /* Category Card Body */
    .category-card-body {
      padding: 0 1.25rem 1.25rem;
      border-top: 1px solid #f7fafc;
    }

    body.dark-mode .category-card-body {
      border-top-color: #404040;
    }

    .subcategories-preview h5 {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #4a5568;
    }

    body.dark-mode .subcategories-preview h5 {
      color: #a0a0a0;
    }

    .subcategories-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .subcategory-tag {
      padding: 0.25rem 0.75rem;
      background: #f7fafc;
      border-left: 3px solid;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #4a5568;
    }

    body.dark-mode .subcategory-tag {
      background: #404040;
      color: #e0e0e0;
    }

    .subcategory-more {
      padding: 0.25rem 0.75rem;
      background: #edf2f7;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #718096;
      font-style: italic;
    }

    body.dark-mode .subcategory-more {
      background: #2a2a2a;
      color: #a0a0a0;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .empty-content {
      text-align: center;
      max-width: 400px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-content h3 {
      margin: 0 0 0.5rem 0;
      color: #4a5568;
      font-size: 1.5rem;
    }

    body.dark-mode .empty-content h3 {
      color: #e0e0e0;
    }

    .empty-content p {
      margin: 0 0 2rem 0;
      color: #718096;
      font-size: 1rem;
    }

    body.dark-mode .empty-content p {
      color: #a0a0a0;
    }

    /* Footer Styles */
    .enhanced-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    body.dark-mode .enhanced-footer {
      background: #2a2a2a;
      border-top-color: #404040;
    }

    .footer-info {
      font-size: 0.9rem;
      color: #6c757d;
    }

    body.dark-mode .footer-info {
      color: #a0a0a0;
    }

    .footer-right {
      display: flex;
      gap: 0.75rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .categories-grid {
        grid-template-columns: 1fr;
      }

      .enhanced-toolbar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .toolbar-left,
      .toolbar-right {
        justify-content: center;
      }

      .search-input {
        width: 100%;
      }

      .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }
    }
  `;

  document.head.appendChild(style);
}

/**
 * 🎮 Attach enhanced event listeners
 */
function attachEnhancedEventListeners(container, modal) {
  // Search functionality
  const searchInput = container.querySelector('#categorySearch');
  const clearSearch = container.querySelector('#clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
      clearSearch.style.display = e.target.value ? 'block' : 'none';
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      handleSearch({ target: searchInput });
      clearSearch.style.display = 'none';
    });
  }

  // Filter functionality
  const filterSelect = container.querySelector('#categoryFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', handleFilter);
  }

  // Add new category
  const addNewBtn = container.querySelector('#addNewCategory');
  const createFirstBtn = container.querySelector('#createFirstCategory');

  if (addNewBtn) {
    addNewBtn.addEventListener('click', () => showAddCategoryModal());
  }

  if (createFirstBtn) {
    createFirstBtn.addEventListener('click', () => showAddCategoryModal());
  }

  // Category actions
  container.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.action-btn');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const categoryName = actionBtn.dataset.category;

      switch (action) {
        case 'edit':
          showEditCategoryModal(categoryName);
          break;
        case 'subcategories':
          showSubcategoriesModal(categoryName);
          break;
        case 'delete':
          handleDeleteCategory(categoryName);
          break;
      }
    }
  });

  // Bulk operations
  const bulkBtn = container.querySelector('#bulkOperations');
  if (bulkBtn) {
    bulkBtn.addEventListener('click', toggleBulkOperations);
  }

  // Import/Export
  const importExportBtn = container.querySelector('#importExport');
  if (importExportBtn) {
    importExportBtn.addEventListener('click', showImportExportModal);
  }

  // Reset categories
  const resetBtn = container.querySelector('#resetCategories');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetCategories);
  }

  // Close modal
  const closeBtn = container.querySelector('#closeModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
  }

  // Checkbox selection
  container.addEventListener('change', (e) => {
    if (e.target.classList.contains('category-select')) {
      updateSelectionCount(container);
    }
  });
}

/**
 * 🔍 Handle search functionality
 */
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const categoryCards = document.querySelectorAll('.enhanced-category-card');

  categoryCards.forEach(card => {
    const categoryName = card.dataset.category.toLowerCase();
    const shouldShow = !searchTerm || categoryName.includes(searchTerm);
    card.style.display = shouldShow ? 'block' : 'none';
  });

  updateEmptyState();
}

/**
 * 🎛️ Handle filter functionality
 */
function handleFilter(e) {
  const filterValue = e.target.value;
  const categoryCards = document.querySelectorAll('.enhanced-category-card');

  categoryCards.forEach(card => {
    const categoryName = card.dataset.category;
    const category = AppState.categories[categoryName];
    const hasSubcategories = typeof category === 'object' && category.subcategories && Object.keys(category.subcategories).length > 0;

    let shouldShow;

    switch (filterValue) {
      case 'with-subcategories':
        shouldShow = hasSubcategories;
        break;
      case 'without-subcategories':
        shouldShow = !hasSubcategories;
        break;
      case 'recently-used':
        // This would require tracking usage - placeholder for now
        shouldShow = true;
        break;
      default:
        shouldShow = true;
    }

    card.style.display = shouldShow ? 'block' : 'none';
  });

  updateEmptyState();
}

/**
 * 📝 Show add category modal
 */
function showAddCategoryModal() {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 1.5rem;">
        <label for="newCategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Name</label>
        <input type="text" id="newCategoryName" placeholder="e.g., Groceries, Entertainment"
               style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label for="newCategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Color</label>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <input type="color" id="newCategoryColor" value="#667eea"
                 style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
          <span id="colorPreview" style="padding: 0.5rem 1rem; background: #667eea; color: white; border-radius: 6px; font-size: 0.9rem;">Preview</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
        <button id="cancelAdd" class="btn btn-secondary">Cancel</button>
        <button id="confirmAdd" class="btn btn-primary">Add Category</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: '✨ Add New Category',
    content: modalContent,
    size: 'medium',
    closeOnClickOutside: false
  });

  // Color preview update
  const colorInput = modalContent.querySelector('#newCategoryColor');
  const colorPreview = modalContent.querySelector('#colorPreview');

  colorInput.addEventListener('input', (e) => {
    colorPreview.style.backgroundColor = e.target.value;
  });

  // Event handlers
  modalContent.querySelector('#cancelAdd').addEventListener('click', () => modal.close());
  modalContent.querySelector('#confirmAdd').addEventListener('click', () => {
    const name = modalContent.querySelector('#newCategoryName').value.trim();
    const color = modalContent.querySelector('#newCategoryColor').value;

    if (!name) {
      showToast('Please enter a category name', 'error');
      return;
    }

    if (AppState.categories[name]) {
      showToast('Category already exists', 'error');
      return;
    }

    AppState.categories[name] = color;
    saveCategories();

    showToast(`Category "${name}" added successfully`, 'success');
    modal.close();

    // Refresh the main modal
    refreshCategoriesGrid();
  });
}

/**
 * ✏️ Show edit category modal
 */
function showEditCategoryModal(categoryName) {
  const category = AppState.categories[categoryName];
  const color = typeof category === 'object' ? category.color : category;

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 1.5rem;">
        <label for="editCategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Name</label>
        <input type="text" id="editCategoryName" value="${categoryName}"
               style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label for="editCategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Color</label>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <input type="color" id="editCategoryColor" value="${color}"
                 style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
          <span id="editColorPreview" style="padding: 0.5rem 1rem; background: ${color}; color: white; border-radius: 6px; font-size: 0.9rem;">Preview</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
        <button id="cancelEdit" class="btn btn-secondary">Cancel</button>
        <button id="confirmEdit" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `✏️ Edit Category: ${categoryName}`,
    content: modalContent,
    size: 'medium',
    closeOnClickOutside: false
  });

  // Color preview update
  const colorInput = modalContent.querySelector('#editCategoryColor');
  const colorPreview = modalContent.querySelector('#editColorPreview');

  colorInput.addEventListener('input', (e) => {
    colorPreview.style.backgroundColor = e.target.value;
  });

  // Event handlers
  modalContent.querySelector('#cancelEdit').addEventListener('click', () => modal.close());
  modalContent.querySelector('#confirmEdit').addEventListener('click', () => {
    const newName = modalContent.querySelector('#editCategoryName').value.trim();
    const newColor = modalContent.querySelector('#editCategoryColor').value;

    if (!newName) {
      showToast('Please enter a category name', 'error');
      return;
    }

    if (newName !== categoryName && AppState.categories[newName]) {
      showToast('Category name already exists', 'error');
      return;
    }

    // Update category
    if (newName !== categoryName) {
      const categoryData = AppState.categories[categoryName];
      delete AppState.categories[categoryName];
      AppState.categories[newName] = typeof categoryData === 'object'
        ? { ...categoryData, color: newColor }
        : newColor;
    } else if (typeof AppState.categories[categoryName] === 'object') {
      AppState.categories[categoryName].color = newColor;
    } else {
      AppState.categories[categoryName] = newColor;
    }

    saveCategories();
    showToast(`Category updated successfully`, 'success');
    modal.close();

    // Refresh the main modal
    refreshCategoriesGrid();
  });
}

/**
 * 📁 Show subcategories modal
 */
function showSubcategoriesModal(categoryName) {
  const category = AppState.categories[categoryName];
  const subcategories = (typeof category === 'object' && category.subcategories) ? category.subcategories : {};

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0;">Add New Subcategory</h4>
        <div style="display: flex; gap: 1rem; align-items: end;">
          <div style="flex: 1;">
            <label for="newSubcategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Subcategory Name</label>
            <input type="text" id="newSubcategoryName" placeholder="e.g., Organic Food, Restaurants"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
          </div>
          <div>
            <label for="newSubcategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Color</label>
            <input type="color" id="newSubcategoryColor" value="#667eea"
                   style="width: 60px; height: 45px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
          <button id="addSubcategory" class="btn btn-primary">Add</button>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 1rem 0;">Existing Subcategories</h4>
        <div id="subcategoriesList" style="min-height: 200px;">
          ${Object.keys(subcategories).length === 0 ?
      '<p style="text-align: center; color: #666; padding: 2rem;">No subcategories yet. Add one above.</p>' :
      Object.entries(subcategories).map(([name, color]) => `
              <div class="subcategory-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 24px; height: 24px; background: ${color}; border-radius: 4px;"></div>
                  <span style="font-weight: 500;">${name}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="color" value="${color}" data-subcategory="${name}" class="subcategory-color-picker"
                         style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer;">
                  <button class="btn btn-ghost delete-subcategory" data-subcategory="${name}" style="padding: 0.5rem;">🗑️</button>
                </div>
              </div>
            `).join('')
    }
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
        <button id="closeSubcategories" class="btn btn-secondary">Close</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `📁 Manage Subcategories: ${categoryName}`,
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Add subcategory functionality
  modalContent.querySelector('#addSubcategory').addEventListener('click', () => {
    const nameInput = modalContent.querySelector('#newSubcategoryName');
    const colorInput = modalContent.querySelector('#newSubcategoryColor');
    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast('Please enter a subcategory name', 'error');
      return;
    }

    // Ensure category structure exists
    if (typeof AppState.categories[categoryName] === 'string') {
      const originalColor = AppState.categories[categoryName];
      AppState.categories[categoryName] = { color: originalColor, subcategories: {} };
    } else if (!AppState.categories[categoryName].subcategories) {
      AppState.categories[categoryName].subcategories = {};
    }

    if (AppState.categories[categoryName].subcategories[name]) {
      showToast('Subcategory already exists', 'error');
      return;
    }

    AppState.categories[categoryName].subcategories[name] = color;
    saveCategories();

    showToast(`Subcategory "${name}" added successfully`, 'success');
    nameInput.value = '';

    // Refresh the subcategories modal
    modal.close();
    setTimeout(() => showSubcategoriesModal(categoryName), 100);
  });

  // Color picker changes
  modalContent.addEventListener('change', (e) => {
    if (e.target.classList.contains('subcategory-color-picker')) {
      const subcategoryName = e.target.dataset.subcategory;
      const newColor = e.target.value;

      AppState.categories[categoryName].subcategories[subcategoryName] = newColor;
      saveCategories();

      // Update the visual color
      const colorDiv = e.target.closest('.subcategory-item').querySelector('div[style*="background"]');
      if (colorDiv) {
        colorDiv.style.background = newColor;
      }

      showToast(`Color updated for "${subcategoryName}"`, 'success');
    }
  });

  // Delete subcategory
  modalContent.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-subcategory')) {
      const subcategoryName = e.target.dataset.subcategory;

      if (confirm(`Are you sure you want to delete the subcategory "${subcategoryName}"?`)) {
        delete AppState.categories[categoryName].subcategories[subcategoryName];
        saveCategories();

        showToast(`Subcategory "${subcategoryName}" deleted`, 'success');

        // Refresh the subcategories modal
        modal.close();
        setTimeout(() => showSubcategoriesModal(categoryName), 100);
      }
    }
  });

  // Close modal
  modalContent.querySelector('#closeSubcategories').addEventListener('click', () => modal.close());
}

/**
 * 🗑️ Handle delete category
 */
function handleDeleteCategory(categoryName) {
  if (confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
    delete AppState.categories[categoryName];
    saveCategories();

    showToast(`Category "${categoryName}" deleted successfully`, 'success');
    refreshCategoriesGrid();
  }
}

/**
 * 📦 Toggle bulk operations
 */
function toggleBulkOperations() {
  const sidebar = document.querySelector('#contentSidebar');
  const isVisible = sidebar.style.display !== 'none';

  sidebar.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    sidebar.querySelector('.sidebar-content').innerHTML = `
      <h4>Bulk Operations</h4>
      <div style="margin: 1.5rem 0;">
        <button class="btn btn-secondary" id="selectAll" style="width: 100%; margin-bottom: 0.5rem;">Select All</button>
        <button class="btn btn-secondary" id="selectNone" style="width: 100%; margin-bottom: 0.5rem;">Select None</button>
      </div>
      <div style="margin: 1.5rem 0;">
        <button class="btn btn-ghost" id="bulkDelete" style="width: 100%; color: #dc3545;" disabled>Delete Selected</button>
      </div>
    `;

    // Attach bulk operation handlers
    sidebar.querySelector('#selectAll').addEventListener('click', () => {
      document.querySelectorAll('.category-select').forEach(cb => cb.checked = true);
      updateSelectionCount();
    });

    sidebar.querySelector('#selectNone').addEventListener('click', () => {
      document.querySelectorAll('.category-select').forEach(cb => cb.checked = false);
      updateSelectionCount();
    });

    sidebar.querySelector('#bulkDelete').addEventListener('click', handleBulkDelete);
  }
}

/**
 * 🗑️ Handle bulk delete
 */
function handleBulkDelete() {
  const selectedCategories = Array.from(document.querySelectorAll('.category-select:checked'))
    .map(cb => cb.closest('.enhanced-category-card').dataset.category);

  if (selectedCategories.length === 0) return;

  if (confirm(`Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`)) {
    selectedCategories.forEach(categoryName => {
      delete AppState.categories[categoryName];
    });

    saveCategories();
    showToast(`${selectedCategories.length} categories deleted successfully`, 'success');
    refreshCategoriesGrid();

    // Hide sidebar
    document.querySelector('#contentSidebar').style.display = 'none';
  }
}

/**
 * ⚡ Show import/export modal
 */
function showImportExportModal() {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 2rem;">
        <h4>Export Categories</h4>
        <p style="color: #666; margin-bottom: 1rem;">Download your categories as a JSON file for backup.</p>
        <button id="exportCategories" class="btn btn-primary">📥 Export Categories</button>
      </div>

      <div style="margin-bottom: 2rem;">
        <h4>Import Categories</h4>
        <p style="color: #666; margin-bottom: 1rem;">Upload a JSON file to import categories.</p>
        <input type="file" id="importFile" accept=".json" style="margin-bottom: 1rem;">
        <button id="importCategories" class="btn btn-secondary" disabled>📤 Import Categories</button>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button id="closeImportExport" class="btn btn-ghost">Close</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: '⚡ Import/Export Categories',
    content: modalContent,
    size: 'medium'
  });

  // Export functionality
  modalContent.querySelector('#exportCategories').addEventListener('click', () => {
    const dataStr = JSON.stringify(AppState.categories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `categories-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast('Categories exported successfully', 'success');
  });

  // Import functionality
  const fileInput = modalContent.querySelector('#importFile');
  const importBtn = modalContent.querySelector('#importCategories');

  fileInput.addEventListener('change', (e) => {
    importBtn.disabled = !e.target.files.length;
  });

  importBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCategories = JSON.parse(e.target.result);

        if (confirm('This will replace all existing categories. Continue?')) {
          AppState.categories = importedCategories;
          saveCategories();

          showToast('Categories imported successfully', 'success');
          modal.close();
          refreshCategoriesGrid();
        }
      } catch (error) {
        console.error('Import error:', error);
        showToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Close modal
  modalContent.querySelector('#closeImportExport').addEventListener('click', () => modal.close());
}

/**
 * 🔄 Handle reset categories
 */
function handleResetCategories() {
  if (confirm('Are you sure you want to reset all categories to defaults? This will remove all your custom categories and cannot be undone.')) {
    // Import default categories function
    import('../constants/categories.js').then(module => {
      if (module.resetToDefaultCategories) {
        module.resetToDefaultCategories();
        showToast('Categories reset to defaults successfully', 'success');
        refreshCategoriesGrid();
      }
    });
  }
}

/**
 * 🔄 Refresh categories grid
 */
function refreshCategoriesGrid() {
  const container = document.querySelector('.enhanced-category-manager');
  if (!container) return;

  const categoriesGrid = container.querySelector('#categoriesGrid');

  if (categoriesGrid) {
    categoriesGrid.innerHTML = buildEnhancedCategoriesGrid(AppState.categories || {});
  }

  updateEmptyState();
  updateHeaderStats(container);
}

/**
 * 📊 Update header statistics
 */
function updateHeaderStats(container) {
  const categoryCount = Object.keys(AppState.categories || {}).length;
  const subcategoryCount = getTotalSubcategories();

  const statNumbers = container.querySelectorAll('.stat-number');
  if (statNumbers.length >= 2) {
    statNumbers[0].textContent = categoryCount;
    statNumbers[1].textContent = subcategoryCount;
  }
}

/**
 * 📊 Update selection count
 */
function updateSelectionCount(container = document) {
  const selectedCount = container.querySelectorAll('.category-select:checked').length;
  const countDisplay = container.querySelector('#selectedCount');
  const bulkDeleteBtn = container.querySelector('#bulkDelete');

  if (countDisplay) {
    countDisplay.textContent = selectedCount;
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.disabled = selectedCount === 0;
  }
}

/**
 * 📭 Update empty state visibility
 */
function updateEmptyState() {
  const categoriesGrid = document.querySelector('#categoriesGrid');
  const emptyState = document.querySelector('#emptyState');

  if (!categoriesGrid || !emptyState) {
    console.log('Could not find categoriesGrid or emptyState elements');
    return;
  }

  const allCards = categoriesGrid.querySelectorAll('.enhanced-category-card');
  const visibleCards = categoriesGrid.querySelectorAll('.enhanced-category-card:not([style*="display: none"])');
  const categoryCount = Object.keys(AppState.categories || {}).length;

  console.log(`Empty state check: ${allCards.length} total cards, ${visibleCards.length} visible cards, ${categoryCount} categories in AppState`);

  // Use AppState.categories as the source of truth, not DOM elements
  const isEmpty = categoryCount === 0;

  emptyState.style.display = isEmpty ? 'flex' : 'none';
  categoriesGrid.style.display = isEmpty ? 'none' : 'grid';

  console.log(`Empty state: ${isEmpty ? 'showing' : 'hiding'} empty state, ${isEmpty ? 'hiding' : 'showing'} categories grid`);
}

/**
 * 🎮 Initialize enhanced features
 */
function initializeEnhancedFeatures(container) {
  // Initialize drag and drop for category reordering
  initializeDragAndDrop(container);

  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts(container);

  // Initialize tooltips
  initializeTooltips(container);
}

/**
 * 🖱️ Initialize drag and drop
 */
function initializeDragAndDrop(container) {
  let draggedElement = null;

  container.addEventListener('dragstart', (e) => {
    if (e.target.closest('.enhanced-category-card')) {
      draggedElement = e.target.closest('.enhanced-category-card');
      draggedElement.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();

    const dropTarget = e.target.closest('.enhanced-category-card');
    if (dropTarget && draggedElement && dropTarget !== draggedElement) {
      const rect = dropTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const insertAfter = e.clientY > midpoint;

      if (insertAfter) {
        dropTarget.insertAdjacentElement('afterend', draggedElement);
      } else {
        dropTarget.insertAdjacentElement('beforebegin', draggedElement);
      }

      showToast('Category order updated', 'success');
    }
  });

  container.addEventListener('dragend', () => {
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
      draggedElement = null;
    }
  });

  // Make category cards draggable
  container.querySelectorAll('.enhanced-category-card').forEach(card => {
    card.draggable = true;
  });
}

/**
 * ⌨️ Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts(container) {
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when the modal is open
    if (!enhancedCategoryModalInstance) return;

    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = container.querySelector('#categorySearch');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Ctrl/Cmd + N: Add new category
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      showAddCategoryModal();
    }

    // Escape: Close any open modals
    if (e.key === 'Escape') {
      enhancedCategoryModalInstance?.close();
    }
  });
}

/**
 * 💡 Initialize tooltips
 */
function initializeTooltips(container) {
  // Simple tooltip implementation
  container.addEventListener('mouseenter', (e) => {
    const element = e.target;
    const title = element.getAttribute('title');

    if (title) {
      element.setAttribute('data-tooltip', title);
      element.removeAttribute('title');

      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = title;
      tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
      `;

      document.body.appendChild(tooltip);

      const updatePosition = (e) => {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 30 + 'px';
      };

      updatePosition(e);
      element.addEventListener('mousemove', updatePosition);

      element.addEventListener('mouseleave', () => {
        tooltip.remove();
        element.setAttribute('title', element.getAttribute('data-tooltip'));
        element.removeAttribute('data-tooltip');
      }, { once: true });
    }
  });
}
