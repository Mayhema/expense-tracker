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

/**
 * Ensures default categories are loaded
 */
export function ensureDefaultCategories() {
  if (!AppState.categories) {
    AppState.categories = {};
  }

  // Use Object.entries to iterate over the DEFAULT_CATEGORIES object
  Object.entries(DEFAULT_CATEGORIES).forEach(([categoryName, colorValue]) => {
    if (!AppState.categories[categoryName]) {
      AppState.categories[categoryName] = colorValue;
    }
  });

  // Save categories to ensure persistence
  saveCategories();
  console.log("Ensured default categories are loaded");
}

// Initialize the AppState values from localStorage after definition
AppState.isDarkMode = localStorage.getItem("darkMode") === "true" || false;
AppState.categories = JSON.parse(localStorage.getItem("expenseCategories")) || DEFAULT_CATEGORIES;

// Call this right away to ensure categories are always available
ensureDefaultCategories();
