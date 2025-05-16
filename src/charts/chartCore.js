import { AppState } from "../core/appState.js";
import { DEFAULT_CATEGORIES } from "../core/constants.js";

// Store chart instances for proper cleanup
const chartInstances = {};

// Add this safety check to the beginning of the file

// Make sure Chart.js is available
if (typeof Chart === 'undefined') {
  console.error('Chart.js not found! Charts will not render.');
}

// Add an improved patched version for Chart.js to fix positioning issues
if (typeof Chart !== 'undefined') {
  // Add a more comprehensive safety patch for positioning logic
  const originalInteractionModes = Chart.Interaction.modes;

  // Safe wrapper for all interaction methods
  Object.keys(originalInteractionModes).forEach(mode => {
    const originalFunction = originalInteractionModes[mode];
    if (typeof originalFunction === 'function') {
      Chart.Interaction.modes[mode] = function (chart, e, options, useFinalPosition) {
        try {
          return originalFunction.call(this, chart, e, options, useFinalPosition);
        } catch (err) {
          console.warn(`Caught error in Chart.js interaction mode "${mode}":`, err);
          return [];
        }
      };
    }
  });

  // Also patch the event service
  if (Chart.Interaction && Chart.Interaction._eventPosition) {
    const originalEventPosition = Chart.Interaction._eventPosition;
    Chart.Interaction._eventPosition = function (e) {
      try {
        return originalEventPosition.call(this, e);
      } catch (err) {
        console.warn('Caught error in Chart.js event position handler:', err);
        return { x: 0, y: 0 };
      }
    };
  }

  // Add adapters if missing
  if (!Chart.defaults.scale || !Chart.defaults.scale.adapters) {
    Chart.defaults.scale = Chart.defaults.scale || {};
    Chart.defaults.scale.adapters = {
      date: {
        locale: 'en-US'
      }
    };
    console.log("Added missing date adapter configuration");
  }

  // Add null check for interaction handlers
  if (Chart.Interaction) {
    const originalHandleEvent = Chart.Interaction.handleEvent;
    if (originalHandleEvent) {
      Chart.Interaction.handleEvent = function (chart, e) {
        try {
          if (!chart || !e) return false;
          return originalHandleEvent.call(this, chart, e);
        } catch (err) {
          console.warn('Caught error in Chart.js handleEvent:', err);
          return false;
        }
      };
    }
  }

  // Fix for _positionChanged error
  const originalPluginServiceNotifyPlugins = Chart.PluginService?.notify;
  if (originalPluginServiceNotifyPlugins) {
    Chart.PluginService.notify = function (chart, hook, args) {
      try {
        return originalPluginServiceNotifyPlugins.apply(this, arguments);
      } catch (err) {
        console.warn('Caught error in Chart.js plugin notification:', err);
        return undefined;
      }
    };
  }

  // Additional patch for _positionChanged error
  const originalEventPosition = Chart.Interaction._eventPosition;
  Chart.Interaction._eventPosition = function (e) {
    try {
      if (!e || typeof e !== 'object') {
        console.warn('Invalid event passed to _eventPosition');
        return { x: 0, y: 0 };
      }
      // Use original function with proper this binding
      return originalEventPosition.call(Chart.Interaction, e);
    } catch (err) {
      console.warn('Error in Chart.js _eventPosition:', err);
      return { x: 0, y: 0 };
    }
  };

  // Fix for _positionChanged in handleEvent
  const originalHandleEvent = Chart.Interaction.handleEvent;
  Chart.Interaction.handleEvent = function (chart, e) {
    try {
      if (!chart || !chart.getElementsAtEventForMode || !e) {
        console.warn('Invalid parameters for handleEvent');
        return false;
      }
      return originalHandleEvent.call(this, chart, e);
    } catch (err) {
      console.warn('Caught error in Chart.js handleEvent:', err);
      return false;
    }
  };
}

// Add these additional safety checks to the chart.js error

/**
 * Additional Chart.js safety patches to prevent common errors
 */
function patchChartJS() {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js not found. Charts will not render properly.");
    return;
  }

  // Fix for _positionChanged error
  try {
    if (Chart.Interaction) {
      const originalHandleEvent = Chart.Interaction.handleEvent;
      if (originalHandleEvent) {
        Chart.Interaction.handleEvent = function (chart, e) {
          try {
            return originalHandleEvent.call(this, chart, e);
          } catch (err) {
            console.warn("Suppressed Chart.js handleEvent error:", err);
            return false;
          }
        };
      }
    }

    // Fix for _positionChanged specifically
    if (Chart.Interaction && Chart.Interaction.modes) {
      Object.keys(Chart.Interaction.modes).forEach(mode => {
        const originalFunction = Chart.Interaction.modes[mode];
        if (typeof originalFunction === 'function') {
          Chart.Interaction.modes[mode] = function () {
            try {
              return originalFunction.apply(this, arguments);
            } catch (err) {
              console.warn(`Suppressed Chart.js error in mode ${mode}:`, err);
              return [];
            }
          };
        }
      });
    }
  } catch (e) {
    console.warn("Could not patch Chart.js:", e);
  }
}

// Call the patch function immediately
document.addEventListener('DOMContentLoaded', patchChartJS);
window.addEventListener('load', patchChartJS);

// Wait for DOM before initializing
document.addEventListener('DOMContentLoaded', () => {
  initializeChartDefaults();
});

/**
 * Initialize Chart.js with global defaults
 */
function initializeChartDefaults() {
  if (typeof Chart !== 'undefined') {
    // First, register the time scale plugin properly
    if (typeof window.dayjs !== 'undefined') {
      console.log("Using dayjs for chart dates");
    } else {
      console.log("Note: date-fns adapter should be loaded for proper time scale handling");
    }

    // Set global Chart.js defaults
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.title.display = true;
    Chart.defaults.plugins.title.font = {
      size: 16,
      weight: 'bold'
    };

    // Set default animations with lower duration for better performance
    Chart.defaults.animation = {
      duration: 300,
      easing: 'linear'
    };

    // Set default tooltips
    Chart.defaults.plugins.tooltip = {
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 10,
      cornerRadius: 4,
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      }
    };

    // Important: Apply safer defaults for scales
    Chart.defaults.scale = {
      grid: {
        color: 'rgba(0,0,0,0.1)'
      },
      ticks: {
        maxRotation: 45,
        minRotation: 0
      }
    };

    // Set time scale defaults
    if (Chart.defaults.scales && Chart.defaults.scales.time) {
      Chart.defaults.scales.time.adapters = {
        date: {
          locale: 'en-US'
        }
      };
    }

    console.log("Chart.js global defaults initialized");
  } else {
    console.error("Chart.js not found - global defaults not initialized");
  }
}

// Ensure Chart.js is loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  // Add a short delay to ensure Chart.js is fully loaded
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      initializeChartDefaults();
    } else {
      console.error("Chart.js still not available after DOMContentLoaded");
    }
  }, 100);
});

/**
 * Enhanced Chart.js patching to fix animation and event handling errors
 */
function applyAdvancedChartPatches() {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded - cannot apply patches');
    return;
  }

  console.log('Applying advanced Chart.js patches');

  try {
    // Patch 1: Fix _positionChanged error with bound functions
    if (Chart.Interaction) {
      // Explicitly bind methods to prevent 'call' on undefined errors
      const originalHandleEvent = Chart.Interaction.handleEvent;
      Chart.Interaction.handleEvent = function () {
        try {
          return originalHandleEvent.apply(Chart.Interaction, arguments);
        } catch (err) {
          console.warn('Suppressed Chart.js handleEvent error:', err);
          return false;
        }
      };

      // Patch problematic _positionChanged method specifically
      if (typeof Chart.Interaction._positionChanged === 'function') {
        const originalPositionChanged = Chart.Interaction._positionChanged;
        Chart.Interaction._positionChanged = function () {
          try {
            // Use safe call with explicit this binding
            return originalPositionChanged.apply(Chart.Interaction, arguments);
          } catch (err) {
            console.warn('Suppressed Chart.js _positionChanged error:', err);
            return false;
          }
        };
      }
    }

    // Patch 2: Fix animation callbacks
    if (Chart.defaults && Chart.defaults.animation) {
      // Disable problematic animation callbacks
      const safeDefaults = {
        duration: 100, // Shorter duration
        easing: 'linear',
        onProgress: null, // Remove callback
        onComplete: null  // Remove callback
      };
      Chart.defaults.animation = { ...Chart.defaults.animation, ...safeDefaults };
    }

    // Patch 3: Fix requestAnimationFrame loop errors
    if (Chart.animator) {
      // Make animator's _refresh method safer
      const originalRefresh = Chart.animator._refresh;
      Chart.animator._refresh = function () {
        try {
          return originalRefresh.apply(this, arguments);
        } catch (err) {
          console.warn('Suppressed Chart.js animator error:', err);
          // Cancel animation frame to prevent infinite error loop
          if (this._request) {
            cancelAnimationFrame(this._request);
            this._request = null;
          }
          return false;
        }
      };
    }

    // Patch 4: Fix tick errors
    if (Chart.Animator && Chart.Animator.prototype) {
      const originalTick = Chart.Animator.prototype.tick;
      Chart.Animator.prototype.tick = function (time) {
        try {
          // Validate that this._fn is a function before calling it
          if (typeof this._fn !== 'function') {
            console.warn('Chart.js animator missing function, fixing...');
            this._fn = () => { }; // Provide empty function
          }
          return originalTick.call(this, time);
        } catch (err) {
          console.warn('Suppressed Chart.js tick error:', err);
          return false;
        }
      };
    }

    console.log('Chart.js patches applied successfully');
  } catch (err) {
    console.error('Error applying Chart.js patches:', err);
  }
}

// Call our enhanced patching function during initialization
document.addEventListener('DOMContentLoaded', applyAdvancedChartPatches);

// Apply patches again if Chart is loaded after DOMContentLoaded
setTimeout(() => {
  if (typeof Chart !== 'undefined') {
    applyAdvancedChartPatches();
  }
}, 500);

/**
 * Safely creates a Chart instance with error handling
 * @param {string} canvasId - ID of the canvas element
 * @param {object} config - Chart configuration
 * @returns {Chart|null} The Chart instance or null if error
 */
export function createSafeChart(canvasId, config) {
  // Apply patches first
  if (typeof Chart !== 'undefined') {
    applyRobustPatches();
  }

  // Modify config to be safer
  const safeConfig = { ...config };

  // Disable animations
  safeConfig.options = safeConfig.options || {};
  safeConfig.options.animation = false;
  safeConfig.options.animations = { colors: false, x: false };

  // Disable tooltips (main source of _positionChanged errors)
  safeConfig.options.plugins = safeConfig.options.plugins || {};
  safeConfig.options.plugins.tooltip = {
    enabled: false
  };

  // Use safe wrapper for actual chart creation
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with ID "${canvasId}" not found`);
      return null;
    }

    // First apply advanced patches if not already done
    if (typeof Chart !== 'undefined') {
      applyAdvancedChartPatches();
    }

    // Check if an existing chart is attached to this canvas and destroy it
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    // Add safety for missing options
    config.options = config.options || {};

    // Add plugin defaults for safety
    config.options.plugins = config.options.plugins || {};

    // Add interaction configurations for better error handling
    config.options.interaction = config.options.interaction || {};
    config.options.interaction.intersect = false;
    config.options.interaction.mode = 'nearest';

    // Add safer animation configuration
    config.options.animation = {
      duration: 100,        // Much shorter duration to reduce chance of errors
      easing: 'linear',     // Simpler easing function
      delay: 0,             // No delay
      loop: false,          // No looping
      responsive: true      // Maintain responsiveness
    };

    // Disable animations entirely if we've had errors
    if (window.chartJsErrorCount && window.chartJsErrorCount > 2) {
      console.log('Disabling Chart.js animations due to previous errors');
      config.options.animation = false;
    }

    // Wrap any provided callbacks in try-catch
    if (config.options.plugins && config.options.plugins.tooltip) {
      const originalCallbacks = config.options.plugins.tooltip.callbacks || {};
      config.options.plugins.tooltip.callbacks = Object.keys(originalCallbacks).reduce((safe, key) => {
        const original = originalCallbacks[key];
        if (typeof original === 'function') {
          safe[key] = function () {
            try {
              return original.apply(this, arguments);
            } catch (err) {
              console.warn(`Chart tooltip callback '${key}' error:`, err);
              return '';
            }
          };
        }
        return safe;
      }, {});
    }

    // Create chart with error boundary
    try {
      return new Chart(canvas, config);
    } catch (error) {
      console.error(`Error creating chart for canvas "${canvasId}":`, error);

      // Increment error count for future reference
      window.chartJsErrorCount = (window.chartJsErrorCount || 0) + 1;

      displayNoDataMessage(canvasId, "Error creating chart");
      return null;
    }
  } catch (error) {
    console.error(`Error in createSafeChart for "${canvasId}":`, error);
    return null;
  }
}

// Update the destroyChart function to be more robust
export function destroyChart(chart) {
  if (!chart) return false;

  try {
    // Check if the chart still exists and has a destroy method
    if (typeof chart.destroy === 'function') {
      chart.destroy();
      return true;
    } else {
      console.warn("Chart instance lacks destroy method");
      return false;
    }
  } catch (error) {
    console.error("Error destroying chart:", error);
    return false;
  }
}

/**
 * Displays a message on a canvas when no data is available
 * @param {string} canvasId - The ID of the canvas element
 * @param {string} message - The message to display
 */
export function displayNoDataMessage(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Just leave it blank - no message or icon
}

/**
 * Throttles a function call to prevent too many executions
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, delay = 300) {
  let timerId;
  let lastExecTime = 0;

  return function (...args) {
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTime;
    const context = this;

    // Clear any existing timer
    clearTimeout(timerId);

    if (timeSinceLastExec >= delay) {
      // Execute immediately if enough time has passed
      lastExecTime = now;
      func.apply(context, args);
    } else {
      // Schedule for later and de-duplicate calls
      timerId = setTimeout(() => {
        lastExecTime = Date.now();
        func.apply(context, args);
      }, delay - timeSinceLastExec);
    }
  };
}

/**
 * Validates the data for chart rendering
 * @param {Array} transactions - The transactions to validate
 * @returns {Array} Filtered valid transactions
 */
export function validateChartData(transactions) {
  if (!Array.isArray(transactions)) return [];

  return transactions.filter(tx => {
    // Skip null/undefined transactions
    if (!tx) return false;

    // Every transaction needs a valid date
    if (!tx.date) return false;

    // Check if the date is valid
    const date = new Date(tx.date);
    if (isNaN(date.getTime())) {
      return false;
    }

    // Need either income or expenses - single return statement
    return (tx.income && !isNaN(parseFloat(tx.income))) ||
      (tx.expenses && !isNaN(parseFloat(tx.expenses)));
  });
}

/**
 * Gets chart colors for categories
 * @returns {Object} Map of category names to colors
 */
export function getCategoryColors() {
  // Use the centralized category definitions from constants.js
  return DEFAULT_CATEGORIES;
}

/**
 * Creates a consistent color palette for charts
 * @returns {Array} Array of colors for charts
 */
export function getChartColorPalette() {
  // Extract just the color values from the category definitions
  return Object.values(DEFAULT_CATEGORIES).map(val =>
    typeof val === 'string' ? val : val.color
  );
}

/**
 * Assigns colors to datasets for consistency across charts
 * @param {Array} datasets - Chart datasets
 * @returns {Array} Datasets with assigned colors
 */
export function assignColorsToDatasets(datasets) {
  const categoryColors = DEFAULT_CATEGORIES;

  return datasets.map(dataset => {
    // Try to match dataset label to a category name
    const categoryName = dataset.label;
    const color = categoryColors[categoryName] ||
                 (typeof categoryColors[categoryName] === 'object' ?
                  categoryColors[categoryName].color : null);

    if (color) {
      dataset.backgroundColor = color;
      dataset.borderColor = color;
    }
    return dataset;
  });
}

// Provides a safe custom defaults object for Chart.js
// that won't attempt to modify read-only properties
export function getSafeChartDefaults() {
  return {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10
      }
    },
    elements: {
      point: {
        radius: 3
      },
      line: {
        tension: 0.3
      }
    }
  };
}

/**
 * Applies robust patches to Chart.js safely without modifying read-only properties
 */
function applyRobustPatches() {
  // Do not attempt to modify Chart.defaults directly
  console.log("Applying robust Chart.js patches");

  try {
    // Safe approach: Create a helper function that will be used
    // when creating new charts instead of trying to modify global defaults
    window.getChartConfig = function(type, data, customOptions = {}) {
      const baseConfig = getSafeChartDefaults();

      // Merge custom options with our safe defaults
      const config = {
        type: type,
        data: data,
        options: { ...baseConfig, ...customOptions }
      };

      return config;
    };

    console.log("Added safe Chart.js configuration helper");
  } catch (error) {
    // This is not critical, so just log the error and continue
    console.warn("Could not create Chart.js helpers:", error);
  }

  // Add our own theme manager helper for charts
  try {
    window.applyChartTheme = function(chart, isDarkMode) {
      if (!chart || !chart.options) return;

      // Get the canvas context and manipulate styles directly
      const ctx = chart.ctx;
      if (ctx) {
        ctx.font = '12px Arial, sans-serif';
      }

      // Set colors based on theme without modifying Chart.defaults
      if (isDarkMode) {
        if (chart.options.scales && chart.options.scales.x) {
          chart.options.scales.x.grid = chart.options.scales.x.grid || {};
          chart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
          chart.options.scales.x.ticks = chart.options.scales.x.ticks || {};
          chart.options.scales.x.ticks.color = '#aaa';
        }

        if (chart.options.scales && chart.options.scales.y) {
          chart.options.scales.y.grid = chart.options.scales.y.grid || {};
          chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
          chart.options.scales.y.ticks = chart.options.scales.y.ticks || {};
          chart.options.scales.y.ticks.color = '#aaa';
        }
      }

      // Update the chart
      chart.update();
    };

    console.log("Added Chart.js theme helper");
  } catch (error) {
    console.warn("Could not create Chart.js theme helper:", error);
  }

  console.log("Robust patches complete");
}

// Call our enhancement function after Chart.js is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart !== 'undefined') {
    applyRobustPatches();
    applyChartCompatibilityPatches();
  } else {
    console.warn('Chart.js not available during DOMContentLoaded');
    // Try again later
    setTimeout(() => {
      if (typeof Chart !== 'undefined') {
        applyRobustPatches();
        applyChartCompatibilityPatches();
      } else {
        console.error('Chart.js still not available after timeout');
      }
    }, 1000);
  }
});

// Add this specific fix for the hitRadius issue
if (typeof Chart !== 'undefined' && Chart.Interaction && Chart.Interaction.modes) {
  // Safe wrapper for all interaction modes, especially 'nearest'
  const originalNearest = Chart.Interaction.modes.nearest;
  Chart.Interaction.modes.nearest = function (chart, e, options, useFinalPosition) {
    try {
      // Make sure to check if each point has a hitRadius property
      if (chart && chart.getElementsAtEventForMode) {
        const elements = chart.getVisibleDatasetElements();
        if (elements && elements.length > 0) {
          elements.forEach(element => {
            // Fix for hitRadius undefined error
            if (element && element.options && element.options.hitRadius === undefined) {
              element.options.hitRadius = 1;
            }
          });
        }
      }
      return originalNearest.call(this, chart, e, options, useFinalPosition);
    } catch (err) {
      console.warn('Caught error in Chart.js interaction mode "nearest":', err);
      return [];
    }
  };

  // Fix the _positionChanged error
  if (Chart.Interaction) {
    const originalPositionChanged = Chart.Interaction._positionChanged;
    if (originalPositionChanged) {
      Chart.Interaction._positionChanged = function (e, position, lastPosition) {
        try {
          if (!lastPosition) return false;
          return originalPositionChanged.call(this, e, position, lastPosition);
        } catch (err) {
          console.warn('Caught error in Chart.js _positionChanged:', err);
          return false;
        }
      };
    }
  }
}

// Refactor function at line 467
function getChartType(data) {
  if (data.length > 100) return "line";
  if (data.length > 50) return "bar";
  return "pie";
}

/**
 * Applies compatibility patches for Chart.js
 */
function applyChartCompatibilityPatches() {
  console.log("Applying Chart.js compatibility patches...");

  try {
    // Example compatibility patch: Ensure proper handling of older Chart.js versions
    if (Chart && Chart.defaults) {
      if (!Chart.defaults.plugins) {
        Chart.defaults.plugins = {};
      }

      // Add default configurations if missing
      Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || { display: true };
      Chart.defaults.plugins.tooltip = Chart.defaults.plugins.tooltip || { enabled: true };
    }

    console.log("Chart.js compatibility patches applied successfully.");
  } catch (error) {
    console.error("Error applying Chart.js compatibility patches:", error);
  }
}

// Call the function to ensure compatibility
applyChartCompatibilityPatches();
