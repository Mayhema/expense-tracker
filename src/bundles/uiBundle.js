/**
 * UI Bundle - Consolidates all UI-related functionality
 * This reduces the number of separate HTTP requests
 */

// Import the new revertTransaction functionality
import '../ui/revertTransaction.js';

// Re-export UI functionality - no CSS imports
export { initializeUI, showToast, hideElement, showElement } from '../ui/uiManager.js';
export { setupSidebarManager } from '../ui/sidebarManager.js';
export {
  updateTransactions,
  renderTransactions,
  renderCategoryButtons
} from '../ui/transactionManager.js';
export { showModal, closeAllModals } from '../ui/modalManager.js';
export { revertTransaction } from '../ui/revertTransaction.js';

// Re-export file handling UI
export {
  onFileUpload,
  clearPreview,
  createNewFileInput,
  onSaveHeaders
} from '../ui/fileUpload.js';
export { renderHeaderPreview, suggestMapping, updateHeaderMapping } from '../ui/headerMapping.js';
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
 * Initialize theme settings - uses CSS classes defined in styles folder
 */
export function initializeTheme() {
  // Get stored preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Apply to body class - CSS is defined in styles/dark-theme.css
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Update chart theme if Chart.js is loaded
  if (isDarkMode && window.Chart && window.Chart.defaults) {
    updateChartTheme(isDarkMode);
  }

  console.log(`Theme initialized: ${isDarkMode ? "dark" : "light"} mode`);
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

// Global UI utilities
export const UIUtils = {
  /**
   * Show a modal with enhanced configuration
   */
  showEnhancedModal: (config) => {
    return showModal({
      ...config,
      className: `enhanced-modal ${config.className || ''}`,
      closeOnClickOutside: config.closeOnClickOutside !== false
    });
  },

  /**
   * Close all modals safely
   */
  closeAllModals: () => {
    try {
      closeAllModals();
    } catch (error) {
      console.error("Error closing modals:", error);
    }
  },

  /**
   * Show success toast
   */
  showSuccess: (message) => {
    showToast(message, "success");
  },

  /**
   * Show error toast
   */
  showError: (message) => {
    showToast(message, "error");
  },

  /**
   * Show warning toast
   */
  showWarning: (message) => {
    showToast(message, "warning");
  }
};
