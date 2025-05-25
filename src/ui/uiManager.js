// Directory: /src/ui/uiManager.js

let activeToast = null;

export function showElement(id) {
  const el = document.getElementById(id);
  if (!el) return console.error(`Element #${id} not found.`);
  el.style.display = 'block';
}

export function hideElement(id) {
  const el = document.getElementById(id);
  if (!el) return console.error(`Element #${id} not found.`);
  el.style.display = 'none';
}

export function clearElement(id) {
  const el = document.getElementById(id);
  if (!el) return console.error(`Element #${id} not found.`);
  el.innerHTML = '';
}

export function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
  showToast(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`, "info");
}

/**
 * Shows a simple toast notification at the top of the screen
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - How long to show the toast (in milliseconds)
 */
export function showToast(message, type = "info", duration = 2000) {
  // Get or create toast container
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Create simple toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  // Add to container
  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Limit number of toasts (keep only 2 most recent)
  const toasts = container.querySelectorAll('.toast');
  if (toasts.length > 2) {
    removeToast(toasts[0]);
  }
}

/**
 * Removes a toast with animation
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;

  // Add removing class for exit animation
  toast.classList.add('removing');

  // Remove after animation completes
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 200);
}

export function handleError(error, userMessage = "An error occurred.") {
  console.error(error);
  showToast(userMessage, "error");
}

export function initializeDragAndDrop(onFileUpload) {
  const dropZone = document.getElementById("fileUploadSection");
  if (!dropZone) return;

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = "#f0f0f0";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.backgroundColor = "white"; // Or initial color
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = "white"; // Or initial color

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Pass the FileList directly to onFileUpload
      onFileUpload({ target: { files: files } });
    }
  });
}

// Add these functions to show loading states



/**
 * Updates UI elements based on debug mode state
 * @param {boolean} isDebugMode - Whether debug mode is enabled
 */
export function updateDebugModeUI(isDebugMode) {
  const debugTools = document.querySelectorAll('.debug-tools');

  debugTools.forEach(tool => {
    tool.style.display = isDebugMode ? 'inline-block' : 'none';
  });

  // Save the debug mode state
  localStorage.setItem('debugMode', isDebugMode);

  // Toggle debug class on body
  document.body.classList.toggle('debug-mode', isDebugMode);

  // Show/hide chart controls based on debug mode
  const chartControls = document.querySelectorAll('.chart-controls');
  chartControls.forEach(control => {
    control.style.display = isDebugMode ? 'inline-block' : 'none';
  });

  console.log(`Debug mode ${isDebugMode ? 'enabled' : 'disabled'}`);
}

/**
 * Initialize all UI components
 */
export function initializeUI() {
  console.log("Initializing UI components...");

  // Initialize sidebar controls first
  initializeSidebarControls();

  // Initialize other UI components
  initializeTooltips();
  initializeResponsiveFeatures();

  console.log("UI components initialized");
}


/**
 * Shows a loading indicator on an element
 * @param {string} elementId - ID of element to show loading on
 * @param {string} message - Optional loading message
 */
export function showLoading(elementId, message = 'Loading...') {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Store original content
  element.dataset.originalContent = element.innerHTML;

  // Create loading indicator
  const loadingHtml = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-message">${message}</div>
    </div>
  `;

  element.innerHTML = loadingHtml;
}

/**
 * Hides the loading indicator and restores original content
 * @param {string} elementId - ID of element with loading indicator
 */
export function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Restore original content if available
  if (element.dataset.originalContent) {
    element.innerHTML = element.dataset.originalContent;
    delete element.dataset.originalContent;
  }
}

/**
 * Shows a loading overlay for the entire page
 * @param {string} message - Loading message to display
 * @returns {Object} Object with a close() method to hide the overlay
 */
export function showPageLoadingOverlay(message = 'Loading...') {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'page-loading-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    flexDirection: 'column'
  });

  // Add spinner and message
  overlay.innerHTML = `
    <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <div style="color: white; margin-top: 15px; font-weight: bold;">${message}</div>
  `;

  // Add keyframe animation for spinner
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Add to document
  document.body.appendChild(overlay);

  // Return object with close method
  return {
    close: function () {
      document.body.removeChild(overlay);
    },
    updateMessage: function (newMessage) {
      overlay.querySelector('div:nth-child(2)').textContent = newMessage;
    }
  };
}


export function updateCurrencyFilters() {
  const chartCurrencySelect = document.getElementById('chartCurrencySelect');
  if (!chartCurrencySelect) return;

  // Clear existing options except "All Currencies"
  const firstOption = chartCurrencySelect.querySelector('option[value="all"]');
  chartCurrencySelect.innerHTML = '';

  if (firstOption) {
    chartCurrencySelect.appendChild(firstOption);
  } else {
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Currencies';
    chartCurrencySelect.appendChild(allOption);
  }

  // Get unique currencies from transactions
  const currencies = new Set();
  if (AppState.transactions) {
    AppState.transactions.forEach(tx => {
      if (tx.currency) {
        currencies.add(tx.currency);
      }
    });
  }

  // Add currency options
  currencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency; // Fixed: This line was causing the error
    option.textContent = currency;
    chartCurrencySelect.appendChild(option);
  });
}

/**
 * Initialize sidebar controls and toggle functionality
 */
function initializeSidebarControls() {
  console.log("Initializing sidebar controls...");

  // Menu button to open sidebar
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  if (menuBtn && sidebar && overlay) {
    // Clean up any existing listeners
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

    newMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Menu button clicked - opening sidebar");
      openSidebar();
    });
  }

  if (closeSidebarBtn) {
    const newCloseBtn = closeSidebarBtn.cloneNode(true);
    closeSidebarBtn.parentNode.replaceChild(newCloseBtn, closeSidebarBtn);

    newCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Close button clicked - closing sidebar");
      closeSidebar();
    });
  }

  if (overlay) {
    const newOverlay = overlay.cloneNode(true);
    overlay.parentNode.replaceChild(newOverlay, overlay);

    newOverlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Overlay clicked - closing sidebar");
      closeSidebar();
    });
  }

  console.log("Sidebar controls initialized");
}

/**
 * Open the sidebar
 */
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebar && overlay) {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    console.log("Sidebar opened");
  }
}

/**
 * Close the sidebar
 */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebar && overlay) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scrolling
    console.log("Sidebar closed");
  }
}

/**
 * Initialize tooltips for UI elements
 */
function initializeTooltips() {
  // Add tooltips to buttons and interactive elements
  const elementsWithTitles = document.querySelectorAll('[title]');

  elementsWithTitles.forEach(element => {
    // Simple tooltip functionality - browser native titles work fine
    // Could be enhanced with custom tooltip library later
    element.addEventListener('mouseenter', function () {
      // Optional: Add custom tooltip styling or behavior
    });
  });

  console.log(`Initialized tooltips for ${elementsWithTitles.length} elements`);
}

/**
 * Initialize responsive features for mobile/tablet support
 */
function initializeResponsiveFeatures() {
  // Handle responsive table scrolling
  initializeResponsiveTables();

  // Handle responsive modal sizing
  initializeResponsiveModals();

  // Handle responsive chart containers
  initializeResponsiveCharts();

  console.log("Responsive features initialized");
}

/**
 * Make tables responsive on smaller screens
 */
function initializeResponsiveTables() {
  const tables = document.querySelectorAll('.transactions-table, .preview-table');

  tables.forEach(table => {
    // Wrap tables in scrollable containers if not already wrapped
    if (!table.closest('.table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      wrapper.style.overflowX = 'auto';
      wrapper.style.marginBottom = '20px';

      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
}

/**
 * Initialize responsive modal behavior
 */
function initializeResponsiveModals() {
  // Listen for window resize to adjust modal sizes
  window.addEventListener('resize', () => {
    const modals = document.querySelectorAll('.modal-content');
    modals.forEach(modal => {
      // Adjust modal width for small screens
      if (window.innerWidth < 768) {
        modal.style.width = '95%';
        modal.style.maxWidth = '95%';
      } else {
        // Reset to original sizing
        modal.style.width = '';
        modal.style.maxWidth = '';
      }
    });
  });
}

/**
 * Initialize responsive chart containers
 */
function initializeResponsiveCharts() {
  // Ensure chart containers are responsive
  const chartContainers = document.querySelectorAll('.chart-wrapper, .charts-container');

  chartContainers.forEach(container => {
    // Add responsive classes if not present
    if (!container.classList.contains('responsive-chart')) {
      container.classList.add('responsive-chart');
    }
  });

  // Handle chart resize on window resize
  window.addEventListener('resize', debounce(() => {
    // Trigger chart resize if Chart.js is available
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    }
  }, 250));
}

/**
 * Debounce utility function for resize events
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
