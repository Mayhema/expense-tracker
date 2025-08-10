import { AppState } from "../../core/appState.js";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../categoryManager.js";

/**
 * Render the category UI within the provided container
 */
export function renderCategoryUI(container) {
  if (!container) {
    console.error("No container provided for category UI");
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  // Build and insert the category list HTML
  const categoryListHTML = buildCategoryList();
  container.innerHTML = categoryListHTML;

  // Attach event listeners
  attachCategoryEventListeners(container);
}

/**
 * Build HTML for the categories list
 */
export function buildCategoryList() {
  const categories = AppState.categories || {};
  const sortedCategories = Object.keys(categories).sort((a, b) =>
    a.localeCompare(b)
  );

  let html = `
    <div class="add-category-form">
      <input type="text" id="newCategoryName" placeholder="Category name" />
      <input type="color" id="newCategoryColor" value="#4CAF50" />
      <button id="addCategoryBtn" class="button primary-btn">Add Category</button>
    </div>
    <div class="categories-list">
  `;

  if (sortedCategories.length === 0) {
    html += '<p class="empty-state">No categories defined yet.</p>';
  } else {
    sortedCategories.forEach((categoryName) => {
      const categoryValue = categories[categoryName];
      // Fix color format - ensure 6 digit hex
      let color = "#cccccc"; // default
      if (typeof categoryValue === "string") {
        color = categoryValue;
      } else if (typeof categoryValue === "object" && categoryValue.color) {
        color = categoryValue.color;
      }

      // Ensure color is 6 digits
      if (color.length === 4) {
        color = color + color.slice(1); // #abc -> #aabbcc
      }

      html += `
        <div class="category-edit-row" draggable="true" data-category="${categoryName}">
          <div class="category-drag-handle">⋮⋮</div>
          <input type="color" value="${color}" class="edit-category-color" data-category="${categoryName}">
          <input type="text" value="${categoryName}" class="category-name-input" data-original-name="${categoryName}">
          <button class="update-category-btn button secondary-btn" data-category="${categoryName}">Update</button>
          <button class="delete-category-btn button danger-btn" data-category="${categoryName}">Delete</button>
          <button class="toggle-subcategory-btn button" data-category="${categoryName}">
            ${
              typeof categoryValue === "object" && categoryValue.subcategories
                ? "Hide"
                : "Show"
            } Subcategories
          </button>
        </div>

        ${
          typeof categoryValue === "object" && categoryValue.subcategories
            ? `<div class="subcategories-container" data-parent="${categoryName}" style="display: block;">
            ${renderSubcategories(categoryName, categoryValue)}
          </div>`
            : `<div class="subcategories-container" data-parent="${categoryName}" style="display: none;">
            ${renderSubcategories(categoryName, { subcategories: {} })}
          </div>`
        }
      `;
    });
  }

  html += `
    </div>
    <div class="category-actions">
      <button id="closeCategoryManagerBtn" class="button secondary-btn">Close</button>
    </div>
  `;

  return html;
}

/**
 * Render subcategories for a parent category
 */
function renderSubcategories(parentName, parentCategory) {
  let html = '<div style="margin-left: 20px;">';

  // Check if this category has subcategories
  if (
    typeof parentCategory === "object" &&
    parentCategory.subcategories &&
    Object.keys(parentCategory.subcategories).length > 0
  ) {
    // Sort subcategories alphabetically
    const sortedSubcategories = Object.keys(parentCategory.subcategories).sort(
      (a, b) => a.localeCompare(b)
    );

    sortedSubcategories.forEach((subName) => {
      let subColor = parentCategory.subcategories[subName];
      // Ensure color is 6 digits
      if (subColor && subColor.length === 4) {
        subColor = subColor + subColor.slice(1);
      }
      if (!subColor || subColor.length !== 7) {
        subColor = "#8bd48b";
      }

      html += `
        <div class="subcategory-edit-row">
          <input type="color" value="${subColor}"
                 class="edit-subcategory-color" data-parent="${parentName}" data-subcategory="${subName}">
          <input type="text" value="${subName}" class="subcategory-name-input"
                 data-parent="${parentName}" data-original-name="${subName}">
          <button class="update-subcategory-btn button secondary-btn"
                  data-parent="${parentName}" data-subcategory="${subName}">Update</button>
          <button class="delete-subcategory-btn button danger-btn"
                  data-parent="${parentName}" data-subcategory="${subName}">Delete</button>
        </div>
      `;
    });
  } else {
    html +=
      '<p style="font-style: italic; color: #666;">No subcategories yet</p>';
  }

  // Add form to create new subcategory
  html += `
    <div class="add-subcategory-form" style="margin-top: 10px;">
      <input type="color" class="new-subcategory-color" value="#8bd48b" data-parent="${parentName}">
      <input type="text" class="new-subcategory-name" placeholder="New Subcategory" data-parent="${parentName}">
      <button class="add-subcategory-btn button primary-btn" data-parent="${parentName}">Add</button>
    </div>
  `;

  html += "</div>";
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
        import("../uiManager.js").then((module) => {
          module.showToast("Please enter a category name", "error");
        });
        return;
      }

      if (addCategory(name, color)) {
        // Reset inputs and re-render
        nameInput.value = "";
        renderCategoryUI(container);

        // Trigger update of transaction filters
        setTimeout(() => {
          if (window.updateTransactions) {
            window.updateTransactions();
          }
        }, 100);
      }
    });
  }

  // Close modal button
  const closeBtn = container.querySelector("#closeCategoryManagerBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      // Close the modal by finding and clicking the modal close button
      const modalClose = document.querySelector(".modal-close");
      if (modalClose) {
        modalClose.click();
      }
    });
  }

  // Toggle subcategories buttons
  container.querySelectorAll(".toggle-subcategory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryName = e.target.getAttribute("data-category");
      const subcategoriesContainer = container.querySelector(
        `.subcategories-container[data-parent="${categoryName}"]`
      );

      if (subcategoriesContainer) {
        const isVisible = subcategoriesContainer.style.display !== "none";
        subcategoriesContainer.style.display = isVisible ? "none" : "block";
        e.target.textContent = isVisible
          ? "Show Subcategories"
          : "Hide Subcategories";
      }
    });
  });

  // Update category buttons
  container.querySelectorAll(".update-category-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryName = e.target.getAttribute("data-category");
      const colorInput = container.querySelector(
        `.edit-category-color[data-category="${categoryName}"]`
      );
      const nameInput = container.querySelector(
        `.category-name-input[data-original-name="${categoryName}"]`
      );

      if (!colorInput || !nameInput) return;

      const newColor = colorInput.value;
      const newName = nameInput.value.trim();

      if (!newName) {
        import("../uiManager.js").then((module) => {
          module.showToast("Category name cannot be empty", "error");
        });
        return;
      }

      if (updateCategory(categoryName, newName, newColor)) {
        renderCategoryUI(container);

        // Trigger update of transaction filters
        setTimeout(() => {
          if (window.updateTransactions) {
            window.updateTransactions();
          }
        }, 100);
      }
    });
  });

  // Delete category buttons
  container.querySelectorAll(".delete-category-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryName = e.target.getAttribute("data-category");

      if (
        !confirm(
          `Are you sure you want to delete the category "${categoryName}"?`
        )
      ) {
        return;
      }

      if (deleteCategory(categoryName)) {
        renderCategoryUI(container);

        // Trigger update of transaction filters
        setTimeout(() => {
          if (window.updateTransactions) {
            window.updateTransactions();
          }
        }, 100);
      }
    });
  });

  // Add subcategory buttons
  container.querySelectorAll(".add-subcategory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parentName = e.target.getAttribute("data-parent");
      const colorInput = container.querySelector(
        `.new-subcategory-color[data-parent="${parentName}"]`
      );
      const nameInput = container.querySelector(
        `.new-subcategory-name[data-parent="${parentName}"]`
      );

      if (!colorInput || !nameInput) return;

      const subName = nameInput.value.trim();
      const subColor = colorInput.value;

      if (!subName) {
        import("../uiManager.js").then((module) => {
          module.showToast("Please enter a subcategory name", "error");
        });
        return;
      }

      if (addSubcategory(parentName, subName, subColor)) {
        // Clear input and re-render
        nameInput.value = "";
        renderCategoryUI(container);

        // Show subcategories container
        const subcategoriesContainer = container.querySelector(
          `.subcategories-container[data-parent="${parentName}"]`
        );
        if (subcategoriesContainer) {
          subcategoriesContainer.style.display = "block";
        }
      }
    });
  });

  // Update subcategory buttons
  container.querySelectorAll(".update-subcategory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parentName = e.target.getAttribute("data-parent");
      const subName = e.target.getAttribute("data-subcategory");
      const colorInput = container.querySelector(
        `.edit-subcategory-color[data-parent="${parentName}"][data-subcategory="${subName}"]`
      );
      const nameInput = container.querySelector(
        `.subcategory-name-input[data-parent="${parentName}"][data-original-name="${subName}"]`
      );

      if (!colorInput || !nameInput) return;

      const newSubColor = colorInput.value;
      const newSubName = nameInput.value.trim();

      if (!newSubName) {
        import("../uiManager.js").then((module) => {
          module.showToast("Subcategory name cannot be empty", "error");
        });
        return;
      }

      if (updateSubcategory(parentName, subName, newSubName, newSubColor)) {
        renderCategoryUI(container);
      }
    });
  });

  // Delete subcategory buttons
  container.querySelectorAll(".delete-subcategory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parentName = e.target.getAttribute("data-parent");
      const subName = e.target.getAttribute("data-subcategory");

      if (
        !confirm(
          `Are you sure you want to delete the subcategory "${subName}"?`
        )
      ) {
        return;
      }

      if (deleteSubcategory(parentName, subName)) {
        renderCategoryUI(container);
      }
    });
  });

  // Initialize drag and drop for category reordering
  initializeCategoryDragAndDrop(container);
}

/**
 * Initialize drag and drop functionality for categories
 */
function initializeCategoryDragAndDrop(container) {
  const categoryRows = container.querySelectorAll(
    '.category-edit-row[draggable="true"]'
  );

  categoryRows.forEach((row) => {
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
    row.addEventListener("dragend", handleDragEnd);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = "0.5";
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", this.outerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    const draggedCategory = draggedElement.getAttribute("data-category");
    const targetCategory = this.getAttribute("data-category");

    // Reorder categories in AppState
    reorderCategories(draggedCategory, targetCategory);

    // Re-render the UI
    const container = this.closest(".category-manager-content");
    if (container) {
      renderCategoryUI(container);
    }
  }
  return false;
}

function handleDragEnd(e) {
  this.style.opacity = "1";
  draggedElement = null;
}

function reorderCategories(draggedCategory, targetCategory) {
  const categories = AppState.categories || {};
  const categoryKeys = Object.keys(categories);

  const draggedIndex = categoryKeys.indexOf(draggedCategory);
  const targetIndex = categoryKeys.indexOf(targetCategory);

  if (draggedIndex > -1 && targetIndex > -1) {
    // Remove dragged category
    const [draggedKey] = categoryKeys.splice(draggedIndex, 1);

    // Insert at new position
    categoryKeys.splice(targetIndex, 0, draggedKey);

    // Rebuild categories object with new order
    const reorderedCategories = {};
    categoryKeys.forEach((key) => {
      reorderedCategories[key] = categories[key];
    });

    AppState.categories = reorderedCategories;

    // Save to localStorage
    localStorage.setItem("categories", JSON.stringify(AppState.categories));
  }
}
