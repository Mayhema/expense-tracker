// Directory: /src/ui/uiManager.js

let activeToast = null;

export function showElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
}

export function hideElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
}

export function clearElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
}

export function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);

  // Update the toggle icon state
  updateDarkModeToggle(isDarkMode);

  showToast(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`, "info");
}

/**
 * Updates the dark mode toggle icon state
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 */
function updateDarkModeToggle(isDarkMode) {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    const icon = darkModeToggle.querySelector('.toggle-icon');
    if (icon) {
      icon.textContent = isDarkMode ? '🌙' : '☀️';
    }
    darkModeToggle.classList.toggle('active', isDarkMode);
  }
}

/**
 * Shows a simple toast notification at the top of the screen
 */
export function showToast(message, type = 'info', duration = 3000) {
  try {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;

    toastContainer.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('removing');
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);

  } catch (error) {
    console.error('Error showing toast:', error);
    // Fallback to console log
    console.log(`Toast ${type}: ${message}`);
  }
}

/**
 * Creates toast container if it doesn't exist
 */
function createToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Removes a toast with animation
 */
function removeToast(toast) {
  if (!toast || !document.body.contains(toast)) return;

  toast.style.transform = 'translateX(400px)';
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
    if (activeToast === toast) {
      activeToast = null;
    }
  }, 300);
}

export function handleError(error, userMessage = "An error occurred.") {
  console.error(error);
  showToast(userMessage, "error");
}

export function initializeDragAndDrop(onFileUpload) {
  const dropZone = document.body;

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && onFileUpload) {
      onFileUpload({ target: { files } });
    }
  });
}

/**
 * Updates UI elements based on debug mode state
 */
export function updateDebugModeUI(isDebugMode) {
  const debugActions = document.querySelectorAll('.debug-action');
  debugActions.forEach(action => {
    action.style.display = isDebugMode ? 'flex' : 'none';
  });

  // Save the debug mode state
  localStorage.setItem('debugMode', isDebugMode);

  // Update the toggle icon state
  updateDebugModeToggle(isDebugMode);
}

/**
 * Updates the debug mode toggle icon state
 */
function updateDebugModeToggle(isDebugMode) {
  const debugToggle = document.getElementById('debugToggle');
  if (debugToggle) {
    const icon = debugToggle.querySelector('.toggle-icon');
    if (icon) {
      icon.textContent = isDebugMode ? '🐛' : '🔧';
    }
    debugToggle.classList.toggle('active', isDebugMode);
  }

  // Update debug mode UI elements
  document.body.classList.toggle('debug-mode', isDebugMode);
  localStorage.setItem('debugMode', isDebugMode);

  console.log(`Debug mode ${isDebugMode ? 'enabled' : 'disabled'}`);
}

/**
 * Initialize all UI components
 */
export function initializeUI() {
  console.log('Initializing UI components...');

  try {
    // Set up sidebar functionality
    setupSidebar();

    // Set up all UI event listeners
    setupUIEventListeners();

    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
    updateDarkModeToggle(savedDarkMode);

    // Initialize debug mode from localStorage
    const savedDebugMode = localStorage.getItem('debugMode') === 'true';
    updateDebugModeUI(savedDebugMode);

    // Initialize dark mode toggle functionality
    initializeDarkModeToggle();

    // Initialize debug action buttons
    initializeDebugActionButtons();

    console.log('UI components initialized successfully');
  } catch (error) {
    console.error('Error initializing UI components:', error);
  }
}

/**
 * Shows a loading indicator on an element
 */
export function showLoading(elementId, message = 'Loading...') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const originalContent = element.innerHTML;
  element.dataset.originalContent = originalContent;

  element.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <span>${message}</span>
    </div>
  `;
}

/**
 * Hides the loading indicator and restores original content
 */
export function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const originalContent = element.dataset.originalContent;
  if (originalContent) {
    element.innerHTML = originalContent;
    delete element.dataset.originalContent;
  }
}

/**
 * Shows a loading overlay for the entire page
 */
export function showPageLoadingOverlay(message = 'Loading...') {
  const overlay = document.createElement('div');
  overlay.className = 'page-loading-overlay';
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(overlay);

  return {
    close: () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }
  };
}

/**
 * Shows chart loading with blink effect
 */
export function showChartLoading(elementId, message = 'Loading chart...') {
  const element = document.getElementById(elementId);
  if (!element) return;

  // FIXED: Store original content more carefully
  if (!element.dataset.originalContent) {
    element.dataset.originalContent = element.innerHTML;
  }

  // FIXED: Add loading with blink effect while preserving chart structure
  const originalContent = element.innerHTML;
  element.innerHTML = `
    <div class="chart-loading-overlay" style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 1000;
      animation: chartLoadingBlink 1.5s ease-in-out infinite;
      border-radius: 8px;
    ">
      <div class="chart-loading-spinner" style="
        width: 40px;
        height: 40px;
        border: 4px solid #e3e3e3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      "></div>
      <div class="chart-loading-text" style="
        color: #667eea;
        font-weight: 600;
        font-size: 0.9rem;
        text-align: center;
        animation: chartTextPulse 2s ease-in-out infinite;
      ">${message}</div>
    </div>
    ${originalContent}
    <style>
      @keyframes chartLoadingBlink {
        0%, 100% { opacity: 0.8; background-color: rgba(255, 255, 255, 0.8); }
        50% { opacity: 1; background-color: rgba(102, 126, 234, 0.1); }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes chartTextPulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    </style>
  `;

  // FIXED: Ensure wrapper is positioned relative for overlay
  element.style.position = 'relative';
}

/**
 * Hides chart loading and restores original content
 */
export function hideChartLoading(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // FIXED: Remove only the loading overlay, preserve chart content
  const overlay = element.querySelector('.chart-loading-overlay');
  if (overlay) {
    overlay.remove();
  }

  // FIXED: Don't restore original content, just ensure visibility
  element.style.visibility = 'visible';
  element.style.display = 'block';
}

/**
 * Set up sidebar functionality
 */
function setupSidebar() {
  // Import and initialize sidebar manager
  import('./sidebarManager.js').then(module => {
    if (module.setupSidebarManager) {
      module.setupSidebarManager();
    }
  }).catch(error => {
    console.error('Error loading sidebar manager:', error);
  });
}

/**
 * Set up all UI event listeners
 */
function setupUIEventListeners() {
  // Remove this hamburger menu setup - it's handled in sidebarManager
  console.log('UI event listeners set up');
}

/**
 * Initialize theme based on saved preferences
 */
export function initializeTheme() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
}

/**
 * Hide element utility (overloaded to accept element object or id string)
 */
export function hideElementByObject(element) {
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * Show element utility (overloaded to accept element object or id string)
 */
export function showElementByObject(element) {
  if (element) {
    element.style.display = 'block';
  }
}

/**
 * Initialize debug action buttons
 */
function initializeDebugActionButtons() {
  const clearDataBtn = document.getElementById('clearDataBtn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      if (confirm('This will clear all your data. Are you sure?')) {
        try {
          // FIXED: Ensure default categories are loaded after clearing data
          localStorage.clear();

          // Initialize default categories immediately
          import('../constants/categories.js').then(categoriesModule => {
            import('../core/appState.js').then(appStateModule => {
              appStateModule.AppState.categories = { ...categoriesModule.DEFAULT_CATEGORIES };
              localStorage.setItem('categories', JSON.stringify(appStateModule.AppState.categories));
              console.log('Clear Data: Restored default categories');
              location.reload();
            });
          });
        } catch (error) {
          console.error('Error clearing data:', error);
          showToast('Error clearing data', 'error');
        }
      }
    });
  }

  const exportDebugBtn = document.getElementById('exportDebugBtn');
  if (exportDebugBtn) {
    exportDebugBtn.addEventListener('click', () => {
      try {
        const debugData = {
          localStorage: { ...localStorage },
          appState: window.AppState || {},
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };

        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-tracker-debug-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('Debug data exported', 'success');
      } catch (error) {
        console.error('Error exporting debug data:', error);
        showToast('Error exporting debug data', 'error');
      }
    });
  }
}

/**
 * Initialize dark mode toggle functionality
 */
function initializeDarkModeToggle() {
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (!darkModeToggle) {
    console.warn("Dark mode toggle not found");
    return;
  }

  // Set initial state
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  darkModeToggle.checked = isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);

  // Add event listener
  darkModeToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle('dark-mode', isEnabled);
    localStorage.setItem('darkMode', isEnabled.toString());

    // Show toast notification
    showToast(`Dark mode ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
  });

  console.log("Dark mode toggle initialized successfully");
}

/**
 * Toggle debug mode
 */
function toggleDebugMode() {
  const currentDebugMode = localStorage.getItem('debugMode') === 'true';
  const newDebugMode = !currentDebugMode;

  updateDebugModeUI(newDebugMode);
  showToast(`Debug mode ${newDebugMode ? "enabled" : "disabled"}`, "info");

  console.log(`Debug mode toggled: ${newDebugMode}`);
}

/**
 * Updates UI elements based on debug mode state
 */
export function updateDebugVisibility(isDebugMode) {
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

  // Update console logs button visibility
  const saveButton = document.querySelector('button[onclick*="saveLogs"]');
  if (saveButton) {
    saveButton.style.display = isDebugMode ? 'block' : 'none';
  }

  console.log(`Debug visibility updated: ${isDebugMode ? 'shown' : 'hidden'} for ${debugElements.length} elements`);
}
