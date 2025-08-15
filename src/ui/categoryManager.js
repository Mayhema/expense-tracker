// Facade module: delegate UI to the default Category Manager modal and keep minimal API
import { showCategoryManagerModal as showCategoryManagerModalInternal } from "./categoryManagerModal.js";
import { AppState, saveCategories } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from "../constants/categories.js";

export function showCategoryManagerModal() {
  return showCategoryManagerModalInternal();
}

// Legacy DOM rendering removed

/**
 * Setup drag and drop functionality for category reordering
 */
// Drag/drop handled by category manager UI

/**
 * Reorder categories by updating their order values
 */
// Ordering handled by category manager UI

// Helpers removed

// Legacy subcategory save removed

/**
 * Reset to default categories
 */
export function resetToDefaultCategories() {
  AppState.categories = { ...DEFAULT_CATEGORIES };
  saveCategories();
}

/**
 * Handle managing subcategories for a category
 */
// Legacy subcategory modal removed; handled by category manager UI

/**
 * Attach event listeners for subcategory management modal
 */
// Legacy subcategory listeners removed

/**
 * Refresh category dropdowns in the transaction area
 */
function refreshCategoryDropdowns() {
  // Update category dropdowns in all transaction rows
  const categorySelects = document.querySelectorAll(
    'select[data-field="category"], .category-select'
  );
  categorySelects.forEach((select) => {
    const currentValue = select.value;

    // Regenerate the dropdown options
    const categories = AppState.categories || {};
    const categoryEntries = Object.entries(categories);

    let options = '<option value="">Select Category</option>';
    categoryEntries.forEach(([categoryName, categoryData]) => {
      const selected = categoryName === currentValue ? "selected" : "";
      options +=
        '<option value="' +
        categoryName +
        '" ' +
        selected +
        ">" +
        categoryName +
        "</option>";
    });

    select.innerHTML = options;

    // FIXED: Add change event listener to update charts in real time
    if (!select.hasAttribute("data-chart-listener")) {
      select.setAttribute("data-chart-listener", "true");
      select.addEventListener("change", () => {
        // FIXED: Update charts immediately when category selection changes
        setTimeout(async () => {
          try {
            const chartsModule = await import("./charts.js");
            if (chartsModule?.updateCharts) {
              chartsModule.updateCharts();
              console.log("Charts updated after category selection change");
            }
          } catch (error) {
            console.log("Charts not available for update:", error.message);
          }
        }, 100);
      });
    }
  });

  // Update bulk category select dropdowns
  const bulkCategorySelects = document.querySelectorAll("#bulkCategorySelect");
  bulkCategorySelects.forEach((select) => {
    const currentValue = select.value;
    const categories = AppState.categories || {};

    let options = '<option value="">Choose Category</option>';
    Object.keys(categories)
      .sort((a, b) => a.localeCompare(b))
      .forEach((categoryName) => {
        const selected = categoryName === currentValue ? "selected" : "";
        options +=
          '<option value="' +
          categoryName +
          '" ' +
          selected +
          ">" +
          categoryName +
          "</option>";
      });

    select.innerHTML = options;
  });

  // Also refresh advanced filters
  const categoryFilters = document.querySelectorAll(
    "#categoryFilter, .category-select-btn"
  );
  categoryFilters.forEach((filter) => {
    // Trigger a refresh of the advanced filters if they exist
    if (
      window.refreshAdvancedFilters &&
      typeof window.refreshAdvancedFilters === "function"
    ) {
      window.refreshAdvancedFilters();
    }
  });

  // Update advanced filters category dropdown specifically
  setTimeout(async () => {
    try {
      const advancedFiltersModule = await import(
        "./filters/advancedFilters.js"
      );
      if (advancedFiltersModule.updateCategoryFilterOptions) {
        advancedFiltersModule.updateCategoryFilterOptions();
        console.log("✅ Advanced filters category dropdown updated");
      }
    } catch (error) {
      console.log("Advanced filters module not available:", error.message);
    }
  }, 50);

  // Update transaction manager to render fresh dropdowns
  setTimeout(() => {
    import("./transactionManager.js")
      .then((module) => {
        if (module.renderTransactions && AppState.transactions) {
          module.renderTransactions(AppState.transactions, false);
        }
      })
      .catch((error) => {
        console.warn("Could not refresh transaction manager:", error);
      });
  }, 100);

  // FIXED: Update charts when categories change
  setTimeout(async () => {
    try {
      const chartsModule = await import("./charts.js");
      if (chartsModule?.updateCharts) {
        chartsModule.updateCharts();
        console.log("Charts updated after category changes");
      }
    } catch (error) {
      console.log("Charts not available for update:", error.message);
    }
  }, 200);
}

// Legacy subcategory event wiring removed

// CRUD compatibility API

export function addCategory(name, color = "#3498db") {
  if (!name?.trim()) return false;
  const n = name.trim();
  if (AppState.categories[n]) return false;
  AppState.categories[n] = color;
  saveCategories();
  return true;
}

export function deleteCategory(name) {
  if (!name || !AppState.categories[name]) return false;
  delete AppState.categories[name];
  saveCategories();
  return true;
}

export function updateCategory(oldName, newName, newColor) {
  if (!oldName || !AppState.categories[oldName]) return false;
  const target = (newName || oldName).trim();
  if (target !== oldName && AppState.categories[target]) return false;
  const existing = AppState.categories[oldName];
  const color = newColor || (typeof existing === "object" ? existing.color : existing);
  delete AppState.categories[oldName];
  AppState.categories[target] = color;
  saveCategories();
  return true;
}

export function addSubcategory(categoryName, subName, subColor = "#667eea") {
  if (!categoryName || !subName) return false;
  const cat = AppState.categories[categoryName];
  if (!cat) return false;
  if (typeof cat === "string") {
    AppState.categories[categoryName] = { color: cat, subcategories: {} };
  }
  const obj = AppState.categories[categoryName];
  obj.subcategories = obj.subcategories || {};
  if (obj.subcategories[subName]) return false;
  obj.subcategories[subName] = subColor;
  saveCategories();
  return true;
}

export function updateSubcategory(categoryName, oldSub, newSub, newColor) {
  const cat = AppState.categories[categoryName];
  if (!cat || typeof cat === "string") return false;
  if (!cat.subcategories?.[oldSub]) return false;
  if (newSub !== oldSub && cat.subcategories[newSub]) return false;
  const color = newColor || cat.subcategories[oldSub];
  delete cat.subcategories[oldSub];
  cat.subcategories[newSub] = color;
  saveCategories();
  return true;
}

export function deleteSubcategory(categoryName, subName) {
  const cat = AppState.categories[categoryName];
  if (!cat || typeof cat === "string") return false;
  if (!cat.subcategories?.[subName]) return false;
  delete cat.subcategories[subName];
  saveCategories();
  return true;
}

export function ensureDefaultCategories() {
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    AppState.categories = { ...DEFAULT_CATEGORIES };
    saveCategories();
  }
}

export function initializeCategories() {
  // Backward compatibility: ensure defaults loaded
  ensureDefaultCategories();
}
