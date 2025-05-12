// Directory: /src/core/appState.js

// Update imports
import { getMappingBySignature } from '../mappings/mappingsManager.js';

// Define default categories
const DEFAULT_CATEGORIES = {
  "Food": "#FF6384",
  "Housing": "#36A2EB",
  "Transportation": "#FFCE56",
  "Entertainment": "#4BC0C0",
  "Healthcare": "#9966FF",
  "Shopping": "#FF9F40",
  "Personal Care": "#8AC249",
  "Education": "#EA526F",
  "Utilities": "#7B68EE",
  "Travel": "#2ECC71"
};

// Update AppState to include all global state

export const AppState = {
  categories: JSON.parse(localStorage.getItem("expenseCategories")) || DEFAULT_CATEGORIES,
  mergedFiles: JSON.parse(localStorage.getItem("mergedFiles")) || [],
  transactions: [],
  originalTransactions: [], // Add this line
  currentCategoryFilters: [],

  // File processing state - moved from main.js
  currentFileData: null,
  currentFileName: null,
  currentFileSignature: null,
  currentSuggestedMapping: null,

  // UI state
  isDarkMode: localStorage.getItem("darkMode") === "true" || false,

  // Application flags
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
  AppState.currentFileSignature = null;
  AppState.currentSuggestedMapping = null;
}

// Update the loadMergedFiles function

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
  if (!AppState.categories || Object.keys(AppState.categories).length === 0) {
    AppState.categories = DEFAULT_CATEGORIES;
    saveCategories();
    console.log("Loaded default categories");
  }
}

// Call this right away to ensure categories are always available
ensureDefaultCategories();
