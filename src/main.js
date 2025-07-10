console.log("Executing main.js - Version: 2025-06-29_02");

// Import only JavaScript modules - all CSS is loaded via HTML
import { AppState, loadAppState } from './core/appState.js';
import { initializeFileUpload } from './ui/fileUpload.js';
import { setupSidebarManager } from './ui/sidebarManager.js';
import { initializeTransactionManager } from './ui/transactionManager.js';

// FIXED: Global chart initialization state to prevent multiple loads
let chartInitializationState = {
  initialized: false,
  initializing: false,
  hasData: false
};

// FIXED: App initialization guard to prevent duplicate initialization
let appInitializationState = {
  initialized: false,
  initializing: false
};

/**
 * Initialize the entire application
 */
async function initializeMainApp() {
  // FIXED: Guard against multiple initializations
  if (appInitializationState.initialized || appInitializationState.initializing) {
    console.log("App already initialized or initializing, skipping...");
    return;
  }

  appInitializationState.initializing = true;
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

    // Initialize transaction manager (this will create the section and render data WITHOUT updating charts)
    console.log("CRITICAL: Initializing transaction manager...");
    initializeTransactionManager();

    // FIXED: Initialize charts LAST and update them ONCE if we have data
    await initializeChartsOnce();

    appInitializationState.initialized = true;
    // FIXED: Mark AppState as initialized for debugging
    AppState.initialized = true;
    console.log("CRITICAL: App initialization complete");
  } catch (error) {
    console.error("CRITICAL ERROR: App initialization failed:", error);
    // Don't throw the error, just log it to prevent unhandled promise rejection
  } finally {
    appInitializationState.initializing = false;
  }
}

/**
 * FIXED: Initialize charts only once with proper loading indicators
 */
async function initializeChartsOnce() {
  // Prevent multiple initialization
  if (chartInitializationState.initialized || chartInitializationState.initializing) {
    console.log("Charts already initialized or initializing, skipping...");
    return;
  }

  chartInitializationState.initializing = true;

  try {
    const chartsModule = await Promise.race([
      import('./ui/charts.js'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Charts import timeout')), 2000))
    ]);

    if (chartsModule && chartsModule.initializeCharts) {
      console.log("Initializing charts...");
      await chartsModule.initializeCharts();
      chartInitializationState.initialized = true;
      console.log("Charts initialized successfully");

      // FIXED: Only update charts ONCE if we have data - prevent double updates
      if (AppState.transactions && AppState.transactions.length > 0) {
        console.log(`Performing SINGLE chart update with ${AppState.transactions.length} transactions`);
        // FIXED: Add delay to ensure DOM is ready and prevent double update
        setTimeout(() => {
          chartsModule.updateCharts();
          chartInitializationState.hasData = true;
          console.log("Charts updated with existing transaction data - SINGLE UPDATE COMPLETE");
        }, 500);
      } else {
        console.log("No transaction data available for initial chart update");
      }
    }
  } catch (error) {
    console.log('Charts not available or failed to initialize:', error.message);
  } finally {
    chartInitializationState.initializing = false;
  }
}

// FIXED: Improved initialization with proper error handling
async function safeInitialization() {
  try {
    console.log('DOM loaded, initializing expense tracker...');

    // FIXED: Load debug utilities with timeout and error handling
    try {
      await Promise.race([
        Promise.all([
          import('./utils/debug.js').catch(() => console.log('Debug utils not available')),
          import('./utils/console-logger.js').catch(() => console.log('Console logger not available'))
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Debug utilities timeout')), 3000))
      ]);
    } catch (error) {
      console.log('Debug utilities failed to load:', error.message);
    }

    // Then initialize the main application
    await initializeMainApp();

    console.log('✅ Expense Tracker initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Expense Tracker:', error);
    // Show user-friendly error message
    showInitializationError(error);
  }
}

// FIXED: Show initialization error to user
function showInitializationError(error) {
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    mainContent.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #dc3545;">
        <h2>⚠️ Application Initialization Error</h2>
        <p>There was an error starting the expense tracker.</p>
        <p>Please refresh the page or check the browser console for details.</p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 20px;
        ">Refresh Page</button>
      </div>
    `;
  }
}

// FIXED: Initialize the application when DOM is ready with proper event handling
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitialization);
} else {
  // DOM is already ready
  setTimeout(safeInitialization, 0);
}

// FIXED: Track cleanup functions for proper memory management
const cleanupFunctions = [];

// FIXED: Register cleanup functions
function registerCleanup(cleanupFn) {
  cleanupFunctions.push(cleanupFn);
}

// FIXED: Initialize cleanup handlers
function initializeCleanupHandlers() {
  // Register cleanup functions for various modules
  const cleanupModules = [
    { module: './ui/chartManager.js', cleanup: 'cleanupAllCharts' },
    { module: './ui/modalManager.js', cleanup: 'cleanupAllModals' },
    { module: './ui/transactionManager.js', cleanup: 'cleanupTransactionManager' },
    { module: './ui/fileUpload.js', cleanup: 'cleanupFileUpload' }
  ];

  cleanupModules.forEach(({ module, cleanup }) => {
    registerCleanup(() => {
      try {
        import(module).then(moduleInstance => {
          if (moduleInstance[cleanup]) {
            moduleInstance[cleanup]();
          }
        }).catch(() => {
          // Module might not exist, ignore error
        });
      } catch (error) {
        console.warn(`Cleanup failed for ${module}:`, error);
      }
    });
  });
}

// Initialize cleanup handlers
initializeCleanupHandlers();

// FIXED: Cleanup on page unload with error handling
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

// FIXED: Add improved error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Check if it's a browser extension related error
  if (event.reason?.message?.includes('message channel closed') ||
    event.reason?.message?.includes('listener indicated an asynchronous response')) {
    console.log('Browser extension related error, ignoring...');
    event.preventDefault();
  } else {
    // Prevent default browser error handling for other errors too
    event.preventDefault();
  }
});

// FIXED: Add error handler for general JavaScript errors
window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error);

  // Check if it's a browser extension related error
  if (event.error?.message?.includes('Extension context invalidated') ||
    event.error?.message?.includes('message channel closed')) {
    console.log('Browser extension related error, ignoring...');
    event.preventDefault();
  }
});

// FIXED: Add a safety timeout to ensure initialization doesn't hang
setTimeout(() => {
  if (!appInitializationState.initialized && !appInitializationState.initializing) {
    console.warn('Application may not have initialized properly');

    // Try to initialize again as a fallback
    if (document.readyState === 'complete') {
      console.log('Attempting fallback initialization...');
      safeInitialization().catch(error => {
        console.error('Fallback initialization also failed:', error);
      });
    }
  }
}, 5000);
