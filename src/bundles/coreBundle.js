/**
 * Core Bundle - Consolidates core application functionality
 * This reduces the number of separate HTTP requests
 */

// Re-export core functionality
export { AppState, loadMergedFiles, loadTransactions } from '../core/appState.js';
export { DEFAULT_CATEGORIES, HEADERS } from '../core/constants.js';
export {
  handleFileUpload,
  isDuplicateFile,
  generateFileSignature
} from '../parsers/fileHandler.js';
export { addMergedFile } from '../core/fileManager.js';
export { initializeEventListeners } from '../core/eventHandlers.js';

/**
 * Initialize all core components in one call
 */
export async function initializeCore() {
  console.log("Initializing core functionality...");

  try {
    // Load essential modules
    const { loadMergedFiles, loadTransactions } = await import('../core/appState.js');
    const { initializeEventListeners } = await import('../core/eventHandlers.js');
    const { initializeCategories } = await import('../ui/categoryManager.js');
    const { initCategoryMapping } = await import('../ui/categoryMapping.js');
    const { initializeFileHandlers } = await import('../parsers/fileHandler.js');

    // Load app state and data
    ensureDefaultCategories();
    loadMergedFiles();
    loadTransactions();

    // Initialize in proper sequence
    initializeCategories();
    initCategoryMapping();
    initializeFileHandlers();
    initializeEventListeners();

    console.log("Core functionality initialized");
    return true;
  } catch (error) {
    console.error("Error initializing core:", error);
    return false;
  }
}

/**
 * Initializes category mappings
 */
async function initializeCategoryMapping() {
  try {
    // Import the module
    const categoryMappingModule = await import("../ui/categoryMapping.js");

    // Make sure we're working with the map object correctly
    if (categoryMappingModule.descriptionCategoryMap && typeof categoryMappingModule.descriptionCategoryMap.init === 'function') {
      categoryMappingModule.descriptionCategoryMap.init();
      console.log("CoreBundle: Category mapping initialized successfully via descriptionCategoryMap.init().");
    } else {
      console.warn("CoreBundle: Category mapping object or init method not found.");
    }
  } catch (error) {
    console.error("CoreBundle: Error initializing category mapping:", error);
  }
}

// Import AppState and handle defaults internally
import { AppState, saveCategories } from '../core/appState.js';
import { DEFAULT_CATEGORIES } from '../core/constants.js';

/**
 * Local function to ensure default categories
 */
function ensureDefaultCategories() {
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    console.log("No categories found, initializing with defaults...");
    AppState.categories = { ...DEFAULT_CATEGORIES };
    saveCategories();
    console.log("Default categories initialized:", Object.keys(AppState.categories));
  }
}
