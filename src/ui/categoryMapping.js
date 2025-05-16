import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { renderTransactions } from "./transactionManager.js"; // Ensure this matches the export
import { getContrastColor } from "../utils/utils.js";

// Change mutable export to const with getter/setter
const CATEGORY_MAPPINGS_KEY = "categoryMappings";
// Instead of: export let descriptionCategoryMap = {};
let _descriptionCategoryMap = {};
export const descriptionCategoryMap = {
  get map() { return _descriptionCategoryMap; },
  set map(value) { _descriptionCategoryMap = value; }
};

// Define utility functions only once at the beginning of the file
function normalizeDescription(description) {
  if (!description) return "";
  return description.trim().toLowerCase();
}

function containsHebrew(text) {
  return /[\u0590-\u05FF]/.test(text);
}

function normalizeHebrewText(text) {
  return text.replace(/[^\u0590-\u05FF\s]/g, "").trim();
}

function normalizeLatinText(text) {
  return text.replace(/[^a-zA-Z0-9\s]/g, "").trim();
}

export function initCategoryMapping() {
  loadCategoryMappings();
}

export function loadCategoryMappings() {
  try {
    const savedMappings = localStorage.getItem(CATEGORY_MAPPINGS_KEY);
    if (savedMappings) {
      _descriptionCategoryMap = JSON.parse(savedMappings);
    }
  } catch (err) {
    console.error("Error loading category mappings:", err);
    _descriptionCategoryMap = {};
  }
}

export function saveCategoryMappings() {
  localStorage.setItem(CATEGORY_MAPPINGS_KEY, JSON.stringify(_descriptionCategoryMap));
}

export function addToCategoryMapping(description, category, subcategory = null) {
  if (!description || !category) return;

  const normalizedDesc = normalizeDescription(description);
  const categoryKey = subcategory ? `${category}:${subcategory}` : category;

  if (!_descriptionCategoryMap[normalizedDesc]) {
    _descriptionCategoryMap[normalizedDesc] = categoryKey;
    saveCategoryMappings();
  }
}

/**
 * Removes a description from category mappings
 * @param {string} description - Description to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeFromCategoryMapping(description) {
  if (!description) return false;

  const normalizedDesc = normalizeDescription(description);

  // Check if this description exists in the mappings
  if (_descriptionCategoryMap[normalizedDesc]) {
    delete _descriptionCategoryMap[normalizedDesc];
    saveCategoryMappings();
    return true;
  }

  return false;
}

export function getCategoryForDescription(description) {
  // Break this into smaller functions
  if (!description) return null;

  const normalizedDesc = normalizeDescription(description);

  // Extract exact match check to a separate function
  const exactMatch = findExactCategoryMatch(normalizedDesc);
  if (exactMatch) return exactMatch;

  // Extract partial match logic to a separate function
  return findPartialCategoryMatch(normalizedDesc);
}

// Helper functions to reduce complexity
function findExactCategoryMatch(normalizedDesc) {
  if (_descriptionCategoryMap[normalizedDesc]) {
    const categoryKey = _descriptionCategoryMap[normalizedDesc];

    // Check if it includes a subcategory
    if (categoryKey.includes(':')) {
      const [category, subcategory] = categoryKey.split(':');
      return { category, subcategory };
    }

    return { category: categoryKey };
  }

  return null;
}

function findPartialCategoryMatch(normalizedDesc) {
  // Then try partial matches - more careful with Hebrew text
  const isHebrew = /[\u0590-\u05FF]/.test(normalizedDesc);

  for (const [key, category] of Object.entries(_descriptionCategoryMap)) {
    const keyIsHebrew = /[\u0590-\u05FF]/.test(key);

    // Only match Hebrew with Hebrew and Latin with Latin
    if (isHebrew === keyIsHebrew) {
      // For Hebrew text or very short descriptions, require more strict matching
      if (isHebrew || normalizedDesc.length < 5) {
        if (normalizedDesc === key ||
          normalizedDesc.includes(key) ||
          key.includes(normalizedDesc)) {
          return category;
        }
      } else if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
        // For non-Hebrew, standard matching behavior
        return category;
      }
    }
  }

  return null;
}

export function getDescriptionsForCategory(category) {
  if (!category) return [];

  return Object.entries(_descriptionCategoryMap)
    .filter(([_, cat]) => cat === category)
    .map(([desc, _]) => desc);
}

export function updateCategoryNameInMappings(oldName, newName) {
  if (!oldName || !newName) return;

  let updated = false;
  for (const [desc, category] of Object.entries(_descriptionCategoryMap)) {
    if (category === oldName) {
      _descriptionCategoryMap[desc] = newName;
      updated = true;
    }
  }

  if (updated) {
    saveCategoryMappings();
  }
}

// Helper function to apply category to a transaction
function applyCategory(tx, categoryInfo) {
  let needsUpdate = false;

  if (categoryInfo.category && tx.category !== categoryInfo.category) {
    tx.category = categoryInfo.category;
    needsUpdate = true;
  }

  if (categoryInfo.subcategory) {
    if (tx.subcategory !== categoryInfo.subcategory) {
      tx.subcategory = categoryInfo.subcategory;
      needsUpdate = true;
    }
  } else if (tx.subcategory) {
    delete tx.subcategory;
    needsUpdate = true;
  }

  if (needsUpdate) {
    tx.autoCategorized = true;
    return true;
  }
  return false;
}

// Helper function to remove category from a transaction
function removeCategory(tx) {
  tx.category = null;
  if (tx.subcategory) delete tx.subcategory;
  delete tx.autoCategorized;
  return true;
}

export function autoCategorizeTransactions(transactions) {
  if (!transactions || !transactions.length) return 0;

  let count = 0;
  let removedCount = 0;

  transactions.forEach(tx => {
    if (!tx.description) return;

    const categoryInfo = getCategoryForDescription(tx.description);

    if (categoryInfo) {
      if (applyCategory(tx, categoryInfo)) {
        count++;
      }
    } else if (tx.autoCategorized && tx.category) {
      removeCategory(tx);
      removedCount++;
    }
  });

  if (count > 0 || removedCount > 0) {
    localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
  }

  return { added: count, removed: removedCount };
}

/**
 * Groups mappings by category and filters by selected categories if provided
 * @param {Array} selectedCategories - Categories to filter by
 * @returns {Object} Categorized mappings
 */
function getCategorizedMappings(selectedCategories) {
  const showAllCategories = !selectedCategories || selectedCategories.length === 0;
  const categorizedMappings = {};

  for (const [desc, categoryKey] of Object.entries(_descriptionCategoryMap)) {
    let category = categoryKey;
    if (categoryKey.includes(':')) {
      category = categoryKey.split(':')[0];
    }

    if (!showAllCategories && !selectedCategories.includes(category)) {
      continue;
    }

    if (!categorizedMappings[categoryKey]) {
      categorizedMappings[categoryKey] = [];
    }
    categorizedMappings[categoryKey].push(desc);
  }

  return { categorizedMappings, showAllCategories };
}

/**
 * Generates HTML for empty mappings message
 * @param {boolean} showAllCategories - Whether all categories are being shown
 * @returns {string} HTML message
 */
function generateEmptyMappingsHTML(showAllCategories) {
  let html = '<p>No category mappings found';
  if (!showAllCategories) {
    html += ' for the selected categories';
  }
  html += '.</p>';
  return html;
}

/**
 * Gets appropriate color for category or subcategory
 * @param {string} category - Category name
 * @param {string} subcategory - Subcategory name
 * @returns {string} Color hex code
 */
function getCategoryColor(category, subcategory) {
  let color = '#cccccc';

  if (!AppState.categories[category]) {
    return color;
  }

  if (typeof AppState.categories[category] === 'string') {
    return AppState.categories[category];
  }

  if (AppState.categories[category].color) {
    color = AppState.categories[category].color;

    if (subcategory &&
      AppState.categories[category].subcategories &&
      AppState.categories[category].subcategories[subcategory]) {
      return AppState.categories[category].subcategories[subcategory];
    }
  }

  return color;
}

/**
 * Generates HTML for a single category mapping group
 * @param {string} categoryKey - Category key
 * @param {Array} descriptions - Description list
 * @returns {string} HTML for category group
 */
function generateCategoryGroupHTML(categoryKey, descriptions) {
  let category = categoryKey;
  let subcategory = null;

  if (categoryKey.includes(':')) {
    [category, subcategory] = categoryKey.split(':');
  }

  const color = getCategoryColor(category, subcategory);

  const titleText = subcategory ? `${category}: ${subcategory}` : category;
  const sectionId = `mapping-${categoryKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return `
    <div class="category-mapping-group" style="margin-bottom: 15px;">
      <div class="category-header" onclick="toggleMappingSection('${sectionId}')"
           style="background-color: ${color}; color: ${getContrastColor(color)};
                  padding: 8px; border-radius: 4px; cursor: pointer; display: flex;
                  justify-content: space-between; align-items: center;">
        <div>
          <strong>${titleText}</strong> (${descriptions.length} patterns)
        </div>
        <span class="toggle-icon">▼</span>
      </div>
      <ul id="${sectionId}" class="mapping-list" style="list-style-type: none; padding-left: 10px; margin-top: 5px;">
        ${descriptions.map(desc => `
          <li style="margin: 3px 0; display: flex; justify-content: space-between;">
            <span>${desc}</span>
            <button class="small-btn" onclick="window.removeDescriptionMapping('${desc.replace(/'/g, "\\'")}', '${categoryKey.replace(/'/g, "\\'")}')" title="Remove this mapping">❌</button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Sets up toggle functionality for collapsible sections
 */
function setupToggleFunctionality() {
  window.toggleMappingSection = function (sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';

    const header = section.previousElementSibling;
    if (header) {
      const icon = header.querySelector('.toggle-icon');
      if (icon) icon.textContent = isVisible ? '►' : '▼';
    }
  };

  // Initialize all sections as expanded
  document.querySelectorAll('.mapping-list').forEach(section => {
    section.style.display = 'block';
  });
}

/**
 * Renders the category mapping UI
 * @param {Array} selectedCategories - Optional array of categories to show (if empty, show all)
 */
export function renderCategoryMappingUI(selectedCategories = null) {
  const container = document.getElementById("categoryMappingContainer");
  if (!container) {
    console.warn("Category mapping container not found");
    return;
  }

  let html = '<h3>Description to Category Mappings</h3>';

  const { categorizedMappings, showAllCategories } = getCategorizedMappings(selectedCategories);

  // Check if we have any mappings to show
  if (Object.keys(categorizedMappings).length === 0) {
    html += generateEmptyMappingsHTML(showAllCategories);
    container.innerHTML = html;
    return;
  }

  // Render category mapping groups
  for (const [categoryKey, descriptions] of Object.entries(categorizedMappings)) {
    html += generateCategoryGroupHTML(categoryKey, descriptions);
  }

  html += `
    <div style="margin-top: 20px;">
      <button id="autoCategorizeBtn" class="button" onclick="window.autoCategorizeAll()">
        Auto-categorize All Transactions
      </button>
    </div>
  `;

  container.innerHTML = html;
  setupToggleFunctionality();
}

window.removeDescriptionMapping = function (description, category) {
  if (confirm(`Remove "${description}" from category "${category}"?`)) {
    removeFromCategoryMapping(description);
    renderCategoryMappingUI();
    showToast("Mapping removed", "success");
  }
};

window.autoCategorizeAll = function () {
  const result = autoCategorizeTransactions(AppState.transactions);
  if (result.added > 0 || result.removed > 0) {
    renderTransactions(AppState.transactions);

    let message = "";
    if (result.added > 0) {
      message += `Auto-categorized ${result.added} transactions. `;
    }
    if (result.removed > 0) {
      message += `Removed categories from ${result.removed} transactions without mappings.`;
    }

    showToast(message, "success");
  } else {
    showToast("No transactions were changed", "info");
  }
};

// Add subcategory mapping functions

/**
 * Updates subcategory name in all category mappings
 * @param {string} categoryName - Parent category name
 * @param {string} oldSubName - Old subcategory name
 * @param {string} newSubName - New subcategory name
 */
export function updateSubcategoryNameInMappings(categoryName, oldSubName, newSubName) {
  if (!categoryName || !oldSubName || !newSubName) return;

  // Full key with category and subcategory
  const oldKey = `${categoryName}:${oldSubName}`;
  const newKey = `${categoryName}:${newSubName}`;

  let updated = false;

  for (const [desc, category] of Object.entries(_descriptionCategoryMap)) {
    if (category === oldKey) {
      _descriptionCategoryMap[desc] = newKey;
      updated = true;
    }
  }

  if (updated) {
    saveCategoryMappings();
  }
}

/**
 * Removes subcategory from all mappings
 * @param {string} categoryName - Parent category name
 * @param {string} subcategoryName - Subcategory to remove
 */
export function removeSubcategoryFromMappings(categoryName, subcategoryName) {
  if (!categoryName || !subcategoryName) return;

  // Full key with category and subcategory
  const fullKey = `${categoryName}:${subcategoryName}`;

  let updated = false;

  for (const [desc, category] of Object.entries(_descriptionCategoryMap)) {
    if (category === fullKey) {
      // Change back to just the main category
      _descriptionCategoryMap[desc] = categoryName;
      updated = true;
    }
  }

  if (updated) {
    saveCategoryMappings();
  }
}

/**
 * Gets descriptions mapped to a specific subcategory
 * @param {string} categoryName - Parent category name
 * @param {string} subcategoryName - Subcategory name
 * @returns {Array} List of descriptions
 */
export function getDescriptionsForSubcategory(categoryName, subcategoryName) {
  if (!categoryName || !subcategoryName) return [];

  const fullKey = `${categoryName}:${subcategoryName}`;

  return Object.entries(_descriptionCategoryMap)
    .filter(([_, cat]) => cat === fullKey)
    .map(([desc, _]) => desc);
}

/**
 * Toggles the visibility of a category mapping section
 * @param {string} categoryId - The ID of the category section to toggle
 */
function toggleCategorySection(categoryId) {
  const contentDiv = document.getElementById(`category-content-${categoryId}`);
  const arrowIcon = document.querySelector(`#category-header-${categoryId} .toggle-arrow`);

  if (!contentDiv || !arrowIcon) return;

  // Define the condition variable that was missing
  const condition = contentDiv.style.display !== 'none';

  // Toggle content visibility based on the condition
  contentDiv.style.display = condition ? 'none' : 'block';

  // Update arrow icon based on the same condition
  arrowIcon.textContent = condition ? '▶' : '▼';

  // Save state to localStorage
  try {
    const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '{}');
    collapsedSections[categoryId] = condition;
    localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
  } catch (err) {
    console.error('Error saving section state:', err);
  }
}
// Refactor function at line 174
function categorizeDescriptions(descriptions) {
  return descriptions.reduce((map, desc) => {
    const category = getCategoryForDescription(desc);
    if (category) {
      map[desc] = category;
    }
    return map;
  }, {});
}

// Refactor function at line 224
function processCategoryMappings(mappings) {
  const processedMappings = {};

  Object.entries(mappings).forEach(([key, value]) => {
    if (isValidMapping(key, value)) {
      processedMappings[key] = value;
    }
  });

  return processedMappings;
}

export default {
  // Add descriptionCategoryMap to the default export
  descriptionCategoryMap
};
