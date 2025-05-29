// Category mapping from transaction descriptions to categories
export const descriptionCategoryMap = {
  map: {},
  isInitialized: false,

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
      this.map = {};
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
 */
export function learnOrUpdateMapping(description, category, subcategory = null, isRegex = false) {
  if (!description || !category) {
    console.warn("learnOrUpdateMapping: Description and category are required.");
    return;
  }

  descriptionCategoryMap.init();

  const mappingValue = subcategory ? `${category}:${subcategory}` : category;
  const key = isRegex ? description.trim() : description.trim().toLowerCase();

  if (descriptionCategoryMap.map[key] === mappingValue) {
    return;
  }

  descriptionCategoryMap.map[key] = mappingValue;
  saveCategoryMappings();

  console.log(`Learned/Updated mapping: "${key}" -> ${mappingValue}`);
}

/**
 * Get category for a transaction description
 */
export function getCategoryForDescription(description) {
  if (!description) return null;

  descriptionCategoryMap.init();

  const normalizedDescription = description.trim().toLowerCase();

  // Direct match
  if (descriptionCategoryMap.map[normalizedDescription]) {
    return descriptionCategoryMap.map[normalizedDescription];
  }

  // Try regex patterns
  for (const pattern in descriptionCategoryMap.map) {
    const isLikelyRegex = pattern.startsWith("^") || pattern.endsWith("$") ||
      pattern.includes("*") || pattern.includes("(") ||
      pattern.includes("[");

    if (isLikelyRegex) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(normalizedDescription) || regex.test(description)) {
          return descriptionCategoryMap.map[pattern];
        }
      } catch (e) {
        console.warn(`Invalid regex pattern: ${pattern}`, e);
      }
    }
  }

  return null;
}

/**
 * Apply category mappings to transactions
 */
export function applyCategoryMappings(transactions) {
  if (!Array.isArray(transactions)) {
    console.warn("applyCategoryMappings: transactions must be an array");
    return 0;
  }

  descriptionCategoryMap.init();
  let appliedCount = 0;

  transactions.forEach(transaction => {
    // Only apply if transaction doesn't already have a category
    if (!transaction.category || transaction.category === '') {
      const suggestedCategory = getCategoryForDescription(transaction.description);
      if (suggestedCategory) {
        // Handle category:subcategory format
        if (suggestedCategory.includes(':')) {
          const [category, subcategory] = suggestedCategory.split(':');
          transaction.category = category;
          transaction.subcategory = subcategory;
        } else {
          transaction.category = suggestedCategory;
        }
        appliedCount++;
      }
    }
  });

  if (appliedCount > 0) {
    console.log(`Applied category mappings to ${appliedCount} transactions`);
  }

  return appliedCount;
}

/**
 * Update category name in all mappings when a category is renamed
 */
export function updateCategoryNameInMappings(oldName, newName) {
  if (!oldName || !newName) return;

  descriptionCategoryMap.init();
  let updatedCount = 0;

  for (const [description, mapping] of Object.entries(descriptionCategoryMap.map)) {
    if (mapping === oldName) {
      // Simple category mapping
      descriptionCategoryMap.map[description] = newName;
      updatedCount++;
    } else if (mapping.startsWith(oldName + ':')) {
      // Category with subcategory
      const subcategory = mapping.substring(oldName.length + 1);
      descriptionCategoryMap.map[description] = `${newName}:${subcategory}`;
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    saveCategoryMappings();
    console.log(`Updated ${updatedCount} category mappings from "${oldName}" to "${newName}"`);
  }
}

/**
 * Update subcategory name in mappings when a subcategory is renamed
 */
export function updateSubcategoryNameInMappings(categoryName, oldSubName, newSubName) {
  if (!categoryName || !oldSubName || !newSubName) return;

  descriptionCategoryMap.init();
  let updatedCount = 0;

  const oldMapping = `${categoryName}:${oldSubName}`;
  const newMapping = `${categoryName}:${newSubName}`;

  for (const [description, mapping] of Object.entries(descriptionCategoryMap.map)) {
    if (mapping === oldMapping) {
      descriptionCategoryMap.map[description] = newMapping;
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    saveCategoryMappings();
    console.log(`Updated ${updatedCount} subcategory mappings from "${oldSubName}" to "${newSubName}"`);
  }
}

/**
 * Get all mappings for display purposes
 */
export function getAllMappings() {
  descriptionCategoryMap.init();
  return { ...descriptionCategoryMap.map };
}

/**
 * Clear all category mappings
 */
export function clearAllMappings() {
  descriptionCategoryMap.map = {};
  saveCategoryMappings();
  console.log("Cleared all category mappings");
}

/**
 * Initialize category mapping system
 */
export function initCategoryMapping() {
  descriptionCategoryMap.init();
  console.log("Category mapping system initialized");
}
