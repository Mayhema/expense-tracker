import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { renderTransactions } from "./transactionManager.js";
import { getContrastColor } from "../utils/utils.js";

const CATEGORY_MAPPINGS_KEY = "categoryMappings";

// Export this variable so it can be imported elsewhere
export let descriptionCategoryMap = {};

export function initCategoryMapping() {
  loadCategoryMappings();
}

export function loadCategoryMappings() {
  try {
    const savedMappings = localStorage.getItem(CATEGORY_MAPPINGS_KEY);
    if (savedMappings) {
      descriptionCategoryMap = JSON.parse(savedMappings);
    }
  } catch (err) {
    console.error("Error loading category mappings:", err);
    descriptionCategoryMap = {};
  }
}

export function saveCategoryMappings() {
  localStorage.setItem(CATEGORY_MAPPINGS_KEY, JSON.stringify(descriptionCategoryMap));
}

export function addToCategoryMapping(description, category, subcategory = null) {
  if (!description || !category) return;

  const normalizedDesc = normalizeDescription(description);
  const categoryKey = subcategory ? `${category}:${subcategory}` : category;

  if (!descriptionCategoryMap[normalizedDesc]) {
    descriptionCategoryMap[normalizedDesc] = categoryKey;
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
  if (descriptionCategoryMap[normalizedDesc]) {
    delete descriptionCategoryMap[normalizedDesc];
    saveCategoryMappings();
    return true;
  }

  return false;
}

export function getCategoryForDescription(description) {
  if (!description) return null;

  const normalizedDesc = normalizeDescription(description);

  // First try exact match
  if (descriptionCategoryMap[normalizedDesc]) {
    const categoryKey = descriptionCategoryMap[normalizedDesc];

    // Check if it includes a subcategory
    if (categoryKey.includes(':')) {
      const [category, subcategory] = categoryKey.split(':');
      return { category, subcategory };
    }

    return { category: categoryKey };
  }

  // Then try partial matches - more careful with Hebrew text
  const isHebrew = /[\u0590-\u05FF]/.test(normalizedDesc);

  for (const [key, category] of Object.entries(descriptionCategoryMap)) {
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
      } else {
        // For non-Hebrew, standard matching behavior
        if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
          return category;
        }
      }
    }
  }

  return null;
}

function normalizeDescription(description) {
  if (!description) return '';

  // First check if the string is primarily Hebrew
  const hebrewPattern = /[\u0590-\u05FF]/;
  const isPrimarilyHebrew = hebrewPattern.test(description);

  let normalized = description.toLowerCase().trim();

  // Apply different normalization rules for Hebrew vs other texts
  if (isPrimarilyHebrew) {
    // For Hebrew, just remove some punctuation but maintain the original characters
    normalized = normalized.replace(/[^\u0590-\u05FF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    // Standard normalization for Latin text
    normalized = normalized
      .replace(/^payment to |^purchase from |^txn\*|^pos |^pymt to |^txn |^transact /i, '')
      .replace(/\s*-\s*ref\s*:.*$/i, '')
      .replace(/\s*-\s*auth\s*:.*$/i, '')
      .replace(/\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?$/i, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return normalized;
}

export function getDescriptionsForCategory(category) {
  if (!category) return [];

  return Object.entries(descriptionCategoryMap)
    .filter(([_, cat]) => cat === category)
    .map(([desc, _]) => desc);
}

export function updateCategoryNameInMappings(oldName, newName) {
  if (!oldName || !newName) return;

  let updated = false;
  for (const [desc, category] of Object.entries(descriptionCategoryMap)) {
    if (category === oldName) {
      descriptionCategoryMap[desc] = newName;
      updated = true;
    }
  }

  if (updated) {
    saveCategoryMappings();
  }
}

export function autoCategorizeTransactions(transactions) {
  if (!transactions || !transactions.length) return 0;

  let count = 0;
  let removedCount = 0;

  transactions.forEach(tx => {
    if (!tx.description) return;

    const categoryInfo = getCategoryForDescription(tx.description);

    // If we have a mapping for this description, apply it
    if (categoryInfo) {
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
        count++;
      }
    }
    // If we previously auto-categorized this transaction but the mapping is gone,
    // remove the category
    else if (tx.autoCategorized && tx.category) {
      tx.category = null;
      if (tx.subcategory) delete tx.subcategory;
      delete tx.autoCategorized;
      removedCount++;
    }
  });

  if (count > 0 || removedCount > 0) {
    localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
  }

  return { added: count, removed: removedCount };
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

  // Check if we need to filter mappings by selected categories
  const showAllCategories = !selectedCategories || selectedCategories.length === 0;

  const categorizedMappings = {};

  // Group mappings by category
  for (const [desc, categoryKey] of Object.entries(descriptionCategoryMap)) {
    // Handle both simple categories and category:subcategory format
    let category = categoryKey;
    if (categoryKey.includes(':')) {
      category = categoryKey.split(':')[0];
    }

    // Skip if filtering by selected categories
    if (!showAllCategories && !selectedCategories.includes(category)) {
      continue;
    }

    if (!categorizedMappings[categoryKey]) {
      categorizedMappings[categoryKey] = [];
    }
    categorizedMappings[categoryKey].push(desc);
  }

  // Check if we have any mappings to show
  if (Object.keys(categorizedMappings).length === 0) {
    html += '<p>No category mappings found';

    if (!showAllCategories) {
      html += ' for the selected categories';
    }

    html += '.</p>';
    container.innerHTML = html;
    return;
  }

  // Render category mapping groups
  for (const [categoryKey, descriptions] of Object.entries(categorizedMappings)) {
    // Handle both simple categories and category:subcategory format
    let category = categoryKey;
    let subcategory = null;

    if (categoryKey.includes(':')) {
      [category, subcategory] = categoryKey.split(':');
    }

    // Get appropriate color
    let color = '#cccccc';

    if (AppState.categories[category]) {
      if (typeof AppState.categories[category] === 'string') {
        color = AppState.categories[category];
      } else if (AppState.categories[category].color) {
        color = AppState.categories[category].color;

        // Use subcategory color if available
        if (subcategory &&
          AppState.categories[category].subcategories &&
          AppState.categories[category].subcategories[subcategory]) {
          color = AppState.categories[category].subcategories[subcategory];
        }
      }
    }

    // Create section title with category name and subcategory if applicable
    let titleText = category;
    if (subcategory) {
      titleText += `: ${subcategory}`;
    }

    // Create collapsible section for each category
    const sectionId = `mapping-${categoryKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

    html += `
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

  html += `
    <div style="margin-top: 20px;">
      <button id="autoCategorizeBtn" class="button" onclick="window.autoCategorizeAll()">
        Auto-categorize All Transactions
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Initialize sections toggle functionality
  window.toggleMappingSection = function (sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';

    // Update the toggle icon
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

export default {
  initCategoryMapping,
  addToCategoryMapping,
  removeFromCategoryMapping,
  getCategoryForDescription,
  autoCategorizeTransactions,
  updateCategoryNameInMappings,
  renderCategoryMappingUI,
  getDescriptionsForCategory,
  // Add descriptionCategoryMap to the default export
  descriptionCategoryMap
};
