console.log("Executing main.js - Version: 2024-07-29_01");

// Import only JavaScript modules - all CSS is loaded via HTML
import { AppState, initialize } from './core/appState.js';
import { initializeFileUpload } from './ui/fileUpload.js';
import { initializeUI } from './ui/uiManager.js';
import { initializeCharts } from './ui/charts.js';
import { updateTransactions } from './ui/transactionManager.js';

/**
 * Initialize the entire application
 */
async function initializeApp() {
  try {
    console.log("🔧 Initializing AppState...");

    // Initialize AppState first
    const stateInitialized = initialize(); // Use the imported function directly
    if (!stateInitialized) {
      throw new Error("Failed to initialize AppState");
    }

    console.log("🎨 Initializing UI components...");
    initializeUI();

    console.log("📁 Initializing file upload...");
    initializeFileUpload();

    console.log("📊 Initializing charts...");
    await initializeCharts();

    // Add small delay before transaction rendering to ensure DOM is ready
    console.log("💾 Loading and rendering transactions...");
    await new Promise(resolve => setTimeout(resolve, 100));
    updateTransactions();

    console.log("✅ Application initialized successfully!");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);

    // Show user-friendly error message
    import('./ui/uiManager.js').then((uiModule) => {
      if (uiModule.showToast) {
        uiModule.showToast("Failed to initialize application. Please refresh the page.", "error");
      }
    });

    return false;
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

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
