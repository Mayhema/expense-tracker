import { AppState, saveCategories } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { showModal } from "./modalManager.js";
import { renderCategoryMappingUI } from "./categoryMapping.js";
import { getContrastColor } from "../utils/utils.js";
import { updateTransactions } from "./transactionManager.js";
import { updateChartsWithCurrentData } from "../charts/chartManager.js";

/**
 * Initializes category management
 */
export function initializeCategories() {
  loadCategoriesFromStorage();
  setupCategoryEventHandlers();
}

/**
 * Loads categories from localStorage
 */
function loadCategoriesFromStorage() {
  try {
    const savedCategories = localStorage.getItem("expenseCategories");
    if (savedCategories) {
      AppState.categories = JSON.parse(savedCategories);
      console.log("Loaded categories:", AppState.categories);
    } else {
      saveCategories(); // Save default categories
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    // Maintain default categories defined in AppState
  }
}

/**
 * Setup event handlers for category management
 */
function setupCategoryEventHandlers() {
  document.addEventListener('DOMContentLoaded', () => {
    const editCategoriesBtn = document.getElementById('editCategoriesSidebarBtn');
    if (editCategoriesBtn) {
      editCategoriesBtn.addEventListener('click', showCategoryManagerModal);
    }
  });
}

/**
 * Shows the category management modal with improved UI
 */
export function showCategoryManagerModal() {
  const modalContent = document.createElement('div');
  modalContent.className = 'category-modal-content';

  // Add category form
  modalContent.innerHTML = `
    <div class="add-category-form" style="margin-bottom:20px">
      <input type="color" id="newCategoryColor" value="#4CAF50">
      <input type="text" id="newCategoryName" placeholder="New category name..." style="flex:1">
      <button id="addCategoryBtn" class="primary-btn">Add Category</button>
    </div>
    <div class="categories-container"></div>
    <div class="category-mapping-container-wrapper">
      <div id="categoryMappingContainer" class="category-mapping-container" style="margin-top:20px;border-top:1px solid #eee;padding-top:15px;"></div>
    </div>
  `;

  const modal = showModal({
    title: "Category Management",
    content: modalContent,
    size: "large"
  });

  renderCategories();
  renderCategoryMappingUI();

  // Add category button handler
  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('newCategoryName');
    const colorInput = document.getElementById('newCategoryColor');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Please enter a category name", "warning");
      return;
    }

    if (AppState.categories[name]) {
      showToast("Category already exists", "warning");
      return;
    }

    // Add new category
    AppState.categories[name] = color;
    saveCategories();

    // Clear inputs
    nameInput.value = '';
    colorInput.value = '#4CAF50';

    // Re-render categories
    renderCategories();
    showToast(`Category "${name}" added`, "success");
  });
}

/**
 * Renders the categories in the modal
 */
function renderCategories() {
  const container = document.querySelector('.categories-container');
  if (!container) return;

  let html = '';

  Object.entries(AppState.categories).forEach(([name, value]) => {
    const isComplex = typeof value === 'object';
    const color = isComplex ? value.color : value;
    const textColor = getContrastColor(color);

    // Get subcategories if available
    const subcategories = isComplex && value.subcategories ? Object.entries(value.subcategories) : [];

    html += `
      <div class="category-section" data-category="${name}">
        <div class="category-section-header" style="background-color:${color};color:${textColor};display:flex;justify-content:space-between;padding:10px;margin-bottom:5px;">
          <div class="category-header-left">
            <strong>${name}</strong>
            ${subcategories.length ? `<span style="margin-left:10px;font-size:0.8em;">(${subcategories.length} subcategories)</span>` : ''}
          </div>
          <div class="category-header-actions">
            <button class="edit-category-btn small-btn" style="background:none;border:none;color:inherit;margin-right:10px;" data-category="${name}">✏️</button>
            <button class="delete-category-btn small-btn" style="background:none;border:none;color:inherit;" data-category="${name}">❌</button>
          </div>
        </div>

        <div class="subcategories-container" style="padding:10px;background:#f9f9f9;display:${subcategories.length ? 'block' : 'none'};">
          ${subcategories.map(([subName, subColor]) => `
            <div class="subcategory-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;padding:5px;">
              <div style="display:flex;align-items:center;">
                <div style="width:15px;height:15px;background-color:${subColor};margin-right:10px;border-radius:3px;"></div>
                <span>${subName}</span>
              </div>
              <div>
                <button class="edit-subcategory-btn small-btn" style="background:none;border:none;"
                  data-category="${name}" data-subcategory="${subName}">✏️</button>
                <button class="delete-subcategory-btn small-btn" style="background:none;border:none;"
                  data-category="${name}" data-subcategory="${subName}">❌</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="add-subcategory-container" style="padding:10px;margin-top:5px;">
          <button class="add-subcategory-btn button" data-category="${name}">Add Subcategory</button>
        </div>
      </div>
      <hr style="margin:15px 0;">
    `;
  });

  container.innerHTML = html;

  // Attach event handlers
  attachCategoryEventHandlers();
}

/**
 * Attaches event handlers to category UI elements
 */
function attachCategoryEventHandlers() {
  // Edit category buttons
  document.querySelectorAll('.edit-category-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      editCategory(categoryName);
    });
  });

  // Delete category buttons
  document.querySelectorAll('.delete-category-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      deleteCategory(categoryName);
    });
  });

  // Add subcategory buttons
  document.querySelectorAll('.add-subcategory-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      addSubcategory(categoryName);
    });
  });

  // Edit subcategory buttons
  document.querySelectorAll('.edit-subcategory-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      const subcategoryName = e.target.getAttribute('data-subcategory');
      editSubcategory(categoryName, subcategoryName);
    });
  });

  // Delete subcategory buttons
  document.querySelectorAll('.delete-subcategory-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      const subcategoryName = e.target.getAttribute('data-subcategory');
      deleteSubcategory(categoryName, subcategoryName);
    });
  });
}

/**
 * Edits an existing category
 * @param {string} categoryName - The category to edit
 */
function editCategory(categoryName) {
  const categoryValue = AppState.categories[categoryName];
  if (!categoryValue) return;

  const isComplex = typeof categoryValue === 'object';
  const currentColor = isComplex ? categoryValue.color : categoryValue;

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div class="edit-category-form">
      <div style="margin-bottom:15px;">
        <label for="editCategoryName">Category Name:</label>
        <input type="text" id="editCategoryName" value="${categoryName}" style="width:100%;margin-top:5px;padding:8px;">
      </div>
      <div style="margin-bottom:15px;">
        <label for="editCategoryColor">Category Color:</label>
        <input type="color" id="editCategoryColor" value="${currentColor}" style="width:100%;margin-top:5px;">
      </div>
      <div class="button-container" style="display:flex;justify-content:flex-end;margin-top:20px;">
        <button id="cancelCategoryEditBtn" class="button" style="margin-right:10px;">Cancel</button>
        <button id="saveCategoryEditBtn" class="button primary-btn">Save</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Edit Category: ${categoryName}`,
    content: modalContent,
    size: "small"
  });

  document.getElementById('cancelCategoryEditBtn').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('saveCategoryEditBtn').addEventListener('click', () => {
    const newName = document.getElementById('editCategoryName').value.trim();
    const newColor = document.getElementById('editCategoryColor').value;

    if (!newName) {
      showToast("Category name cannot be empty", "error");
      return;
    }

    if (newName !== categoryName && AppState.categories[newName]) {
      showToast("A category with this name already exists", "error");
      return;
    }

    // Handle the update based on whether it's a simple or complex category
    if (isComplex) {
      // For complex categories, preserve subcategories
      const updatedValue = {
        ...categoryValue,
        color: newColor
      };

      // If name changed, delete old and create new
      if (newName !== categoryName) {
        delete AppState.categories[categoryName];
        AppState.categories[newName] = updatedValue;

        // Update category mappings and transactions (would need additional code)
      } else {
        // Just update the color
        AppState.categories[categoryName] = updatedValue;
      }
    } else {
      // For simple categories
      if (newName !== categoryName) {
        delete AppState.categories[categoryName];
        AppState.categories[newName] = newColor;

        // Update category mappings and transactions (would need additional code)
      } else {
        AppState.categories[categoryName] = newColor;
      }
    }

    saveCategories();
    renderCategories();
    showToast("Category updated successfully", "success");
    modal.close();

    // Refresh transactions with new categories
    updateTransactions();
  });
}

/**
 * Deletes a category
 * @param {string} categoryName - The category to delete
 */
function deleteCategory(categoryName) {
  if (!confirm(`Are you sure you want to delete "${categoryName}" category? This cannot be undone.`)) {
    return;
  }

  delete AppState.categories[categoryName];
  saveCategories();
  renderCategories();
  showToast(`Category "${categoryName}" deleted`, "success");

  // Update transactions to remove this category
  updateTransactions();
}

/**
 * Adds a subcategory to a category
 * @param {string} categoryName - The parent category
 */
function addSubcategory(categoryName) {
  const categoryValue = AppState.categories[categoryName];
  if (!categoryValue) return;

  // Convert to complex category if it's simple
  let category;
  if (typeof categoryValue === 'string') {
    category = {
      color: categoryValue,
      subcategories: {}
    };
  } else {
    category = categoryValue;
    if (!category.subcategories) {
      category.subcategories = {};
    }
  }

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div class="add-subcategory-form">
      <div style="margin-bottom:15px;">
        <label for="subcategoryName">Subcategory Name:</label>
        <input type="text" id="subcategoryName" placeholder="Enter subcategory name" style="width:100%;margin-top:5px;padding:8px;">
      </div>
      <div style="margin-bottom:15px;">
        <label for="subcategoryColor">Subcategory Color:</label>
        <input type="color" id="subcategoryColor" value="${category.color}" style="width:100%;margin-top:5px;">
      </div>
      <div class="button-container" style="display:flex;justify-content:flex-end;margin-top:20px;">
        <button id="cancelAddSubcategoryBtn" class="button" style="margin-right:10px;">Cancel</button>
        <button id="saveAddSubcategoryBtn" class="button primary-btn">Add</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Add Subcategory to ${categoryName}`,
    content: modalContent,
    size: "small"
  });

  document.getElementById('cancelAddSubcategoryBtn').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('saveAddSubcategoryBtn').addEventListener('click', () => {
    const subcategoryName = document.getElementById('subcategoryName').value.trim();
    const subcategoryColor = document.getElementById('subcategoryColor').value;

    if (!subcategoryName) {
      showToast("Subcategory name cannot be empty", "error");
      return;
    }

    if (category.subcategories[subcategoryName]) {
      showToast(`Subcategory '${subcategoryName}' already exists`, "error");
      return;
    }

    // Add the subcategory
    category.subcategories[subcategoryName] = subcategoryColor;

    // Update the category in AppState
    AppState.categories[categoryName] = category;

    saveCategories();
    renderCategories();
    showToast(`Subcategory "${subcategoryName}" added to "${categoryName}"`, "success");
    modal.close();
  });
}

/**
 * Edits a subcategory
 * @param {string} categoryName - The parent category
 * @param {string} subcategoryName - The subcategory to edit
 */
function editSubcategory(categoryName, subcategoryName) {
  const categoryValue = AppState.categories[categoryName];
  if (!categoryValue || typeof categoryValue !== 'object' || !categoryValue.subcategories) {
    showToast("Category structure is invalid", "error");
    return;
  }

  const subcategoryColor = categoryValue.subcategories[subcategoryName];
  if (!subcategoryColor) {
    showToast("Subcategory not found", "error");
    return;
  }

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div class="edit-subcategory-form">
      <div style="margin-bottom:15px;">
        <label for="editSubcategoryName">Subcategory Name:</label>
        <input type="text" id="editSubcategoryName" value="${subcategoryName}" style="width:100%;margin-top:5px;padding:8px;">
      </div>
      <div style="margin-bottom:15px;">
        <label for="editSubcategoryColor">Subcategory Color:</label>
        <input type="color" id="editSubcategoryColor" value="${subcategoryColor}" style="width:100%;margin-top:5px;">
      </div>
      <div class="button-container" style="display:flex;justify-content:flex-end;margin-top:20px;">
        <button id="cancelEditSubcategoryBtn" class="button" style="margin-right:10px;">Cancel</button>
        <button id="saveEditSubcategoryBtn" class="button primary-btn">Save</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Edit Subcategory: ${subcategoryName}`,
    content: modalContent,
    size: "small"
  });

  document.getElementById('cancelEditSubcategoryBtn').addEventListener('click', () => {
    modal.close();
  });

  document.getElementById('saveEditSubcategoryBtn').addEventListener('click', () => {
    const newName = document.getElementById('editSubcategoryName').value.trim();
    const newColor = document.getElementById('editSubcategoryColor').value;

    if (!newName) {
      showToast("Subcategory name cannot be empty", "error");
      return;
    }

    if (newName !== subcategoryName && categoryValue.subcategories[newName]) {
      showToast(`Subcategory '${newName}' already exists`, "error");
      return;
    }

    // Update or rename the subcategory
    if (newName !== subcategoryName) {
      delete categoryValue.subcategories[subcategoryName];
      categoryValue.subcategories[newName] = newColor;

      // Update transactions with this subcategory (would need additional code)
    } else {
      categoryValue.subcategories[subcategoryName] = newColor;
    }

    saveCategories();
    renderCategories();
    showToast("Subcategory updated successfully", "success");
    modal.close();

    // Refresh transactions with new subcategories
    updateTransactions();
  });
}

/**
 * Deletes a subcategory
 * @param {string} categoryName - The parent category
 * @param {string} subcategoryName - The subcategory to delete
 */
function deleteSubcategory(categoryName, subcategoryName) {
  if (!confirm(`Are you sure you want to delete "${subcategoryName}" from "${categoryName}"? This cannot be undone.`)) {
    return;
  }

  const categoryValue = AppState.categories[categoryName];
  if (!categoryValue || typeof categoryValue !== 'object' || !categoryValue.subcategories) {
    showToast("Category structure is invalid", "error");
    return;
  }

  delete categoryValue.subcategories[subcategoryName];

  // If no more subcategories, convert back to simple category
  if (Object.keys(categoryValue.subcategories).length === 0) {
    AppState.categories[categoryName] = categoryValue.color;
  }

  saveCategories();
  renderCategories();
  showToast(`Subcategory "${subcategoryName}" deleted from "${categoryName}"`, "success");

  // Update transactions to remove this subcategory
  updateTransactions();
}

/**
 * Displays all subcategories across all categories
 */
export function showAllSubcategoriesModal() {
  const subcategories = [];

  // Collect all subcategories from all categories
  Object.entries(AppState.categories).forEach(([categoryName, value]) => {
    if (typeof value === 'object' && value.subcategories) {
      Object.entries(value.subcategories).forEach(([subcategoryName, subcategoryColor]) => {
        subcategories.push({
          category: categoryName,
          subcategory: subcategoryName,
          color: subcategoryColor
        });
      });
    }
  });

  const modalContent = document.createElement('div');

  if (subcategories.length === 0) {
    modalContent.innerHTML = '<p>No subcategories have been defined yet.</p>';
  } else {
    modalContent.innerHTML = `
      <div class="subcategories-list">
        <table class="subcategory-table" style="width:100%;">
          <thead>
            <tr>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Color</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${subcategories.map(item => `
              <tr>
                <td>${item.category}</td>
                <td>${item.subcategory}</td>
                <td>
                  <div style="width:20px;height:20px;background-color:${item.color};border-radius:3px;"></div>
                </td>
                <td>
                  <button class="edit-subcategory-btn small-btn"
                    data-category="${item.category}"
                    data-subcategory="${item.subcategory}">✏️</button>
                  <button class="delete-subcategory-btn small-btn"
                    data-category="${item.category}"
                    data-subcategory="${item.subcategory}">❌</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const modal = showModal({
    title: "All Subcategories",
    content: modalContent,
    size: "medium"
  });

  // Attach event handlers for edit and delete buttons
  modalContent.querySelectorAll('.edit-subcategory-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      const subcategoryName = e.target.getAttribute('data-subcategory');
      modal.close();
      editSubcategory(categoryName, subcategoryName);
    });
  });

  modalContent.querySelectorAll('.delete-subcategory-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const categoryName = e.target.getAttribute('data-category');
      const subcategoryName = e.target.getAttribute('data-subcategory');
      modal.close();
      deleteSubcategory(categoryName, subcategoryName);
    });
  });
}
