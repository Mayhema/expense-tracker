import { AppState, saveCategories } from "../core/appState.js";
import { showToast } from "../ui/uiManager.js";
import { updateCategoryNameInMappings, updateSubcategoryNameInMappings } from "./categoryMapping.js";

// Singleton pattern to ensure only one modal is open
let categoryModalInstance = null;

/**
 * Shows the category manager modal
 */
export function showCategoryManagerModal() {
  // If a modal is already open, don't open another one
  if (categoryModalInstance) {
    console.log("Category modal is already open");
    return;
  }

  try {
    const modalContent = document.createElement("div");
    modalContent.className = "category-modal-content";

    modalContent.innerHTML = `
      <div class="category-section">
        <h3>Manage Categories</h3>
        <p>Add, edit, and delete expense categories. Each category can have a unique color and subcategories.</p>

        <div class="add-category-form">
          <input type="color" id="newCategoryColor" value="#4CAF50">
          <input type="text" id="newCategoryName" placeholder="New Category Name">
          <button id="addCategoryBtn" class="button primary-btn">Add Category</button>
        </div>

        <div id="categoriesList" class="categories-list"></div>
      </div>

      <div class="category-mapping-section">
        <h3>Category Mappings</h3>
        <p>View and manage automatic transaction categorization rules.</p>
        <div id="categoryMappingContainer"></div>
      </div>

      <div class="button-container" style="text-align: right; margin-top: 20px;">
        <button id="openRegexEditorBtn" class="button">Edit Rules</button>
        <button id="closeCategoryManagerBtn" class="button primary-btn">Close</button>
      </div>
    `;

    // Import modal manager dynamically to avoid circular dependencies
    import("./modalManager.js").then(module => {
      const modal = module.showModal({
        title: "Manage Categories",
        content: modalContent,
        size: "extra-large",
        onClose: () => {
          categoryModalInstance = null;
        }
      });

      // Store the modal instance
      categoryModalInstance = modal;

      // Initialize the UI inside the modal
      renderCategoryList(modalContent);

      // Attach event handlers
      attachEventHandlers(modalContent, modal);
    });
  } catch (error) {
    console.error("Error showing category modal:", error);
    showToast("Error showing category manager", "error");
  }
}

/**
 * Renders the category list in the modal
 */
function renderCategoryList(container) {
  const categoriesList = container.querySelector("#categoriesList");
  if (!categoriesList) return;

  let html = '';

  // Sort categories alphabetically
  const sortedCategories = Object.keys(AppState.categories).sort();

  sortedCategories.forEach(name => {
    const value = AppState.categories[name];
    const color = typeof value === 'string' ? value : (value.color || '#cccccc');

    html += `
      <div class="category-edit-row" data-category="${name}">
        <input type="color" value="${color}" data-name="${name}" class="category-color-input">
        <input type="text" value="${name}" data-original="${name}" class="category-name-input">
        <div class="category-buttons">
          <button class="save-category-btn primary-btn" data-name="${name}">Save</button>
          <button class="delete-category-btn" data-name="${name}">Delete</button>
          <button class="subcategories-btn" data-name="${name}">Subcategories</button>
        </div>
      </div>
    `;

    // Render subcategories if they exist
    if (typeof value === 'object' && value.subcategories) {
      const subcategories = value.subcategories;
      const subcategoryIds = Object.keys(subcategories);

      if (subcategoryIds.length > 0) {
        html += `<div class="subcategories-container" id="subcategories-${name}" style="margin-left: 20px; display: none;">`;

        subcategoryIds.sort().forEach(subName => {
          const subColor = subcategories[subName];
          html += `
            <div class="subcategory-edit-row" data-parent="${name}" data-subcategory="${subName}">
              <input type="color" value="${subColor}" class="subcategory-color-input">
              <input type="text" value="${subName}" data-original="${subName}" class="subcategory-name-input">
              <div class="subcategory-buttons">
                <button class="save-subcategory-btn primary-btn" data-parent="${name}" data-name="${subName}">Save</button>
                <button class="delete-subcategory-btn" data-parent="${name}" data-name="${subName}">Delete</button>
              </div>
            </div>
          `;
        });

        // Add form to create new subcategory
        html += `
          <div class="add-subcategory-form" data-parent="${name}">
            <input type="color" class="new-subcategory-color" value="#8bd48b">
            <input type="text" class="new-subcategory-name" placeholder="New Subcategory Name">
            <button class="add-subcategory-btn primary-btn" data-parent="${name}">Add</button>
          </div>
        </div>`;
      } else {
        html += `<div class="subcategories-container" id="subcategories-${name}" style="margin-left: 20px; display: none;">
          <div class="empty-subcategories">No subcategories yet.</div>
          <div class="add-subcategory-form" data-parent="${name}">
            <input type="color" class="new-subcategory-color" value="#8bd48b">
            <input type="text" class="new-subcategory-name" placeholder="New Subcategory Name">
            <button class="add-subcategory-btn primary-btn" data-parent="${name}">Add</button>
          </div>
        </div>`;
      }
    }
  });

  categoriesList.innerHTML = html;

  // Add styles for the improved category modal
  const style = document.createElement("style");
  style.textContent = `
    .category-edit-row, .subcategory-edit-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    .dark-mode .category-edit-row, .dark-mode .subcategory-edit-row {
      background-color: #333;
    }
    .category-color-input, .subcategory-color-input {
      width: 40px;
      height: 30px;
      border: none;
      padding: 0;
      margin-right: 10px;
    }
    .category-name-input, .subcategory-name-input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 10px;
    }
    .dark-mode .category-name-input, .dark-mode .subcategory-name-input {
      background-color: #444;
      color: #e0e0e0;
      border-color: #555;
    }
    .category-buttons, .subcategory-buttons {
      display: flex;
      gap: 5px;
    }
    .primary-btn {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .primary-btn:hover {
      background-color: #45a049;
    }
    .delete-category-btn, .delete-subcategory-btn {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .delete-category-btn:hover, .delete-subcategory-btn:hover {
      background-color: #d32f2f;
    }
    .subcategories-btn {
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .subcategories-btn:hover {
      background-color: #0b7dda;
    }
    .add-category-form, .add-subcategory-form {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      gap: 10px;
    }
    .subcategories-container {
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .dark-mode .subcategories-container {
      background-color: #2a2a2a;
    }
    .empty-subcategories {
      color: #999;
      font-style: italic;
      margin-bottom: 10px;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Attaches event handlers to elements in the modal
 */
function attachEventHandlers(container, modal) {
  // Close button handler
  container.querySelector("#closeCategoryManagerBtn").addEventListener("click", () => {
    modal.close();
    categoryModalInstance = null;
  });

  // Add category button handler
  container.querySelector("#addCategoryBtn").addEventListener("click", () => {
    const nameInput = container.querySelector("#newCategoryName");
    const colorInput = container.querySelector("#newCategoryColor");

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Please enter a category name", "error");
      return;
    }

    // Check if category already exists
    if (AppState.categories[name]) {
      showToast("This category already exists", "error");
      return;
    }

    // Add the new category
    AppState.categories[name] = color;

    // Save to local storage
    saveCategories();

    // Clear the inputs
    nameInput.value = "";

    // Re-render the category list
    renderCategoryList(container);

    showToast(`Category "${name}" added successfully`, "success");
  });

  // Delegate event handling for category buttons
  container.querySelector("#categoriesList").addEventListener("click", (event) => {
    const target = event.target;

    const buttonHandlers = {
      "save-category-btn": () => handleSaveCategoryClick(target, container),
      "delete-category-btn": () => handleDeleteCategoryClick(target, container),
      "subcategories-btn": () => handleSubcategoriesClick(target, container),
      "save-subcategory-btn": () => handleSaveSubcategoryClick(target, container),
      "delete-subcategory-btn": () => handleDeleteSubcategoryClick(target, container),
      "add-subcategory-btn": () => handleAddSubcategoryClick(target, container)
    };

    // Execute handler if button class matches
    for (const [className, handler] of Object.entries(buttonHandlers)) {
      if (target.classList.contains(className)) {
        handler();
        break;
      }
    }
  });

  // Handler functions for different button types
  function handleSaveCategoryClick(target, container) {
    const categoryName = target.getAttribute("data-name");
    const row = target.closest(".category-edit-row");
    const nameInput = row.querySelector(".category-name-input");
    const colorInput = row.querySelector(".category-color-input");
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;

    if (!newName) {
      showToast("Category name cannot be empty", "error");
      return;
    }

    if (newName !== categoryName && AppState.categories[newName]) {
      showToast(`Category "${newName}" already exists`, "error");
      return;
    }

    updateCategory(categoryName, newName, newColor);
    renderCategoryList(container);
    showToast(`Category updated successfully`, "success");
  }

  function handleDeleteCategoryClick(target, container) {
    const categoryName = target.getAttribute("data-name");
    if (confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      delete AppState.categories[categoryName];
      saveCategories();
      renderCategoryList(container);
      showToast(`Category "${categoryName}" deleted`, "success");
    }
  }

  function handleSubcategoriesClick(target, container) {
    const categoryName = target.getAttribute("data-name");
    const subcategoriesContainer = container.querySelector(`#subcategories-${categoryName}`);

    if (subcategoriesContainer) {
      const isVisible = subcategoriesContainer.style.display !== "none";
      subcategoriesContainer.style.display = isVisible ? "none" : "block";

      if (!isVisible) {
        ensureSubcategoriesExist(categoryName);
      }
    }
  }

  function handleSaveSubcategoryClick(target, container) {
    const parentCategory = target.getAttribute("data-parent");
    const subcategoryName = target.getAttribute("data-name");
    const row = target.closest(".subcategory-edit-row");
    const nameInput = row.querySelector(".subcategory-name-input");
    const colorInput = row.querySelector(".subcategory-color-input");
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;

    if (!newName) {
      showToast("Subcategory name cannot be empty", "error");
      return;
    }

    if (newName !== subcategoryName &&
      AppState.categories[parentCategory].subcategories[newName]) {
      showToast(`Subcategory "${newName}" already exists`, "error");
      return;
    }

    updateSubcategory(parentCategory, subcategoryName, newName, newColor);
    renderCategoryList(container);
    showToast(`Subcategory updated successfully`, "success");
  }

  function handleDeleteSubcategoryClick(target, container) {
    const parentCategory = target.getAttribute("data-parent");
    const subcategoryName = target.getAttribute("data-name");

    if (confirm(`Are you sure you want to delete subcategory "${subcategoryName}"?`)) {
      delete AppState.categories[parentCategory].subcategories[subcategoryName];
      saveCategories();
      renderCategoryList(container);
      showToast(`Subcategory "${subcategoryName}" deleted`, "success");
    }
  }

  function handleAddSubcategoryClick(target, container) {
    const parentCategory = target.getAttribute("data-parent");
    const form = target.closest(".add-subcategory-form");
    const nameInput = form.querySelector(".new-subcategory-name");
    const colorInput = form.querySelector(".new-subcategory-color");
    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Please enter a subcategory name", "error");
      return;
    }

    ensureSubcategoriesExist(parentCategory);

    if (AppState.categories[parentCategory].subcategories[name]) {
      showToast("This subcategory already exists", "error");
      return;
    }

    AppState.categories[parentCategory].subcategories[name] = color;
    saveCategories();
    nameInput.value = "";
    renderCategoryList(container);
    showToast(`Subcategory "${name}" added successfully`, "success");
  }

  function ensureSubcategoriesExist(categoryName) {
    if (typeof AppState.categories[categoryName] === "string") {
      const color = AppState.categories[categoryName];
      AppState.categories[categoryName] = {
        color: color,
        subcategories: {}
      };
      saveCategories();
    } else if (!AppState.categories[categoryName].subcategories) {
      AppState.categories[categoryName].subcategories = {};
      saveCategories();
    }
  }

  // Add event handler for regex editor button
  container.querySelector("#openRegexEditorBtn").addEventListener("click", () => {
    import("./RegexRuleEditor.js")
      .then(module => module.openRegexRuleEditor())
      .catch(error => console.error("Error opening regex editor:", error));
  });
}

/**
 * Updates an existing category
 */
function updateCategory(oldName, newName, newColor) {
  if (!oldName || !newName) return false;

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
  } else {
    // Just update the color
    AppState.categories[oldName] = updatedValue;
  }

  saveCategories();
  return true;
}

/**
 * Updates a subcategory
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
  } else {
    // Just update the color
    parentCategory.subcategories[oldSubName] = newSubColor;
  }

  saveCategories();
  return true;
}
