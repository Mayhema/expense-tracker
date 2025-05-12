import { AppState } from "../core/appState.js";

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
  if (!chart) return null;

  try {
    // Check if the chart still exists and has a destroy method
    if (typeof chart.destroy === 'function') {
      chart.destroy();
    } else {
      console.warn("Chart instance lacks destroy method");
    }
  } catch (error) {
    console.error("Error destroying chart:", error);
  }

  return null;
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
    try {
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // Need either income or expenses
    if ((!tx.income || isNaN(parseFloat(tx.income))) &&
      (!tx.expenses || isNaN(parseFloat(tx.expenses)))) {
      return false;
    }

    return true;
  });
}

/**
 * Generates consistent colors for categories
 */
export function generateCategoryColors(categories) {
  const colorMap = {
    "Food": "#FF6384",
    "Transport": "#36A2EB",
    "Housing": "#FFCE56",
    "Utilities": "#4BC0C0",
    "Entertainment": "#9966FF",
    "Healthcare": "#FF9F40",
    "Shopping": "#8AC249",
    "Travel": "#EA526F",
    "Education": "#7B68EE",
    "Uncategorized": "#C9CBCF"
  };

  return categories.map(category => {
    if (colorMap[category]) {
      return colorMap[category];
    }

    if (AppState.categories && AppState.categories[category]) {
      return AppState.categories[category];
    }

    // Generate a stable color based on the category name
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = ((hash << 5) - hash) + category.charCodeAt(i);
      hash = hash & hash;
    }

    // Convert to hex color
    return `#${Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0')}`;
  });
}
