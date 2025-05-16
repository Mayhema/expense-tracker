import { AppState } from "../../core/appState.js";
import { renderCategoryMappingUI } from "../categoryMapping.js";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory
} from "../categoryManager.js";

/**
 * Render the category UI within the provided container
 */
export function renderCategoryUI(container) {
  const categoriesList = container.querySelector("#categoriesList");
  if (!categoriesList) return;

  categoriesList.innerHTML = buildCategoryList();

  // Attach event handlers to category UI elements
  attachCategoryEventListeners(container);

  // Render the category mappings section
  const mappingContainer = container.querySelector("#categoryMappingContainer");
  if (mappingContainer) {
    renderCategoryMappingUI();
  }
}

/**
 * Build HTML for the categories list
 */
export function buildCategoryList() {
  const categories = AppState.categories || {};

  if (Object.keys(categories).length === 0) {
    return '<p>No categories found. Add your first category above.</p>';
  }

  let html = '';

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categories).sort();

  sortedCategories.forEach(categoryName => {
    const category = categories[categoryName];
    const color = typeof category === 'object' ? category.color : category;

    html += `
      <div class="category-section">
        <div class="category-edit-row">
          <input type="color" value="${color}"
                 class="edit-category-color" data-category="${categoryName}">
          <input type="text" value="${categoryName}" class="category-name-input"
                 data-original-name="${categoryName}">
          <button class="update-category-btn" data-category="${categoryName}">Update</button>
          <button class="delete-category-btn" data-category="${categoryName}">Delete</button>
          <button class="toggle-subcategory-btn" data-category="${categoryName}">
            Show Subcategories
          </button>
        </div>

        <div class="subcategories-container" data-parent="${categoryName}" style="display: none;">
          <!-- Subcategory list will be shown/hidden -->
          ${renderSubcategories(categoryName, category)}

          <!-- Add subcategory form -->
          <div class="add-subcategory-form" style="margin-top: 10px; margin-left: 20px;">
            <input type="color" class="new-subcategory-color"
                   value="#cccccc" data-parent="${categoryName}">
            <input type="text" class="new-subcategory-name"
                   placeholder="New Subcategory" data-parent="${categoryName}">
            <button class="add-subcategory-btn" data-parent="${categoryName}">Add</button>
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

/**
 * Render subcategories for a parent category
 */
function renderSubcategories(parentName, parentCategory) {
  // Check if this category has subcategories
  if (typeof parentCategory !== 'object' || !parentCategory.subcategories ||
    Object.keys(parentCategory.subcategories).length === 0) {
    return `<p style="margin-left: 20px; font-style: italic;">No subcategories yet</p>`;
  }

  // Sort subcategories alphabetically
  const sortedSubcategories = Object.keys(parentCategory.subcategories).sort();

  let html = '<div style="margin-left: 20px;">';

  sortedSubcategories.forEach(subName => {
    const subColor = parentCategory.subcategories[subName];

    html += `
      <div class="subcategory-edit-row">
        <input type="color" value="${subColor}"
               class="edit-subcategory-color" data-parent="${parentName}" data-subcategory="${subName}">
        <input type="text" value="${subName}" class="subcategory-name-input"
               data-parent="${parentName}" data-original-name="${subName}">
        <button class="update-subcategory-btn"
                data-parent="${parentName}" data-subcategory="${subName}">Update</button>
        <button class="delete-subcategory-btn"
                data-parent="${parentName}" data-subcategory="${subName}">Delete</button>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

/**
 * Attach event listeners to category UI elements
 */
function attachCategoryEventListeners(container) {
  // Add category button
  const addCategoryBtn = container.querySelector("#addCategoryBtn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      const nameInput = container.querySelector("#newCategoryName");
      const colorInput = container.querySelector("#newCategoryColor");

      if (!nameInput || !colorInput) return;

      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        alert("Please enter a category name");
        return;
      }

      if (addCategory(name, color)) {
        // Reset inputs and re-render
        nameInput.value = "";
        renderCategoryUI(container);
      }
    });
  }

  // Close modal button
  const closeBtn = container.querySelector("#closeCategoryManagerBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modalContainer = document.getElementById("modalContainer");
      if (modalContainer) {
        modalContainer.innerHTML = "";
      }
    });
  }

  // Toggle subcategories buttons
  container.querySelectorAll(".toggle-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const categoryName = btn.getAttribute("data-category");
      const subcategoriesContainer = container.querySelector(
        `.subcategories-container[data-parent="${categoryName}"]`
      );

      if (subcategoriesContainer) {
        const isVisible = subcategoriesContainer.style.display !== "none";
        subcategoriesContainer.style.display = isVisible ? "none" : "block";
        btn.textContent = isVisible ? "Show Subcategories" : "Hide Subcategories";
      }
    });
  });

  // Update category buttons
  container.querySelectorAll(".update-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const categoryName = btn.getAttribute("data-category");
      const row = btn.closest(".category-edit-row");

      if (!row) return;

      const nameInput = row.querySelector(".category-name-input");
      const colorInput = row.querySelector(".edit-category-color");

      if (!nameInput || !colorInput) return;

      const newName = nameInput.value.trim();
      const newColor = colorInput.value;

      if (!newName) {
        alert("Category name cannot be empty");
        return;
      }

      if (updateCategory(categoryName, newName, newColor)) {
        renderCategoryUI(container);
      }
    });
  });

  // Delete category buttons
  container.querySelectorAll(".delete-category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const categoryName = btn.getAttribute("data-category");

      if (!confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
        return;
      }

      if (deleteCategory(categoryName)) {
        renderCategoryUI(container);
      }
    });
  });

  // Add subcategory buttons
  container.querySelectorAll(".add-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parentName = btn.getAttribute("data-parent");
      const form = btn.closest(".add-subcategory-form");

      if (!form) return;

      const nameInput = form.querySelector(".new-subcategory-name");
      const colorInput = form.querySelector(".new-subcategory-color");

      if (!nameInput || !colorInput) return;

      const subName = nameInput.value.trim();
      const subColor = colorInput.value;

      if (!subName) {
        alert("Subcategory name cannot be empty");
        return;
      }

      if (addSubcategory(parentName, subName, subColor)) {
        nameInput.value = "";
        renderCategoryUI(container);

        // Make sure subcategories are visible after adding
        const subcategoriesContainer = container.querySelector(
          `.subcategories-container[data-parent="${parentName}"]`
        );
        if (subcategoriesContainer) {
          subcategoriesContainer.style.display = "block";
          const toggleBtn = container.querySelector(
            `.toggle-subcategory-btn[data-category="${parentName}"]`
          );
          if (toggleBtn) {
            toggleBtn.textContent = "Hide Subcategories";
          }
        }
      }
    });
  });

  // Update subcategory buttons
  container.querySelectorAll(".update-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parentName = btn.getAttribute("data-parent");
      const oldSubName = btn.getAttribute("data-subcategory");
      const row = btn.closest(".subcategory-edit-row");

      if (!row) return;

      const nameInput = row.querySelector(".subcategory-name-input");
      const colorInput = row.querySelector(".edit-subcategory-color");

      if (!nameInput || !colorInput) return;

      const newSubName = nameInput.value.trim();
      const newSubColor = colorInput.value;

      if (!newSubName) {
        alert("Subcategory name cannot be empty");
        return;
      }

      if (updateSubcategory(parentName, oldSubName, newSubName, newSubColor)) {
        renderCategoryUI(container);

        // Keep subcategories visible
        const subcategoriesContainer = container.querySelector(
          `.subcategories-container[data-parent="${parentName}"]`
        );
        if (subcategoriesContainer) {
          subcategoriesContainer.style.display = "block";
          const toggleBtn = container.querySelector(
            `.toggle-subcategory-btn[data-category="${parentName}"]`
          );
          if (toggleBtn) {
            toggleBtn.textContent = "Hide Subcategories";
          }
        }
      }
    });
  });

  // Delete subcategory buttons
  container.querySelectorAll(".delete-subcategory-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parentName = btn.getAttribute("data-parent");
      const subName = btn.getAttribute("data-subcategory");

      if (!confirm(`Are you sure you want to delete the "${subName}" subcategory?`)) {
        return;
      }

      if (deleteSubcategory(parentName, subName)) {
        renderCategoryUI(container);

        // Keep subcategories visible
        const subcategoriesContainer = container.querySelector(
          `.subcategories-container[data-parent="${parentName}"]`
        );
        if (subcategoriesContainer) {
          subcategoriesContainer.style.display = "block";
          const toggleBtn = container.querySelector(
            `.toggle-subcategory-btn[data-category="${parentName}"]`
          );
          if (toggleBtn) {
            toggleBtn.textContent = "Hide Subcategories";
          }
        }
      }
    });
  });
}
