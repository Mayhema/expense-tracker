import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";

// Change mutable export to const with getter/setter
const CATEGORY_MAPPINGS_KEY = "categoryMappings";
// Instead of: export let descriptionCategoryMap = {};
let _descriptionCategoryMap = {};

// Category mapping from transaction descriptions to categories
export const descriptionCategoryMap = {
  map: {},
  isInitialized: false, // Flag to prevent multiple initializations

  // Initialize if needed
  init() {
    if (this.isInitialized) {

      return this;
    }
    try {
      const saved = localStorage.getItem("categoryMappings");
      if (saved) {
        this.map = JSON.parse(saved);
        console.log(`Loaded ${Object.keys(this.map).length} category mappings from localStorage.`);
      } else {
        this.map = {};
        console.log("No saved category mappings found, initialized empty map.");
      }
    } catch (e) {
      console.error("Error loading category mappings:", e);
      this.map = {}; // Reset to empty map on error
    }
    this.isInitialized = true;
    return this;
  }
};

/**
 * Saves category mappings to local storage
 */
export function saveCategoryMappings() {
  if (!descriptionCategoryMap.isInitialized) {
    // Initialize first if not already, to avoid overwriting with empty if loaded late
    descriptionCategoryMap.init();
  }
  try {
    localStorage.setItem("categoryMappings", JSON.stringify(descriptionCategoryMap.map));
    console.log(`Saved ${Object.keys(descriptionCategoryMap.map).length} category mappings to localStorage.`);
  } catch (e) {
    console.error("Error saving category mappings:", e);
  }
}

/**
 * Add or update a transaction description to category mapping.
 * This function should be called when a user manually categorizes a transaction
 * or when a new rule is explicitly created.
 * @param {string} description - Transaction description (or regex pattern).
 * @param {string} category - Category name.
 * @param {string} [subcategory=null] - Optional subcategory name.
 * @param {boolean} [isRegex=false] - Whether the description is a regex pattern.
 */
export function learnOrUpdateMapping(description, category, subcategory = null, isRegex = false) {
  if (!description || !category) {
    console.warn("learnOrUpdateMapping: Description and category are required.");
    return;
  }

  descriptionCategoryMap.init(); // Ensure map is loaded

  const mappingValue = subcategory ? `${category}:${subcategory}` : category;

  // For non-regex, normalize the description key (e.g., to lowercase, trim)
  const key = isRegex ? description.trim() : description.trim().toLowerCase();

  if (descriptionCategoryMap.map[key] === mappingValue) {
    return; // No change needed
  }

  descriptionCategoryMap.map[key] = mappingValue;
  saveCategoryMappings(); // Save immediately

  console.log(`Learned/Updated mapping: "${key}" -> ${mappingValue}`);

  // Optionally, re-apply to existing transactions if desired (can be intensive)
  // import("./transactionManager.js").then(tm => tm.updateTransactions());
}

/**
 * Get category for a transaction description
 * @param {string} description - Transaction description
 * @returns {string|null} Category name (e.g., "Category" or "Category:Subcategory") or null if not found
 */
export function getCategoryForDescription(description) {
  if (!description) return null;

  descriptionCategoryMap.init(); // Ensure map is loaded

  const normalizedDescription = description.trim().toLowerCase();

  // 1. Direct match for normalized non-regex descriptions
  if (descriptionCategoryMap.map[normalizedDescription]) {
    return descriptionCategoryMap.map[normalizedDescription];
  }

  // 2. Try regex patterns
  for (const pattern in descriptionCategoryMap.map) {
    const isLikelyRegex = pattern.startsWith("^") || pattern.endsWith("$") || pattern.includes("*") || pattern.includes("(") || pattern.includes("[");
    if (isLikelyRegex) {
      try {
        const regex = new RegExp(pattern, "i"); // Case-insensitive regex matching
        if (regex.test(description)) { // Test against original description for regex
          // console.log(`Regex match for "${description}" with pattern "${pattern}": ${descriptionCategoryMap.map[pattern]}`);
          return descriptionCategoryMap.map[pattern];
        }
      } catch (e) {
        console.warn(`Invalid regex pattern skipped: "${pattern}"`, e.message);
      }
    }
  }

  return null;
}

/**
 * Apply category mappings to transactions
 * @param {Array} transactions - Array of transactions
 * @returns {number} Number of transactions categorized
 */
export function applyCategoryMappings(transactions) {
  if (!transactions || !Array.isArray(transactions)) return 0;

  // Make sure mappings are initialized
  descriptionCategoryMap.init();

  let categorizedCount = 0;

  transactions.forEach(tx => {
    // Skip already categorized transactions
    if (tx.category) return;

    if (tx.description) {
      const categoryMapping = getCategoryForDescription(tx.description);

      if (categoryMapping) {
        console.log(`Auto-categorizing: "${tx.description}" → ${categoryMapping}`);

        // Check if it contains a subcategory (format: "Category:Subcategory")
        if (categoryMapping.includes(":")) {
          const [category, subcategory] = categoryMapping.split(":");
          tx.category = category;
          tx.subcategory = subcategory;
        } else {
          tx.category = categoryMapping;
        }

        categorizedCount++;
      }
    }
  });

  console.log(`Applied ${categorizedCount} category mappings to transactions`);
  return categorizedCount;
}

/**
 * Adds a description-to-category mapping
 * @param {string} description - Transaction description
 * @param {string} category - Category to map to
 * @param {string} subcategory - Optional subcategory
 */
export function addToCategoryMapping(description, category, subcategory = null) {
  learnOrUpdateMapping(description, category, subcategory, false); // Assume not regex by default
}

/**
 * Updates category name in all mappings when category is renamed
 * @param {string} oldName - Old category name
 * @param {string} newName - New category name
 */
export function updateCategoryNameInMappings(oldName, newName) {
  if (!oldName || !newName) return;

  // Initialize map if needed
  descriptionCategoryMap.init();

  let updateCount = 0;

  // Update all mappings that use this category
  Object.keys(descriptionCategoryMap.map).forEach(key => {
    const value = descriptionCategoryMap.map[key];

    if (value === oldName) {
      // Direct category match
      descriptionCategoryMap.map[key] = newName;
      updateCount++;
    } else if (value.startsWith(`${oldName}:`)) {
      // Category with subcategory
      const subcategory = value.split(':')[1];
      descriptionCategoryMap.map[key] = `${newName}:${subcategory}`;
      updateCount++;
    }
  });

  if (updateCount > 0) {
    saveCategoryMappings();
    console.log(`Updated ${updateCount} category mappings from "${oldName}" to "${newName}"`);
  }
}

// Define utility functions only once at the beginning of the file
function normalizeDescription(description) {
  if (!description) return "";
  return description
    .toLowerCase()
    .trim()
    .replace(/\s{2,}/g, ' '); // Replace multiple spaces with one
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
    // renderTransactions(AppState.transactions); // Removed incorrect usage

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

/**
 * Updates subcategory name in all mappings
 * @param {string} categoryName - Parent category name
 * @param {string} oldSubName - Old subcategory name
 * @param {string} newSubName - New subcategory name
 */
export function updateSubcategoryNameInMappings(categoryName, oldSubName, newSubName) {
  if (!categoryName || !oldSubName || !newSubName) return;

  let updated = false;
  // Create a copy of the mapping object to iterate through
  const mappings = { ..._descriptionCategoryMap };

  Object.entries(mappings).forEach(([desc, catValue]) => {
    // Check if this is a matching category:subcategory format
    if (typeof catValue === 'string' && catValue === `${categoryName}:${oldSubName}`) {
      _descriptionCategoryMap[desc] = `${categoryName}:${newSubName}`;
      updated = true;
    }
  });

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
