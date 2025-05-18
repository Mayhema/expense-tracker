import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";

/**
 * Initializes the sidebar functionality
 */
export function initializeSidebar() {
  console.log("Initializing sidebar components...");

  const menuBtn = document.getElementById("menuBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  // Initialize toggle button handlers
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("active");
    });
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }

  // Initialize toggle switches immediately, not with a delay
  initializeToggles();

  // Also add window resize handler to fix any visibility issues
  window.addEventListener('resize', () => {
    setTimeout(refreshToggleSwitches, 100);
  });
}

/**
 * Initialize toggle switches with proper event listeners
 */
function initializeToggles() {
  console.log("Initializing sidebar toggles...");

  // Use direct event binding approach for maximum compatibility
  setupDarkModeToggle();
  setupDebugModeToggle();

  // Apply CSS fixes for toggle switches
  applyToggleSwitchFixes();
}

function setupDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) {
    console.warn("Dark mode toggle element not found");
    return;
  }

  console.log("Setting up dark mode toggle");

  // Set initial state
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  darkModeToggle.checked = isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Check if AppState is available before accessing it
  if (typeof AppState !== 'undefined' && AppState !== null) {
    AppState.isDarkMode = isDarkMode;
  } else {
    console.warn("AppState not available yet, dark mode state will be set later");
  }

  // Clean up any existing event handlers
  darkModeToggle.onclick = null;

  // Use a simple click handler instead of change event
  darkModeToggle.onclick = function () {
    const newState = this.checked;
    console.log(`Dark mode toggle clicked, new state: ${newState}`);
    document.body.classList.toggle("dark-mode", newState);
    localStorage.setItem("darkMode", newState);

    // FIXED: Add safety check when setting AppState values
    try {
      if (typeof AppState !== 'undefined') {
        AppState.isDarkMode = newState;
      }
    } catch (err) {
      console.warn("Could not update AppState with dark mode setting:", err.message);
      // Log the full error for debugging purposes
      console.error(err);
    }

    showToast(`Dark mode ${newState ? "enabled" : "disabled"}`, "info");

    // Update theme for charts
    updateChartTheme(newState);
  };

  console.log("Dark mode toggle setup complete");
}

function setupDebugModeToggle() {
  const debugModeToggle = document.getElementById("debugModeToggle");
  if (!debugModeToggle) {
    console.warn("Debug mode toggle element not found");
    return;
  }

  console.log("Setting up debug mode toggle");

  // Set initial state
  const isDebugMode = localStorage.getItem("debugMode") === "true";
  debugModeToggle.checked = isDebugMode;
  document.body.classList.toggle("debug-mode", isDebugMode);
  updateDebugElementsVisibility(isDebugMode);

  // Clean up any existing event handlers
  debugModeToggle.onclick = null;

  // Use a simple click handler
  debugModeToggle.onclick = function () {
    const newState = this.checked;
    console.log(`Debug mode toggle clicked, new state: ${newState}`);
    document.body.classList.toggle("debug-mode", newState);
    localStorage.setItem("debugMode", newState);
    updateDebugElementsVisibility(newState);
    showToast(`Debug mode ${newState ? "enabled" : "disabled"}`, "info");
  };

  console.log("Debug mode toggle setup complete");
}

/**
 * Updates visibility of debug-only elements
 * @param {boolean} isDebugMode - Whether debug mode is enabled
 */
function updateDebugElementsVisibility(isDebugMode) {
  document.querySelectorAll('.debug-only').forEach(element => {
    element.style.display = isDebugMode ? 'block' : 'none';
  });

  // Also update any elements with the debug-tools class
  document.querySelectorAll('.debug-tools').forEach(element => {
    element.style.display = isDebugMode ? 'block' : 'none';
  });
}

/**
 * Fix CSS issues with toggle switches
 */
function applyToggleSwitchFixes() {
  // Add a style element to ensure toggle switches are clickable
  const styleElement = document.createElement('style');

  styleElement.textContent = `
    /* Fix z-index issues with switches */
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
      user-select: none;
    }

    /* Ensure input is positioned correctly and clickable */
    .switch input[type="checkbox"] {
      opacity: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      margin: 0;
      cursor: pointer;
      z-index: 10;
    }

    /* Adjust slider styles */
    .slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      border-radius: 34px;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      border-radius: 50%;
      transition: .4s;
    }

    input:checked + .slider {
      background-color: #4CAF50;
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #4CAF50;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }
  `;

  document.head.appendChild(styleElement);
}

// Refresh function for toggle switches
function refreshToggleSwitches() {
  setupDarkModeToggle();
  setupDebugModeToggle();
}

/**
 * Toggles dark mode on/off with improved implementation
 */
export function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);

  // Update chart theme
  updateChartTheme(isDarkMode);

  // Update sidebar toggle state
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
  }

  // Update AppState
  if (window.AppState) window.AppState.isDarkMode = isDarkMode;

  // Show toast
  showToast(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`, "info");
}

/**
 * Updates chart theme colors based on dark mode state
 */
function updateChartTheme(isDarkMode) {
  // Default colors for charts
  const textColor = isDarkMode ? '#e0e0e0' : '#666666';
  const gridColor = isDarkMode ? '#444444' : '#dddddd';

  // Apply to Chart.js defaults
  if (window.Chart && window.Chart.defaults) {
    // Update global chart options
    window.Chart.defaults.color = textColor;
    window.Chart.defaults.borderColor = gridColor;

    // Update scales
    if (window.Chart.defaults.scales) {
      window.Chart.defaults.scales.x = window.Chart.defaults.scales.x || {};
      window.Chart.defaults.scales.y = window.Chart.defaults.scales.y || {};

      window.Chart.defaults.scales.x.grid = {
        color: gridColor,
        borderColor: gridColor
      };
      window.Chart.defaults.scales.y.grid = {
        color: gridColor,
        borderColor: gridColor
      };
    }

    // Trigger chart updates if they exist
    if (typeof window.updateChartsWithCurrentData === 'function') {
      setTimeout(window.updateChartsWithCurrentData, 100);
    }
  }
}

// Initialize on script load
window.addEventListener('load', () => {
  console.log("Window loaded, ensuring toggle switches are working");
  // Add delay to ensure AppState is loaded
  setTimeout(refreshToggleSwitches, 500);
});
