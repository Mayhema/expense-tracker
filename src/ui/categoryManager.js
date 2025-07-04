import { AppState } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';

/**
 * Ensure category modal uses singleton pattern:
 */
let categoryManagerModalInstance = null;

/**
 * Show the category manager modal
 */
export function showCategoryManagerModal() {
  // FIXED: Prevent multiple modals
  if (categoryManagerModalInstance) {
    console.log('Category manager modal already open');
    return categoryManagerModalInstance;
  }

  console.log("Opening category manager modal...");

  const modalContent = document.createElement('div');
  modalContent.className = 'category-manager-content';
  modalContent.innerHTML = buildCategoryManagerHTML();

  const modal = showModal({
    title: '🎨 Category Manager',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Store reference and override close method
  categoryManagerModalInstance = modal;
  const originalClose = modal.close;
  modal.close = function () {
    categoryManagerModalInstance = null;
    originalClose.call(this);
  };

  attachCategoryManagerEventListeners(modalContent, modal);

  return modal;
}

function buildCategoryManagerHTML() {
  const categories = AppState.categories || {};

  return `
    <div class="category-manager-header">
      <h3>Manage Categories</h3>
      <p>Create and organize your expense categories</p>
    </div>

    <div class="add-category-section">
      <h4>Add New Category</h4>
      <div class="form-row">
        <input type="text" id="newCategoryName" placeholder="Category name" />
        <input type="color" id="newCategoryColor" value="#3498db" />
        <button class="btn btn-primary" id="addCategoryBtn">Add Category</button>
      </div>
    </div>

    <div class="categories-section">
      <div class="categories-header">
        <h4>Existing Categories (${Object.keys(categories).length})</h4>
        <button class="btn btn-warning" id="resetCategoriesBtn" title="Reset to default categories">
          🔄 Reset to Defaults
        </button>
      </div>
      ${Object.keys(categories).length === 0 ?
      '<div class="empty-state">No categories created yet.</div>' :
      buildCategoriesTable(categories)
    }
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" id="closeCategoryManagerBtn">Close</button>
    </div>
  `;
}

function buildCategoriesTable(categories) {
  // Get sorted categories by order
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => {
      const orderA = (typeof a === 'object' && a.order !== undefined) ? a.order : 999;
      const orderB = (typeof b === 'object' && b.order !== undefined) ? b.order : 999;
      return orderA - orderB;
    });

  let html = `
    <table class="categories-table">
      <thead>
        <tr>
          <th class="order-cell">Order</th>
          <th class="color-cell">Color</th>
          <th class="name-cell">Name</th>
          <th class="subcategories-cell">Subcategories</th>
          <th class="actions-cell">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedCategories.forEach(([categoryName, categoryData], index) => {
    const order = (typeof categoryData === 'object' && categoryData.order !== undefined) ? categoryData.order : index;
    const color = (typeof categoryData === 'string') ? categoryData : (categoryData.color || '#cccccc');
    const subcategories = (typeof categoryData === 'object' && categoryData.subcategories) ? categoryData.subcategories : {};
    const subCount = Object.keys(subcategories).length;

    // FIXED: Create safe ID by encoding category name
    const safeId = btoa(categoryName).replace(/[^a-zA-Z0-9]/g, '');

    html += `
      <tr class="category-row" data-category="${categoryName}">
        <td class="order-cell">
          <input type="number"
                 class="order-input"
                 value="${order}"
                 data-category="${categoryName}"
                 min="0"
                 max="999">
        </td>
        <td class="color-cell">
          <input type="color"
                 class="color-input"
                 value="${color}"
                 data-category="${categoryName}">
        </td>
        <td class="name-cell">
          <input type="text"
                 class="name-input"
                 value="${categoryName}"
                 data-category="${categoryName}">
        </td>
        <td class="subcategories-cell">
          <div class="subcategory-info">
            <span class="subcategory-count">${subCount}</span>
            <button class="btn btn-sm btn-info manage-subs-btn" data-category="${categoryName}">
              <span class="manage-text">Manage</span>
            </button>
          </div>
        </td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-danger delete-category-btn" data-category="${categoryName}">
            🗑️
          </button>
        </td>
      </tr>
    `;

    // FIXED: Use safe ID and class-based selection instead of ID
    html += `
      <tr class="subcategories-row subcategories-for-${safeId}" data-category="${categoryName}" style="display: none;">
        <td colspan="5">
          <div class="subcategories-container">
            ${buildSubcategoriesSection(categoryName, subcategories)}
          </div>
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

function buildSubcategoriesSection(categoryName, subcategories) {
  return `
    <div class="subcategories-header">
      <h5>Subcategories for ${categoryName}</h5>
    </div>

    <div class="add-subcategory-form">
      <div class="form-row">
        <input type="text"
               class="subname-input"
               placeholder="Subcategory name"
               data-parent="${categoryName}">
        <input type="color"
               class="subcolor-input"
               value="#e74c3c"
               data-parent="${categoryName}">
        <button class="btn btn-sm btn-success add-subcategory-btn" data-parent="${categoryName}">
          Add
        </button>
      </div>
    </div>

    <table class="subcategories-table">
      <thead>
        <tr>
          <th>Color</th>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(subcategories).map(([subName, subColor]) => `
          <tr>
            <td>
              <input type="color"
                     class="subcolor-input"
                     value="${subColor}"
                     data-parent="${categoryName}"
                     data-subcategory="${subName}">
            </td>
            <td>
              <input type="text"
                     class="subname-input"
                     value="${subName}"
                     data-parent="${categoryName}"
                     data-subcategory="${subName}">
            </td>
            <td>
              <button class="btn btn-sm btn-danger delete-subcategory-btn"
                      data-parent="${categoryName}"
                      data-subcategory="${subName}">
                🗑️
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function attachCategoryManagerEventListeners(container, modal) {
  // Add category button
  const addCategoryBtn = container.querySelector('#addCategoryBtn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
      const nameInput = container.querySelector('#newCategoryName');
      const colorInput = container.querySelector('#newCategoryColor');

      if (nameInput.value.trim()) {
        addCategory(nameInput.value.trim(), colorInput.value);
        // Refresh the modal content
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  }

  // Reset to default categories button
  const resetCategoriesBtn = container.querySelector('#resetCategoriesBtn');
  if (resetCategoriesBtn) {
    resetCategoriesBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all categories to defaults? This will remove all your custom categories and cannot be undone.')) {
        resetToDefaultCategories();
        // Refresh the modal content
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  }

  // Close button
  const closeBtn = container.querySelector('#closeCategoryManagerBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.close();
    });
  }

  // Delete category buttons
  container.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = e.target.dataset.category;
      if (confirm(`Delete category "${categoryName}"?`)) {
        deleteCategory(categoryName);
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  });

  // FIXED: Manage subcategories buttons - use class-based selection
  container.querySelectorAll('.manage-subs-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const button = e.currentTarget;
      const categoryName = button.dataset.category;
      const safeId = btoa(categoryName).replace(/[^a-zA-Z0-9]/g, '');
      const subRow = container.querySelector(`.subcategories-for-${safeId}`);
      const manageText = button.querySelector('.manage-text');

      console.log('FIXED: Manage button clicked for category:', categoryName);
      console.log('FIXED: Safe ID:', safeId);
      console.log('FIXED: Found subRow:', !!subRow);
      console.log('FIXED: Found manageText:', !!manageText);

      if (subRow && manageText) {
        const isVisible = subRow.style.display === 'table-row';

        if (isVisible) {
          // Hide subcategories
          subRow.style.display = 'none';
          manageText.textContent = 'Manage';
          button.classList.remove('active');
          console.log('FIXED: Hiding subcategories');
        } else {
          // Show subcategories
          subRow.style.display = 'table-row';
          manageText.textContent = 'Hide';
          button.classList.add('active');
          console.log('FIXED: Showing subcategories');

          // FIXED: Re-attach event listeners for the newly shown subcategory elements
          attachSubcategoryListeners(subRow, container, modal);
        }
      } else {
        console.error('FIXED: Could not find subRow or manageText elements');
        console.error('FIXED: Available subcategory rows:', container.querySelectorAll('.subcategories-row').length);
        console.error('FIXED: Looking for class:', `.subcategories-for-${safeId}`);
      }
    });
  });

  // Input change handlers for saving
  container.querySelectorAll('.order-input, .color-input, .name-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const categoryName = e.target.dataset.category;
      saveCategoryChanges(categoryName, container);
    });
  });
}

// FIXED: Rename function to avoid duplicate declaration
function attachSubcategoryListeners(subRow, container, modal) {
  // Add subcategory buttons with proper event handling
  subRow.querySelectorAll('.add-subcategory-btn').forEach(btn => {
    // Remove existing listeners by cloning the node
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentCategory = e.target.dataset.parent;
      const nameInput = subRow.querySelector(`input.subname-input[data-parent="${parentCategory}"]:not([data-subcategory])`);
      const colorInput = subRow.querySelector(`input.subcolor-input[data-parent="${parentCategory}"]:not([data-subcategory])`);

      console.log('FIXED: Add subcategory clicked for:', parentCategory);
      console.log('FIXED: Found inputs:', !!nameInput, !!colorInput);

      if (nameInput && nameInput.value.trim()) {
        if (addSubcategory(parentCategory, nameInput.value.trim(), colorInput.value)) {
          // Refresh the modal content
          container.innerHTML = buildCategoryManagerHTML();
          attachCategoryManagerEventListeners(container, modal);

          // Show the subcategory section after refresh
          setTimeout(() => {
            const newSubRow = container.querySelector(`#subcategories-${parentCategory}`);
            const manageBtn = container.querySelector(`.manage-subs-btn[data-category="${parentCategory}"]`);
            const manageText = manageBtn?.querySelector('.manage-text');

            if (newSubRow && manageBtn && manageText) {
              newSubRow.style.display = 'table-row';
              manageText.textContent = 'Hide';
              manageBtn.classList.add('active');
              // Re-attach listeners for the newly shown section
              attachSubcategoryListeners(newSubRow, container, modal);
            }
          }, 100);
        }
      }
    });
  });

  // Delete subcategory buttons
  subRow.querySelectorAll('.delete-subcategory-btn').forEach(btn => {
    // Remove existing listeners by cloning the node
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentCategory = e.target.dataset.parent;
      const subcategoryName = e.target.dataset.subcategory;

      console.log('FIXED: Delete subcategory clicked:', subcategoryName, 'from', parentCategory);

      if (confirm(`Delete subcategory "${subcategoryName}"?`)) {
        deleteSubcategory(parentCategory, subcategoryName);
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  });

  // Subcategory input change handlers
  subRow.querySelectorAll('.subname-input[data-subcategory], .subcolor-input[data-subcategory]').forEach(input => {
    // Remove existing listeners by cloning the node
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    newInput.addEventListener('change', (e) => {
      const parentCategory = e.target.dataset.parent;
      const subcategoryName = e.target.dataset.subcategory;
      saveSubcategoryChanges(parentCategory, subcategoryName, container);
    });
  });
}

/**
 * Add category with real-time UI updates
 */
export function addCategory(name, color) {
  if (!name.trim()) {
    import('./uiManager.js').then(module => {
      module.showToast("Category name cannot be empty", "error");
    });
    return false;
  }

  if (AppState.categories[name]) {
    import('./uiManager.js').then(module => {
      module.showToast("Category already exists", "error");
    });
    return false;
  }

  // Get next order number
  const existingOrders = Object.values(AppState.categories)
    .map(cat => typeof cat === 'object' && cat.order !== undefined ? cat.order : 999)
    .filter(order => order !== 999);

  const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

  // Add category with order
  AppState.categories[name] = {
    color: color,
    order: nextOrder,
    subcategories: {}
  };

  // Save to localStorage
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }

  // Update all category UI elements in real-time
  import('./transactionManager.js').then(module => {
    if (module.updateAllCategoryUI) {
      module.updateAllCategoryUI();
    }
  }).catch(error => {
    console.warn('Could not update category UI:', error);
  });

  import('./uiManager.js').then(module => {
    module.showToast(`Category "${name}" added successfully`, "success");
  });

  return true;
}

/**
 * Update category with real-time UI updates
 */
export function updateCategory(oldName, newName, newColor) {
  if (!newName.trim()) {
    import('./uiManager.js').then(module => {
      module.showToast("Category name cannot be empty", "error");
    });
    return false;
  }

  if (newName !== oldName && AppState.categories[newName]) {
    import('./uiManager.js').then(module => {
      module.showToast("Category name already exists", "error");
    });
    return false;
  }

  const currentValue = AppState.categories[oldName];
  let updatedValue;

  if (typeof currentValue === 'object') {
    updatedValue = { ...currentValue, color: newColor };
  } else {
    updatedValue = {
      color: newColor,
      order: 999,
      subcategories: {}
    };
  }

  if (oldName !== newName) {
    delete AppState.categories[oldName];
    AppState.categories[newName] = updatedValue;

    // Update transactions that use this category - use ID-based approach
    if (AppState.transactions) {
      AppState.transactions.forEach(tx => {
        if (tx.category === oldName) {
          tx.category = newName;
          // Mark as edited but preserve ID
          tx.edited = true;
        }
      });
      localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
    }
  } else {
    AppState.categories[oldName] = updatedValue;
  }

  // Save to localStorage
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }

  // Update all category UI elements in real-time
  import('./transactionManager.js').then(module => {
    if (module.updateAllCategoryUI) {
      module.updateAllCategoryUI();
    }
  }).catch(error => {
    console.warn('Could not update category UI:', error);
  });

  import('./uiManager.js').then(module => {
    module.showToast(`Category updated successfully`, "success");
  });

  return true;
}

/**
 * Delete category with real-time UI updates
 */
export function deleteCategory(name) {
  if (!AppState.categories[name]) {
    return false;
  }

  delete AppState.categories[name];

  // Update transactions that use this category
  if (AppState.transactions) {
    AppState.transactions.forEach(tx => {
      if (tx.category === name) {
        tx.category = '';
      }
    });
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));
  }

  // Save to localStorage
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }

  // Update all category UI elements in real-time
  import('./transactionManager.js').then(module => {
    if (module.updateAllCategoryUI) {
      module.updateAllCategoryUI();
    }
  }).catch(error => {
    console.warn('Could not update category UI:', error);
  });

  import('./uiManager.js').then(module => {
    module.showToast(`Category "${name}" deleted`, "success");
  });

  return true;
}

/**
 * Add subcategory with real-time UI updates
 */
export function addSubcategory(parentName, subName, subColor) {
  if (!subName.trim()) {
    import('./uiManager.js').then(module => {
      module.showToast("Subcategory name cannot be empty", "error");
    });
    return false;
  }

  let parentCategory = AppState.categories[parentName];
  if (!parentCategory) {
    return false;
  }

  // Convert string category to object if needed
  if (typeof parentCategory === 'string') {
    parentCategory = {
      color: parentCategory,
      order: 999,
      subcategories: {}
    };
    AppState.categories[parentName] = parentCategory;
  }

  // Ensure subcategories object exists
  if (!parentCategory.subcategories) {
    parentCategory.subcategories = {};
  }

  if (parentCategory.subcategories[subName]) {
    import('./uiManager.js').then(module => {
      module.showToast("Subcategory already exists", "error");
    });
    return false;
  }

  parentCategory.subcategories[subName] = subColor;

  // Save to localStorage
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }

  // Update all category UI elements in real-time
  import('./transactionManager.js').then(module => {
    if (module.updateAllCategoryUI) {
      module.updateAllCategoryUI();
    }
  }).catch(error => {
    console.warn('Could not update category UI:', error);
  });

  import('./uiManager.js').then(module => {
    module.showToast(`Subcategory "${subName}" added successfully`, "success");
  });

  return true;
}

function deleteSubcategory(parentCategory, subcategoryName) {
  if (!AppState.categories[parentCategory] ||
    typeof AppState.categories[parentCategory] !== 'object' ||
    !AppState.categories[parentCategory].subcategories ||
    !AppState.categories[parentCategory].subcategories[subcategoryName]) {
    return false;
  }

  delete AppState.categories[parentCategory].subcategories[subcategoryName];

  // Save to localStorage
  try {
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }

  return true;
}

function saveCategoryChanges(categoryName, container) {
  const row = container.querySelector(`tr[data-category="${categoryName}"]`);
  if (!row) return;

  const orderInput = row.querySelector('.order-input');
  const colorInput = row.querySelector('.color-input');
  const nameInput = row.querySelector('.name-input');

  const newOrder = parseInt(orderInput.value) || 0;
  const newColor = colorInput.value;
  const newName = nameInput.value.trim();

  if (!newName) {
    import('./uiManager.js').then(module => {
      module.showToast("Category name cannot be empty", "error");
    });
    return;
  }

  updateCategory(categoryName, newName, newColor);

  // Update order if it's different
  if (AppState.categories[newName] && typeof AppState.categories[newName] === 'object') {
    AppState.categories[newName].order = newOrder;
    localStorage.setItem('categories', JSON.stringify(AppState.categories));
  }
}

function saveSubcategoryChanges(parentCategory, subcategoryName, container) {
  // Implementation for saving subcategory changes
  console.log('Saving subcategory changes:', parentCategory, subcategoryName);
}

/**
 * Reset to default categories
 */
export function resetToDefaultCategories() {
  // Import default categories
  import('../constants/categories.js').then(categoriesModule => {
    // Clear existing categories
    AppState.categories = {};

    // Set default categories
    AppState.categories = { ...categoriesModule.DEFAULT_CATEGORIES };

    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(AppState.categories));

    // Clear any existing category mappings
    import('./categoryMapping.js').then(mappingModule => {
      if (mappingModule.resetCategoryMappingsForDefaults) {
        mappingModule.resetCategoryMappingsForDefaults();
      }
    }).catch(error => {
      console.warn('Could not reset category mappings:', error);
    });

    console.log(`Reset: Loaded ${Object.keys(AppState.categories).length} default categories`);

    // Update all category UI elements
    import('./transactionManager.js').then(module => {
      if (module.renderTransactions) {
        module.renderTransactions(AppState.transactions || [], true);
      }
    }).catch(error => {
      console.warn('Could not update transaction UI:', error);
    });

    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Categories reset to defaults', 'success');
      }
    });
  }).catch(error => {
    console.error('Error loading default categories:', error);
  });
}

/**
 * Handle managing subcategories for a category
 */
function handleManageSubcategories(categoryName) {
  console.log(`Managing subcategories for: ${categoryName}`);

  const categories = AppState.categories || {};
  const categoryData = categories[categoryName] || {};
  const subcategories = categoryData.subcategories || {};

  const modalContent = document.createElement('div');
  modalContent.className = 'subcategory-manager-content';

  let html = `
    <div class="subcategory-header">
      <h3>Manage Subcategories for: ${categoryName}</h3>
      <p>Organize your transactions with more specific subcategories.</p>
    </div>

    <div class="add-subcategory-section">
      <h4>Add New Subcategory</h4>
      <div class="subcategory-form">
        <input type="text" id="newSubcategoryName" placeholder="Subcategory name" maxlength="50">
        <input type="color" id="newSubcategoryColor" value="#3498db" title="Choose color">
        <button id="addSubcategoryBtn" class="button primary-btn">Add Subcategory</button>
      </div>
    </div>

    <div class="existing-subcategories-section">
      <h4>Existing Subcategories (${Object.keys(subcategories).length})</h4>
      <div id="subcategoriesList" class="subcategories-list">
  `;

  if (Object.keys(subcategories).length === 0) {
    html += `
      <div class="empty-subcategories">
        <p>No subcategories yet. Add some above!</p>
      </div>
    `;
  } else {
    Object.entries(subcategories).forEach(([subName, subColor]) => {
      html += `
        <div class="subcategory-item" data-subcategory="${subName}">
          <div class="subcategory-info">
            <span class="subcategory-color" style="background-color: ${subColor};"></span>
            <span class="subcategory-name">${subName}</span>
          </div>
          <div class="subcategory-actions">
            <input type="color" class="subcategory-color-picker" value="${subColor}" data-subcategory="${subName}" title="Change color">
            <button class="remove-subcategory-btn" data-subcategory="${subName}" title="Remove subcategory">🗑️</button>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>

    <div class="subcategory-actions-footer">
      <button id="closeSubcategoryModal" class="button secondary-btn">Close</button>
    </div>
  `;

  modalContent.innerHTML = html;

  const subcategoryModal = showModal({
    title: `Subcategories: ${categoryName}`,
    content: modalContent,
    size: 'medium',
    closeOnClickOutside: false
  });

  // Attach event listeners
  attachSubcategoryEventListeners(modalContent, subcategoryModal, categoryName);
}

/**
 * Attach event listeners for subcategory management
 */
function attachSubcategoryEventListeners(container, modal, categoryName) {
  // Add subcategory button
  const addBtn = container.querySelector('#addSubcategoryBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const nameInput = container.querySelector('#newSubcategoryName');
      const colorInput = container.querySelector('#newSubcategoryColor');

      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        showToast('Please enter a subcategory name', 'warning');
        return;
      }

      // Add subcategory
      if (!AppState.categories[categoryName]) {
        AppState.categories[categoryName] = {};
      }
      if (!AppState.categories[categoryName].subcategories) {
        AppState.categories[categoryName].subcategories = {};
      }

      AppState.categories[categoryName].subcategories[name] = color;

      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(AppState.categories));

      showToast(`Subcategory "${name}" added successfully`, 'success');

      // Refresh the modal
      modal.close();
      setTimeout(() => handleManageSubcategories(categoryName), 100);
    });
  }

  // Remove subcategory buttons
  container.querySelectorAll('.remove-subcategory-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subcategoryName = e.target.getAttribute('data-subcategory');

      if (confirm(`Are you sure you want to remove the subcategory "${subcategoryName}"?`)) {
        delete AppState.categories[categoryName].subcategories[subcategoryName];

        // Save to localStorage
        localStorage.setItem('categories', JSON.stringify(AppState.categories));

        showToast(`Subcategory "${subcategoryName}" removed`, 'success');

        // Refresh the modal
        modal.close();
        setTimeout(() => handleManageSubcategories(categoryName), 100);
      }
    });
  });

  // Color picker changes
  container.querySelectorAll('.subcategory-color-picker').forEach(picker => {
    picker.addEventListener('change', (e) => {
      const subcategoryName = e.target.getAttribute('data-subcategory');
      const newColor = e.target.value;

      AppState.categories[categoryName].subcategories[subcategoryName] = newColor;

      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(AppState.categories));

      // Update the color display
      const colorSpan = e.target.closest('.subcategory-item').querySelector('.subcategory-color');
      colorSpan.style.backgroundColor = newColor;

      showToast(`Color updated for "${subcategoryName}"`, 'success');
    });
  });

  // Close button
  const closeBtn = container.querySelector('#closeSubcategoryModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.close();
    });
  }
}

console.log("Category manager module loaded");
