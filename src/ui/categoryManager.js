import { AppState } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';

/**
 * Show the category manager modal
 */
export function showCategoryManagerModal() {
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

  attachCategoryManagerEventListeners(modalContent, modal);
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
      <h4>Existing Categories (${Object.keys(categories).length})</h4>
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
          <span class="subcategory-count">${subCount} subs</span>
          <button class="btn btn-sm btn-secondary manage-subs-btn" data-category="${categoryName}">
            Manage
          </button>
        </td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-danger delete-category-btn" data-category="${categoryName}">
            🗑️
          </button>
        </td>
      </tr>
    `;

    // Add subcategories row if expanded
    if (subCount > 0) {
      html += `
        <tr class="subcategories-row" id="subcategories-${categoryName}" style="display: none;">
          <td colspan="5">
            <div class="subcategories-container">
              ${buildSubcategoriesSection(categoryName, subcategories)}
            </div>
          </td>
        </tr>
      `;
    }
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

  // Manage subcategories buttons
  container.querySelectorAll('.manage-subs-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const categoryName = e.target.dataset.category;
      const subRow = container.querySelector(`#subcategories-${categoryName}`);
      if (subRow) {
        const isVisible = subRow.style.display !== 'none';
        subRow.style.display = isVisible ? 'none' : 'table-row';
        e.target.textContent = isVisible ? 'Manage' : 'Hide';
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

  // Add subcategory buttons
  container.querySelectorAll('.add-subcategory-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parentCategory = e.target.dataset.parent;
      const nameInput = container.querySelector(`input.subname-input[data-parent="${parentCategory}"]:not([data-subcategory])`);
      const colorInput = container.querySelector(`input.subcolor-input[data-parent="${parentCategory}"]:not([data-subcategory])`);

      if (nameInput && nameInput.value.trim()) {
        addSubcategory(parentCategory, nameInput.value.trim(), colorInput.value);
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  });

  // Delete subcategory buttons
  container.querySelectorAll('.delete-subcategory-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parentCategory = e.target.dataset.parent;
      const subcategoryName = e.target.dataset.subcategory;
      if (confirm(`Delete subcategory "${subcategoryName}"?`)) {
        deleteSubcategory(parentCategory, subcategoryName);
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  });

  // Subcategory input change handlers
  container.querySelectorAll('.subname-input[data-subcategory], .subcolor-input[data-subcategory]').forEach(input => {
    input.addEventListener('change', (e) => {
      const parentCategory = e.target.dataset.parent;
      const subcategoryName = e.target.dataset.subcategory;
      saveSubcategoryChanges(parentCategory, subcategoryName, container);
    });
  });
}

function addCategory(name, color) {
  if (!AppState.categories) {
    AppState.categories = {};
  }

  // Get the highest order number and add 1
  const maxOrder = Math.max(0, ...Object.values(AppState.categories).map(cat =>
    (typeof cat === 'object' && cat.order !== undefined) ? cat.order : 0
  ));

  AppState.categories[name] = {
    color: color,
    order: maxOrder + 1,
    subcategories: {}
  };

  saveCategories();
}

function deleteCategory(categoryName) {
  if (AppState.categories && AppState.categories[categoryName]) {
    delete AppState.categories[categoryName];
    saveCategories();
  }
}

function addSubcategory(parentCategory, name, color) {
  if (AppState.categories && AppState.categories[parentCategory]) {
    if (typeof AppState.categories[parentCategory] === 'string') {
      // Convert old format to new format
      AppState.categories[parentCategory] = {
        color: AppState.categories[parentCategory],
        order: 0,
        subcategories: {}
      };
    }

    if (!AppState.categories[parentCategory].subcategories) {
      AppState.categories[parentCategory].subcategories = {};
    }

    AppState.categories[parentCategory].subcategories[name] = color;
    saveCategories();
  }
}

function deleteSubcategory(parentCategory, subcategoryName) {
  if (AppState.categories &&
    AppState.categories[parentCategory] &&
    AppState.categories[parentCategory].subcategories &&
    AppState.categories[parentCategory].subcategories[subcategoryName]) {
    delete AppState.categories[parentCategory].subcategories[subcategoryName];
    saveCategories();
  }
}

function saveCategoryChanges(categoryName, container) {
  if (!AppState.categories || !AppState.categories[categoryName]) return;

  const orderInput = container.querySelector(`.order-input[data-category="${categoryName}"]`);
  const colorInput = container.querySelector(`.color-input[data-category="${categoryName}"]`);
  const nameInput = container.querySelector(`.name-input[data-category="${categoryName}"]`);

  if (orderInput && colorInput && nameInput) {
    const newName = nameInput.value.trim();
    const category = AppState.categories[categoryName];

    if (newName !== categoryName) {
      // Rename category
      AppState.categories[newName] = category;
      delete AppState.categories[categoryName];
    }

    // Update category data
    if (typeof AppState.categories[newName] === 'string') {
      AppState.categories[newName] = {
        color: colorInput.value,
        order: parseInt(orderInput.value) || 0,
        subcategories: {}
      };
    } else {
      AppState.categories[newName].color = colorInput.value;
      AppState.categories[newName].order = parseInt(orderInput.value) || 0;
    }

    saveCategories();
  }
}

function saveSubcategoryChanges(parentCategory, subcategoryName, container) {
  if (!AppState.categories || !AppState.categories[parentCategory]) return;

  const nameInput = container.querySelector(`.subname-input[data-parent="${parentCategory}"][data-subcategory="${subcategoryName}"]`);
  const colorInput = container.querySelector(`.subcolor-input[data-parent="${parentCategory}"][data-subcategory="${subcategoryName}"]`);

  if (nameInput && colorInput) {
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;

    if (typeof AppState.categories[parentCategory] === 'string') {
      AppState.categories[parentCategory] = {
        color: AppState.categories[parentCategory],
        order: 0,
        subcategories: {}
      };
    }

    if (!AppState.categories[parentCategory].subcategories) {
      AppState.categories[parentCategory].subcategories = {};
    }

    if (newName !== subcategoryName) {
      // Rename subcategory
      AppState.categories[parentCategory].subcategories[newName] = newColor;
      delete AppState.categories[parentCategory].subcategories[subcategoryName];
    } else {
      // Update color
      AppState.categories[parentCategory].subcategories[newName] = newColor;
    }

    saveCategories();
  }
}

function saveCategories() {
  try {
    localStorage.setItem('expenseCategories', JSON.stringify(AppState.categories));
    console.log('Categories saved to localStorage');

    // Show success feedback
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Categories saved', 'success');
      }
    });

    // Update transaction buttons
    setTimeout(() => {
      import('./transactionManager.js').then(txModule => {
        if (txModule.renderCategoryButtons) {
          txModule.renderCategoryButtons();
        }
      });
    }, 100);

  } catch (error) {
    console.error('Error saving categories:', error);
    import('./uiManager.js').then(module => {
      if (module.showToast) {
        module.showToast('Error saving categories', 'error');
      }
    });
  }
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
