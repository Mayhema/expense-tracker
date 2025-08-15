/**
 * 🎨 Category Manager - Modern UI/UX with Advanced Functionality
 * Features: Improved design, accessibility, bulk operations, drag & drop, validation
 */

import { AppState, saveCategories } from "../core/appState.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";

// Singleton pattern to ensure only one modal is open
let categoryManagerModalInstance = null;

/**
 * 🎯 Main function to show the category manager modal
 */
export async function showCategoryManagerModal() {
  // Prevent multiple modals, but reset stale references if DOM is clean
  if (categoryManagerModalInstance) {
    const stillMounted = !!document.querySelector('.modal-overlay');
    if (!stillMounted) {
      categoryManagerModalInstance = null;
    } else {
      console.log("Category manager modal already open");
      return categoryManagerModalInstance;
    }
  }

  console.log("Opening category manager modal...");

  // Ensure categories are loaded before showing the modal (now async)
  await ensureCategoriesLoaded();

  const categories = AppState.categories || {};
  const categoryCount = Object.keys(categories).length;
  console.log(
    `Category Manager: Found ${categoryCount} categories`,
    categories
  );

  const modalContent = document.createElement("div");
  modalContent.className = "category-manager";
  modalContent.setAttribute('role', 'region');
  modalContent.setAttribute('aria-label', 'Category Manager');
  modalContent.innerHTML = buildCategoryManagerHTML();

  const modal = showModal({
  title: "Category Manager",
    content: modalContent,
    size: "xlarge",
    closeOnClickOutside: true,
  });

  // Store reference and override close method
  categoryManagerModalInstance = modal;
  const originalClose = modal.close;
  modal.close = function () {
    categoryManagerModalInstance = null;
    originalClose.call(this);
  };

  // Apply styles and attach event listeners
  ensureCategoryManagerStyles();
  attachCategoryManagerEventListeners(modalContent, modal);
  initializeCategoryManagerFeatures(modalContent);

  // Ensure categories are displayed properly
  setTimeout(() => {
    refreshCategoriesGrid();
    console.log("Categories grid refreshed after modal display");
  }, 100);

  return modal;
}

/**
 * 🔄 Ensure categories are loaded and initialized
 */
async function ensureCategoriesLoaded() {
  // Check if categories are empty or not properly loaded
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    console.log(
      "Categories not loaded, initializing from localStorage or defaults..."
    );

    try {
      // Try to load from localStorage first
      const savedCategories = localStorage.getItem("categories");
      if (savedCategories) {
        AppState.categories = JSON.parse(savedCategories);
        console.log(
          "Loaded categories from localStorage:",
          Object.keys(AppState.categories)
        );
      } else {
        // If no saved categories, initialize with defaults
        const { DEFAULT_CATEGORIES } = await import(
          "../constants/categories.js"
        );
        AppState.categories = { ...DEFAULT_CATEGORIES };
        console.log(
          "Initialized with default categories:",
          Object.keys(AppState.categories)
        );

        // Save to localStorage for future use
        localStorage.setItem("categories", JSON.stringify(AppState.categories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);

      // Fallback to a basic set of categories
      AppState.categories = {
        "Food & Dining": { color: "#FF6B6B", subcategories: {} },
        Transportation: { color: "#4ECDC4", subcategories: {} },
        Shopping: { color: "#45B7D1", subcategories: {} },
        "Bills & Utilities": { color: "#FFEAA7", subcategories: {} },
        Entertainment: { color: "#96CEB4", subcategories: {} },
        Healthcare: { color: "#FD79A8", subcategories: {} },
        Income: { color: "#6C5CE7", subcategories: {} },
      };
      console.log("Used fallback categories");
    }
  }
}

/**
 * 🏗️ Build the HTML structure
 */
function buildCategoryManagerHTML() {
  const categories = AppState.categories || {};
  const categoryCount = Object.keys(categories).length;

  return `
    <div class="category-manager-container">
      <!-- Header Section (stats only, title moved to modal header) -->
      <div class="category-header">
        <div class="header-content">
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-number">${categoryCount}</span>
              <span class="stat-label">Categories</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${getTotalSubcategories()}</span>
              <span class="stat-label">Subcategories</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar Section -->
      <div class="category-toolbar">
        <div class="toolbar-left">
          <div class="search-container">
            <input type="text" id="categorySearch" placeholder="Search categories..." class="search-input" aria-label="Search categories">
            <button id="clearSearch" class="search-clear" aria-label="Clear search">×</button>
          </div>
          <div class="filter-container">
            <select id="categoryFilter" class="filter-select">
              <option value="all">All Categories</option>
              <option value="with-subcategories">With Subcategories</option>
              <option value="without-subcategories">Simple Categories</option>
              <option value="recently-used">Recently Used</option>
            </select>
          </div>
        </div>
        <div class="toolbar-right">
          <button id="bulkOperations" class="btn btn-secondary" aria-pressed="false">Bulk Actions</button>
          <button id="importExport" class="btn btn-secondary">Import/Export</button>
          <button id="addNewCategory" class="btn btn-primary">Add Category</button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="category-content">
        <div class="content-main">
          <!-- Categories Grid -->
          <div class="categories-grid" id="categoriesGrid">
            ${buildCategoriesGrid(categories)}
          </div>

          <!-- Empty State -->
          <div class="empty-state" id="emptyState" style="display: ${categoryCount === 0 ? "flex" : "none"
    }">
            <div class="empty-content">
              <h3>No Categories Yet</h3>
              <p>Create your first category to start organizing your expenses</p>
              <button class="btn btn-primary btn-large" id="createFirstCategory">
                <span class="btn-text">Create First Category</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Panel (for bulk operations, etc.) -->
        <div class="content-sidebar" id="contentSidebar" style="display: none;">
          <div class="sidebar-content">
            <!-- Dynamic content based on selected action -->
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="category-footer">
        <div class="footer-left">
          <span class="footer-info">
            <span id="selectedCount">0</span> categories selected
          </span>
        </div>
        <div class="footer-right">
          <button id="resetCategories" class="btn btn-ghost">Reset to Defaults</button>
          <button id="closeModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 🎨 Build categories grid
 */
function buildCategoriesGrid(categories) {
  console.log("Building categories grid with:", categories);

  if (!categories || Object.keys(categories).length === 0) {
    console.log("No categories to display - showing empty state");
    return "";
  }

  const sortedCategories = Object.entries(categories)
    .sort(([aKey, aVal], [bKey, bVal]) => {
      const aOrder = typeof aVal === 'object' && typeof aVal.order === 'number' ? aVal.order : Infinity;
      const bOrder = typeof bVal === 'object' && typeof bVal.order === 'number' ? bVal.order : Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Fallback to alpha by key
      return String(aKey).localeCompare(String(bKey));
    });

  console.log(
    `Sorted categories for display:`,
    sortedCategories.map(([name]) => name)
  );

  return sortedCategories
    .map(([name, value], index) => {
      const isComplexCategory = typeof value === "object";
      const color = isComplexCategory ? value.color : value;
      const subcategories = isComplexCategory ? value.subcategories || {} : {};
      const subcategoryCount = Object.keys(subcategories).length;

      console.log(
        `Category ${name}: color=${color}, subcategories=${subcategoryCount}`
      );

      return `
      <div class="category-card" data-category="${name}" data-color="${color}">
        <div class="category-card-header">
          <div class="category-visual">
            <div class="category-color" style="background-color: ${color}" aria-hidden="true"></div>
            <div class="category-checkbox">
              <input type="checkbox" id="select-${index}" class="category-select">
            </div>
          </div>
          <div class="category-info">
            <h4 class="category-name">${name}</h4>
            <p class="category-meta">
              ${subcategoryCount > 0
          ? `${subcategoryCount} subcategories`
          : "Simple category"
        }
            </p>
          </div>
          <div class="category-actions">
            <button class="action-btn edit-btn" data-action="edit" data-category="${name}" title="Edit category">
              <span class="action-icon">✏️</span>
            </button>
            <button class="action-btn delete-btn" data-action="delete" data-category="${name}" title="Delete category">
              <span class="action-icon">🗑️</span>
            </button>
            <button class="action-btn drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
              <span class="action-icon">⋮⋮</span>
            </button>
          </div>
        </div>

        ${subcategoryCount > 0
          ? buildSubcategoriesPreview(subcategories, subcategoryCount)
          : ""
        }
      </div>
    `;
    })
    .join("");
}

/**
 * 🏗️ Build subcategories preview section
 */
function buildSubcategoriesPreview(subcategories, subcategoryCount) {
  const moreText =
    subcategoryCount > 3
      ? `<span class="subcategory-more">+${subcategoryCount - 3} more</span>`
      : "";

  return `
    <div class="category-card-body">
      <div class="subcategories-preview">
        <h5>Subcategories (${subcategoryCount})</h5>
        <div class="subcategories-list">
          ${Object.entries(subcategories)
      .slice(0, 3)
      .map(
        ([subName, subColor]) => `
            <span class="subcategory-tag" style="border-left-color: ${subColor}">
              ${subName}
            </span>
          `
      )
      .join("")}
          ${moreText}
        </div>
      </div>
    </div>
  `;
}

/**
 * 📊 Get total subcategories count
 */
function getTotalSubcategories() {
  const categories = AppState.categories || {};
  return Object.values(categories).reduce((total, category) => {
    if (typeof category === "object" && category.subcategories) {
      return total + Object.keys(category.subcategories).length;
    }
    return total;
  }, 0);
}

/**
 * 🎨 Ensure styles are loaded
 */
function ensureCategoryManagerStyles() {
  // If already marked as loaded, do nothing
  if (document.getElementById("categoryManagerStyles")) return;

  // Ensure the canonical stylesheet is present; prefer main styles bundle
  const hasMainStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).some((link) =>
    /styles\/styles\.css$/i.test(link.getAttribute("href") || "")
  );
  const hasManagerStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).some((link) =>
    /styles\/category-manager\.css$/i.test(
      link.getAttribute("href") || ""
    )
  );

  if (!hasMainStyles && !hasManagerStyles) {
    try {
      const link = document.createElement("link");
      link.id = "categoryManagerStyles";
      link.rel = "stylesheet";
      // Use main bundle which already @imports the manager CSS
      link.href = "styles/styles.css";
      document.head.appendChild(link);
      return;
    } catch (e) {
      // Fallback: insert a minimal marker style (no duplicate rules)
      // Handle exception explicitly to avoid silent failures in analysis tools
      console.warn(
        "CategoryManager: failed to append stylesheet link, falling back to inline marker style.",
        e
      );
      const style = document.createElement("style");
      style.id = "categoryManagerStyles";
      style.textContent =
        "/* Category Manager styles loaded via canonical CSS */";
      document.head.appendChild(style);
    }
  } else {
    // Add a lightweight marker to avoid re-running
    const style = document.createElement("style");
    style.id = "categoryManagerStyles";
    style.textContent =
      "/* Category Manager styles already present via canonical CSS */";
    document.head.appendChild(style);
  }
}

/**
 * 🎮 Attach event listeners
 */
function attachCategoryManagerEventListeners(container, modal) {
  // Search functionality
  const searchInput = container.querySelector("#categorySearch");
  const clearSearch = container.querySelector("#clearSearch");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleSearch(e);
      if (clearSearch) clearSearch.style.display = e.target.value ? "block" : "none";
    });
  }

  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      searchInput.value = "";
      handleSearch({ target: searchInput });
      clearSearch.style.display = "none";
    });
  }

  // Filter functionality
  const filterSelect = container.querySelector("#categoryFilter");
  if (filterSelect) {
    filterSelect.addEventListener("change", handleFilter);
  }

  // Add new category
  const addNewBtn = container.querySelector("#addNewCategory");
  const createFirstBtn = container.querySelector("#createFirstCategory");

  if (addNewBtn) {
    addNewBtn.addEventListener("click", () => showAddCategoryModal());
  }

  if (createFirstBtn) {
    createFirstBtn.addEventListener("click", () => showAddCategoryModal());
  }

  // Category actions
  container.addEventListener("click", (e) => {
    const actionBtn = e.target.closest(".action-btn");
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const categoryName = actionBtn.dataset.category;

      switch (action) {
        case "edit":
          showEditCategoryModal(categoryName);
          break;
        case "delete":
          handleDeleteCategory(categoryName);
          break;
      }
    }
  });

  // Bulk operations
  const bulkBtn = container.querySelector("#bulkOperations");
  if (bulkBtn) {
    bulkBtn.addEventListener("click", (e) => {
      const pressed = e.currentTarget.getAttribute('aria-pressed') === 'true';
      e.currentTarget.setAttribute('aria-pressed', String(!pressed));
      toggleBulkOperations();
    });
  }

  // Import/Export
  const importExportBtn = container.querySelector("#importExport");
  if (importExportBtn) {
    importExportBtn.addEventListener("click", showImportExportModal);
  }

  // Reset categories
  const resetBtn = container.querySelector("#resetCategories");
  if (resetBtn) {
    resetBtn.addEventListener("click", handleResetCategories);
  }

  // Close modal
  const closeBtn = container.querySelector("#closeModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.close());
  }

  // Checkbox selection
  container.addEventListener("change", (e) => {
    if (e.target.classList.contains("category-select")) {
      updateSelectionCount(container);
    }
  });
}

/**
 * 🔍 Handle search functionality
 */
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const categoryCards = document.querySelectorAll(".category-card");

  categoryCards.forEach((card) => {
    const categoryName = card.dataset.category.toLowerCase();
    const shouldShow = !searchTerm || categoryName.includes(searchTerm);
    card.style.display = shouldShow ? "block" : "none";
  });

  updateEmptyState();
}

/**
 * 🎛️ Handle filter functionality
 */
function handleFilter(e) {
  const filterValue = e.target.value;
  const categoryCards = document.querySelectorAll(".category-card");

  categoryCards.forEach((card) => {
    const categoryName = card.dataset.category;
    const category = AppState.categories[categoryName];
    const hasSubcategories =
      typeof category === "object" &&
      category.subcategories &&
      Object.keys(category.subcategories).length > 0;

    let shouldShow;

    switch (filterValue) {
      case "with-subcategories":
        shouldShow = hasSubcategories;
        break;
      case "without-subcategories":
        shouldShow = !hasSubcategories;
        break;
      case "recently-used":
        // This would require tracking usage - placeholder for now
        shouldShow = true;
        break;
      default:
        shouldShow = true;
    }

    card.style.display = shouldShow ? "block" : "none";
  });

  updateEmptyState();
}

/**
 * 📝 Show add category modal
 */
function showAddCategoryModal() {
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 1.5rem;">
        <label for="newCategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Name</label>
        <input type="text" id="newCategoryName" placeholder="e.g., Groceries, Entertainment"
               style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label for="newCategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Color</label>
        <input type="color" id="newCategoryColor" value="#667eea"
               style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
        <button id="cancelAdd" class="btn btn-secondary">Cancel</button>
        <button id="confirmAdd" class="btn btn-primary">Add Category</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: "Add New Category",
    content: modalContent,
    size: "medium",
    closeOnClickOutside: false,
    keepPrevious: true,
  });

  // Event handlers
  modalContent
    .querySelector("#cancelAdd")
    .addEventListener("click", () => modal.close());
  modalContent.querySelector("#confirmAdd").addEventListener("click", () => {
    const name = modalContent.querySelector("#newCategoryName").value.trim();
    const color = modalContent.querySelector("#newCategoryColor").value;

    if (!name) {
      showToast("Please enter a category name", "error");
      return;
    }

    if (AppState.categories[name]) {
      showToast("Category already exists", "error");
      return;
    }

    AppState.categories[name] = color;
    saveCategories();

    showToast(`Category "${name}" added successfully`, "success");
    modal.close();

    // Refresh the main modal
    refreshCategoriesGrid();
  });
}

/**
 * ✏️ Show edit category modal
 */
function showEditCategoryModal(categoryName) {
  const category = AppState.categories[categoryName];
  const color = typeof category === "object" ? category.color : category;
  const subcategories = (typeof category === 'object' && category.subcategories) ? category.subcategories : {};

  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
      <div>
        <label for="editCategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Name</label>
        <input type="text" id="editCategoryName" value="${categoryName}"
               style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
      </div>

      <div>
        <label for="editCategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Color</label>
        <input type="color" id="editCategoryColor" value="${color}"
               style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
      </div>

      <div>
        <h4 style="margin: 0 0 0.75rem 0;">Subcategories</h4>
        <div style="display: flex; gap: 1rem; align-items: end; margin-bottom: 1rem;">
          <div style="flex: 1;">
            <label for="newSubcategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Add Subcategory</label>
            <input type="text" id="newSubcategoryName" placeholder="e.g., Organic Food"
                   style="width: 100%; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px;">
          </div>
          <div>
            <label for="newSubcategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Color</label>
            <input type="color" id="newSubcategoryColor" value="#667eea"
                   style="width: 56px; height: 40px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
          <button id="addSubcategory" class="btn btn-primary">Add</button>
        </div>

        <div id="subcategoriesList" style="min-height: 120px;">
          ${Object.keys(subcategories).length === 0
            ? '<p style="text-align: center; color: #666; padding: 1rem;">No subcategories yet.</p>'
            : Object.entries(subcategories).map(([name, clr]) => `
              <div class="subcategory-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
                  <div style="width: 20px; height: 20px; background: ${clr}; border-radius: 4px;"></div>
                  <span class="sub-name" style="font-weight: 500; overflow: hidden; text-overflow: ellipsis;">${name}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                  <input type="color" value="${clr}" data-subcategory="${name}" class="subcategory-color-picker"
                         style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer;">
                  <button class="btn btn-ghost delete-subcategory" data-subcategory="${name}" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
        <button id="cancelEdit" class="btn btn-secondary">Cancel</button>
        <button id="confirmEdit" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Edit Category: ${categoryName}`,
    content: modalContent,
    size: "medium",
    closeOnClickOutside: false,
    keepPrevious: true,
  });

  // Event handlers
  modalContent
    .querySelector("#cancelEdit")
    .addEventListener("click", () => modal.close());
  modalContent.querySelector("#confirmEdit").addEventListener("click", () => {
    const newName = modalContent
      .querySelector("#editCategoryName")
      .value.trim();
    const newColor = modalContent.querySelector("#editCategoryColor").value;

    if (!newName) {
      showToast("Please enter a category name", "error");
      return;
    }

    if (newName !== categoryName && AppState.categories[newName]) {
      showToast("Category name already exists", "error");
      return;
    }

    // Normalize structure and update
    const existing = AppState.categories[categoryName];
    const normalized = typeof existing === 'object' ? { ...existing } : { color: existing, subcategories: {} };
    normalized.color = newColor;

    if (newName !== categoryName) {
      delete AppState.categories[categoryName];
      AppState.categories[newName] = normalized;
    } else {
      AppState.categories[categoryName] = normalized;
    }

    saveCategories();
    showToast(`Category updated successfully`, "success");
    modal.close();

    // Refresh the main modal
    refreshCategoriesGrid();
  });

  // Add subcategory
  modalContent.querySelector('#addSubcategory')?.addEventListener('click', () => {
    const nameInput = modalContent.querySelector('#newSubcategoryName');
    const colorInput = modalContent.querySelector('#newSubcategoryColor');
    const name = nameInput.value.trim();
    const clr = colorInput.value;
    const currentName = modalContent.querySelector('#editCategoryName').value.trim() || categoryName;

    if (!name) { showToast('Please enter a subcategory name', 'error'); return; }

    // Ensure category object structure
    if (typeof AppState.categories[currentName] === 'string') {
      AppState.categories[currentName] = { color: AppState.categories[currentName], subcategories: {} };
    } else if (!AppState.categories[currentName].subcategories) {
      AppState.categories[currentName].subcategories = {};
    }

    if (AppState.categories[currentName].subcategories[name]) {
      showToast('Subcategory already exists', 'error');
      return;
    }

    AppState.categories[currentName].subcategories[name] = clr;
    saveCategories();
    showToast(`Subcategory "${name}" added`, 'success');

    // Re-render list in place
    showEditCategoryModal(currentName);
  });

  // Update subcategory color and delete
  modalContent.addEventListener('change', (e) => {
    if (e.target.classList.contains('subcategory-color-picker')) {
      const subName = e.target.dataset.subcategory;
      const newClr = e.target.value;
      const currentName = modalContent.querySelector('#editCategoryName').value.trim() || categoryName;
      if (typeof AppState.categories[currentName] !== 'object' || !AppState.categories[currentName].subcategories) return;
      AppState.categories[currentName].subcategories[subName] = newClr;
      saveCategories();
      showToast(`Color updated for "${subName}"`, 'success');
    }
  });

  modalContent.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-subcategory')) {
      const subName = e.target.dataset.subcategory;
      const currentName = modalContent.querySelector('#editCategoryName').value.trim() || categoryName;
      if (confirm(`Delete subcategory "${subName}"?`)) {
        delete AppState.categories[currentName].subcategories[subName];
        saveCategories();
        showToast(`Subcategory "${subName}" deleted`, 'success');
        showEditCategoryModal(currentName);
      }
    }
  });
}

/**
 * 📁 Show subcategories modal
 */
function showSubcategoriesModal(categoryName) {
  const category = AppState.categories[categoryName];
  const subcategories =
    typeof category === "object" && category.subcategories
      ? category.subcategories
      : {};

  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0;">Add New Subcategory</h4>
        <div style="display: flex; gap: 1rem; align-items: end;">
          <div style="flex: 1;">
            <label for="newSubcategoryName" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Subcategory Name</label>
            <input type="text" id="newSubcategoryName" placeholder="e.g., Organic Food, Restaurants"
                   style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px;">
          </div>
          <div>
            <label for="newSubcategoryColor" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Color</label>
            <input type="color" id="newSubcategoryColor" value="#667eea"
                   style="width: 60px; height: 45px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
          <button id="addSubcategory" class="btn btn-primary">Add</button>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 1rem 0;">Existing Subcategories</h4>
        <div id="subcategoriesList" style="min-height: 200px;">
          ${Object.keys(subcategories).length === 0
      ? '<p style="text-align: center; color: #666; padding: 2rem;">No subcategories yet. Add one above.</p>'
      : Object.entries(subcategories)
        .map(
          ([name, color]) => `
              <div class="subcategory-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; margin-bottom: 0.5rem; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 24px; height: 24px; background: ${color}; border-radius: 4px;"></div>
                  <span style="font-weight: 500;">${name}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="color" value="${color}" data-subcategory="${name}" class="subcategory-color-picker"
                         style="width: 32px; height: 32px; border: none; border-radius: 4px; cursor: pointer;">
                  <button class="btn btn-ghost delete-subcategory" data-subcategory="${name}" style="padding: 0.5rem;">🗑️</button>
                </div>
              </div>
            `
        )
        .join("")
    }
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
        <button id="closeSubcategories" class="btn btn-secondary">Close</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: `Manage Subcategories: ${categoryName}`,
    content: modalContent,
    size: "large",
    closeOnClickOutside: false,
    keepPrevious: true,
  });

  // Add subcategory functionality
  modalContent
    .querySelector("#addSubcategory")
    .addEventListener("click", () => {
      const nameInput = modalContent.querySelector("#newSubcategoryName");
      const colorInput = modalContent.querySelector("#newSubcategoryColor");
      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        showToast("Please enter a subcategory name", "error");
        return;
      }

      // Ensure category structure exists
      if (typeof AppState.categories[categoryName] === "string") {
        const originalColor = AppState.categories[categoryName];
        AppState.categories[categoryName] = {
          color: originalColor,
          subcategories: {},
        };
      } else if (!AppState.categories[categoryName].subcategories) {
        AppState.categories[categoryName].subcategories = {};
      }

      if (AppState.categories[categoryName].subcategories[name]) {
        showToast("Subcategory already exists", "error");
        return;
      }

      AppState.categories[categoryName].subcategories[name] = color;
      saveCategories();

      showToast(`Subcategory "${name}" added successfully`, "success");
      nameInput.value = "";

      // Refresh the subcategories modal
      modal.close();
      setTimeout(() => showSubcategoriesModal(categoryName), 100);
    });

  // Color picker changes
  modalContent.addEventListener("change", (e) => {
    if (e.target.classList.contains("subcategory-color-picker")) {
      const subcategoryName = e.target.dataset.subcategory;
      const newColor = e.target.value;

      AppState.categories[categoryName].subcategories[subcategoryName] =
        newColor;
      saveCategories();

      // Update the visual color
      const colorDiv = e.target
        .closest(".subcategory-item")
        .querySelector('div[style*="background"]');
      if (colorDiv) {
        colorDiv.style.background = newColor;
      }

      showToast(`Color updated for "${subcategoryName}"`, "success");
    }
  });

  // Delete subcategory
  modalContent.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-subcategory")) {
      const subcategoryName = e.target.dataset.subcategory;

      if (
        confirm(
          `Are you sure you want to delete the subcategory "${subcategoryName}"?`
        )
      ) {
        delete AppState.categories[categoryName].subcategories[subcategoryName];
        saveCategories();

        showToast(`Subcategory "${subcategoryName}" deleted`, "success");

        // Refresh the subcategories modal
        modal.close();
        setTimeout(() => showSubcategoriesModal(categoryName), 100);
      }
    }
  });

  // Close modal
  modalContent
    .querySelector("#closeSubcategories")
    .addEventListener("click", () => modal.close());
}

/**
 * 🗑️ Handle delete category
 */
function handleDeleteCategory(categoryName) {
  if (
    confirm(
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`
    )
  ) {
    delete AppState.categories[categoryName];
    saveCategories();

    showToast(`Category "${categoryName}" deleted successfully`, "success");
    refreshCategoriesGrid();
  }
}

/**
 * 📦 Toggle bulk operations
 */
function toggleBulkOperations() {
  const sidebar = document.querySelector("#contentSidebar");
  const isVisible = sidebar.style.display !== "none";

  sidebar.style.display = isVisible ? "none" : "block";

  // Toggle bulk-mode class on root container to show/hide checkboxes
  const root = document.querySelector('.category-manager');
  if (root) {
    if (isVisible) {
      root.classList.remove('bulk-mode');
    } else {
      root.classList.add('bulk-mode');
    }
  }

  if (!isVisible) {
    sidebar.querySelector(".sidebar-content").innerHTML = `
      <h4>Bulk Operations</h4>
      <div style="margin: 1.5rem 0;">
        <button class="btn btn-secondary" id="selectAll" style="width: 100%; margin-bottom: 0.5rem;">Select All</button>
        <button class="btn btn-secondary" id="selectNone" style="width: 100%; margin-bottom: 0.5rem;">Select None</button>
      </div>
      <div style="margin: 1.5rem 0;">
        <button class="btn btn-ghost" id="bulkDelete" style="width: 100%; color: #dc3545;" disabled>Delete Selected</button>
      </div>
    `;

    // Attach bulk operation handlers
    sidebar.querySelector("#selectAll").addEventListener("click", () => {
      document
        .querySelectorAll(".category-select")
        .forEach((cb) => (cb.checked = true));
      updateSelectionCount();
    });

    sidebar.querySelector("#selectNone").addEventListener("click", () => {
      document
        .querySelectorAll(".category-select")
        .forEach((cb) => (cb.checked = false));
      updateSelectionCount();
    });

    sidebar
      .querySelector("#bulkDelete")
      .addEventListener("click", handleBulkDelete);
  }
}

/**
 * 🗑️ Handle bulk delete
 */
function handleBulkDelete() {
  const selectedCategories = Array.from(
    document.querySelectorAll(".category-select:checked")
  ).map((cb) => cb.closest(".category-card").dataset.category);

  if (selectedCategories.length === 0) return;

  if (
    confirm(
      `Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`
    )
  ) {
    selectedCategories.forEach((categoryName) => {
      delete AppState.categories[categoryName];
    });

    saveCategories();
    showToast(
      `${selectedCategories.length} categories deleted successfully`,
      "success"
    );
    refreshCategoriesGrid();

    // Hide sidebar
    document.querySelector("#contentSidebar").style.display = "none";
  }
}

/**
 * ⚡ Show import/export modal
 */
function showImportExportModal() {
  const modalContent = document.createElement("div");
  modalContent.innerHTML = `
    <div style="padding: 1.5rem;">
      <div style="margin-bottom: 2rem;">
        <h4>Export Categories</h4>
        <p style="color: #666; margin-bottom: 1rem;">Download your categories as a JSON file for backup.</p>
        <button id="exportCategories" class="btn btn-primary">📥 Export Categories</button>
      </div>

      <div style="margin-bottom: 2rem;">
        <h4>Import Categories</h4>
        <p style="color: #666; margin-bottom: 1rem;">Upload a JSON file to import categories.</p>
        <input type="file" id="importFile" accept=".json" style="margin-bottom: 1rem;">
        <button id="importCategories" class="btn btn-secondary" disabled>📤 Import Categories</button>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button id="closeImportExport" class="btn btn-ghost">Close</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: "Import/Export Categories",
    content: modalContent,
    size: "medium",
  });

  // Export functionality
  modalContent
    .querySelector("#exportCategories")
    .addEventListener("click", () => {
      const dataStr = JSON.stringify(AppState.categories, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `categories-${new Date().toISOString().split("T")[0]
        }.json`;
      link.click();

      URL.revokeObjectURL(url);
      showToast("Categories exported successfully", "success");
    });

  // Import functionality
  const fileInput = modalContent.querySelector("#importFile");
  const importBtn = modalContent.querySelector("#importCategories");

  fileInput.addEventListener("change", (e) => {
    importBtn.disabled = !e.target.files.length;
  });

  importBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCategories = JSON.parse(e.target.result);

        if (confirm("This will replace all existing categories. Continue?")) {
          AppState.categories = importedCategories;
          saveCategories();

          showToast("Categories imported successfully", "success");
          modal.close();
          refreshCategoriesGrid();
        }
      } catch (error) {
        console.error("Import error:", error);
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
  });

  // Close modal
  modalContent
    .querySelector("#closeImportExport")
    .addEventListener("click", () => modal.close());
}

/**
 * 🔄 Handle reset categories
 */
function handleResetCategories() {
  if (
    confirm(
      "Are you sure you want to reset all categories to defaults? This will remove all your custom categories and cannot be undone."
    )
  ) {
    // Use the reset helper from categoryManager facade to ensure AppState + storage update
    import("../ui/categoryManager.js").then((module) => {
      if (module.resetToDefaultCategories) {
        module.resetToDefaultCategories();
        showToast("Categories reset to defaults successfully", "success");
        refreshCategoriesGrid();
      } else {
        // Fallback: direct import of defaults
        import("../constants/categories.js").then((catModule) => {
          if (catModule.DEFAULT_CATEGORIES) {
            AppState.categories = { ...catModule.DEFAULT_CATEGORIES };
            saveCategories();
            showToast("Categories reset to defaults successfully", "success");
            refreshCategoriesGrid();
          } else {
            showToast("Unable to reset categories", "error");
          }
        });
      }
    });
  }
}

/**
 * 🔄 Refresh categories grid
 */
function refreshCategoriesGrid() {
  const container = document.querySelector(".category-manager");
  if (!container) return;

  const categoriesGrid = container.querySelector("#categoriesGrid");

  if (categoriesGrid) {
    categoriesGrid.innerHTML = buildCategoriesGrid(
      AppState.categories || {}
    );
    // Reapply draggable attribute after rebuild
    categoriesGrid.querySelectorAll('.category-card').forEach(card => { card.draggable = true; });
  }

  updateEmptyState();
  updateHeaderStats(container);
}

/**
 * 📊 Update header statistics
 */
function updateHeaderStats(container) {
  const categoryCount = Object.keys(AppState.categories || {}).length;
  const subcategoryCount = getTotalSubcategories();

  const statNumbers = container.querySelectorAll(".stat-number");
  if (statNumbers.length >= 2) {
    statNumbers[0].textContent = categoryCount;
    statNumbers[1].textContent = subcategoryCount;
  }
}

/**
 * 📊 Update selection count
 */
function updateSelectionCount(container = document) {
  const selectedCount = container.querySelectorAll(
    ".category-select:checked"
  ).length;
  const countDisplay = container.querySelector("#selectedCount");
  const bulkDeleteBtn = container.querySelector("#bulkDelete");

  if (countDisplay) {
    countDisplay.textContent = selectedCount;
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.disabled = selectedCount === 0;
  }
}

/**
 * 📭 Update empty state visibility
 */
function updateEmptyState() {
  const categoriesGrid = document.querySelector("#categoriesGrid");
  const emptyState = document.querySelector("#emptyState");

  if (!categoriesGrid || !emptyState) {
    console.log("Could not find categoriesGrid or emptyState elements");
    return;
  }

  const totalCategories = Object.keys(AppState.categories || {}).length;
  const visibleCards = Array.from(document.querySelectorAll('.category-card'))
    .filter(card => card.style.display !== 'none').length;

  const isTrulyEmpty = totalCategories === 0;
  const isFilteredEmpty = totalCategories > 0 && visibleCards === 0;

  if (isTrulyEmpty) {
    emptyState.querySelector('h3').textContent = 'No Categories Yet';
    emptyState.querySelector('p').textContent = 'Create your first category to start organizing your expenses';
  } else if (isFilteredEmpty) {
    emptyState.querySelector('h3').textContent = 'No Results';
    emptyState.querySelector('p').textContent = 'Try adjusting your search or filters';
  }

  emptyState.style.display = (isTrulyEmpty || isFilteredEmpty) ? 'flex' : 'none';
  categoriesGrid.style.display = (isTrulyEmpty) ? 'none' : 'grid';
}

/**
 * 🎮 Initialize features
 */
function initializeCategoryManagerFeatures(container) {
  // Initialize drag and drop for category reordering
  initializeDragAndDrop(container);

  // Initialize keyboard shortcuts
  initializeKeyboardShortcuts(container);

  // Initialize tooltips
  initializeTooltips(container);
}

/**
 * 🖱️ Initialize drag and drop
 */
function initializeDragAndDrop(container) {
  let draggedElement = null;
  let isHandle = false;

  container.addEventListener("mousedown", (e) => {
    isHandle = !!e.target.closest('.drag-handle');
  });

  container.addEventListener("dragstart", (e) => {
    if (isHandle && e.target.closest(".category-card")) {
      draggedElement = e.target.closest(".category-card");
      draggedElement.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData('text/plain', draggedElement.dataset.category || 'drag');
      } catch (err) {
        // Some browsers may throw when setting drag data; assign to temp to satisfy lint
        const _msg = err ? err.message : '';
        // eslint-disable-next-line no-unused-vars
        const _ignore = _msg;
      }
    }
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();

    const dropTarget = e.target.closest(".category-card");
    if (isHandle && dropTarget && draggedElement && dropTarget !== draggedElement) {
      const rect = dropTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const insertAfter = e.clientY > midpoint;

      if (insertAfter) {
        dropTarget.insertAdjacentElement("afterend", draggedElement);
      } else {
        dropTarget.insertAdjacentElement("beforebegin", draggedElement);
      }

      // Persist new order to AppState.categories using 'order' field
      const cards = Array.from(container.querySelectorAll(".category-card"));
      cards.forEach((card, idx) => {
        const name = card.getAttribute("data-category");
        if (AppState.categories[name]) {
          if (typeof AppState.categories[name] === "string") {
            AppState.categories[name] = { color: AppState.categories[name], order: idx + 1 };
          } else {
            AppState.categories[name].order = idx + 1;
          }
        }
      });
      saveCategories();
      showToast("Category order updated", "success");
    }
  });

  container.addEventListener("dragend", () => {
    if (draggedElement) {
      draggedElement.classList.remove("dragging");
      draggedElement = null;
    }
    isHandle = false;
  });

  // Make category cards draggable
  container.querySelectorAll(".category-card").forEach((card) => {
    card.draggable = true;
  });
}

/**
 * ⌨️ Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts(container) {
  document.addEventListener("keydown", (e) => {
    // Only handle shortcuts when the modal is open
    if (!categoryManagerModalInstance) return;

    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = container.querySelector("#categorySearch");
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Ctrl/Cmd + N: Add new category
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      showAddCategoryModal();
    }

  // Escape: Close modal
    if (e.key === "Escape") {
      categoryManagerModalInstance?.close();
    }
  });
}

/**
 * 💡 Initialize tooltips
 */
function initializeTooltips(container) {
  // More robust tooltip implementation
  const onMouseOver = (e) => {
    const element = e.target.closest('[title]');
    if (!element) return;
    const title = element.getAttribute('title');
    if (!title) return;
    element.setAttribute('data-tooltip', title);
    element.removeAttribute('title');

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = title;
    document.body.appendChild(tooltip);

    const move = (ev) => {
      tooltip.style.left = ev.pageX + 10 + 'px';
      tooltip.style.top = ev.pageY - 30 + 'px';
    };
    move(e);
    element.addEventListener('mousemove', move);

    const cleanup = () => {
      tooltip.remove();
      const t = element.getAttribute('data-tooltip');
      if (t) element.setAttribute('title', t);
      element.removeAttribute('data-tooltip');
      element.removeEventListener('mousemove', move);
      element.removeEventListener('mouseleave', cleanup);
      element.removeEventListener('blur', cleanup);
    };
    element.addEventListener('mouseleave', cleanup, { once: true });
    element.addEventListener('blur', cleanup, { once: true });
  };
  container.addEventListener('mouseover', onMouseOver);
}
