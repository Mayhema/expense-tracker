// State management - prevent multiple initialization
const STATE = {
  initialized: false,
  darkMode: false
};

// Logging levels for controlled output
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set default log level (less verbose in production)
const CURRENT_LOG_LEVEL = isProduction() ? LOG_LEVEL.WARN : LOG_LEVEL.INFO;

/**
 * Controlled logging with level-based filtering
 * @param {string} message - Message to log
 * @param {number} level - Log level importance
 * @param {boolean} force - Force logging regardless of level
 */
function log(message, level = LOG_LEVEL.INFO, force = false) {
  if (force || level <= CURRENT_LOG_LEVEL) {
    const prefix = '[Chart] ';

    switch (level) {
      case LOG_LEVEL.ERROR:
        console.error(prefix + message);
        break;
      case LOG_LEVEL.WARN:
        console.warn(prefix + message);
        break;
      case LOG_LEVEL.DEBUG:
        console.debug(prefix + message);
        break;
      default:
        console.log(prefix + message);
    }
  }
}

/**
 * Detect if running in production
 * @returns {boolean} True if running in production environment
 */
function isProduction() {
  return location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1' &&
    !location.hostname.includes('.local');
}

/**
 * Primary initialization function - all initialization happens here
 */
export function initializeChartCore() {
  // Skip if already initialized
  if (STATE.initialized) {
    log('Already initialized, skipping', LOG_LEVEL.DEBUG);
    return;
  }

  try {
    log('Initializing Chart.js core');

    // Check if Chart.js is available
    if (!window.Chart) {
      log('Chart.js library not found - charts will not function', LOG_LEVEL.WARN, true);
      return;
    }

    // Set up defaults
    setupChartDefaults();

    // Apply fixes for known issues
    applyChartFixes();

    // Add version compatibility
    addVersionCompatibility();

    // Initialize theme
    setupThemeHelpers();

    // Mark as initialized
    STATE.initialized = true;
    log('Initialization complete');
  } catch (error) {
    log(`Initialization failed: ${error.message}`, LOG_LEVEL.ERROR, true);
    console.error(error); // Show stack trace for debugging
  }
}

/**
 * Set up Chart.js global defaults
 */
function setupChartDefaults() {
  if (!window.Chart) return;

  log('Setting up Chart.js defaults');

  try {
    // Animation settings
    Chart.defaults.animation = {
      duration: 400,
      easing: 'easeOutQuart'
    };

    // Responsive behavior
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Colors and styling
    Chart.defaults.color = '#666';
    Chart.defaults.borderColor = '#ddd';

    // Plugin defaults
    Chart.defaults.plugins = Chart.defaults.plugins || {};
    Chart.defaults.plugins.title = {
      display: true,
      padding: 10,
      font: {
        size: 16,
        weight: 'bold'
      }
    };

    Chart.defaults.plugins.tooltip = {
      backgroundColor: 'rgba(0,0,0,0.7)',
      titleFont: { weight: 'bold' },
      padding: 8,
      cornerRadius: 4,
      displayColors: true,
      mode: 'index',
      intersect: false
    };

    log('Note: date-fns adapter should be loaded for proper time scale handling');
  } catch (error) {
    log(`Error in setupChartDefaults: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Apply fixes for known Chart.js issues
 */
function applyChartFixes() {
  if (!window.Chart) return;

  log('Applying Chart.js fixes');

  try {
    // Fix tooltip issues
    if (Chart.Tooltip && Chart.Tooltip.prototype) {
      fixTooltipFunctions();
    }

    // Create tooltip safety plugin
    createTooltipSafetyPlugin();
  } catch (error) {
    log(`Error applying fixes: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Add compatibility layer between Chart.js versions
 */
function addVersionCompatibility() {
  if (!window.Chart) return;

  log('Adding Chart.js version compatibility');

  try {
    // Check for v2 vs v3
    if (!Chart.defaults.global && Chart.defaults.elements) {
      // This is Chart.js v3+ - add v2 compatibility
      Chart.defaults.global = {
        defaultColor: Chart.defaults.color,
        defaultFontColor: Chart.defaults.color,
        defaultFontFamily: Chart.defaults.font?.family,
        defaultFontSize: Chart.defaults.font?.size
      };
      log('Added v2 compatibility layer for v3', LOG_LEVEL.DEBUG);
    }
    else if (Chart.defaults.global && !Chart.defaults.elements) {
      // This is Chart.js v2 - add v3 compatibility
      Chart.defaults.color = Chart.defaults.global.defaultColor;
      Chart.defaults.font = {
        family: Chart.defaults.global.defaultFontFamily,
        size: Chart.defaults.global.defaultFontSize
      };
      log('Added v3 compatibility layer for v2', LOG_LEVEL.DEBUG);
    }
  } catch (error) {
    log(`Error adding compatibility layer: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Fix tooltip functions to prevent errors
 */
function fixTooltipFunctions() {
  try {
    if (!window.Chart || !window.Chart.Tooltip) return;

    // Fix _positionChanged which often causes errors
    if (Chart.Tooltip.prototype._positionChanged) {
      const originalPositionChanged = Chart.Tooltip.prototype._positionChanged;
      Chart.Tooltip.prototype._positionChanged = function () {
        try {
          // Add comprehensive safety checks
          if (!this || !this._chart) return false;
          if (!this._active) this._active = [];
          if (this._active.length === 0) return false;

          // Check for chartArea which is used in positioning calculations
          if (!this._chart.chartArea) return false;

          // Check if the original function exists and is callable
          if (typeof originalPositionChanged !== 'function') return false;

          return originalPositionChanged.apply(this, arguments);
        } catch (error) {
          log(`Prevented tooltip positioning error: ${error.message}`, LOG_LEVEL.WARN);
          return false;
        }
      };
    }

    // Fix handleEvent to prevent 'call' errors
    if (Chart.Tooltip.prototype.handleEvent) {
      const originalHandleEvent = Chart.Tooltip.prototype.handleEvent;
      Chart.Tooltip.prototype.handleEvent = function (e) {
        try {
          // Ensure we have all required properties
          if (!this || !this._chart) return false;
          if (!this._active) this._active = [];

          // Only call original if we have all required properties
          if (typeof originalHandleEvent === 'function') {
            return originalHandleEvent.apply(this, arguments);
          }
          return false;
        } catch (error) {
          log(`Prevented tooltip event error: ${error.message}`, LOG_LEVEL.WARN);
          return false;
        }
      };
    }

    // Register global tooltip safety plugin
    if (typeof Chart.register === 'function') {
      Chart.register({
        id: 'globalTooltipSafety',
        beforeEvent: function (chart, args) {
          if (!chart.tooltip) chart.tooltip = { _active: [] };
          if (!chart.tooltip._active) chart.tooltip._active = [];
          return true;
        }
      });
    }
  } catch (error) {
    log(`Error fixing tooltip functions: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Create a plugin for tooltip safety
 */
function createTooltipSafetyPlugin() {
  if (!window.Chart || typeof Chart.register !== 'function') return;

  try {
    Chart.register({
      id: 'tooltipSafety',
      beforeEvent: function (chart) {
        // Ensure tooltip has required properties
        if (chart.tooltip && !chart.tooltip._active) {
          chart.tooltip._active = [];
        }
        return true;
      }
    });
  } catch (error) {
    log(`Error creating tooltip plugin: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Set up theme helpers for charts
 */
function setupThemeHelpers() {
  log('Setting up theme helpers');

  try {
    // Define updateChartTheme as a global function for direct access from UI components
    window.updateChartTheme = function (chart, isDarkMode) {
      if (!chart || !chart.options) return;

      const textColor = isDarkMode ? '#e0e0e0' : '#666666';
      const gridColor = isDarkMode ? '#444444' : '#dddddd';

      // Update title color
      if (chart.options.plugins?.title) {
        chart.options.plugins.title.color = textColor;
      }

      // Update legend colors
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = textColor;
      }

      // Update scales colors
      if (chart.options.scales) {
        // Handle both array and object formats for v2/v3 compatibility
        if (Array.isArray(chart.options.scales)) {
          chart.options.scales.forEach(scale => {
            if (scale.gridLines) scale.gridLines.color = gridColor;
            if (scale.ticks) scale.ticks.fontColor = textColor;
          });
        } else {
          Object.values(chart.options.scales).forEach(scale => {
            if (scale.grid) scale.grid.color = gridColor;
            if (scale.ticks) scale.ticks.color = textColor;
          });
        }
      }

      // Update the chart
      chart.update('none'); // Update without animation for performance
    };

    // Global function to update all charts
    window.updateAllChartThemes = function (isDarkMode) {
      STATE.darkMode = isDarkMode;

      // Update global defaults
      if (window.Chart) {
        Chart.defaults.color = isDarkMode ? '#e0e0e0' : '#666666';
        Chart.defaults.borderColor = isDarkMode ? '#444444' : '#dddddd';
      }

      // Update all existing chart instances
      updateAllChartInstances(isDarkMode);
    };
  } catch (error) {
    log(`Error setting up theme helpers: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Update all chart instances with the current theme
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateAllChartInstances(isDarkMode) {
  // Different Chart.js versions store instances differently
  try {
    if (!window.Chart) return;

    let instances = [];

    if (Chart.instances) {
      // Chart.js v2
      instances = Object.values(Chart.instances);
    }
    else if (Chart.getChart) {
      // Chart.js v3+
      // Get all canvases in the document
      document.querySelectorAll('canvas').forEach(canvas => {
        const chart = Chart.getChart(canvas);
        if (chart) {
          instances.push(chart);
        }
      });
    }

    // Update each instance
    instances.forEach(chart => {
      if (chart && typeof window.updateChartTheme === 'function') {
        window.updateChartTheme(chart, isDarkMode);
      }
    });
  } catch (error) {
    log(`Error updating chart instances: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Get and validate the canvas element
 * @param {string} canvasId - Canvas element ID
 * @returns {HTMLElement|null} Canvas element or null if not found
 */
function getValidCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    log(`Canvas with ID "${canvasId}" not found`, LOG_LEVEL.ERROR);
    return null;
  }

  // Set explicit dimensions if needed
  if (!canvas.style.height) {
    canvas.style.height = '300px';
  }

  return canvas;
}

/**
 * Normalize layout padding configuration
 * @param {object|number|undefined} padding - The padding configuration
 * @returns {object} Normalized padding object
 */
function normalizeLayoutPadding(padding) {
  const defaultPadding = 20;

  if (!padding) {
    return {
      top: defaultPadding,
      right: defaultPadding,
      bottom: defaultPadding,
      left: defaultPadding
    };
  }

  if (typeof padding === 'number') {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }

  // It's an object, ensure all sides are defined
  return {
    top: padding.top !== undefined ? padding.top : defaultPadding,
    right: padding.right !== undefined ? padding.right : defaultPadding,
    bottom: padding.bottom !== undefined ? padding.bottom : defaultPadding,
    left: padding.left !== undefined ? padding.left : defaultPadding
  };
}

/**
 * Prepare chart configuration with all required properties
 * @param {object} config - Original chart configuration
 * @param {string} canvasId - Canvas ID for tooltip plugin
 * @returns {object} Enhanced configuration
 */
function prepareChartConfig(config, canvasId) {
  // Create a defensive copy to avoid mutating the original
  const enhancedConfig = { ...config };

  // Ensure options exists
  if (!enhancedConfig.options) enhancedConfig.options = {};

  // Set up layout and padding
  if (!enhancedConfig.options.layout) enhancedConfig.options.layout = {};
  enhancedConfig.options.layout.padding = normalizeLayoutPadding(enhancedConfig.options.layout.padding);

  // Add tooltip safety plugin
  if (!enhancedConfig.plugins) enhancedConfig.plugins = [];
  enhancedConfig.plugins.push({
    id: `tooltipSafety-${canvasId}`,
    beforeEvent: (chart, args) => {
      if (!chart.tooltip) chart.tooltip = { _active: [] };
      if (!chart.tooltip._active) chart.tooltip._active = [];
      return true;
    }
  });

  return enhancedConfig;
}

/**
 * Creates a chart with error handling and theme support
 * @param {string} canvasId - Canvas element ID
 * @param {object} config - Chart configuration
 * @returns {Chart|null} Chart instance or null if creation failed
 */
export function createSafeChart(canvasId, config) {
  // Initialize if needed
  if (!STATE.initialized) {
    initializeChartCore();
  }

  try {
    // Check for Chart.js library
    if (!window.Chart) {
      log(`Cannot create chart: Chart.js library not available`, LOG_LEVEL.ERROR);
      return null;
    }

    // Get the canvas element
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      log(`Canvas with ID "${canvasId}" not found`, LOG_LEVEL.ERROR);
      return null;
    }

    // Ensure the canvas has proper dimensions
    if (!canvas.style.height) {
      canvas.style.height = '300px';
    }

    // Create a completely new deep-copied config to avoid reference issues
    const safeConfig = JSON.parse(JSON.stringify(config));

    // CRITICAL FIX: Ensure all required layout objects are defined
    // This prevents "Cannot read properties of undefined (reading 'top')" errors
    if (!safeConfig.options) safeConfig.options = {};

    // Fix layout structure - the most common source of 'top' errors
    if (!safeConfig.options.layout) {
      safeConfig.options.layout = {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      };
    } else if (!safeConfig.options.layout.padding) {
      safeConfig.options.layout.padding = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      };
    } else if (typeof safeConfig.options.layout.padding === 'number') {
      // If padding is a single number, convert to object with all directions
      const padding = safeConfig.options.layout.padding;
      safeConfig.options.layout.padding = {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding
      };
    } else {
      // Ensure all padding directions exist
      const padding = safeConfig.options.layout.padding;
      if (padding.top === undefined) padding.top = 20;
      if (padding.right === undefined) padding.right = 20;
      if (padding.bottom === undefined) padding.bottom = 20;
      if (padding.left === undefined) padding.left = 20;
    }

    // Fix plugins structure
    if (!safeConfig.options.plugins) safeConfig.options.plugins = {};

    // CRITICAL FIX: Disable tooltips for charts with no data
    const hasData = safeConfig.data &&
      safeConfig.data.datasets &&
      safeConfig.data.datasets.some(ds => ds.data && ds.data.length > 0 &&
        ds.data.some(val => val !== 0 && val !== null));

    if (!hasData) {
      // Disable tooltips completely for empty state charts
      safeConfig.options.plugins.tooltip = { enabled: false };
    } else if (!safeConfig.options.plugins.tooltip) {
      // Ensure tooltip configuration exists for charts with data
      safeConfig.options.plugins.tooltip = {
        enabled: true,
        mode: 'nearest',
        intersect: true
      };
    }

    // Global tooltip safety plugin - prevents 'call' errors by ensuring tooltip objects exist
    const tooltipSafetyPlugin = {
      id: `tooltip-safety-${canvasId}`,
      beforeEvent: function (chart, args, options) {
        // Ensure tooltip and chart objects are properly initialized
        if (!chart.tooltip) chart.tooltip = { _active: [] };
        if (!chart.tooltip._active) chart.tooltip._active = [];
        return true;
      }
    };

    // Add our plugin
    if (!safeConfig.plugins) safeConfig.plugins = [];
    safeConfig.plugins.push(tooltipSafetyPlugin);

    // Destroy any existing chart on this canvas
    destroyChart(canvasId);

    // Create new chart
    const chart = new Chart(canvas, safeConfig);

    // Apply current theme
    if (STATE.darkMode && typeof window.updateChartTheme === 'function') {
      window.updateChartTheme(chart, true);
    }

    return chart;
  } catch (error) {
    log(`Error creating chart on "${canvasId}": ${error.message}`, LOG_LEVEL.ERROR);

    // Display a fallback message on the canvas
    try {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width || 300, canvas.height || 150);
          ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#333' : '#f5f5f5';
          ctx.fillRect(0, 0, canvas.width || 300, canvas.height || 150);
          ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#666';
          ctx.textAlign = 'center';
          ctx.font = '14px Arial';
          ctx.fillText('Error creating chart', (canvas.width || 300) / 2, (canvas.height || 150) / 2);
        }
      }
    } catch (fallbackError) {
      log(`Error creating fallback rendering: ${fallbackError.message}`, LOG_LEVEL.ERROR);
      console.error(fallbackError); // Log full error object for debugging
    }

    return null;
  }
}

/**
 * EXPORTED: Safely destroy a chart
 * @param {Chart|string} chartOrId - Chart instance or canvas ID
 */
export function destroyChart(chartOrId) {
  try {
    let chart = chartOrId;

    // If a string ID was provided, get the chart instance
    if (typeof chartOrId === 'string') {
      const canvas = document.getElementById(chartOrId);
      if (!canvas) return;

      // Try Chart.js v3 approach first
      if (window.Chart && typeof Chart.getChart === 'function') {
        chart = Chart.getChart(canvas);
      }
      // Fall back to v2 approach if needed
      else if (canvas.__chartjs__) {
        chart = canvas.__chartjs__.instance;
      }
    }

    // Destroy the chart if we found it
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  } catch (error) {
    log(`Error destroying chart: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * EXPORTED: Display a message on a canvas when no data is available
 * @param {string|HTMLElement} canvas - Canvas ID or element
 * @param {string} message - Message to display
 * @param {object} options - Display options
 */
export function displayNoDataMessage(canvas, message = "No data available", options = {}) {
  try {
    // Get canvas element if string ID was provided
    const canvasElement = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    if (!canvasElement) {
      log(`Canvas not found for no-data message: ${canvas}`, LOG_LEVEL.ERROR);
      return;
    }

    // First destroy any existing chart
    destroyChart(typeof canvas === 'string' ? canvas : canvasElement);

    // Default options
    const defaultOptions = {
      fontFamily: "'Arial', sans-serif",
      fontSize: 14,
      fontColor: STATE.darkMode ? '#e0e0e0' : '#666666',
      backgroundColor: STATE.darkMode ? '#333333' : '#f9f9f9',
      verticalPosition: 'center'
    };

    const settings = { ...defaultOptions, ...options };

    // Get 2D context and dimensions
    const ctx = canvasElement.getContext('2d');
    const width = canvasElement.width;
    const height = canvasElement.height;

    // Clear canvas and set background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw message text
    ctx.fillStyle = settings.fontColor;
    ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
    ctx.textAlign = 'center';

    // Calculate vertical position
    let yPosition;
    switch (settings.verticalPosition) {
      case 'top':
        yPosition = settings.fontSize + 20;
        break;
      case 'bottom':
        yPosition = height - 20;
        break;
      case 'center':
      default:
        yPosition = height / 2;
    }

    // Draw the text
    ctx.fillText(message, width / 2, yPosition);
  } catch (error) {
    log(`Error displaying no-data message: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * EXPORTED: Update chart theme colors
 * @param {Chart} chart - Chart instance to update
 * @param {boolean} isDarkMode - Whether to use dark mode theme
 */
export function updateChartTheme(chart, isDarkMode) {
  try {
    // Just call the global function if it exists
    if (typeof window.updateChartTheme === 'function') {
      window.updateChartTheme(chart, isDarkMode);
    }
  } catch (error) {
    log(`Error in updateChartTheme: ${error.message}`, LOG_LEVEL.ERROR);
  }
}

/**
 * Validates data for chart rendering to prevent errors
 * @param {Object} data - The chart data object to validate
 * @returns {Object} Validated and sanitized data
 */
export function validateChartData(data) {
  if (!data) {
    return {
      labels: [],
      datasets: []
    };
  }

  try {
    // Ensure we have labels
    if (!data.labels || !Array.isArray(data.labels)) {
      data.labels = [];
    }

    // Ensure we have datasets
    if (!data.datasets || !Array.isArray(data.datasets)) {
      data.datasets = [];
    }

    // Validate each dataset
    data.datasets = data.datasets.map(dataset => {
      // Ensure dataset has data property
      if (!dataset.data || !Array.isArray(dataset.data)) {
        dataset.data = [];
      }

      // Ensure all data values are numbers (nulls are acceptable for gaps)
      dataset.data = dataset.data.map(value => {
        if (value === null || value === undefined) {
          return null; // Keep nulls for gaps in data
        }

        const num = parseFloat(value);
        return isNaN(num) ? 0 : num; // Convert to number or 0
      });

      return dataset;
    });

    return data;
  } catch (error) {
    console.error("Error validating chart data:", error);
    return {
      labels: [],
      datasets: []
    };
  }
}

// Run initialization once when this module loads
initializeChartCore();

// Export simple, clean API
export default {
  initialize: initializeChartCore,
  create: createSafeChart,
  destroy: destroyChart,
  updateTheme: (isDarkMode) => {
    STATE.darkMode = isDarkMode;
    updateAllChartInstances(isDarkMode);
  }
};
