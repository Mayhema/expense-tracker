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

export function showToast(message, type = "info") {
  if (activeToast) {
    activeToast.remove(); // Remove any existing toast
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    background: type === "error" ? "#e74c3c" : "#333",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "6px",
    zIndex: 9999,
    fontSize: "16px",
    opacity: 0.95,
  });

  document.body.appendChild(toast);
  activeToast = toast;

  setTimeout(() => {
    toast.remove();
    activeToast = null;
  }, 3500);
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
    dropZone.style.backgroundColor = "white";
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = "white";

    const file = event.dataTransfer.files[0];
    if (file) {
      onFileUpload({ target: { files: [file] } });
    }
  });
}

// Add these functions to show loading states

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

/**
 * Initializes UI components that don't have their own initialization functions
 */
export function initializeUI() {
  console.log("Initializing UI components...");

  // Initialize toast container if it doesn't exist
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1000";
    document.body.appendChild(container);
  }

  // Initialize any other UI elements that don't have dedicated init functions
  setupUIEventListeners();
}

/**
 * Sets up event listeners for UI components
 */
function setupUIEventListeners() {
  // Set up click handlers for collapsible sections
  document.querySelectorAll('.section-header[data-toggle]').forEach(header => {
    header.addEventListener('click', function () {
      const targetId = this.getAttribute('data-toggle');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const isVisible = targetElement.style.display !== 'none';
        targetElement.style.display = isVisible ? 'none' : 'block';

        // Update toggle icon if present
        const toggleIcon = this.querySelector('.toggle-icon');
        if (toggleIcon) {
          toggleIcon.textContent = isVisible ? '▼' : '▲';
        }
      }
    });
  });
}
