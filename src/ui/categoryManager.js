import { AppState, categoriesInitialized } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from "../core/constants.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";
import { updateCategoryNameInMappings, updateSubcategoryNameInMappings } from "./categoryMapping.js";

// Define all functions that will be exported only once at the end of the file
export function initializeCategories() {
  // Check if categories are already initialized
  if (categoriesInitialized) {
    console.log("Categories already initialized, attaching event listeners only");
    // Only attach event listeners, skip redundant initialization
    attachCategoryEventListeners();
    return;
  }

  console.log("Initializing categories:", Object.keys(AppState.categories));

  // Don't call ensureDefaultCategories again - it's already been called in appState.js
  attachCategoryEventListeners();
}

/**
 * Ensures default categories exist in the state
 */
function ensureDefaultCategories() {
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    AppState.categories = DEFAULT_CATEGORIES; // Use the centralized definition
    saveCategories();
  }
}

/**
 * Fallback function for ensuring default categories if AppState import fails
 */
function ensureDefaultCategoriesFallback() {
  try {
    // Direct access as fallback - use imported DEFAULT_CATEGORIES instead of hardcoded
    if (window.AppState && (!window.AppState.categories || Object.keys(window.AppState.categories).length === 0)) {
      window.AppState.categories = DEFAULT_CATEGORIES;
      localStorage.setItem("expenseCategories", JSON.stringify(window.AppState.categories));
    }
  } catch (err) {
    console.error("Fallback category initialization failed:", err);
  }
}

/**
 * Add event handlers for category management buttons
 */
function attachCategoryEventListeners() {
  document.addEventListener('DOMContentLoaded', () => {
    const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
    if (editCategoriesBtn) {
      editCategoriesBtn.addEventListener("click", showCategoryManagerModal);
    }

    // Add event listener for the RegexRuleEditor
    document.getElementById("openRegexEditorBtn")?.addEventListener("click", () => {
      import("./RegexRuleEditor.js").then(m => m.openRegexRuleEditor());
    });
  });
}

/**
 * Add a new category
 */
function addCategory(name, color) {
  if (!name) return false;

  // Make sure name is unique
  if (AppState.categories[name]) {
    showToast(`Category '${name}' already exists`, "error");
    return false;
  }

  // Simple category with just a color
  AppState.categories[name] = color || "#cccccc";
  saveCategories();

  showToast(`Category '${name}' added`, "success");
  return true;
}

/**
 * Update an existing category
 */
function updateCategory(oldName, newName, newColor) {
  if (!oldName || !newName) return false;

  // Check if the new name already exists (unless it's the same name)
  if (oldName !== newName && AppState.categories[newName]) {
    showToast(`Category '${newName}' already exists`, "error");
    return false;
  }

  // Get the current category value
  const currentValue = AppState.categories[oldName];

  // Handle complex vs. simple category format
  let updatedValue;
  if (typeof currentValue === 'object') {
    // Preserve subcategories if present
    updatedValue = { ...currentValue, color: newColor };
  } else {
    // Simple format - just color
    updatedValue = newColor;
  }

  // If name changed, delete old and add new
  if (oldName !== newName) {
    delete AppState.categories[oldName];
    AppState.categories[newName] = updatedValue;

    // Update any mappings that used this category
    updateCategoryNameInMappings(oldName, newName);

    showToast(`Category renamed to '${newName}'`, "success");
  } else {
    // Just update the color
    AppState.categories[oldName] = updatedValue;
    showToast(`Category '${oldName}' updated`, "success");
  }

  saveCategories();
  return true;
}

/**
 * Delete a category
 */
function deleteCategory(name) {
  if (!name || !AppState.categories[name]) return false;

  delete AppState.categories[name];
  saveCategories();

  showToast(`Category '${name}' deleted`, "success");
  return true;
}

/**
 * Add a subcategory to a parent category
 */
function addSubcategory(parentName, subName, subColor) {
  if (!parentName || !subName) return false;

  // Make sure parent exists
  if (!AppState.categories[parentName]) {
    showToast(`Parent category '${parentName}' doesn't exist`, "error");
    return false;
  }

  // Convert simple category to complex if needed
  let parentCategory = AppState.categories[parentName];
  if (typeof parentCategory === 'string') {
    // Convert from string color to object with color
    parentCategory = {
      color: parentCategory,
      subcategories: {}
    };
    AppState.categories[parentName] = parentCategory;
  }

  // Make sure subcategories object exists
  if (!parentCategory.subcategories) {
    parentCategory.subcategories = {};
  }

  // Check if subcategory already exists
  if (parentCategory.subcategories[subName]) {
    showToast(`Subcategory '${subName}' already exists`, "error");
    return false;
  }

  // Add the subcategory
  parentCategory.subcategories[subName] = subColor || "#cccccc";
  saveCategories();

  showToast(`Subcategory '${subName}' added`, "success");
  return true;
}

/**
 * Update a subcategory
 */
function updateSubcategory(parentName, oldSubName, newSubName, newSubColor) {
  if (!parentName || !oldSubName || !newSubName) return false;

  // Make sure parent exists
  const parentCategory = AppState.categories[parentName];
  if (!parentCategory || typeof parentCategory !== 'object' || !parentCategory.subcategories) {
    showToast(`Parent category '${parentName}' not found or has no subcategories`, "error");
    return false;
  }

  // Check if the old subcategory exists
  if (!parentCategory.subcategories[oldSubName]) {
    showToast(`Subcategory '${oldSubName}' not found`, "error");
    return false;
  }

  // Check if the new name already exists (unless it's the same name)
  if (oldSubName !== newSubName && parentCategory.subcategories[newSubName]) {
    showToast(`Subcategory '${newSubName}' already exists`, "error");
    return false;
  }

  // Update subcategory
  if (oldSubName !== newSubName) {
    // Rename - delete old and add new
    delete parentCategory.subcategories[oldSubName];
    parentCategory.subcategories[newSubName] = newSubColor;

    // Update any mappings that used this subcategory
    updateSubcategoryNameInMappings(parentName, oldSubName, newSubName);

    showToast(`Subcategory renamed to '${newSubName}'`, "success");
  } else {
    // Just update the color
    parentCategory.subcategories[oldSubName] = newSubColor;
    showToast(`Subcategory '${oldSubName}' updated`, "success");
  }

  saveCategories();
  return true;
}

/**
 * Delete a subcategory
 */
function deleteSubcategory(parentName, subName) {
  if (!parentName || !subName) return false;

  // Make sure parent exists
  const parentCategory = AppState.categories[parentName];
  if (!parentCategory || typeof parentCategory !== 'object' || !parentCategory.subcategories) {
    showToast(`Parent category '${parentName}' not found or has no subcategories`, "error");
    return false;
  }

  // Check if the subcategory exists
  if (!parentCategory.subcategories[subName]) {
    showToast(`Subcategory '${subName}' not found`, "error");
    return false;
  }

  // Delete the subcategory
  delete parentCategory.subcategories[subName];
  saveCategories();

  showToast(`Subcategory '${subName}' deleted`, "success");
  return true;
}

/**
 * Opens the category manager modal
 */
function showCategoryManagerModal() {
  const modalContent = document.createElement("div");
  modalContent.className = "category-modal-content";

  // Create the modal structure
  modalContent.innerHTML = buildCategoryManagerContent();

  // Show modal - remove unused modal variable
  showModal({
    title: "Manage Categories",
    content: modalContent,
    size: "extra-large" // Changed from "xlarge"
  });

  // Initialize the UI inside the modal
  renderCategoryUI(modalContent);
}

// Fix "xlarge" unknown word
function showCategoryModal() {
  const modalContent = createCategoryModalContent();

  showModal({
    title: "Manage Categories",
    content: modalContent,
    size: "extra-large" // Changed from "xlarge"
  });
}

// Add this missing function (referenced but not defined)
function renderCategoryUI(container) {
  // Implement category UI rendering
  const categoriesList = container.querySelector("#categoriesList");
  if (!categoriesList) return;

  let html = '';

  // Sort categories alphabetically
  const sortedCategories = Object.keys(AppState.categories).sort();

  sortedCategories.forEach(name => {
    const value = AppState.categories[name];
    const color = typeof value === 'string' ? value : (value.color || '#cccccc');

    html += `
      <div class="category-edit-row">
        <input type="color" value="${color}" data-name="${name}" class="category-color-input">
        <input type="text" value="${name}" data-original="${name}" class="category-name-input">
        <button class="save-category-btn" data-name="${name}">Save</button>
        <button class="delete-category-btn" data-name="${name}">Delete</button>
        <button class="subcategories-btn" data-name="${name}">Subcategories</button>
      </div>
    `;

    // If this category has subcategories, render them too
    if (typeof value === 'object' && value.subcategories) {
      // Render subcategories UI
    }
  });

  categoriesList.innerHTML = html;

  // Attach event handlers to the generated elements
  attachCategoryUIEventHandlers(container);
}

// Add this missing function too
function attachCategoryUIEventHandlers(container) {
  // Implementation...
}

/**
 * Builds the HTML content for the category manager modal
 */
function buildCategoryManagerContent() {
  return `
    <div class="category-section">
      <h3>Manage Categories</h3>
      <p>Add, edit, and delete expense categories. Each category can have a unique color and subcategories.</p>

      <div class="add-category-form">
        <input type="color" id="newCategoryColor" value="#4CAF50">
        <input type="text" id="newCategoryName" placeholder="New Category Name">
        <button id="addCategoryBtn" class="button">Add Category</button>
      </div>

      <div id="categoriesList"></div>
    </div>

    <div class="category-mapping-section">
      <h3>Category Mappings</h3>
      <p>View and manage automatic transaction categorization rules.</p>
      <div id="categoryMappingContainer"></div>
    </div>

    <div class="button-container" style="text-align: right; margin-top: 20px;">
      <button id="openRegexEditorBtn" class="button">Edit Rules</button>
      <button id="closeCategoryManagerBtn" class="button">Close</button>
    </div>
  `;
}

// IMPORTANT: Single export statement for all functions - this prevents duplicate exports
export {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  showCategoryManagerModal
};
