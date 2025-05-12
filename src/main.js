// Import core modules
import { AppState, loadMergedFiles, ensureDefaultCategories } from "./core/appState.js";
import { initializeUI } from "./ui/uiManager.js";
import { initializeFileHandlers } from "./core/fileHandlers.js";
import { initializeCategories } from "./ui/categoryManager.js";
import { initializeSidebar, toggleDarkMode } from "./ui/sidebarManager.js"; // Fixed import
import { initializeCharts } from "./charts/chartManager.js";
import { initCategoryMapping } from "./ui/categoryMapping.js";
import { attachDebugFunctions } from "./utils/debug.js";
import { initializeEventListeners } from "./core/eventHandlers.js";

// Entry point - Main application initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Expense Tracker...");

  // Load data and ensure defaults
  loadMergedFiles();
  ensureDefaultCategories();

  // Initialize UI components
  initializeUI();
  initializeSidebar();

  // Initialize core functionality
  initializeFileHandlers();
  initializeCategories();
  initCategoryMapping();
  initializeCharts();

  // Initialize event handlers
  initializeEventListeners();

  // Attach debug functions
  attachDebugFunctions();

  // Set initial theme
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }

  // Set debug mode if enabled
  if (localStorage.getItem("debugMode") === "true") {
    document.body.classList.add("debug-mode");
  }

  // Load and display transaction data from merged files
  import("./ui/transactionManager.js").then(module => {
    if (typeof module.updateTransactions === 'function') {
      setTimeout(() => {
        module.updateTransactions();

        // Update charts after transactions are loaded
        import("./charts/chartManager.js").then(chartModule => {
          if (typeof chartModule.updateChartsWithCurrentData === 'function') {
            setTimeout(chartModule.updateChartsWithCurrentData, 300);
          }
        });
      }, 100);
    }
  }).catch(error => {
    console.error("Error loading transaction manager:", error);
  });

  console.log("Expense Tracker initialized successfully");
});

// Export essential functions that need to be globally accessible
export { addMergedFile } from "./core/fileManager.js";
export { renderMergedFiles } from "./ui/fileListUI.js";
