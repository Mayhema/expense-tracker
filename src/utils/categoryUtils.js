/**
 * Utility functions for working with categories
 */
import { AppState } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from '../core/constants.js';

/**
 * Gets a color for a category
 * @param {string} categoryName - The category name
 * @param {string} subcategoryName - Optional subcategory name
 * @returns {string} The color hex code
 */
export function getCategoryColor(categoryName, subcategoryName = null) {
  if (!categoryName) return '#cccccc';

  // Use the centralized DEFAULT_CATEGORIES if AppState isn't available
  const categories = window.AppState?.categories || DEFAULT_CATEGORIES;

  const categoryValue = categories[categoryName];
  if (!categoryValue) return '#cccccc';

  // Handle subcategory if provided
  if (subcategoryName &&
    typeof categoryValue === 'object' &&
    categoryValue.subcategories &&
    categoryValue.subcategories[subcategoryName]) {
    return categoryValue.subcategories[subcategoryName];
  }

  // Return main category color
  return typeof categoryValue === 'string' ? categoryValue : categoryValue.color || '#cccccc';
}

/**
 * Gets default categories
 * @returns {Object} Default category object
 */
export function getDefaultCategories() {
  return DEFAULT_CATEGORIES;
}

/**
 * Gets all subcategories for a category
 * @param {string} categoryName - The category name
 * @returns {Object} Subcategory mapping or null
 */
export function getSubcategories(categoryName) {
  if (!categoryName || !AppState.categories[categoryName]) {
    return null;
  }

  const category = AppState.categories[categoryName];
  if (typeof category === 'object' && category.subcategories) {
    return category.subcategories;
  }

  return null;
}

/**
 * Checks if a category has subcategories
 * @param {string} categoryName - The category name to check
 * @returns {boolean} True if category has subcategories
 */
export function hasSubcategories(categoryName) {
  const subcategories = getSubcategories(categoryName);
  return !!subcategories && Object.keys(subcategories).length > 0;
}

/**
 * Gets all categories as a flat list including subcategories
 * @returns {Array} Array of {id, name, color, parent} objects
 */
export function getFlatCategoryList() {
  const result = [];

  Object.entries(AppState.categories).forEach(([categoryName, value]) => {
    // Add main category
    result.push({
      id: categoryName,
      name: categoryName,
      color: typeof value === 'string' ? value : (value.color || "#CCCCCC"),
      parent: null
    });

    // Add subcategories if any
    if (typeof value === 'object' && value.subcategories) {
      Object.entries(value.subcategories).forEach(([subName, subColor]) => {
        result.push({
          id: `${categoryName}:${subName}`,
          name: subName,
          color: subColor,
          parent: categoryName
        });
      });
    }
  });

  return result;
}

export default {
  getCategoryColor,
  getDefaultCategories,
  getSubcategories,
  hasSubcategories,
  getFlatCategoryList
};
