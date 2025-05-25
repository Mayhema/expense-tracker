console.log("Executing main.js - Version: 2024-07-29_01"); // Diagnostic log
// Import from consolidated bundles instead of individual files
import { initializeCore as initializeCoreServices } from './bundles/coreBundle.js';
import { initializeUI, showToast } from './ui/uiManager.js';
import { setupSidebarManager } from './ui/sidebarManager.js'; // Changed import
import { initializeFileUpload } from './ui/fileUpload.js';
import { renderTransactions, renderCategoryButtons } from './ui/transactionManager.js'; // REMOVED: updateCategoryFilterDropdown
import { AppState } from './core/appState.js';
import { descriptionCategoryMap } from './ui/categoryMapping.js'; // Import for direct init

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
    // Service worker registration for better performance and offline capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Use a more efficient initialization sequence with bundled modules
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
    console.log("Main.js: Initializing application - Version: 2024-07-29_01");

    // 1. Initialize core services
    await initializeCoreServices();
    console.log("Main.js: Core services initialized. AppState should be ready.");

    // 2. Initialize category description mappings
    if (descriptionCategoryMap && typeof descriptionCategoryMap.init === 'function') {
      descriptionCategoryMap.init();
      console.log("Main.js: Category description mappings initialized.");
    } else {
      console.error("Main.js: CRITICAL - descriptionCategoryMap.init is NOT available!");
      showToast("Critical error: Category mapping system failed to load.", "error");
    }

    // 3. Initialize UI components
    initializeUI();

    // 4. Initialize sidebar with increased delay and error handling
    setTimeout(() => {
      try {
        setupSidebarManager();
        console.log("Main.js: Sidebar manager initialized successfully");
      } catch (error) {
        console.error("Main.js: Error initializing sidebar manager:", error);
        showToast("Warning: Sidebar features may not work properly", "warning");
      }
    }, 500);

    initializeFileUpload();

    // 5. Initialize charts FIRST before rendering transactions
    await import("./bundles/chartBundle.js").then(module => {
      if (typeof module.initializeCharts === 'function') {
        module.initializeCharts();
        console.log("Main.js: Charts initialized.");
      }
    }).catch(err => {
      console.error("Error initializing charts:", err);
    });

    // 6. Render initial UI state WITHOUT triggering immediate chart updates
    renderTransactions(AppState.transactions || [], false);
    // REMOVED: updateCategoryFilterDropdown() - function no longer exists
    renderCategoryButtons();

    // 7. Initialize transaction event listeners
    import("./ui/transactionManager.js").then(module => {
      if (typeof module.initializeTransactionEventListeners === 'function') {
        module.initializeTransactionEventListeners();
        console.log("Main.js: Transaction event listeners initialized.");
      }
    }).catch(err => {
      console.error("Error initializing transaction event listeners:", err);
    });

    console.log("Main.js: Application fully initialized.");
    showToast("Application loaded successfully!", "success");

  } catch (error) {
    console.error("Main.js: Failed to initialize application -", error);
    showToast("Error initializing application. Some features may not work.", "error");
  }
}

// Helper function to update charts - using the bundle import
function updateCharts() {
  import("./bundles/chartBundle.js")
    .then((chartModule) => {
      if (typeof chartModule.updateChartsWithCurrentData === "function") {
        chartModule.updateChartsWithCurrentData();
      }
    })
    .catch((error) => {
      console.error("Error updating charts:", error);
    });
}

// Helper function to load transactions and update charts
function loadTransactionsAndCharts() {
  import("./bundles/uiBundle.js")
    .then((uiModule) => {
      if (typeof uiModule.updateTransactions === "function") {
        uiModule.updateTransactions();

        // Update charts after transactions are loaded
        setTimeout(updateCharts, 100);
      }
    })
    .catch((error) => {
      console.error("Error loading transaction manager:", error);
    });
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', function (event) {
  console.error('Main.js: Unhandled promise rejection -', event.reason);
  showToast(`An unexpected error occurred: ${event.reason.message || event.reason}`, "error");
});

// Initialize console history capture
(function initConsoleCapture() {
  window.consoleHistory = [];
  window.recentErrors = [];

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  ['log', 'warn', 'error', 'info'].forEach(level => {
    console[level] = function (...args) {
      // Call original console method
      originalConsole[level].apply(console, args);

      // Store in history (limit to last 100 entries)
      window.consoleHistory.push({
        level,
        timestamp: new Date().toISOString(),
        message: args.join(' '),
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      });

      if (window.consoleHistory.length > 100) {
        window.consoleHistory.shift();
      }

      // Store errors separately
      if (level === 'error') {
        window.recentErrors.push({
          timestamp: new Date().toISOString(),
          message: args.join(' '),
          stack: args[0]?.stack || 'No stack trace'
        });

        if (window.recentErrors.length > 20) {
          window.recentErrors.shift();
        }
      }
    };
  });
})();

// Export essential functions that need to be globally accessible
export { addMergedFile } from "./bundles/coreBundle.js";
// renderMergedFiles is still exported by uiBundle.js if needed elsewhere,
// but not called directly from main.js init.
export { renderMergedFiles } from "./bundles/uiBundle.js";
