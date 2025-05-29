import { AppState } from '../core/appState.js';
import { showModal } from './modalManager.js';
import { showToast } from './uiManager.js';

/**
 * Shows the category manager modal
 */
export function showCategoryManagerModal() {
  console.log('Opening category manager modal');

  const categories = AppState.categories || {};

  const modalContent = document.createElement('div');
  modalContent.className = 'category-manager-modal';

  modalContent.innerHTML = `
    <div class="category-manager">
      <h3>📂 Manage Categories</h3>
      <p>Create and organize your expense categories with custom colors.</p>

      <div class="add-category-section">
        <h4>Add New Category</h4>
        <div class="add-category-form">
          <input type="text" id="newCategoryName" placeholder="Category name..." maxlength="50">
          <input type="color" id="newCategoryColor" value="#4CAF50">
          <button id="addCategoryBtn" class="button primary-btn">Add Category</button>
        </div>
      </div>

      <div class="existing-categories">
        <h4>Existing Categories (${Object.keys(categories).length})</h4>
        <div id="categoriesList" class="categories-list">
          ${renderCategoriesList(categories)}
        </div>
      </div>
    </div>
  `;

  const modal = showModal({
    title: 'Category Manager',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Set up event listeners
  setupCategoryManagerEventListeners(modal);

  return modal;
}

/**
 * Renders the categories list
 */
function renderCategoriesList(categories) {
  if (Object.keys(categories).length === 0) {
    return '<p class="no-categories">No categories created yet.</p>';
  }

  let html = '';
  Object.entries(categories).forEach(([name, colorOrObj]) => {
    const color = typeof colorOrObj === 'string' ? colorOrObj : colorOrObj.color || '#4CAF50';

    html += `
      <div class="category-item" data-category="${name}">
        <div class="category-info">
          <div class="category-color" style="background-color: ${color};"></div>
          <span class="category-name">${name}</span>
        </div>
        <div class="category-actions">
          <button class="edit-category-btn" data-category="${name}" title="Edit">✏️</button>
          <button class="delete-category-btn" data-category="${name}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Sets up event listeners for the category manager
 */
function setupCategoryManagerEventListeners(modal) {
  const addBtn = document.getElementById('addCategoryBtn');
  const nameInput = document.getElementById('newCategoryName');
  const colorInput = document.getElementById('newCategoryColor');

  if (addBtn && nameInput && colorInput) {
    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (name) {
        addCategory(name, color);
        nameInput.value = '';
        colorInput.value = '#4CAF50';
        refreshCategoriesList();
      } else {
        showToast('Please enter a category name', 'warning');
      }
    });

    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addBtn.click();
      }
    });
  }

  // Set up delete and edit listeners using event delegation
  const categoriesList = document.getElementById('categoriesList');
  if (categoriesList) {
    categoriesList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-category-btn')) {
        const categoryName = e.target.dataset.category;
        deleteCategory(categoryName);
        refreshCategoriesList();
      } else if (e.target.classList.contains('edit-category-btn')) {
        const categoryName = e.target.dataset.category;
        editCategory(categoryName);
      }
    });
  }
}

/**
 * Adds a new category
 */
function addCategory(name, color) {
  const categories = AppState.categories || {};

  if (categories[name]) {
    showToast('Category already exists', 'warning');
    return;
  }

  categories[name] = { color };
  AppState.categories = categories;

  // Save to localStorage
  localStorage.setItem('categories', JSON.stringify(categories));

  showToast(`Category "${name}" added`, 'success');
}

/**
 * Deletes a category
 */
function deleteCategory(name) {
  if (!confirm(`Delete category "${name}"? This action cannot be undone.`)) {
    return;
  }

  const categories = AppState.categories || {};
  delete categories[name];
  AppState.categories = categories;

  // Save to localStorage
  localStorage.setItem('categories', JSON.stringify(categories));

  showToast(`Category "${name}" deleted`, 'success');
}

/**
 * Edits a category
 */
function editCategory(name) {
  const categories = AppState.categories || {};
  const category = categories[name];
  const currentColor = typeof category === 'string' ? category : category?.color || '#4CAF50';

  const newColor = prompt(`Change color for "${name}":`, currentColor);
  if (newColor && newColor !== currentColor) {
    categories[name] = { color: newColor };
    AppState.categories = categories;

    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(categories));

    showToast(`Category "${name}" updated`, 'success');
    refreshCategoriesList();
  }
}

/**
 * Refreshes the categories list
 */
function refreshCategoriesList() {
  const categoriesList = document.getElementById('categoriesList');
  if (categoriesList) {
    const categories = AppState.categories || {};
    categoriesList.innerHTML = renderCategoriesList(categories);
  }
}
