// Directory: /src/appState.js

export const AppState = {
  categories: JSON.parse(localStorage.getItem("expenseCategories")) || {
    Food: "#FF6384",
    Transport: "#36A2EB",
    Housing: "#FFCE56",
  },
  mergedFiles: JSON.parse(localStorage.getItem("mergedFiles")) || [],
  transactions: [],
  currentCategoryFilters: [],
  currentFileData: null,
  currentFileName: null,
  currentFileSignature: null,
  currentSuggestedMapping: null,
  savePromptShown: false,
};

export function saveCategories() {
  localStorage.setItem("expenseCategories", JSON.stringify(AppState.categories));
}

export function saveMergedFiles() {
  localStorage.setItem("mergedFiles", JSON.stringify(AppState.mergedFiles));
}
