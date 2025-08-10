// Enhanced existing debug functionality
export function initializeDebugMode() {
  const debugToggle = document.getElementById("debugModeToggle");

  if (debugToggle) {
    // Load saved debug state
    const savedDebugMode = localStorage.getItem("debugMode") === "true";
    debugToggle.checked = savedDebugMode;
    applyDebugMode(savedDebugMode);

    debugToggle.addEventListener("change", (e) => {
      const isDebugMode = e.target.checked;
      localStorage.setItem("debugMode", isDebugMode);
      applyDebugMode(isDebugMode);
    });
  }
}

function applyDebugMode(enabled) {
  if (enabled) {
    document.body.classList.add("debug-mode");
    console.log("🐛 Debug mode: ENABLED");
  } else {
    document.body.classList.remove("debug-mode");
    console.log("🐛 Debug mode: DISABLED");
  }
}

// Export existing debug functions
export {
  debugFiles,
  debugSignatures,
  debugTransactions,
  saveDebugLog,
  resetApplication,
} from "./existing-debug-functions.js";
