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
 * Safely creates a chart with fallback and error handling
 * @param {HTMLElement} ctx - Canvas element
 * @param {Object} config - Chart.js configuration
 * @returns {Object|null} - Chart instance or null if failed
 */
export function createSafeChart(ctx, config) {
  if (!ctx) {
    console.error('Chart context not found');
    return null;
  }

  try {
    // Add empty state styling to all charts
    const defaultConfig = {
      options: {
        plugins: {
          // Remove "No data" text by default
          title: {
            display: false
          }
        }
      }
    };

    // Merge configs (simple shallow merge)
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      options: {
        ...(defaultConfig.options || {}),
        ...(config.options || {}),
        plugins: {
          ...(defaultConfig.options?.plugins || {}),
          ...(config.options?.plugins || {})
        }
      }
    };

    return new Chart(ctx, mergedConfig);
  } catch (err) {
    console.error('Error creating chart:', err);
    return null;
  }
}

/**
 * Safely destroys a chart instance if it exists
 * @param {Object|null} chart - Chart instance to destroy
 */
export function destroyChart(chart) {
  if (chart) {
    try {
      chart.destroy();
    } catch (err) {
      console.error('Error destroying chart:', err);
    }
  }
  return null;
}

/**
 * Displays a "no data" message on a chart
 * @param {string} chartId - The ID of the chart canvas element
 * @param {string} message - The message to display
 */
export function displayNoDataMessage(chartId, message = "No data available") {
  const canvas = document.getElementById(chartId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set up text style
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Use appropriate color based on dark mode
  const isDarkMode = document.body.classList.contains('dark-mode');
  ctx.fillStyle = isDarkMode ? '#888888' : '#999999';

  // Draw text in center of canvas
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/**
 * Validates chart data to ensure it can be safely displayed
 * @param {Object} data - The chart data to validate
 * @returns {boolean} - Whether the data is valid for charting
 */
export function validateChartData(data) {
  if (!data) return false;

  // Check for required properties
  if (!data.labels || !Array.isArray(data.labels)) return false;

  // Check for datasets
  if (!data.datasets || !Array.isArray(data.datasets)) return false;

  // Ensure at least one dataset exists
  if (data.datasets.length === 0) return false;

  // Validate each dataset
  for (const dataset of data.datasets) {
    if (!dataset || !Array.isArray(dataset.data)) return false;

    // Make sure data values are valid numbers or null/undefined
    const hasInvalidData = dataset.data.some(value =>
      value !== null && value !== undefined && isNaN(parseFloat(value))
    );
    if (hasInvalidData) return false;
  }

  return true;
}
