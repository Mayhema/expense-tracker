import { AppState } from "../../core/appState.js";
// Remove this unused import: import { showCategoryManagerModal } from "../categoryManager.js";
import { showToast } from "../uiManager.js";
import { showModal } from "../modalManager.js";
import { getContrastColor } from "../../utils/utils.js";
import { updateTransactions } from "../transactionManager.js";
import { updateChartsWithCurrentData } from "../../charts/chartManager.js";
import { getDescriptionsForCategory } from "../categoryMapping.js";

/**
 * Generate a random color for new categories in HEX format
 * @returns {string} Random HEX color
 */
function getRandomColor() {
  // Generate a valid hex color (not HSL)
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Shows a modal to add a new category
 */
function showAddCategoryModal() {
  // Get a random color for the new category (in hex format)
  const initialColor = getRandomColor();

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div class="add-category-form">
      <input type="color" id="newCategoryColor" value="${initialColor}">
      <input type="text" id="newCategoryName" placeholder="Category name..." style="flex:1">
    </div>
    <div class="button-container" style="margin-top:15px;">
      <button id="saveCategoryBtn" class="primary-btn">Add Category</button>
      <button id="cancelCategoryBtn" class="button">Cancel</button>
    </div>
  `;

  const modal = showModal({
    title: "Add New Category",
    content: modalContent,
    size: "small"
  });

  document.getElementById('saveCategoryBtn').addEventListener('click', () => {
    const name = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value;

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
    showToast(`Category "${name}" added`, "success");

    // Close modal
    modal.close();

    // Refresh the main category modal if needed
    if (typeof updateTransactions === 'function') {
      updateTransactions();
    }

    if (typeof updateChartsWithCurrentData === 'function') {
      updateChartsWithCurrentData();
    }
  });

  document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
    modal.close();
  });
}

/**
 * Shows the category management modal
 */
function openEditCategoriesModal() {
  const modalContent = document.createElement('div');
  modalContent.className = 'category-modal-content';

  // Add category form
  modalContent.innerHTML = `
    <div class="add-category-form" style="margin-bottom:20px">
      <input type="color" id="newCategoryColor" value="${getRandomColor()}">
      <input type="text" id="newCategoryName" placeholder="New category name..." style="flex:1">
      <button id="addCategoryBtn" class="primary-btn">Add Category</button>
    </div>
    <div class="categories-container"></div>
    <div class="category-mapping-container-wrapper">
      <div id="categoryMappingContainer" class="category-mapping-container" style="margin-top:20px;border-top:1px solid #eee;padding-top:15px;"></div>
    </div>
  `;

  showModal({
    title: "Category Management",
    content: modalContent,
    size: "large"
  });

  renderCategoryList();

  // Add event listeners
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
    colorInput.value = getRandomColor();

    // Re-render categories
    renderCategoryList();
    showToast(`Category "${name}" added`, "success");

    // Update transactions with new category
    updateTransactions();
    updateChartsWithCurrentData();
  });
}

/**
 * Renders the list of categories in the modal
 */
function renderCategoryList() {
  if (!AppState.categories) return;

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
        <div class="category-section-header" style="background-color:${color};color:${textColor};padding:10px;margin-bottom:5px;">
          <div class="category-name">${name}</div>
          <div class="category-actions">
            <button class="edit-btn small-btn" onclick="window.editCategoryItem('${name}')" title="Edit category">✏️</button>
            <button class="delete-btn small-btn" onclick="window.deleteCategoryItem('${name}')" title="Delete category">❌</button>
            <button class="mappings-btn small-btn" onclick="window.showCategoryMappings('${name}')" title="View mappings">🔗</button>
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
                <button class="edit-subcategory-btn small-btn" onclick="window.editSubcategoryItem('${name}', '${subName}')" title="Edit subcategory">✏️</button>
                <button class="delete-subcategory-btn small-btn" onclick="window.deleteSubcategoryItem('${name}', '${subName}')" title="Delete subcategory">❌</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="add-subcategory-container" style="padding:10px;margin-top:5px;">
          <button class="add-subcategory-btn button" onclick="window.addSubcategoryItem('${name}')">Add Subcategory</button>
        </div>
      </div>
      <hr style="margin:15px 0;">
    `;
  });

  container.innerHTML = html;
}

/**
 * Edit a category
 * @param {string} categoryName - The category to edit
 */
function editCategoryItem(categoryName) {
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
      } else {
        // Just update the color
        AppState.categories[categoryName] = updatedValue;
      }
    } else if (newName !== categoryName) {
      // For simple categories when name has changed
      delete AppState.categories[categoryName];
      AppState.categories[newName] = newColor;
    } else {
      // For simple categories when only color has changed
      AppState.categories[categoryName] = newColor;
    }

    saveCategories();
    renderCategoryList();
    showToast("Category updated successfully", "success");
    modal.close();

    // Refresh UI
    updateTransactions();
    updateChartsWithCurrentData();
  });
}

/**
 * Delete a category
 * @param {string} categoryName - The category to delete
 */
function deleteCategoryItem(categoryName) {
  if (!confirm(`Are you sure you want to delete "${categoryName}" category? This cannot be undone.`)) {
    return;
  }

  delete AppState.categories[categoryName];
  saveCategories();
  renderCategoryList();
  showToast(`Category "${categoryName}" deleted`, "success");

  // Update transactions to remove this category
  updateTransactions();
  updateChartsWithCurrentData();
}

/**
 * Add a subcategory to a category
 * @param {string} categoryName - The parent category
 */
function addSubcategoryItem(categoryName) {
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
    renderCategoryList();
    showToast(`Subcategory "${subcategoryName}" added to "${categoryName}"`, "success");
    modal.close();
  });
}

/**
 * Edit a subcategory
 * @param {string} categoryName - The parent category
 * @param {string} subcategoryName - The subcategory to edit
 */
function editSubcategoryItem(categoryName, subcategoryName) {
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
    } else {
      categoryValue.subcategories[subcategoryName] = newColor;
    }

    saveCategories();
    renderCategoryList();
    showToast("Subcategory updated successfully", "success");
    modal.close();

    // Refresh transactions with new subcategories
    updateTransactions();
    updateChartsWithCurrentData();
  });
}

/**
 * Delete a subcategory
 * @param {string} categoryName - The parent category
 * @param {string} subcategoryName - The subcategory to delete
 */
function deleteSubcategoryItem(categoryName, subcategoryName) {
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
  renderCategoryList();
  showToast(`Subcategory "${subcategoryName}" deleted from "${categoryName}"`, "success");

  // Update transactions to remove this subcategory
  updateTransactions();
  updateChartsWithCurrentData();
}

/**
 * Show the mappings for a specific category
 * @param {string} categoryName - The category to show mappings for
 */
function showCategoryMappings(categoryName) {
  // Get descriptions using categoryMapping.js function
  const descriptions = getDescriptionsForCategory(categoryName);

  const modalContent = document.createElement('div');

  if (!descriptions || descriptions.length === 0) {
    modalContent.innerHTML = `<p>No mappings found for category "${categoryName}".</p>`;
  } else {
    modalContent.innerHTML = `
      <div class="category-mappings">
        <h3>Descriptions mapped to "${categoryName}"</h3>
        <ul style="max-height:300px;overflow-y:auto;list-style-type:none;padding:10px;background:#f9f9f9;">
          ${descriptions.map(desc => `<li style="padding:5px 0;border-bottom:1px solid #eee;">${desc}</li>`).join('')}
        </ul>
        <p style="margin-top:15px;color:#666;font-size:0.9em;">
          These descriptions will be automatically assigned to category "${categoryName}".
        </p>
      </div>
    `;
  }

  showModal({
    title: `Category Mappings: ${categoryName}`,
    content: modalContent,
    size: "medium"
  });
}

// SINGLE EXPORT SECTION - All exports are here in one place
// This prevents duplicate exports and makes imports/exports more maintainable
export {
  showAddCategoryModal,
  openEditCategoriesModal,
  // Add any other functions that need to be exported
};

// Make functions available globally for HTML onclick events
window.editCategoryItem = editCategoryItem;
window.deleteCategoryItem = deleteCategoryItem;
window.addSubcategoryItem = addSubcategoryItem;
window.editSubcategoryItem = editSubcategoryItem;
window.deleteSubcategoryItem = deleteSubcategoryItem;
window.showCategoryMappings = showCategoryMappings;
window.showAddCategoryModal = showAddCategoryModal;
window.openEditCategoriesModal = openEditCategoriesModal;

/**
 * Shows the category selection modal for a transaction
 * @param {object} transaction - The transaction to categorize
 * @param {function} onSelect - Callback when a category is selected
 */
export function showCategoryModal(transaction, onSelect) {
  // Handle case where we don't have a valid transaction
  if (!transaction) {
    showToast("Cannot categorize: Invalid transaction", "error");
    return;
  }

  const modalContent = document.createElement("div");
  modalContent.className = "category-selector-modal";

  // Add transaction info at the top
  modalContent.innerHTML = `
    <div class="transaction-summary" style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
      <p><strong>Description:</strong> ${transaction.description || "No description"}</p>
      <p><strong>Amount:</strong> ${transaction.income ? "+" + transaction.income : "-" + transaction.expenses}</p>
      <p><strong>Date:</strong> ${transaction.date || "No date"}</p>
    </div>

    <h3>Select Category</h3>
    <div class="category-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
      ${buildCategoryButtons(transaction.category)}
    </div>

    <div id="subcategorySection" style="margin-top: 20px; display: none;">
      <h3>Select Subcategory</h3>
      <div id="subcategoryGrid" class="subcategory-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
      </div>
    </div>

    <div class="modal-actions" style="margin-top: 20px; text-align: right;">
      <button id="categoryCancelBtn" class="button">Cancel</button>
    </div>
  `;

  // Show the modal
  const modal = showModal({
    title: "Categorize Transaction",
    content: modalContent,
    size: "large" // Changed from xlarge to fix spelling warning
  });

  /**
   * Handle subcategory button click
   */
  function handleSubcategoryClick(categoryName, modal, onSelect) {
    return function (event) {
      const subBtn = event.currentTarget;
      const subcategoryName = subBtn.getAttribute("data-subcategory");
      const subcategoryGrid = subBtn.closest(".subcategory-grid");

      // Update UI to show selection
      subcategoryGrid.querySelectorAll(".subcategory-btn").forEach(sb => {
        sb.classList.remove("selected");
      });
      subBtn.classList.add("selected");

      // Call onSelect with both category and subcategory
      if (typeof onSelect === "function") {
        onSelect(categoryName, subcategoryName);
        modal.close();
      }
    };
  }

  /**
   * Handle "None" subcategory button click
   */
  function handleNoneSubcategoryClick(categoryName, modal, onSelect) {
    return function () {
      // Call onSelect with just the category
      if (typeof onSelect === "function") {
        onSelect(categoryName, null);
        modal.close();
      }
    };
  }

  /**
   * Set up subcategory section
   */
  function setupSubcategorySection(categoryName, category, transaction, modal, subcategorySection, subcategoryGrid, onSelect) {
    subcategorySection.style.display = "block";
    subcategoryGrid.innerHTML = buildSubcategoryButtons(categoryName, category, transaction.subcategory);

    // Add event listeners for subcategory buttons
    subcategoryGrid.querySelectorAll(".subcategory-btn").forEach(subBtn => {
      subBtn.addEventListener("click", handleSubcategoryClick(categoryName, modal, onSelect));
    });

    // Add a "None" button for subcategories
    const noneBtn = subcategoryGrid.querySelector(".subcategory-none-btn");
    if (noneBtn) {
      noneBtn.addEventListener("click", handleNoneSubcategoryClick(categoryName, modal, onSelect));
    }
  }

  /**
   * Handle category button click
   */
  function handleCategoryClick(modalContent, transaction, modal, onSelect) {
    return function () {
      const btn = this;
      const categoryName = btn.getAttribute("data-category");

      // Update UI to show selection
      modalContent.querySelectorAll(".category-btn").forEach(b => {
        b.classList.remove("selected");
      });
      btn.classList.add("selected");

      // Check if this category has subcategories
      const category = AppState.categories[categoryName];
      if (typeof category === "object" && category.subcategories &&
        Object.keys(category.subcategories).length > 0) {
        // Show subcategories
        const subcategorySection = modalContent.querySelector("#subcategorySection");
        const subcategoryGrid = modalContent.querySelector("#subcategoryGrid");

        if (subcategorySection && subcategoryGrid) {
          setupSubcategorySection(categoryName, category, transaction, modal, subcategorySection, subcategoryGrid, onSelect);
        }
      } else if (typeof onSelect === "function") {
        // No subcategories, just call onSelect with the category
        onSelect(categoryName, null);
        modal.close();
      }
    };
  }

  // Add event listeners for category buttons
  modalContent.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", handleCategoryClick(modalContent, transaction, modal, onSelect));
  });

  // Add event listener for cancel button
  modalContent.querySelector("#categoryCancelBtn").addEventListener("click", () => {
    modal.close();
  });

  return modal;
}

/**
 * Build the HTML for category buttons
 */
function buildCategoryButtons(selectedCategory) {
  const categories = AppState.categories || {};

  if (Object.keys(categories).length === 0) {
    return '<p>No categories found. Please create categories first.</p>';
  }

  // Add a "None" option at the beginning
  let html = `
    <button class="category-btn ${!selectedCategory ? 'selected' : ''}"
            data-category=""
            style="background-color: #cccccc; color: #000000;">
      None
    </button>
  `;

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categories).sort();

  sortedCategories.forEach(categoryName => {
    const category = categories[categoryName];
    const color = typeof category === "object" ? category.color : category;
    const textColor = getContrastColor(color);
    const isSelected = categoryName === selectedCategory;

    html += `
      <button class="category-btn ${isSelected ? 'selected' : ''}"
              data-category="${categoryName}"
              style="background-color: ${color}; color: ${textColor};">
        ${categoryName}
      </button>
    `;
  });

  return html;
}

/**
 * Build the HTML for subcategory buttons
 */
function buildSubcategoryButtons(parentName, parentCategory, selectedSubcategory) {
  if (!parentCategory.subcategories || Object.keys(parentCategory.subcategories).length === 0) {
    return '<p>No subcategories found for this category.</p>';
  }

  // Add a "None" option at the beginning
  let html = `
    <button class="subcategory-btn subcategory-none-btn ${!selectedSubcategory ? 'selected' : ''}"
            data-subcategory=""
            style="background-color: ${parentCategory.color}; color: ${getContrastColor(parentCategory.color)};">
      No Subcategory
    </button>
  `;

  // Sort subcategories alphabetically
  const sortedSubcategories = Object.keys(parentCategory.subcategories).sort();

  sortedSubcategories.forEach(subName => {
    const subColor = parentCategory.subcategories[subName];
    const textColor = getContrastColor(subColor);
    const isSelected = subName === selectedSubcategory;

    html += `
      <button class="subcategory-btn ${isSelected ? 'selected' : ''}"
              data-subcategory="${subName}"
              style="background-color: ${subColor}; color: ${textColor};">
        ${subName}
      </button>
    `;
  });

  return html;
}

/**
 * Show a modal to edit or create a category
 */
export function showCategoryEditModal(existingCategory = null) {
  const isEdit = !!existingCategory;
  const title = isEdit ? "Edit Category" : "Add Category";

  // Get current values if editing
  let currentName = '';
  let currentColor = '#4CAF50';

  if (isEdit) {
    currentName = existingCategory;
    const categoryValue = AppState.categories[existingCategory];
    currentColor = typeof categoryValue === 'object' ? categoryValue.color : categoryValue;
  }

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div class="category-edit-form">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="categoryNameInput">Category Name:</label>
        <input type="text" id="categoryNameInput" value="${currentName}"
               style="width: 100%; padding: 8px; margin-top: 5px;">
      </div>

      <div class="form-group" style="margin-bottom: 15px;">
        <label for="categoryColorInput">Category Color:</label>
        <input type="color" id="categoryColorInput" value="${currentColor}"
               style="width: 100%; height: 40px; margin-top: 5px;">
      </div>

      <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelCategoryEditBtn" class="button">Cancel</button>
        <button id="saveCategoryEditBtn" class="button primary-btn">Save</button>
      </div>
    </div>
  `;

  // Show the modal
  const modal = showModal({
    title: title,
    content: modalContent,
    size: "small"
  });

  // Add event listeners
  modalContent.querySelector("#cancelCategoryEditBtn").addEventListener("click", () => {
    modal.close();
  });

  modalContent.querySelector("#saveCategoryEditBtn").addEventListener("click", () => {
    const nameInput = modalContent.querySelector("#categoryNameInput");
    const colorInput = modalContent.querySelector("#categoryColorInput");

    if (!nameInput || !colorInput) return;

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Category name cannot be empty", "error");
      return;
    }

    // If editing an existing category
    if (isEdit) {
      // Import the updateCategory function
      import("../categoryManager.js").then(module => {
        if (module.updateCategory(existingCategory, name, color)) {
          modal.close();
          // Trigger re-render if needed
          const event = new CustomEvent('categoryUpdated', {
            detail: { oldName: existingCategory, newName: name }
          });
          document.dispatchEvent(event);
        }
      });
    } else {
      // Creating a new category
      import("../categoryManager.js").then(module => {
        if (module.addCategory(name, color)) {
          modal.close();
          // Trigger re-render if needed
          const event = new CustomEvent('categoryAdded', {
            detail: { name: name }
          });
          document.dispatchEvent(event);
        }
      });
    }
  });

  return modal;
}
