import { AppState } from "../../core/appState.js";
import { getContrastColor } from "../../utils/utils.js";
import { showToast } from "../uiManager.js";

/**
 * Renders the category list in the UI
 */
export function renderCategoryUI() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;

  // Clear existing content
  categoryList.innerHTML = '';

  // Get and sort category names alphabetically
  const categoryNames = Object.keys(AppState.categories).sort();

  // Render category buttons
  categoryNames.forEach(category => {
    const color = AppState.categories[category];
    const textColor = typeof color === 'string' ? getContrastColor(color) : '#fff';

    // Create button with appropriate styling
    const button = document.createElement('button');
    button.className = 'category-btn active';
    button.setAttribute('data-category', category);
    button.style.backgroundColor = typeof color === 'string' ? color : color.color || '#ccc';
    button.style.color = textColor;
    button.textContent = category;

    // Add click event to filter transactions
    button.addEventListener('click', () => toggleCategoryFilter(category, button));

    categoryList.appendChild(button);
  });
}

/**
 * Toggles filtering by a specific category
 * @param {string} category - The category to toggle
 * @param {HTMLElement} button - The button element that was clicked
 */
function toggleCategoryFilter(category, button) {
  // Toggle active state of the button
  const isActive = button.classList.toggle('inactive');

  // Update current category filters in app state
  if (!AppState.currentCategoryFilters) {
    AppState.currentCategoryFilters = [];
  }

  if (isActive) {
    // Remove from filters
    const index = AppState.currentCategoryFilters.indexOf(category);
    if (index !== -1) {
      AppState.currentCategoryFilters.splice(index, 1);
    }
  } else {
    // Add to filters
    if (!AppState.currentCategoryFilters.includes(category)) {
      AppState.currentCategoryFilters.push(category);
    }
  }

  // Update the global window.currentCategoryFilters for compatibility
  window.currentCategoryFilters = AppState.currentCategoryFilters;

  // Apply the filters
  if (typeof window.applyFilters === 'function') {
    window.applyFilters({
      // Use any existing filter values in the UI
      startDate: document.getElementById("filterStartDate")?.value || '',
      endDate: document.getElementById("filterEndDate")?.value || '',
      category: document.getElementById("filterCategory")?.value || '',
      minAmount: parseFloat(document.getElementById("filterMinAmount")?.value || "0"),
      maxAmount: parseFloat(document.getElementById("filterMaxAmount")?.value || "0"),
    });
  }
}

/**
 * Updates category dropdown in transaction table
 */
export function updateCategoryDropdowns() {
  // Get all category selects
  const categorySelects = document.querySelectorAll(".category-select");
  if (!categorySelects.length) return;

  // Get sorted category names
  const categories = Object.entries(AppState.categories || {}).sort((a, b) => a[0].localeCompare(b[0]));

  // Update each dropdown
  categorySelects.forEach(select => {
    // Store the currently selected value
    const currentValue = select.value;

    // Clear existing options except first one
    while (select.options.length > 1) {
      select.remove(1);
    }

    // Add options for each category
    categories.forEach(([name, value]) => {
      const color = typeof value === 'string' ? value : value.color;
      const textColor = getContrastColor(color);

      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.style.backgroundColor = color;
      option.style.color = textColor;
      option.dataset.color = color;
      option.dataset.textColor = textColor;

      select.appendChild(option);
    });

    // Restore selected value if possible
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
      select.value = currentValue;
    }
  });
}
