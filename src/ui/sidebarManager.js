import { showToast } from './uiManager.js';

// Module variables
let darkModeToggle = null;
let debugModeToggle = null;

/**
 * Sets up the sidebar functionality
 */
export function setupSidebarManager() {
  console.log("Setting up sidebar manager...");

  try {
    // Initialize hamburger menu
    initializeHamburgerMenu();

    // Initialize toggle switches
    initializeToggles();

    // Initialize action buttons
    initializeActionButtons();

    console.log("Sidebar manager setup complete");
  } catch (error) {
    console.error("Error setting up sidebar manager:", error);
  }
}

/**
 * Initialize hamburger menu functionality
 */
function initializeHamburgerMenu() {
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const mainContent = document.getElementById("mainContent");

  if (!hamburgerMenu || !sidebar || !sidebarOverlay) {
    console.warn("Hamburger menu elements not found");
    return;
  }

  // Toggle sidebar on hamburger click
  hamburgerMenu.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");

    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Close sidebar when overlay is clicked
  sidebarOverlay.addEventListener("click", closeSidebar);

  // Close sidebar on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    hamburgerMenu.classList.add("active");
    if (mainContent) {
      mainContent.classList.add("sidebar-open");
    }
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    hamburgerMenu.classList.remove("active");
    if (mainContent) {
      mainContent.classList.remove("sidebar-open");
    }
  }

  console.log("Hamburger menu initialized");
}

/**
 * Initialize toggle switches
 */
function initializeToggles() {
  // Initialize dark mode toggle
  initializeDarkModeToggle();

  // Initialize debug mode toggle
  initializeDebugModeToggle();

  console.log("Toggle switches initialized");
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
  newToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle("debug-mode", isEnabled);
    localStorage.setItem("debugMode", isEnabled);
    updateDebugVisibility(isEnabled);
    console.log(`Debug mode ${isEnabled ? 'enabled' : 'disabled'}`);
  });

  console.log("Debug mode toggle initialized successfully");
}

/**
 * Initialize dark mode toggle
 */
function initializeDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) {
    console.warn("Dark mode toggle element not found");
    return;
  }

  // Get current state from localStorage
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Set initial state
  darkModeToggle.checked = isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Remove any existing event listeners
  const newToggle = darkModeToggle.cloneNode(true);
  darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);

  // Add event listener
  newToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle("dark-mode", isEnabled);
    localStorage.setItem("darkMode", isEnabled);
    console.log(`Dark mode ${isEnabled ? 'enabled' : 'disabled'}`);
  });

  console.log("Dark mode toggle initialized successfully");
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
}

/**
 * Initialize action buttons
 */
function initializeActionButtons() {
  // File upload button
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => {
      import('../ui/fileUpload.js').then(module => {
        if (module.createNewFileInput) {
          const fileInput = module.createNewFileInput();
          if (fileInput) fileInput.click();
        }
      });
    });
  }

  // Show mappings button
  const showMappingsBtn = document.getElementById("showMappingsBtn");
  if (showMappingsBtn) {
    showMappingsBtn.addEventListener("click", _handleShowMappings);
  }

  // Show merged files button
  const showMergedFilesBtn = document.getElementById("showMergedFilesBtn");
  if (showMergedFilesBtn) {
    showMergedFilesBtn.addEventListener("click", _handleShowMergedFiles);
  }

  // Edit categories button
  const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
  if (editCategoriesBtn) {
    editCategoriesBtn.addEventListener("click", _handleEditCategories);
  }

  // Export button
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      import('../exports/exportManager.js').then(module => {
        if (module.exportMergedFilesAsCSV) {
          module.exportMergedFilesAsCSV();
        }
      });
    });
  }

  // Debug buttons
  initializeDebugButtons();

  console.log("Action buttons initialized");
}

/**
 * Initialize debug buttons
 */
function initializeDebugButtons() {
  const debugButtons = [
    {
      id: "debugFilesBtn", handler: () => {
        if (window.debugMergedFiles) {
          window.debugMergedFiles();
        } else {
          console.log("Debug files function not available");
        }
      }
    },
    {
      id: "debugSignaturesBtn", handler: () => {
        if (window.debugSignatures) {
          window.debugSignatures();
        } else {
          console.log("Debug signatures function not available");
        }
      }
    },
    {
      id: "debugTransactionsBtn", handler: () => {
        if (window.inspectTransactionData) {
          window.inspectTransactionData();
        } else {
          console.log("Debug transactions function not available");
        }
      }
    },
    {
      id: "saveLogBtn", handler: () => {
        // Simple log save implementation
        const logs = console.history || [];
        const logData = JSON.stringify(logs, null, 2);
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-log-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    { id: "resetAppBtn", handler: _handleResetApp }
  ];

  debugButtons.forEach(({ id, handler }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", handler);
    }
  });
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
  import("../ui/categoryModal.js").then(module => {
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
 * Handle app reset
 */
function _handleResetApp() {
  if (window.resetApplication) {
    window.resetApplication();
  } else {
    console.log("Reset application function not available");
  }
}
