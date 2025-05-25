import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";

// --- Module-level Helper Functions ---

/**
 * Updates chart theme colors based on dark mode state
 */
function _updateChartTheme(isDarkMode) {
  const textColor = isDarkMode ? '#e0e0e0' : '#666666';
  const gridColor = isDarkMode ? '#444444' : '#dddddd';

  if (window.Chart && window.Chart.defaults) {
    window.Chart.defaults.color = textColor;
    window.Chart.defaults.borderColor = gridColor;

    if (window.Chart.defaults.scales) {
      window.Chart.defaults.scales.x = window.Chart.defaults.scales.x || {};
      window.Chart.defaults.scales.y = window.Chart.defaults.scales.y || {};

      window.Chart.defaults.scales.x.grid = { color: gridColor, borderColor: gridColor };
      window.Chart.defaults.scales.y.grid = { color: gridColor, borderColor: gridColor };

      if (typeof window.updateChartsWithCurrentData === 'function') {
        setTimeout(window.updateChartsWithCurrentData, 100);
      }
    }
  }
  // Initial call to refresh toggles related to chart theming (if any)
  // This was previously in a window.load event, ensuring it runs after setup
  setTimeout(_refreshToggleSwitches, 500);
}

/**
 * Refresh function for toggle switches
 */
function _refreshToggleSwitches() {
  // This function was originally meant to refresh toggle switch states
  // The setup functions are handled by _initializeToggles() instead
  console.log("Sidebar: Toggle switches refreshed");

  // Optionally verify toggle states are correct
  const darkModeToggle = document.getElementById("darkModeToggle");
  const debugModeToggle = document.getElementById("debugModeToggle");

  if (darkModeToggle) {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (darkModeToggle.checked !== isDarkMode) {
      darkModeToggle.checked = isDarkMode;
      document.body.classList.toggle("dark-mode", isDarkMode);
    }
  }

  if (debugModeToggle) {
    const isDebugMode = localStorage.getItem("debugMode") === "true";
    if (debugModeToggle.checked !== isDebugMode) {
      debugModeToggle.checked = isDebugMode;
      document.body.classList.toggle("debug-mode", isDebugMode);
      updateDebugVisibility(isDebugMode);
    }
  }
}

/**
 * Initialize AppState for dark mode
 */
function _initializeAppStateForDarkMode(isDarkMode) {
  try {
    if (typeof AppState !== 'undefined' && AppState !== null) {
      AppState.isDarkMode = isDarkMode;
    } else {
      import("../core/appState.js").then(module => {
        if (module.AppState) {
          module.AppState.isDarkMode = isDarkMode;
        }
      }).catch(err => {
        console.warn("AppState not available yet for dark mode init", err);
      });
    }
  } catch (err) {
    console.warn("AppState not available yet, dark mode state will be set later (init)", err);
  }
}

/**
 * Update AppState for dark mode
 */
function _updateAppStateForDarkMode(newState) {
  try {
    if (typeof AppState !== 'undefined' && AppState !== null) {
      AppState.isDarkMode = newState;
    } else {
      import("../core/appState.js").then(module => {
        if (module.AppState) {
          module.AppState.isDarkMode = newState;
        }
      }).catch(err => {
        console.warn("Could not update AppState with dark mode setting", err);
      });
    }
  } catch (err) {
    console.warn("Could not update AppState with dark mode setting:", err.message, err);
  }
}

/**
 * Handle dark mode toggle change
 */
function handleDarkModeChange(event) {
  const newState = event.target.checked;
  console.log(`Dark mode toggle clicked, new state: ${newState}`);

  // Apply dark mode immediately with force
  document.body.classList.remove("dark-mode");
  if (newState) {
    document.body.classList.add("dark-mode");
  }

  // Force a reflow to ensure styles are applied
  document.body.offsetHeight;

  // Save to localStorage
  localStorage.setItem("darkMode", newState.toString());

  // Update AppState
  _updateAppStateForDarkMode(newState);

  // Show feedback
  showToast(`Dark mode ${newState ? "enabled" : "disabled"}`, "info");

  // Update chart theme
  _updateChartTheme(newState);

  // Force re-render of any dynamic content
  setTimeout(() => {
    // Trigger a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: { isDarkMode: newState } }));
  }, 100);

  // Log for debugging
  console.log('Body classes after dark mode change:', document.body.className);
}

/**
 * Handle debug mode toggle change
 */
function handleDebugModeChange(event) {
  const newState = event.target.checked;
  console.log(`Debug mode toggle clicked, new state: ${newState}`);

  // Apply debug mode immediately with force
  document.body.classList.remove("debug-mode");
  if (newState) {
    document.body.classList.add("debug-mode");
  }

  // Force a reflow to ensure styles are applied
  document.body.offsetHeight;

  // Save to localStorage
  localStorage.setItem("debugMode", newState.toString());

  // Show feedback
  showToast(`Debug mode ${newState ? "enabled" : "disabled"}`, "info");

  // Update debug element visibility with force
  updateDebugVisibility(newState);

  // Log for debugging
  console.log('Body classes after debug mode change:', document.body.className);
}

/**
 * Initializes toggle switches with proper event listeners
 */
function _initializeToggles() {
  console.log("Initializing sidebar toggles...");

  // Wait a bit to ensure DOM is ready
  setTimeout(() => {
    initializeDarkModeToggle();
    initializeDebugModeToggle();
  }, 100);
}

/**
 * Initialize dark mode toggle with proper event handling
 */
function initializeDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) {
    console.warn("Dark mode toggle element not found");
    return;
  }

  // Get current state from localStorage
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Set initial state immediately
  darkModeToggle.checked = isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  _initializeAppStateForDarkMode(isDarkMode);

  // Remove any existing event listeners
  const newToggle = darkModeToggle.cloneNode(true);
  darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);

  // Add the event listener
  newToggle.addEventListener('change', handleDarkModeChange);

  // Make the entire toggle area clickable
  const toggleContainer = newToggle.closest('.toggle-switch');
  if (toggleContainer) {
    toggleContainer.addEventListener('click', function (e) {
      if (e.target !== newToggle) {
        e.preventDefault();
        newToggle.checked = !newToggle.checked;
        newToggle.dispatchEvent(new Event('change'));
      }
    });
  }

  console.log("Dark mode toggle initialized successfully");
}

/**
 * Initialize debug mode toggle with proper event handling
 */
function initializeDebugModeToggle() {
  const debugModeToggle = document.getElementById("debugModeToggle");
  if (!debugModeToggle) {
    console.warn("Debug mode toggle element not found");
    return;
  }

  // Get current state from localStorage
  const isDebugMode = localStorage.getItem("debugMode") === "true";

  // Set initial state immediately
  debugModeToggle.checked = isDebugMode;
  document.body.classList.toggle("debug-mode", isDebugMode);
  updateDebugVisibility(isDebugMode);

  // Remove any existing event listeners
  const newToggle = debugModeToggle.cloneNode(true);
  debugModeToggle.parentNode.replaceChild(newToggle, debugModeToggle);

  // Add the event listener
  newToggle.addEventListener('change', handleDebugModeChange);

  // Make the entire toggle area clickable
  const toggleContainer = newToggle.closest('.toggle-switch');
  if (toggleContainer) {
    toggleContainer.addEventListener('click', function (e) {
      if (e.target !== newToggle) {
        e.preventDefault();
        newToggle.checked = !newToggle.checked;
        newToggle.dispatchEvent(new Event('change'));
      }
    });
  }

  console.log("Debug mode toggle initialized successfully");
}

/**
 * Updates debug element visibility based on debug mode state
 */
function updateDebugVisibility(isDebugMode) {
  const debugElements = document.querySelectorAll('.debug-only');
  console.log(`Found ${debugElements.length} debug elements to ${isDebugMode ? 'show' : 'hide'}`);

  debugElements.forEach(element => {
    if (isDebugMode) {
      // Show the element with proper display type
      if (element.classList.contains('inline-element')) {
        element.style.display = 'inline-block';
      } else if (element.classList.contains('flex-element')) {
        element.style.display = 'flex';
      } else {
        element.style.display = 'block';
      }
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    } else {
      // Hide the element
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.style.opacity = '0';
    }
  });

  // Ensure body class is correctly set
  document.body.classList.toggle('debug-mode', isDebugMode);

  console.log(`Debug visibility updated: ${isDebugMode ? 'shown' : 'hidden'} for ${debugElements.length} elements`);
  console.log('Body classes:', document.body.className);
}

/**
 * Show mappings manager modal
 */
function _handleShowMappings() {
  import("../mappings/mappingsManager.js").then(module => {
    if (typeof module.showMappingsModal === 'function') {
      module.showMappingsModal();
    } else {
      showToast("Mappings manager not available", "error");
    }
  }).catch(err => {
    console.error("Error loading mappings manager:", err);
    showToast("Error opening mappings manager.", "error");
  });
}

/**
 * Show merged files manager modal
 */
function _handleShowMergedFiles() {
  import("../ui/fileListUI.js").then(module => {
    if (typeof module.showMergedFilesModal === 'function') {
      module.showMergedFilesModal();
    } else {
      showToast("File list manager not available", "error");
    }
  }).catch(err => {
    console.error("Error loading file list UI:", err);
    showToast("Error opening file list manager.", "error");
  });
}

/**
 * Show category manager modal
 */
function _handleEditCategories() {
  import("../ui/categoryManager.js").then(module => {
    if (typeof module.showCategoryManagerModal === 'function') {
      module.showCategoryManagerModal();
    } else {
      showToast("Category manager not available", "error");
    }
  }).catch(err => {
    console.error("Error loading category manager:", err);
    showToast("Error opening category manager.", "error");
  });
}

/**
 * Utility to add a click listener to a button, replacing the button to ensure clean listeners.
 * @param {string} buttonId - The ID of the button.
 * @param {Function} handlerFn - The function to call on click.
 */
function _addCleanButtonListener(buttonId, handlerFn) {
  const button = document.getElementById(buttonId);
  if (!button) {
    console.warn(`Button with ID '${buttonId}' not found.`);
    return;
  }

  const newButton = button.cloneNode(true); // Clone to remove old listeners
  if (button.parentNode) {
    button.parentNode.replaceChild(newButton, button);
  }

  newButton.addEventListener('click', handlerFn);
}

/**
 * Initialize hamburger menu functionality
 */
function initializeHamburgerMenu() {
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');

  if (!hamburgerMenu || !sidebar || !sidebarOverlay || !mainContent) {
    console.warn("Hamburger menu elements not found");
    return;
  }

  // Toggle sidebar
  function toggleSidebar() {
    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // Open sidebar
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    hamburgerMenu.classList.add('active');
    mainContent.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  // Close sidebar
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    hamburgerMenu.classList.remove('active');
    mainContent.classList.remove('sidebar-open');
    document.body.style.overflow = ''; // Restore scrolling
  }

  // Event listeners
  hamburgerMenu.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Close sidebar when clicking on action buttons
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('.action-button') || e.target.closest('.debug-action-button')) {
      setTimeout(closeSidebar, 100); // Small delay to allow button action
    }
  });

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  console.log("Hamburger menu initialized");
}

/**
 * Public API for the sidebar manager module
 */
export function setupSidebarManager() {
  console.log("Setting up sidebar manager...");

  // Initialize hamburger menu first
  initializeHamburgerMenu();

  _initializeToggles();

  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    // Clean button listeners for main actions
    _addCleanButtonListener("fileUploadBtn", _handleFileUpload);
    _addCleanButtonListener("showMappingsBtn", _handleShowMappings);
    _addCleanButtonListener("showMergedFilesBtn", _handleShowMergedFiles);
    _addCleanButtonListener("editCategoriesSidebarBtn", _handleEditCategories);
    _addCleanButtonListener("exportBtn", _handleExport);

    // Debug button listeners
    _addCleanButtonListener("debugFilesBtn", _handleDebugFiles);
    _addCleanButtonListener("debugSignaturesBtn", _handleDebugSignatures);
    _addCleanButtonListener("debugTransactionsBtn", _handleDebugTransactions);
    _addCleanButtonListener("saveLogBtn", _handleSaveLog);
    _addCleanButtonListener("resetAppBtn", _handleResetApp);

    // Chart toggle listeners
    initializeChartToggles();

    console.log("Sidebar manager setup complete");
  }, 200);
}

/**
 * Handle file upload button click
 */
function _handleFileUpload() {
  // Trigger the file upload functionality
  import("../ui/fileUpload.js").then(module => {
    if (typeof module.createNewFileInput === 'function') {
      const input = module.createNewFileInput();
      if (input) {
        input.click();
      }
    } else {
      showToast("File upload not available", "error");
    }
  }).catch(err => {
    console.error("Error loading file upload:", err);
    showToast("Error opening file upload.", "error");
  });
}

/**
 * Initialize chart toggle functionality
 */
function initializeChartToggles() {
  const chartToggles = document.querySelectorAll('.chart-toggle-btn');

  chartToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      const chartId = this.dataset.chart;
      const isActive = this.classList.contains('active');

      // Toggle active state
      this.classList.toggle('active');

      // Show/hide chart wrapper
      const wrapper = document.getElementById(chartId + 'Wrapper');
      if (wrapper) {
        wrapper.style.display = isActive ? 'none' : 'flex';
      }

      showToast(`${chartId} chart ${isActive ? 'hidden' : 'shown'}`, "info");
    });
  });
}

/**
 * Handle export button click
 */
function _handleExport() {
  import("../exports/exportManager.js").then(module => {
    if (typeof module.exportMergedFilesAsCSV === 'function') {
      module.exportMergedFilesAsCSV();
    } else {
      showToast("Export manager not available", "error");
    }
  }).catch(err => {
    console.error("Error loading export manager:", err);
    showToast("Error opening export manager.", "error");
  });
}

/**
 * Handle debug files button
 */
function _handleDebugFiles() {
  import("../utils/debug.js").then(module => {
    if (typeof module.debugMergedFiles === 'function') {
      module.debugMergedFiles();
    } else {
      showToast("Debug files function not available", "error");
    }
  }).catch(err => {
    console.error("Error loading debug files:", err);
    showToast("Error opening debug files.", "error");
  });
}

/**
 * Handle debug signatures button
 */
function _handleDebugSignatures() {
  import("../utils/debug.js").then(module => {
    if (typeof module.debugSignatures === 'function') {
      module.debugSignatures();
    } else {
      showToast("Debug signatures function not available", "error");
    }
  }).catch(err => {
    console.error("Error loading debug signatures:", err);
    showToast("Error opening debug signatures.", "error");
  });
}

/**
 * Handle debug transactions button
 */
function _handleDebugTransactions() {
  import("../utils/debug.js").then(module => {
    if (typeof module.inspectTransactionData === 'function') {
      module.inspectTransactionData();
    } else {
      showToast("Debug transactions function not available", "error");
    }
  }).catch(err => {
    console.error("Error loading debug transactions:", err);
    showToast("Error opening debug transactions.", "error");
  });
}

/**
 * Handle save log button - Enhanced with console capture
 */
function _handleSaveLog() {
  // Capture console history if available
  const consoleHistory = window.consoleHistory || [];

  // Get current console state
  const currentLogs = {
    info: [],
    warn: [],
    error: [],
    log: []
  };

  // If we have console history, use it
  if (consoleHistory.length > 0) {
    consoleHistory.forEach(entry => {
      if (currentLogs[entry.level]) {
        currentLogs[entry.level].push({
          timestamp: entry.timestamp,
          message: entry.message,
          args: entry.args
        });
      }
    });
  }

  // Export comprehensive debug info
  const logs = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    consoleHistory: currentLogs,
    appState: {
      transactionCount: AppState.transactions?.length || 0,
      mergedFilesCount: AppState.mergedFiles?.length || 0,
      categoryCount: Object.keys(AppState.categories || {}).length,
      isDarkMode: AppState.isDarkMode,
      categories: Object.keys(AppState.categories || {}),
      currencies: [...new Set((AppState.transactions || []).map(t => t.currency).filter(Boolean))]
    },
    localStorage: {
      darkMode: localStorage.getItem("darkMode"),
      debugMode: localStorage.getItem("debugMode"),
      expenseCategories: localStorage.getItem("expenseCategories") ? "exists" : "missing",
      transactions: localStorage.getItem("transactions") ? "exists" : "missing",
      mergedFiles: localStorage.getItem("mergedFiles") ? "exists" : "missing",
      fileFormatMappings: localStorage.getItem("fileFormatMappings") ? "exists" : "missing"
    },
    recentErrors: window.recentErrors || [],
    performanceMetrics: {
      loadTime: performance.now(),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : "not available"
    }
  };

  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast("Debug log with console history exported", "success");
}

/**
 * Handle reset app button
 */
function _handleResetApp() {
  import("../utils/debug.js").then(module => {
    if (typeof module.resetApplication === 'function') {
      module.resetApplication();
    } else {
      showToast("Reset function not available", "error");
    }
  }).catch(err => {
    console.error("Error loading reset function:", err);
    showToast("Error accessing reset function.", "error");
  });
}
