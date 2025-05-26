/**
 * Core chart configuration and utilities
 */

// Global chart instances to prevent memory leaks
const chartInstances = new Map();

/**
 * Default chart configuration with fixed dimensions
 */
export const defaultChartConfig = {
  responsive: true,
  maintainAspectRatio: false, // CRITICAL: Prevent aspect ratio issues
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true
      }
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true
      }
    }
  },
  // CRITICAL: Set fixed dimensions to prevent infinite expansion
  layout: {
    padding: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }
  },
  // Prevent animations from causing memory leaks
  animation: {
    duration: 400,
    easing: 'easeInOutQuart'
  },
  // CRITICAL: Disable resize observer to prevent infinite loops
  resizeDelay: 0
};

/**
 * Creates a chart with proper memory management and fixed dimensions
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {string} type - Chart type
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} The created chart instance
 */
export function createChart(canvas, type, data, options = {}) {
  if (!canvas) {
    console.error("Cannot create chart: canvas element not found");
    return null;
  }

  // CRITICAL: Set fixed canvas dimensions to prevent expansion
  const container = canvas.parentElement;
  if (container) {
    // Set container dimensions explicitly
    container.style.width = '100%';
    container.style.height = '400px'; // Fixed height
    container.style.maxWidth = '100%';
    container.style.maxHeight = '400px';
    container.style.overflow = 'hidden'; // Prevent overflow

    // Set canvas dimensions
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';

    // Set actual canvas size attributes
    canvas.width = container.clientWidth || 800;
    canvas.height = 400;
  }

  // Destroy existing chart if it exists
  destroyChart(canvas.id);

  // Merge options with defaults
  const finalOptions = {
    ...defaultChartConfig,
    ...options,
    // CRITICAL: Override responsive settings to prevent infinite expansion
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...defaultChartConfig.plugins,
      ...options.plugins
    }
  };

  try {
    const chart = new Chart(canvas.getContext('2d'), {
      type,
      data: data || getEmptyChartData(type),
      options: finalOptions
    });

    // Store chart instance for cleanup
    chartInstances.set(canvas.id, chart);

    // CRITICAL: Add resize observer with debouncing to prevent infinite loops
    addResizeHandler(canvas, chart);

    console.log(`Chart created: ${canvas.id} (${type})`);
    return chart;
  } catch (error) {
    console.error(`Error creating chart ${canvas.id}:`, error);
    return null;
  }
}

/**
 * Safely destroys a chart and cleans up memory
 * @param {string} canvasId - The canvas ID
 */
export function destroyChart(canvasId) {
  const existingChart = chartInstances.get(canvasId);
  if (existingChart) {
    try {
      existingChart.destroy();
      chartInstances.delete(canvasId);
      console.log(`Chart destroyed: ${canvasId}`);
    } catch (error) {
      console.error(`Error destroying chart ${canvasId}:`, error);
    }
  }
}

/**
 * Returns empty data structure for a chart type
 * @param {string} type - Chart type
 * @returns {Object} Empty chart data
 */
function getEmptyChartData(type) {
  if (type === 'pie' || type === 'doughnut') {
    return {
      labels: ['No Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e0e0e0'],
        borderWidth: 0
      }]
    };
  }

  return {
    labels: [],
    datasets: [{
      label: 'No Data',
      data: [],
      borderColor: '#e0e0e0',
      backgroundColor: 'rgba(224, 224, 224, 0.1)',
      borderWidth: 1
    }]
  };
}

/**
 * Adds debounced resize handler to prevent infinite loops
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Chart} chart - The chart instance
 */
function addResizeHandler(canvas, chart) {
  let resizeTimeout;
  let isResizing = false;

  const resizeObserver = new ResizeObserver(entries => {
    if (isResizing) return; // Prevent recursive calls

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      isResizing = true;

      try {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;

          // CRITICAL: Limit maximum dimensions to prevent infinite expansion
          const maxWidth = Math.min(width, 1200);
          const maxHeight = Math.min(height, 600);

          if (maxWidth > 0 && maxHeight > 0) {
            // Update canvas dimensions
            canvas.width = maxWidth;
            canvas.height = maxHeight;

            // Trigger chart resize
            if (chart && typeof chart.resize === 'function') {
              chart.resize(maxWidth, maxHeight);
            }
          }
        }
      } catch (error) {
        console.error('Error in resize handler:', error);
      } finally {
        isResizing = false;
      }
    }, 100); // Debounce resize events
  });

  // Observe the canvas container, not the canvas itself
  const container = canvas.parentElement;
  if (container) {
    resizeObserver.observe(container);

    // Store observer for cleanup
    canvas._resizeObserver = resizeObserver;
  }
}

/**
 * Updates chart data safely without causing memory leaks
 * @param {string} canvasId - The canvas ID
 * @param {Object} newData - New chart data
 */
export function updateChartData(canvasId, newData) {
  const chart = chartInstances.get(canvasId);
  if (!chart) {
    console.warn(`Chart not found: ${canvasId}`);
    return;
  }

  try {
    // Clear existing data
    chart.data.labels = newData.labels || [];
    chart.data.datasets = newData.datasets || [];

    // Update chart
    chart.update('none'); // Disable animations for updates

    console.log(`Chart data updated: ${canvasId}`);
  } catch (error) {
    console.error(`Error updating chart ${canvasId}:`, error);
  }
}

/**
 * Cleanup all charts and observers
 */
export function cleanupAllCharts() {
  console.log(`Cleaning up ${chartInstances.size} chart instances`);

  chartInstances.forEach((chart, id) => {
    try {
      // Cleanup resize observer
      const canvas = document.getElementById(id);
      if (canvas && canvas._resizeObserver) {
        canvas._resizeObserver.disconnect();
        delete canvas._resizeObserver;
      }

      // Destroy chart
      chart.destroy();
    } catch (error) {
      console.error(`Error cleaning up chart ${id}:`, error);
    }
  });

  chartInstances.clear();
}

/**
 * Initialize chart containers with proper CSS
 */
export function initializeChartContainers() {
  const chartContainers = document.querySelectorAll('.chart-container, .chart-wrapper');

  chartContainers.forEach(container => {
    // CRITICAL: Set container CSS to prevent expansion
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.maxWidth = '100%';
    container.style.maxHeight = '400px';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';

    // Find canvas inside container
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    }
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupAllCharts);

/**
 * Default chart color palette
 */
const DEFAULT_CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
];

const DARK_CHART_COLORS = [
  '#FF7F9A', '#5BC0EB', '#FFD56B', '#66D9D9', '#B380FF',
  '#FFB366', '#FF7F9A', '#E0E0E0', '#66D9D9', '#FF7F9A'
];

/**
 * Gets chart colors based on current theme
 * @param {number} count - Number of colors needed
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Array<string>} Array of color strings
 */
export function getChartColors(count = 10, isDarkMode = false) {
  const colors = isDarkMode ? DARK_CHART_COLORS : DEFAULT_CHART_COLORS;

  // If we need more colors than available, repeat the pattern
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }

  return result;
}

/**
 * Gets a single chart color by index
 * @param {number} index - Color index
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {string} Color string
 */
export function getChartColor(index = 0, isDarkMode = false) {
  const colors = isDarkMode ? DARK_CHART_COLORS : DEFAULT_CHART_COLORS;
  return colors[index % colors.length];
}

/**
 * Generates colors for category data
 * @param {Array} categories - Array of category names
 * @param {Object} categoryColors - Mapping of category names to colors
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Array<string>} Array of colors matching categories
 */
export function getCategoryColors(categories, categoryColors = {}, isDarkMode = false) {
  return categories.map((category, index) => {
    // Use category-specific color if available
    if (categoryColors[category]) {
      return categoryColors[category];
    }
    // Fall back to default chart colors
    return getChartColor(index, isDarkMode);
  });
}
