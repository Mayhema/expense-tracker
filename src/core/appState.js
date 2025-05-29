// Directory: /src/core/appState.js

import { DEFAULT_CATEGORIES } from "./constants.js";

// Define AppState first, before any functions reference it
export const AppState = {
  categories: {},
  mergedFiles: [],
  transactions: [],
  originalTransactions: [],
  currentCategoryFilters: [],
  currentFileData: null,
  currentFileName: null,
  currentFileSignature: null,
  currentSuggestedMapping: null,
  isDarkMode: false,
  isChartUpdateInProgress: false,
  savePromptShown: false,
};

export function saveCategories() {
  localStorage.setItem("expenseCategories", JSON.stringify(AppState.categories));
}

export function saveMergedFiles() {
  localStorage.setItem("mergedFiles", JSON.stringify(AppState.mergedFiles));
}

export function saveAppState() {
  // Save any settings that should persist between sessions
  localStorage.setItem("darkMode", AppState.isDarkMode);
  saveCategories();
  saveMergedFiles();
}

// Helper functions for common AppState operations
export function resetFileState() {
  AppState.currentFileData = null;
  AppState.currentFileName = null;
  AppState.currentFileSignature = null;  // Clear signature
  AppState.currentSuggestedMapping = null;

  // Clear any temporary signature data from both localStorage and window
  try {
    localStorage.removeItem("tempFileSignature");
    delete window.tempFileSignature;
  } catch (e) {
    console.error("Error removing temporary file signature:", e);
  }

  console.log("File state completely reset and signatures removed");
}

export function loadMergedFiles() {
  try {
    const savedFiles = localStorage.getItem("mergedFiles");
    if (savedFiles) {
      AppState.mergedFiles = JSON.parse(savedFiles);
      console.log(`Loaded ${AppState.mergedFiles.length} merged files from localStorage`);

      // Validate loaded files - ensure we have all required properties
      AppState.mergedFiles = AppState.mergedFiles.filter(file => {
        if (!file || !file.fileName || !file.data || !Array.isArray(file.data)) {
          console.warn("Filtered out invalid file entry:", file);
          return false;
        }
        return true;
      });

      // Fix any missing headerMapping
      AppState.mergedFiles.forEach(file => {
        if (!file.headerMapping) {
          console.warn(`Missing headerMapping for ${file.fileName}, attempting to restore`);

          // Try to restore mapping from signature with error handling
          import('../mappings/mappingsManager.js').then(module => {
            if (module.getMappingBySignature) {
              const mappingObj = module.getMappingBySignature(file.signature);
              if (mappingObj && mappingObj.mapping) {
                file.headerMapping = mappingObj.mapping;
                console.log(`Restored mapping for ${file.fileName} from signature`);
              } else {
                file.headerMapping = ['Date', 'Description', 'Expenses'];
                console.log(`Created default mapping for ${file.fileName}`);
              }
            }
          }).catch(err => {
            console.warn("Could not load mappings manager:", err);
            file.headerMapping = ['Date', 'Description', 'Expenses'];
          });
        }

        // Ensure signature is a string
        if (file.signature && typeof file.signature === 'object') {
          file.signature = file.signature.mappingSig ||
            file.signature.formatSig ||
            file.signature.contentSig ||
            JSON.stringify(file.signature);
          console.log(`Converted object signature to string: ${file.signature} `);
        }
      });

      // Save corrected files back to localStorage
      saveMergedFiles();
    } else {
      console.log("No saved merged files found");
      AppState.mergedFiles = [];
    }

    return AppState.mergedFiles;
  } catch (e) {
    console.error("Error loading merged files:", e);
    AppState.mergedFiles = [];
    return [];
  }
}

/**
 * Loads transactions and applies category mappings
 */
export function loadTransactions() {
  try {
    const savedTransactions = localStorage.getItem("transactions");
    if (savedTransactions) {
      AppState.transactions = JSON.parse(savedTransactions);
      console.log(`Loaded ${AppState.transactions.length} transactions from localStorage`);

      // Apply category mappings to transactions without categories
      import("../ui/categoryMapping.js").then(module => {
        if (typeof module.applyCategoryMappings === 'function') {
          const count = module.applyCategoryMappings(AppState.transactions);
          if (count > 0) {
            // Save the updated transactions with mappings applied
            localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
          }
        }
      }).catch(err => {
        console.error("Error applying category mappings:", err);
      });

      return AppState.transactions;
    }
    return [];
  } catch (e) {
    console.error("Error loading transactions:", e);
    return [];
  }
}

// Flag to track if categories have been initialized globally
export const categoriesInitialized = { value: false };

// Flag to track if normalization has already run
let categoriesNormalized = false; // This flag can remain for normalizeCategories internal logic

// Helper function to detect production mode
function isProductionEnvironment() {
  return typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'production';
}

/**
 * Normalizes category names to fix duplicates like Transport/Transportation
 * @returns {Object} Normalized categories
 */
function normalizeCategories(categoriesToNormalize) { // Accept categories as a parameter
  // Skip verbose logging in production
  const verboseLogging = !isProductionEnvironment();

  // If already normalized (based on a global flag, or perhaps this function should be idempotent without a flag)
  // For simplicity, let's assume it can run if needed, but the IIFE will call it once.
  // if (categoriesNormalized) {
  //   logIfVerbose("Categories already normalized, skipping", verboseLogging);
  //   return { ...categoriesToNormalize };
  // }

  const currentCategories = { ...categoriesToNormalize };
  logIfVerbose("Normalizing categories. Input categories: " +
    Object.keys(currentCategories).sort(), verboseLogging);

  // Handle specific category normalizations
  normalizeTransportCategories(currentCategories, verboseLogging);
  normalizeGroceriesCategories(currentCategories, verboseLogging);

  // Create final normalized object with all categories
  const normalized = createNormalizedCategories(currentCategories);

  logIfVerbose("After normalization - categories: " +
    Object.keys(normalized).sort(), verboseLogging);

  return normalized;
}

function normalizeTransportCategories(categories, verboseLogging) {
  if (categories["Transport"] && categories["Transportation"]) {
    logIfVerbose("Found duplicate Transport/Transportation categories", verboseLogging);
    delete categories["Transport"];
  } else if (categories["Transport"] && !categories["Transportation"]) {
    categories["Transportation"] = categories["Transport"];
    delete categories["Transport"];
    logIfVerbose("Renamed Transport to Transportation", verboseLogging);
  }
}

function normalizeGroceriesCategories(categories, verboseLogging) {
  if (categories["Groceries"] && categories["Food"]) {
    logIfVerbose("Found both Groceries and Food categories", verboseLogging);
    delete categories["Groceries"];
    logIfVerbose("Removed Groceries (should be a subcategory of Food)", verboseLogging);
  }
}

function createNormalizedCategories(currentCategories) {
  const normalized = {};

  // Copy all categories
  Object.keys(currentCategories).forEach(name => {
    normalized[name] = currentCategories[name];
  });

  // Ensure all default categories are present
  Object.keys(DEFAULT_CATEGORIES).forEach(name => {
    if (!normalized[name]) {
      normalized[name] = DEFAULT_CATEGORIES[name];
    }
  });

  return normalized;
}

function logIfVerbose(message, verboseLogging) {
  if (verboseLogging) {
    console.log(message);
  }
}

// Initialize the AppState once
(function initializeAppState() {
  console.log("appState.js: Initializing AppState...");
  // Load isDarkMode
  AppState.isDarkMode = localStorage.getItem("darkMode") === "true" || false;

  // Load categories from localStorage
  let loadedCategories = null;
  try {
    const savedCategories = localStorage.getItem("expenseCategories");
    if (savedCategories) {
      loadedCategories = JSON.parse(savedCategories);
    }
  } catch (e) {
    console.error("Error parsing saved categories from localStorage:", e);
    loadedCategories = null;
  }

  // If no valid categories in localStorage, use defaults
  if (!loadedCategories || Object.keys(loadedCategories).length === 0) {
    console.log("appState.js: No categories in localStorage or empty, using DEFAULT_CATEGORIES.");
    AppState.categories = { ...DEFAULT_CATEGORIES };
  } else {
    console.log("appState.js: Loaded categories from localStorage.");
    AppState.categories = loadedCategories;
  }

  // Normalize categories (this ensures defaults are also considered if missing after load)
  if (!categoriesNormalized) { // Use the module-level flag
    AppState.categories = normalizeCategories(AppState.categories);
    categoriesNormalized = true; // Set flag after first normalization
  }


  // Save potentially modified (defaulted or normalized) categories back
  saveCategories();
  console.log("appState.js: Categories initialized and saved:", Object.keys(AppState.categories).sort());

  // Set global flag to indicate categories are ready
  categoriesInitialized.value = true;

  // Load other parts of AppState
  loadMergedFiles(); // Ensure merged files are loaded
  loadTransactions(); // Ensure transactions are loaded

  console.log("appState.js: AppState initialization complete.");
})();

/**
 * Ensure default categories exist in AppState
 */
export function ensureDefaultCategories() {
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    console.log("No categories found, initializing with defaults...");
    AppState.categories = { ...DEFAULT_CATEGORIES };
    saveCategories();
    console.log("Default categories initialized:", Object.keys(AppState.categories));
  }
}

/**
 * Load categories from localStorage or use defaults
 */
function loadCategories() {
  try {
    const saved = localStorage.getItem('expenseTrackerCategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('✅ Categories loaded from localStorage:', Object.keys(parsed).length, 'categories');
      return parsed;
    } else {
      console.log('📂 No saved categories found, using defaults');
      return { ...DEFAULT_CATEGORIES };
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    return { ...DEFAULT_CATEGORIES };
  }
}

/**
 * Initialize the application state
 * This function sets up the initial state and loads saved data
 */
export function initializeAppState() {
  console.log("🚀 Initializing AppState...");

  try {
    // Load saved data from localStorage
    loadTransactions();
    loadMergedFiles();
    loadCategories();

    console.log("✅ AppState initialized successfully");
    console.log("📊 Current state:", {
      transactions: AppState.transactions?.length || 0,
      mergedFiles: AppState.mergedFiles?.length || 0,
      categories: Object.keys(AppState.categories || {}).length
    });

    return Promise.resolve();
  } catch (error) {
    console.error("❌ Error initializing AppState:", error);
    return Promise.reject(error);
  }
}

/**
 * Load application state from localStorage
 */
export function loadAppState() {
  console.log("Loading application state...");

  try {
    // Load merged files
    const savedFiles = localStorage.getItem('mergedFiles');
    if (savedFiles) {
      AppState.mergedFiles = JSON.parse(savedFiles);
      console.log(`Loaded ${AppState.mergedFiles.length} merged files`);
    }

    // Load categories
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      AppState.categories = JSON.parse(savedCategories);
      console.log(`Loaded ${Object.keys(AppState.categories).length} categories`);
    }

    // Load settings
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
      console.log("Loaded application settings");
    }

    // Load format mappings
    const savedMappings = localStorage.getItem('formatMappings');
    if (savedMappings) {
      AppState.formatMappings = JSON.parse(savedMappings);
      console.log(`Loaded ${Object.keys(AppState.formatMappings).length} format mappings`);
    }

    console.log("Application state loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading application state:", error);
    // Reset to defaults on error
    initializeDefaultState();
    return false;
  }
}

// Remove any CSS imports if they exist
// CSS files should only be loaded via HTML link tags, not ES6 imports

/**
 * Initialize the application state (alternative implementation)
 */
export async function initializeAppStateAlternative() {
  console.log('Initializing app state...');

  try {
    // Load existing data from localStorage
    loadAppState();

    // Initialize default categories if none exist
    initializeCategories();

    // Validate and clean up any corrupted data
    validateAndCleanAppState();

    console.log('App state initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing app state:', error);

    // Try to recover by resetting to defaults
    try {
      resetToDefaults();
      console.log('App state reset to defaults due to error');
      return true;
    } catch (resetError) {
      console.error('Failed to reset app state:', resetError);
      throw new Error('Unable to initialize application state');
    }
  }
}

/**
 * Initialize categories in AppState
 */
export function initializeCategories() {
  try {
    // Load categories from localStorage
    const saved = localStorage.getItem('expenseCategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      AppState.categories = parsed;
      console.log('✅ Categories loaded from localStorage:', Object.keys(parsed).length, 'categories');
    } else {
      console.log('📂 No saved categories found, using defaults');
      AppState.categories = { ...DEFAULT_CATEGORIES };
      saveCategories();
    }

    // Normalize categories
    AppState.categories = normalizeCategories(AppState.categories);
    saveCategories();

    console.log("Categories initialized:", Object.keys(AppState.categories));
    return true;
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    AppState.categories = { ...DEFAULT_CATEGORIES };
    saveCategories();
    return false;
  }
}

/**
 * Initialize the application state
 */
export function initialize() {
  console.log("appState.js: Initializing AppState...");

  try {
    // Initialize categories
    initializeCategories();

    // Load merged files
    loadMergedFiles();

    // Load transactions
    loadTransactions();

    console.log("appState.js: AppState initialization complete.");
    return true;
  } catch (error) {
    console.error("Error during AppState initialization:", error);
    return false;
  }
}

// Make initialize available on AppState object
AppState.initialize = initialize;
