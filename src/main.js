console.log("Executing main.js - Version: 2024-07-29_02");

// Import only JavaScript modules - all CSS is loaded via HTML
import { AppState, loadAppState } from './core/appState.js';
import { initializeFileUpload } from './ui/fileUpload.js';
import { setupSidebarManager } from './ui/sidebarManager.js';
import { initializeTransactionManager } from './ui/transactionManager.js';

/**
 * Initialize the entire application
 */
async function initializeMainApp() {
  console.log("Starting application initialization...");

  try {
    // Initialize app state first
    console.log("CRITICAL: Loading app state...");
    await loadAppState();

    // Initialize theme from localStorage (inline instead of themeManager)
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const isDebugMode = localStorage.getItem('debugMode') === 'true';

    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }

    if (isDebugMode) {
      document.body.classList.add('debug-mode');
    }

    // Initialize sidebar
    console.log("CRITICAL: Setting up sidebar...");
    setupSidebarManager();

    // Initialize file upload
    console.log("CRITICAL: Initializing file upload...");
    initializeFileUpload();

    // Initialize transaction manager (this will create the section and render data)
    console.log("CRITICAL: Initializing transaction manager...");
    initializeTransactionManager();

    // Initialize charts after a delay to ensure DOM is ready
    setTimeout(() => {
      import('./ui/charts.js').then(module => {
        if (module.initializeCharts) {
          module.initializeCharts();
        }
      }).catch(error => {
        console.log('Charts not available:', error.message);
      });
    }, 500);

    console.log("CRITICAL: App initialization complete");
  } catch (error) {
    console.error("CRITICAL ERROR: App initialization failed:", error);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing expense tracker...');

  try {
    // FIXED: Load debug utilities FIRST
    await import('./utils/debug.js');
    await import('./utils/console-logger.js');

    // Then initialize the main application
    await initializeMainApp();

    console.log('✅ Expense Tracker initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Expense Tracker:', error);
  }
});

// FIXED: Track cleanup functions for proper memory management
const cleanupFunctions = [];

// FIXED: Register cleanup functions
function registerCleanup(cleanupFn) {
  cleanupFunctions.push(cleanupFn);
}

// FIXED: Initialize with performance optimizations
async function initializeApp() {
  // FIXED: Register cleanup functions
  registerCleanup(() => {
    import('./ui/chartManager.js').then(module => {
      if (module.cleanupAllCharts) module.cleanupAllCharts();
    });
  });

  registerCleanup(() => {
    import('./ui/modalManager.js').then(module => {
      if (module.cleanupAllModals) module.cleanupAllModals();
    });
  });

  registerCleanup(() => {
    import('./ui/transactionManager.js').then(module => {
      if (module.cleanupTransactionManager) module.cleanupTransactionManager();
    });
  });

  registerCleanup(() => {
    import('./ui/fileUpload.js').then(module => {
      if (module.cleanupFileUpload) module.cleanupFileUpload();
    });
  });
}

// FIXED: Cleanup on page unload
window.addEventListener('beforeunload', () => {
  cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });
});

// Make AppState available globally for debugging
window.AppState = AppState;

// Add error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default browser error handling
});

// Add error handler for general JavaScript errors
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);
});
