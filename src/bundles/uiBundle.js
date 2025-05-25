/**
 * UI Bundle - Consolidates UI-related functionality
 * This reduces the number of separate HTTP requests
 */

// Import the new revertTransaction functionality
import '../ui/revertTransaction.js';

// Import from individual UI modules

// Re-export UI functionality
export { initializeUI, showToast, hideElement, showElement } from '../ui/uiManager.js';
export { setupSidebarManager } from '../ui/sidebarManager.js'; // Corrected export
export {
  updateTransactions,
  renderTransactions,
  renderCategoryButtons
} from '../ui/transactionManager.js';
export { showModal, closeModal } from '../ui/modalManager.js';
export { revertTransaction } from '../ui/revertTransaction.js';

// Re-export file handling UI
export {
  onFileUpload
  // renderHeaderPreview was incorrectly sourced from fileUpload.js
} from '../ui/fileUpload.js';
export { renderHeaderPreview } from '../ui/headerMapping.js'; // Correctly source renderHeaderPreview
export { renderMergedFiles } from '../ui/fileListUI.js';

/**
 * Initialize all UI components in one call
 */
export async function initializeAllUI() {
  try {
    // Load essential modules
    const { initializeUI } = await import('../ui/uiManager.js');
    const { setupSidebarManager } = await import('../ui/sidebarManager.js');
    const { renderCategoryButtons } = await import('../ui/transactionManager.js');

    // Initialize in the proper order
    initializeUI();
    setupSidebarManager();
    renderCategoryButtons();

    console.log("All UI components initialized");
    return true;
  } catch (error) {
    console.error("Error initializing UI:", error);
    return false;
  }
}

/**
 * Initialize theme settings
 */
export function initializeTheme() {
  // Get stored preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Apply to body class
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Immediately update meta theme color
  updateMetaThemeColor(isDarkMode);

  // Update chart theme if Chart.js is loaded
  if (isDarkMode && window.Chart && window.Chart.defaults) {
    updateChartTheme(isDarkMode);
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

/**
 * Updates chart theme colors based on dark mode
 */
function updateChartTheme(isDarkMode) {
  if (window.Chart && window.Chart.defaults) {
    window.Chart.defaults.color = isDarkMode ? "#e0e0e0" : "#666666";
    window.Chart.defaults.borderColor = isDarkMode ? "#444444" : "#dddddd";
  }
}
