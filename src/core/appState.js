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

// Update imports - make sure this comes after AppState definition
import { getMappingBySignature } from '../mappings/mappingsManager.js';

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
  AppState.currentFileSignature = null;
  AppState.currentSuggestedMapping = null;
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

          // Try to restore mapping from signature
          const mappingObj = getMappingBySignature(file.signature);
          if (mappingObj && mappingObj.mapping) {
            file.headerMapping = mappingObj.mapping;
            console.log(`Restored mapping for ${file.fileName} from signature`);
          } else {
            // Create minimal header mapping based on data
            file.headerMapping = ['Date', 'Description', 'Expenses'];
            console.log(`Created default mapping for ${file.fileName}`);
          }
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

// Flag to track if categories have been initialized globally
export const categoriesInitialized = { value: false };

// Flag to track if normalization has already run
let categoriesNormalized = false;

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
function normalizeCategories() {
  // Skip verbose logging in production
  const verboseLogging = !isProductionEnvironment();

  // Skip if already normalized
  if (categoriesNormalized) {
    logIfVerbose("Categories already normalized, skipping", verboseLogging);
    return { ...AppState.categories };
  }

  const currentCategories = { ...AppState.categories };
  logIfVerbose("Normalizing categories. Current categories: " +
    Object.keys(currentCategories).sort(), verboseLogging);

  // Handle specific category normalizations
  normalizeTransportCategories(currentCategories, verboseLogging);
  normalizeGroceriesCategories(currentCategories, verboseLogging);

  // Create final normalized object with all categories
  const normalized = createNormalizedCategories(currentCategories);

  logIfVerbose("After normalization - categories: " +
    Object.keys(normalized).sort(), verboseLogging);

  categoriesNormalized = true;
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

/**
 * Ensures default categories are loaded and normalized
 */
export function ensureDefaultCategories() {
  // Only run once globally across the entire app
  if (categoriesInitialized.value) {
    console.log("Categories already initialized globally, skipping");
    return AppState.categories;
  }

  if (!AppState.categories) {
    AppState.categories = {};
  }

  // Fix any duplicate categories like "Transport"/"Transportation"
  AppState.categories = normalizeCategories();

  // Save the normalized categories
  saveCategories();
  console.log("Categories initialized:", Object.keys(AppState.categories).sort());

  // Set global flag to prevent redundant initialization
  categoriesInitialized.value = true;

  return AppState.categories;
}

// Initialize the AppState once
(function initializeAppState() {
  // Load from localStorage
  AppState.isDarkMode = localStorage.getItem("darkMode") === "true" || false;
  AppState.categories = JSON.parse(localStorage.getItem("expenseCategories")) || DEFAULT_CATEGORIES;

  // Normalize only once during initialization and set the global flag
  if (!categoriesInitialized) {
    AppState.categories = normalizeCategories();
    ensureDefaultCategories();
  }
})();
