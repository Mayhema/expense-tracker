import { AppState, saveCategories } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import {
  addCategory,
  updateCategory,
  updateSubcategory,
} from "../constants/categories.js";

// Singleton pattern to ensure only one modal is open
let categoryModalInstance = null;

/**
 * Shows the category manager modal
 */
export function showCategoryManagerModal() {
  // If a modal is already open, don't open another one
  if (categoryModalInstance) {
    return;
  }

  try {
    const modalContent = document.createElement("div");
    modalContent.className = "category-modal-content";

    modalContent.innerHTML = `
      <div class="category-manager">
        <div class="section-header">
          <h3>Manage Categories</h3>
          <p>Create, edit, and organize your expense categories</p>
        </div>

        <div class="add-category-section">
          <h4>Add New Category</h4>
          <div class="add-category-form">
            <input type="color" id="newCategoryColor" value="#4CAF50">
            <input type="text" id="newCategoryName" placeholder="Category name">
            <button class="primary-btn" id="addCategoryBtn">Add Category</button>
          </div>
        </div>

        <div class="categories-list-section">
          <h4>Existing Categories</h4>
          <div id="categoriesList" class="categories-list">
            <!-- Categories will be rendered here -->
          </div>
        </div>

        <div class="modal-footer">
          <button class="primary-btn" id="openRegexEditorBtnModal">Advanced Rules</button>
          <button class="secondary-btn" id="closeCategoryManagerBtn">Close</button>
        </div>
      </div>
    `;

    // Show modal using modal manager
    import("./modalManager.js").then((module) => {
      categoryModalInstance = module.showModal({
        title: "📂 Category Manager",
        content: modalContent,
        size: "large",
        closeOnClickOutside: false,
      });

      // Override the close method to reset instance
      const originalClose = categoryModalInstance.close;
      categoryModalInstance.close = function () {
        categoryModalInstance = null;
        originalClose.call(this);
      };

      // Render categories and attach events
      renderCategoryList(modalContent);
      attachEventHandlers(modalContent, categoryModalInstance);
    });
  } catch (error) {
    console.error("Error showing category manager modal:", error);
    categoryModalInstance = null;
  }
}

/**
 * Renders the category list in the modal
 */
function renderCategoryList(container) {
  const categoriesList = container.querySelector("#categoriesList");
  if (!categoriesList) return;

  const categories = AppState.categories || {};
  const sortedCategories = Object.keys(categories).sort((a, b) =>
    a.localeCompare(b)
  );

  if (sortedCategories.length === 0) {
    categoriesList.innerHTML = `
      <div class="empty-state">
        <p>No categories created yet.</p>
        <p>Add your first category above to get started.</p>
      </div>
    `;
    return;
  }

  let html = '<div class="categories-table">';

  sortedCategories.forEach((name, index) => {
    const category = categories[name];
    const isComplexCategory = typeof category === "object";
    const color = isComplexCategory ? category.color : category;

    html += `
      <div class="category-row" data-category="${name}">
        <div class="category-info">
          <div class="category-order">
            <span class="order-number">#${index + 1}</span>
          </div>
          <div class="category-visual">
            <input type="color" class="category-color-input" value="${color}" data-category="${name}">
          </div>
          <div class="category-details">
            <input type="text" class="category-name-input" value="${name}" data-original-name="${name}">
            ${
              isComplexCategory && category.subcategories
                ? `<span class="subcategory-count">${
                    Object.keys(category.subcategories).length
                  } subcategories</span>`
                : '<span class="subcategory-count">No subcategories</span>'
            }
          </div>
        </div>
        <div class="category-actions">
          <button class="action-btn save-btn primary-btn" data-category="${name}">Save</button>
          <button class="action-btn delete-btn danger-btn" data-category="${name}">Delete</button>
          ${
            isComplexCategory
              ? `
            <button class="action-btn subcategories-btn secondary-btn toggle-subcategories" data-category="${name}">
              <span class="subcategories-text">Subcategories</span>
            </button>
          `
              : ""
          }
        </div>
      </div>
      ${
        isComplexCategory
          ? `
        <div class="subcategories-container" data-category="${name}" style="display: none;">
          <div class="subcategories-header">
            <h5>Subcategories for ${name}</h5>
          </div>
          <div class="subcategories-list">
            ${renderSubcategories(name, category.subcategories)}
          </div>
          <div class="add-subcategory-form">
            <input type="color" class="subcategory-color-input" value="#e0e0e0" data-parent="${name}">
            <input type="text" class="subcategory-name-input" placeholder="New subcategory name" data-parent="${name}">
            <button class="primary-btn add-subcategory-btn" data-parent="${name}">Add Subcategory</button>
          </div>
        </div>
      `
          : ""
      }
    `;
  });

  html += "</div>";
  categoriesList.innerHTML = html;

  // Add styles for improved layout
  addCategoryModalStyles();
}

/**
 * Render subcategories for a category
 */
function renderSubcategories(parentName, subcategories) {
  if (!subcategories || Object.keys(subcategories).length === 0) {
    return '<div class="empty-subcategories">No subcategories</div>';
  }

  return Object.entries(subcategories)
    .map(
      ([subName, subColor]) => `
    <div class="subcategory-row">
      <input type="color" class="subcategory-color-input" value="${subColor}" data-parent="${parentName}" data-subcategory="${subName}">
      <input type="text" class="subcategory-name-input" value="${subName}" data-parent="${parentName}" data-original-name="${subName}">
      <div class="subcategory-actions">
        <button class="action-btn save-btn primary-btn save-subcategory-btn" data-parent="${parentName}" data-subcategory="${subName}">Save</button>
        <button class="action-btn delete-btn danger-btn delete-subcategory-btn" data-parent="${parentName}" data-subcategory="${subName}">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Add enhanced styles for better modal layout
 */
function addCategoryModalStyles() {
  if (document.getElementById("categoryModalStyles")) return;

  const style = document.createElement("style");
  style.id = "categoryModalStyles";
  style.textContent = `
    .category-manager {
      max-width: 100%;
    }

    .section-header {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .section-header h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .section-header p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .add-category-section {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }

    .add-category-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }

    .add-category-form {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .categories-list-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }

    .categories-table {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }

    .category-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      background: white;
    }

    .category-row:last-child {
      border-bottom: none;
    }

    .category-row:hover {
      background: #f8f9fa;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .category-order {
      min-width: 40px;
    }

    .order-number {
      font-weight: bold;
      color: #666;
      font-size: 0.9rem;
    }

    .category-visual input[type="color"] {
      width: 40px;
      height: 40px;
      border: 2px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
    }

    .category-details {
      flex: 1;
    }

    .category-name-input {
      width: 100%;
      max-width: 200px;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
    }

    .subcategory-count {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .category-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .primary-btn {
      background: #007bff;
      color: white;
    }

    .primary-btn:hover {
      background: #0056b3;
    }

    .secondary-btn {
      background: #6c757d;
      color: white;
    }

    .secondary-btn:hover {
      background: #545b62;
    }

    .danger-btn {
      background: #dc3545;
      color: white;
    }

    .danger-btn:hover {
      background: #c82333;
    }

    .subcategories-container {
      background: #f8f9fa;
      padding: 1rem;
      margin: 0;
      border-top: 1px solid #e0e0e0;
    }

    .subcategories-header h5 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 0.95rem;
    }

    .subcategory-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .subcategory-row:last-child {
      margin-bottom: 1rem;
    }

    .subcategory-color-input {
      width: 30px;
      height: 30px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .subcategory-name-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .subcategory-actions {
      display: flex;
      gap: 0.5rem;
    }

    .add-subcategory-form {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border: 2px dashed #007bff;
      border-radius: 4px;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .empty-subcategories {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-style: italic;
    }

    /* Dark mode styles */
    .dark-mode .category-manager {
      color: #e0e0e0;
    }

    .dark-mode .section-header h3,
    .dark-mode .add-category-section h4,
    .dark-mode .categories-list-section h4 {
      color: #e0e0e0;
    }

    .dark-mode .section-header p {
      color: #ccc;
    }

    .dark-mode .add-category-section {
      background: #2a2a2a;
    }

    .dark-mode .category-row {
      background: #333;
      border-color: #555;
    }

    .dark-mode .category-row:hover {
      background: #404040;
    }

    .dark-mode .category-name-input,
    .dark-mode .subcategory-name-input {
      background: #444;
      color: #e0e0e0;
      border-color: #555;
    }

    .dark-mode .subcategories-container {
      background: #2a2a2a;
    }

    .dark-mode .subcategory-row,
    .dark-mode .add-subcategory-form {
      background: #333;
      border-color: #555;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Attaches event handlers to elements in the modal
 */
function attachEventHandlers(container, modal) {
  // Close button handler
  container
    .querySelector("#closeCategoryManagerBtn")
    .addEventListener("click", () => {
      modal.close();
    });

  // Add category button handler
  const addCategoryBtn = container.querySelector("#addCategoryBtn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      const nameInput = container.querySelector("#newCategoryName");
      const colorInput = container.querySelector("#newCategoryColor");

      if (!nameInput || !colorInput) return;

      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        showToast("Please enter a category name", "error");
        return;
      }

      if (addCategory(name, color)) {
        nameInput.value = "";
        renderCategoryList(container);
        showToast(`Category "${name}" added successfully`, "success");
      }
    });
  }

  // Delegate event handling for category buttons
  container
    .querySelector("#categoriesList")
    .addEventListener("click", (event) => {
      const target = event.target;

      if (target.classList.contains("save-btn")) {
        handleSaveCategoryClick(target, container);
      } else if (target.classList.contains("delete-btn")) {
        handleDeleteCategoryClick(target, container);
      } else if (
        target.classList.contains("toggle-subcategories") ||
        target.classList.contains("subcategories-btn")
      ) {
        handleToggleSubcategoriesClick(target, container);
      } else if (target.classList.contains("save-subcategory-btn")) {
        handleSaveSubcategoryClick(target, container);
      } else if (target.classList.contains("delete-subcategory-btn")) {
        handleDeleteSubcategoryClick(target, container);
      } else if (target.classList.contains("add-subcategory-btn")) {
        handleAddSubcategoryClick(target, container);
      }
    });

  // Handler functions for different button types
  function handleSaveCategoryClick(target, container) {
    const categoryName = target.getAttribute("data-category");
    const row = target.closest(".category-row");
    const nameInput = row.querySelector(".category-name-input");
    const colorInput = row.querySelector(".category-color-input");

    const newName = nameInput.value.trim();
    const newColor = colorInput.value;

    if (handleUpdateCategory(categoryName, newName, newColor)) {
      renderCategoryList(container);
      showToast(`Category "${newName}" updated successfully`, "success");
    }
  }

  function handleDeleteCategoryClick(target, container) {
    const categoryName = target.getAttribute("data-category");

    if (
      confirm(`Are you sure you want to delete the category "${categoryName}"?`)
    ) {
      delete AppState.categories[categoryName];
      saveCategories();
      renderCategoryList(container);
      showToast(`Category "${categoryName}" deleted`, "success");
    }
  }

  function handleToggleSubcategoriesClick(target, container) {
    const categoryName = target.getAttribute("data-category");
    const subcategoriesContainer = container.querySelector(
      `.subcategories-container[data-category="${categoryName}"]`
    );
    const textSpan = target.querySelector(".subcategories-text");

    if (subcategoriesContainer) {
      const isHidden = subcategoriesContainer.style.display === "none";
      subcategoriesContainer.style.display = isHidden ? "block" : "none";

      // Update button text
      if (textSpan) {
        textSpan.textContent = isHidden
          ? "Hide Subcategories"
          : "Subcategories";
      }
    }
  }

  function handleSaveSubcategoryClick(target, container) {
    const parentName = target.getAttribute("data-parent");
    const subcategoryName = target.getAttribute("data-subcategory");
    const row = target.closest(".subcategory-row");
    const nameInput = row.querySelector(".subcategory-name-input");
    const colorInput = row.querySelector(".subcategory-color-input");

    const newName = nameInput.value.trim();
    const newColor = colorInput.value;

    if (
      handleUpdateSubcategory(parentName, subcategoryName, newName, newColor)
    ) {
      renderCategoryList(container);
      showToast(`Subcategory "${newName}" updated successfully`, "success");
    }
  }

  function handleDeleteSubcategoryClick(target, container) {
    const parentName = target.getAttribute("data-parent");
    const subcategoryName = target.getAttribute("data-subcategory");

    if (
      confirm(
        `Are you sure you want to delete the subcategory "${subcategoryName}"?`
      )
    ) {
      const parentCategory = AppState.categories[parentName];
      if (parentCategory?.subcategories) {
        delete parentCategory.subcategories[subcategoryName];
        saveCategories();
        renderCategoryList(container);
        showToast(`Subcategory "${subcategoryName}" deleted`, "success");
      }
    }
  }

  function handleAddSubcategoryClick(target, container) {
    const parentName = target.getAttribute("data-parent");
    const form = target.closest(".add-subcategory-form");
    const nameInput = form.querySelector(".subcategory-name-input");
    const colorInput = form.querySelector(".subcategory-color-input");

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Please enter a subcategory name", "error");
      return;
    }

    ensureSubcategoriesExist(parentName);

    if (AppState.categories[parentName].subcategories[name]) {
      showToast("Subcategory already exists", "error");
      return;
    }

    AppState.categories[parentName].subcategories[name] = color;
    saveCategories();

    nameInput.value = "";
    renderCategoryList(container);
    showToast(`Subcategory "${name}" added successfully`, "success");
  }

  function ensureSubcategoriesExist(categoryName) {
    if (!AppState.categories[categoryName]) {
      AppState.categories[categoryName] = {
        color: "#cccccc",
        subcategories: {},
      };
    } else if (typeof AppState.categories[categoryName] === "string") {
      const color = AppState.categories[categoryName];
      AppState.categories[categoryName] = { color, subcategories: {} };
    } else if (!AppState.categories[categoryName].subcategories) {
      AppState.categories[categoryName].subcategories = {};
    }
  }

  // Add event handler for regex editor button
  container
    .querySelector("#openRegexEditorBtnModal")
    .addEventListener("click", () => {
      showToast("Regex editor feature coming soon", "info");
    });
}

/**
 * Handles category update with validation
 */
function handleUpdateCategory(oldName, newName, newColor) {
  if (!newName.trim()) {
    showToast("Category name cannot be empty", "error");
    return false;
  }

  if (newName !== oldName && AppState.categories[newName]) {
    showToast(`Category "${newName}" already exists`, "error");
    return false;
  }

  // Use the imported function from constants
  return updateCategory(oldName, newName, newColor);
}

/**
 * Handles subcategory update with validation
 */
function handleUpdateSubcategory(
  parentName,
  oldSubName,
  newSubName,
  newSubColor
) {
  if (!newSubName.trim()) {
    showToast("Subcategory name cannot be empty", "error");
    return false;
  }

  if (
    newSubName !== oldSubName &&
    AppState.categories[parentName]?.subcategories?.[newSubName]
  ) {
    showToast(`Subcategory "${newSubName}" already exists`, "error");
    return false;
  }

  // Use the imported function from constants
  return updateSubcategory(parentName, oldSubName, newSubName, newSubColor);
}
