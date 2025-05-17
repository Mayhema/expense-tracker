// Remove unused imports
import { initializeUI } from "./ui/uiManager.js";
import { initializeFileHandlers } from "./core/fileHandlers.js";
import { initializeCategories } from "./ui/categoryManager.js";
import { initializeSidebar } from "./ui/sidebarManager.js"; // Removed toggleDarkMode
import { initializeCharts } from "./charts/chartManager.js";
import { initCategoryMapping } from "./ui/categoryMapping.js";
import { attachDebugFunctions } from "./utils/debug.js";
import { initializeEventListeners } from "./core/eventHandlers.js";

// Track if app has been initialized
let appInitialized = false;

// Entry point - Main application initialization
document.addEventListener("DOMContentLoaded", () => {
  // Prevent multiple initializations
  if (appInitialized) {
    console.log("App already initialized, skipping");
    return;
  }

  console.log("Initializing Expense Tracker...");
  appInitialized = true;

  try {
    // Load data and ensure defaults - with proper error handling
    import("./core/appState.js").then(module => {
      // Initialize AppState first
      module.loadMergedFiles();
      module.ensureDefaultCategories();

      // Initialize UI components after AppState is ready
      initializeUI();
      initializeSidebar(); // Moved here to ensure AppState is initialized

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
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      document.body.classList.toggle("dark-mode", isDarkMode);

      // Set debug mode if enabled
      const isDebugMode = localStorage.getItem("debugMode") === "true";
      document.body.classList.toggle("debug-mode", isDebugMode);

      // Load and display transaction data from merged files - with safety delay
      setTimeout(loadTransactionsAndCharts, 100);
    }).catch(error => {
      console.error("Error initializing app state:", error);
    });
  } catch (error) {
    console.error("Error during initialization:", error);
  }

  console.log("Expense Tracker initialization sequence complete");

  // Enhanced theme initialization
  initializeTheme();
});

/**
 * Initialize theme with improved compatibility
 */
function initializeTheme() {
  // Get stored preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Apply to body class
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Immediately update meta theme color
  updateMetaThemeColor(isDarkMode);

  // Fix for chart themeing
  if (isDarkMode && window.Chart && window.Chart.defaults) {
    console.log("Applying dark theme to charts");
    window.Chart.defaults.color = "#e0e0e0";
    window.Chart.defaults.borderColor = "#444444";
  }

  console.log(`Theme initialized: ${isDarkMode ? "dark" : "light"} mode`);
}

/**
 * Updates the meta theme-color for mobile devices
 */
function updateMetaThemeColor(isDark) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = isDark ? "#121212" : "#ffffff";
}

// Helper functions to reduce nesting depth
function updateCharts() {
  import("./charts/chartManager.js")
    .then((chartModule) => {
      if (typeof chartModule.updateChartsWithCurrentData === "function") {
        chartModule.updateChartsWithCurrentData();
      }
    })
    .catch((error) => {
      console.error("Error updating charts:", error);
    });
}

function loadTransactionsAndCharts() {
  import("./ui/transactionManager.js")
    .then((module) => {
      if (typeof module.updateTransactions === "function") {
        module.updateTransactions();

        // Update charts after transactions are loaded
        setTimeout(updateCharts, 300);
      }
    })
    .catch((error) => {
      console.error("Error loading transaction manager:", error);
    });
}

// Export essential functions that need to be globally accessible - KEEP ONLY THESE EXPORTS
export { addMergedFile } from "./core/fileManager.js";
export { renderMergedFiles } from "./ui/fileListUI.js";
