// Remove unused imports
import { initializeUI } from "./ui/uiManager.js";
import { initializeFileHandlers } from "./core/fileHandlers.js";
import { initializeCategories } from "./ui/categoryManager.js";
import { initializeSidebar } from "./ui/sidebarManager.js"; // Removed toggleDarkMode
import { initializeCharts } from "./charts/chartManager.js";
import { initCategoryMapping } from "./ui/categoryMapping.js";
import { attachDebugFunctions } from "./utils/debug.js";
import { initializeEventListeners } from "./core/eventHandlers.js";

// Single global initialization flag
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
    // Use a more efficient initialization sequence with clear dependencies
    initializeApp();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

/**
 * Initializes the app in the correct sequence with proper dependency handling
 */
async function initializeApp() {
  try {
    // Step 1: Initialize core state first
    const appStateModule = await import("./core/appState.js");
    appStateModule.loadMergedFiles();

    // Step 2: Initialize UI components
    initializeUI();
    initializeSidebar();

    // Step 3: Initialize only the essential functionality initially
    initializeFileHandlers();

    // Step 4: Initialize categories (once)
    initializeCategories();

    // Step 5: Initialize remaining components
    initCategoryMapping();
    initializeCharts();
    initializeEventListeners();
    attachDebugFunctions();

    // Step 6: Apply themes
    initializeTheme();

    console.log("Core initialization complete");

    // Step 7: Load user data after everything is initialized
    loadTransactionsAndCharts();

    console.log("App initialization complete");
  } catch (error) {
    console.error("Error in initialization sequence:", error);
  }
}

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
