import { AppState } from "../../core/appState.js";
import { showModal } from "../modalManager.js";
import { showToast } from "../uiManager.js";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../../ui/categoryManager.js";

/**
 * Track if modal is open to prevent multiple instances
 */
let categoryModalOpen = false;

/**
 * Shows the category management modal with improved UI
 */
export function showCategoryModal() {
  // Prevent multiple modals
  if (categoryModalOpen) return;

  // Create modal content with improved styling
  const modalContent = document.createElement("div");
  modalContent.className = "category-modal-content";
  modalContent.style.maxHeight = "80vh";
  modalContent.style.overflow = "auto";

  // Add improved styles to the header
  modalContent.innerHTML = `
    <style>
      .category-modal-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 10px 0;
      }
      .category-section {
        background: #f8f8f8;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .dark-mode .category-section {
        background: #2a2a2a;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .add-category-form {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 15px;
        border-bottom: 1px solid #ddd;
        margin-bottom: 15px;
      }
      .dark-mode .add-category-form {
        border-bottom: 1px solid #444;
      }
      .add-category-form input[type="text"] {
        flex-grow: 1;
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid #ccc;
      }
      .dark-mode .add-category-form input[type="text"] {
        background: #333;
        color: #fff;
        border-color: #555;
      }
      .add-category-form input[type="color"] {
        width: 40px;
        height: 36px;
        border: none;
        border-radius: 4px;
      }
      .action-btn {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }
      .primary-btn {
        background: #4CAF50;
        color: white;
      }
      .primary-btn:hover {
        background: #45a049;
      }
      .secondary-btn {
        background: #f0f0f0;
        color: #333;
        border: 1px solid #ddd;
      }
      .dark-mode .secondary-btn {
        background: #444;
        color: #eee;
        border: 1px solid #555;
      }
      .secondary-btn:hover {
        background: #e8e8e8;
      }
      .dark-mode .secondary-btn:hover {
        background: #555;
      }
      .danger-btn {
        background: #f44336;
        color: white;
      }
      .danger-btn:hover {
        background: #d32f2f;
      }
      .edit-btn {
        background: #2196F3;
        color: white;
      }
      .edit-btn:hover {
        background: #0b7dda;
      }
      .category-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 8px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      .dark-mode .category-item {
        background: #333;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
      .category-color {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        margin-right: 12px;
        flex-shrink: 0;
      }
      .category-name {
        flex-grow: 1;
        font-weight: 500;
      }
      .category-actions {
        display: flex;
        gap: 8px;
      }
      .subcategories-container {
        margin-left: 24px;
        padding-left: 10px;
        border-left: 2px solid #ddd;
        margin-top: 5px;
        margin-bottom: 15px;
      }
      .dark-mode .subcategories-container {
        border-left: 2px solid #555;
      }
      .subcategory-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 6px;
        background: #f9f9f9;
      }
      .dark-mode .subcategory-item {
        background: #2d2d2d;
      }
      .footer-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 10px;
      }
    </style>
    <div class="category-section">
      <h3>Add New Category</h3>
      <div class="add-category-form">
        <input type="color" id="newCategoryColor" value="#4CAF50">
        <input type="text" id="newCategoryName" placeholder="New Category Name">
        <button id="addCategoryBtn" class="action-btn primary-btn">Add Category</button>
      </div>

      <h3>Manage Categories</h3>
      <div id="categoriesList"></div>
    </div>
    <div class="footer-buttons">
      <button id="closeCategoryBtn" class="action-btn secondary-btn">Close</button>
    </div>
  `;

  const modal = showModal({
    title: "Category Management",
    content: modalContent,
    size: "large",
    closeOnClickOutside: false,
  });

  // Mark modal as open
  categoryModalOpen = true;

  // Set up event handlers
  setupCategoryModalEvents(modal);

  // Render initial categories
  renderCategories();

  // Add function for adding subcategories to a category
  function addSubcategoriesToCategory(categoryName, color) {
    const modalContent = document.createElement("div");
    modalContent.innerHTML = `
      <div class="add-subcategory-form">
        <input type="color" id="newSubcategoryColor" value="${color}">
        <input type="text" id="newSubcategoryName" placeholder="New subcategory name">
        <button id="addSubcategoryBtn" class="action-btn primary-btn">Add</button>
      </div>
    `;

    const modal = showModal({
      title: `Add Subcategories to ${categoryName}`,
      content: modalContent,
      size: "small",
    });

    document
      .getElementById("addSubcategoryBtn")
      .addEventListener("click", () => {
        const name = document.getElementById("newSubcategoryName").value.trim();
        const color = document.getElementById("newSubcategoryColor").value;

        if (!name) {
          showToast("Please enter a subcategory name", "error");
          return;
        }

        if (addSubcategory(categoryName, name, color)) {
          modal.close();
          renderCategories();
        }
      });
  }

  // Make sure imported functions are accessible to event handlers
  window.addSubcategory = addSubcategory;
  window.updateCategory = updateCategory;
  window.deleteCategory = deleteCategory;
  window.updateSubcategory = updateSubcategory;
  window.deleteSubcategory = deleteSubcategory;
  window.addSubcategoriesToCategory = addSubcategoriesToCategory;
}

/**
 * Sets up event handlers for the category modal
 * @param {Object} modal - The modal object with close method
 */
function setupCategoryModalEvents(modal) {
  // Add category button click
  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const nameInput = document.getElementById("newCategoryName");
    const colorInput = document.getElementById("newCategoryColor");

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      showToast("Please enter a category name", "error");
      return;
    }

    // Add the category
    addCategory(name, color);

    // Clear inputs
    nameInput.value = "";
    colorInput.value = "#4CAF50";

    // Update UI
    renderCategories();
  });

  // Close button click
  document.getElementById("closeCategoryBtn").addEventListener("click", () => {
    modal.close();
    categoryModalOpen = false;
  });

  // Handle modal close via X button or ESC key
  modal.element.querySelector(".modal-close").addEventListener("click", () => {
    categoryModalOpen = false;
  });
}

/**
 * Renders all categories in the modal
 */
function renderCategories() {
  const categoriesContainer = document.getElementById("categoriesList");
  if (!categoriesContainer) return;

  // Clear existing content
  categoriesContainer.innerHTML = "";

  // Sort categories alphabetically
  const sortedCategories = Object.entries(AppState.categories).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Render each category
  sortedCategories.forEach(([name, value]) => {
    const categoryElement = createCategoryElement(name, value);
    categoriesContainer.appendChild(categoryElement);
  });

  // If no categories, show message
  if (sortedCategories.length === 0) {
    categoriesContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        No categories defined. Add your first category above.
      </div>
    `;
  }
}

/**
 * Creates a DOM element for a category
 * @param {string} name - Category name
 * @param {string|Object} value - Category value (color string or object)
 * @returns {HTMLElement} Category DOM element
 */
function createCategoryElement(name, value) {
  const categoryDiv = document.createElement("div");
  categoryDiv.className = "category-item";

  // Determine color
  const color =
    typeof value === "object" ? value.color || "#cccccc" : value || "#cccccc";

  // Create the category element HTML
  categoryDiv.innerHTML = `
    <div class="category-color" style="background-color: ${color}"></div>
    <div class="category-name">${name}</div>
    <div class="category-actions">
      <button class="action-btn edit-btn edit-category-btn" data-name="${name}" data-color="${color}">Edit</button>
      ${
        typeof value === "object"
          ? `
        <button class="action-btn secondary-btn manage-subcategories-btn" data-name="${name}">
          Subcategories
        </button>
      `
          : `
        <button class="action-btn secondary-btn add-subcategories-btn" data-name="${name}">
          + Sub
        </button>
      `
      }
      <button class="action-btn danger-btn delete-category-btn" data-name="${name}">Delete</button>
    </div>
  `;

  // Add event handlers
  categoryDiv
    .querySelector(".edit-category-btn")
    .addEventListener("click", (e) => {
      const name = e.target.getAttribute("data-name");
      const color = e.target.getAttribute("data-color");
      showEditCategoryModal(name, color);
    });

  categoryDiv
    .querySelector(".delete-category-btn")
    .addEventListener("click", (e) => {
      const name = e.target.getAttribute("data-name");
      if (confirm(`Delete category "${name}"?`)) {
        deleteCategory(name);
        renderCategories();
      }
    });

  // Handle subcategory buttons
  const addSubBtn = categoryDiv.querySelector(".add-subcategories-btn");
  const manageSubBtn = categoryDiv.querySelector(".manage-subcategories-btn");

  if (addSubBtn) {
    addSubBtn.addEventListener("click", (e) => {
      const name = e.target.getAttribute("data-name");
      // Use the window-exposed helper defined in showCategoryModal
      if (typeof window.addSubcategoriesToCategory === "function") {
        window.addSubcategoriesToCategory(name, color);
      }
    });
  }

  if (manageSubBtn) {
    manageSubBtn.addEventListener("click", (e) => {
      const name = e.target.getAttribute("data-name");
      showSubcategoriesModal(name);
    });

    // If this category has subcategories, render them
    if (typeof value === "object" && value.subcategories) {
      const subcategoriesDiv = document.createElement("div");
      subcategoriesDiv.className = "subcategories-container";

      // Render each subcategory
      Object.entries(value.subcategories).forEach(([subName, subColor]) => {
        subcategoriesDiv.appendChild(
          createSubcategoryElement(name, subName, subColor)
        );
      });

      // Append subcategories below the category
      categoryDiv.insertAdjacentElement("afterend", subcategoriesDiv);
    }
  }

  return categoryDiv;
}

/**
 * Creates a subcategory element
 * @param {string} categoryName - Parent category name
 * @param {string} subcategoryName - Subcategory name
 * @param {string} color - Subcategory color
 * @returns {HTMLElement} Subcategory DOM element
 */
function createSubcategoryElement(categoryName, subcategoryName, color) {
  const subDiv = document.createElement("div");
  subDiv.className = "subcategory-item";

  subDiv.innerHTML = `
    <div class="category-name">${subcategoryName}</div>
    <div class="category-actions">
      <button class="action-btn edit-btn edit-subcategory-btn"
        data-category="${categoryName}"
        data-name="${subcategoryName}"
        data-color="${color}">Edit</button>
      <button class="action-btn danger-btn delete-subcategory-btn"
        data-category="${categoryName}"
        data-name="${subcategoryName}">Delete</button>
    </div>
  `;

  // Add event handlers
  subDiv
    .querySelector(".edit-subcategory-btn")
    .addEventListener("click", (e) => {
      const category = e.target.getAttribute("data-category");
      const name = e.target.getAttribute("data-name");
      const color = e.target.getAttribute("data-color");
      showEditSubcategoryModal(category, name, color);
    });

  subDiv
    .querySelector(".delete-subcategory-btn")
    .addEventListener("click", (e) => {
      const category = e.target.getAttribute("data-category");
      const name = e.target.getAttribute("data-name");

      if (confirm(`Delete subcategory "${name}" from "${category}"?`)) {
        deleteSubcategory(category, name);
        renderCategories();
      }
    });

  return subDiv;
}

/**
 * Shows modal to edit a category
 * @param {string} name - Category name
 * @param {string} color - Category color
 */
function showEditCategoryModal(name, color) {
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 10px;">
      <div style="margin-bottom: 20px;">
        <label for="editCategoryName">Category Name:</label>
        <input type="text" id="editCategoryName" value="${name}" style="width: 100%; padding: 8px; margin-top: 5px;">
      </div>

      <div style="margin-bottom: 20px;">
        <label for="editCategoryColor">Category Color:</label>
        <input type="color" id="editCategoryColor" value="${color}" style="width: 100%; height: 40px; margin-top: 5px;">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelEditCategoryBtn" class="action-btn secondary-btn">Cancel</button>
        <button id="saveEditCategoryBtn" class="action-btn primary-btn">Save Changes</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Edit Category: ${name}`,
    content: modalContent,
    size: "small",
  });

  // Handle cancel
  document
    .getElementById("cancelEditCategoryBtn")
    .addEventListener("click", () => {
      modal.close();
    });

  // Handle save
  document
    .getElementById("saveEditCategoryBtn")
    .addEventListener("click", () => {
      const newName = document.getElementById("editCategoryName").value.trim();
      const newColor = document.getElementById("editCategoryColor").value;

      if (!newName) {
        showToast("Category name cannot be empty", "error");
        return;
      }

      if (updateCategory(name, newName, newColor)) {
        modal.close();
        renderCategories();
      }
    });
}

/**
 * Shows modal to manage subcategories
 * @param {string} categoryName - Parent category name
 */
function showSubcategoriesModal(categoryName) {
  const categoryValue = AppState.categories[categoryName];
  if (!categoryValue || typeof categoryValue !== "object") return;

  const subcategories = categoryValue.subcategories || {};

  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 10px;">
      <div class="add-category-form">
        <input type="color" id="newSubcategoryColor" value="#4CAF50">
        <input type="text" id="newSubcategoryName" placeholder="New Subcategory Name">
        <button id="addSubcategoryBtn" class="action-btn primary-btn">Add</button>
      </div>

      <div id="subcategoriesList"></div>

      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <button id="closeSubcategoriesBtn" class="action-btn secondary-btn">Close</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Manage Subcategories: ${categoryName}`,
    content: modalContent,
    size: "medium",
  });

  // Render subcategories list
  renderSubcategories(categoryName, subcategories);

  // Handle add subcategory
  document.getElementById("addSubcategoryBtn").addEventListener("click", () => {
    const name = document.getElementById("newSubcategoryName").value.trim();
    const color = document.getElementById("newSubcategoryColor").value;

    if (!name) {
      showToast("Please enter a subcategory name", "error");
      return;
    }

    addSubcategory(categoryName, name, color);
    renderSubcategories(
      categoryName,
      AppState.categories[categoryName].subcategories || {}
    );
  });

  // Handle close
  document
    .getElementById("closeSubcategoriesBtn")
    .addEventListener("click", () => {
      modal.close();
      renderCategories(); // Refresh main categories view
    });
}

/**
 * Renders subcategories in the subcategories modal
 * @param {string} categoryName - Parent category name
 * @param {Object} subcategories - Subcategories object
 */
function renderSubcategories(categoryName, subcategories) {
  const container = document.getElementById("subcategoriesList");
  if (!container) return;

  container.innerHTML = "";

  // Sort subcategories alphabetically
  const sortedSubcategories = Object.entries(subcategories).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  sortedSubcategories.forEach(([name, color]) => {
    const subItem = document.createElement("div");
    subItem.className = "subcategory-item";

    subItem.innerHTML = `
      <div class="category-color" style="background-color: ${color}"></div>
      <div class="category-name">${name}</div>
      <div class="category-actions">
        <button class="action-btn edit-btn edit-subcategory-modal-btn"
          data-name="${name}" data-color="${color}">Edit</button>
        <button class="action-btn danger-btn delete-subcategory-modal-btn"
          data-name="${name}">Delete</button>
      </div>
    `;

    container.appendChild(subItem);

    // Add event handlers
    subItem
      .querySelector(".edit-subcategory-modal-btn")
      .addEventListener("click", (e) => {
        const name = e.target.getAttribute("data-name");
        const color = e.target.getAttribute("data-color");

        showEditSubcategoryModal(categoryName, name, color, () => {
          renderSubcategories(
            categoryName,
            AppState.categories[categoryName].subcategories || {}
          );
        });
      });

    subItem
      .querySelector(".delete-subcategory-modal-btn")
      .addEventListener("click", (e) => {
        const name = e.target.getAttribute("data-name");

        if (confirm(`Delete subcategory "${name}"?`)) {
          deleteSubcategory(categoryName, name);
          renderSubcategories(
            categoryName,
            AppState.categories[categoryName].subcategories || {}
          );
        }
      });
  });

  // If no subcategories, show message
  if (sortedSubcategories.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        No subcategories defined. Add your first subcategory above.
      </div>
    `;
  }
}

/**
 * Shows modal to edit a subcategory
 * @param {string} categoryName
 * @param {string} subcategoryName
 * @param {string} color
 * @param {Function} onSaved optional callback
 */
function showEditSubcategoryModal(
  categoryName,
  subcategoryName,
  color,
  onSaved
) {
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 10px;">
      <div style="margin-bottom: 20px;">
        <label for="editSubcategoryName">Subcategory Name:</label>
        <input type="text" id="editSubcategoryName" value="${subcategoryName}" style="width: 100%; padding: 8px; margin-top: 5px;">
      </div>
      <div style="margin-bottom: 20px;">
        <label for="editSubcategoryColor">Subcategory Color:</label>
        <input type="color" id="editSubcategoryColor" value="${color}" style="width: 100%; height: 40px; margin-top: 5px;">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancelEditSubcategoryBtn" class="action-btn secondary-btn">Cancel</button>
        <button id="saveEditSubcategoryBtn" class="action-btn primary-btn">Save Changes</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Edit Subcategory: ${subcategoryName}`,
    content: modalContent,
    size: "small",
  });

  document
    .getElementById("cancelEditSubcategoryBtn")
    ?.addEventListener("click", () => modal.close());
  document
    .getElementById("saveEditSubcategoryBtn")
    ?.addEventListener("click", () => {
      const newName = document
        .getElementById("editSubcategoryName")
        .value.trim();
      const newColor = document.getElementById("editSubcategoryColor").value;
      if (!newName) {
        showToast("Subcategory name cannot be empty", "error");
        return;
      }
      // update then refresh
      updateSubcategory(categoryName, subcategoryName, newName, newColor);
      modal.close();
      if (typeof onSaved === "function") onSaved();
    });
}
