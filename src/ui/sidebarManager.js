import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";

/**
 * Initializes the sidebar functionality
 */
export function initializeSidebar() {
  const menuBtn = document.getElementById("menuBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const debugModeToggle = document.getElementById("debugModeToggle");

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

  // Setup dark mode toggle
  if (darkModeToggle) {
    // Set initial state
    darkModeToggle.checked = document.body.classList.contains("dark-mode");

    // Add event listener
    darkModeToggle.addEventListener("change", () => {
      toggleDarkMode();
    });
  }

  // Setup debug mode toggle
  if (debugModeToggle) {
    // Set initial state from localStorage
    const isDebugMode = localStorage.getItem("debugMode") === "true";
    debugModeToggle.checked = isDebugMode;
    document.body.classList.toggle("debug-mode", isDebugMode);

    // Add event listener
    debugModeToggle.addEventListener("change", () => {
      const isDebugModeEnabled = debugModeToggle.checked;
      document.body.classList.toggle("debug-mode", isDebugModeEnabled);
      localStorage.setItem("debugMode", isDebugModeEnabled);
      showToast(`Debug mode ${isDebugModeEnabled ? "enabled" : "disabled"}`, "info");
    });
  }
}

/**
 * Toggles dark mode on/off
 */
export function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);

  // Update toggle in sidebar if it exists
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
  }

  AppState.isDarkMode = isDarkMode;
  showToast(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`, "info");
}
