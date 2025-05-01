// Directory: /src/appState.js

// Update AppState to include all global state

export const AppState = {
  categories: JSON.parse(localStorage.getItem("expenseCategories")) || {
    Food: "#FF6384",
    Transport: "#36A2EB",
    Housing: "#FFCE56",
  },
  mergedFiles: JSON.parse(localStorage.getItem("mergedFiles")) || [],
  transactions: [],
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
