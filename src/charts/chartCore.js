/**
 * Core chart configuration and utilities
 */

// Global chart instances to prevent memory leaks
const chartInstances = new Map();
const registeredCharts = new Map(); // Add this missing declaration

/**
 * Default chart configuration with flexible dimensions
 */
export const defaultChartConfig = {
  responsive: true,
  maintainAspectRatio: false, // CRITICAL: Allow height to adjust for content
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      // FIXED: Ensure legend has proper spacing and wrapping
      labels: {
        padding: 15,
        usePointStyle: true,
        boxWidth: 12,
        boxHeight: 12,
        generateLabels: function (chart) {
          const original = Chart.defaults.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);

          // Ensure labels wrap properly
          labels.forEach(label => {
            if (label.text && label.text.length > 20) {
              label.text = label.text.substring(0, 20) + '...';
            }
          });

          return labels;
        }
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      // FIXED: Ensure tooltips don't get cut off
      position: 'nearest',
      bodySpacing: 4,
      titleSpacing: 4,
      footerSpacing: 4,
      xPadding: 8,
      yPadding: 8
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true
      },
      // FIXED: Ensure x-axis labels don't get cut off
      ticks: {
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true
      },
      // FIXED: Ensure y-axis has proper padding
      ticks: {
        padding: 10
      }
    }
  },
  // FIXED: Ensure proper padding for all chart elements
  layout: {
    padding: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    }
  },
  // Prevent animations from causing memory leaks
  animation: {
    duration: 400,
    easing: 'easeInOutQuart'
  }
};

/**
 * Creates a chart with proper memory management and flexible dimensions
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {string} type - Chart type
 * @param {Object} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Chart} The created chart instance
 */
export function createChart(canvas, type, data, options = {}) {
  try {
    if (!canvas) {
      console.error("Canvas element is required for chart creation");
      return null;
    }

    const canvasId = canvas.id || `chart-${Date.now()}`;
    console.log(`Creating chart: ${canvasId} (${type})`);

    // Destroy existing chart if it exists
    destroyChart(canvasId);

    // FIXED: Ensure canvas has proper responsive dimensions
    const container = canvas.parentElement;
    if (container) {
      // FIXED: Don't set fixed dimensions, use CSS for responsiveness
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.display = 'block';
      canvas.style.boxSizing = 'border-box';
    }

    // FIXED: Merge options with special handling for chart-specific configurations
    const chartOptions = {
      ...defaultChartConfig,
      ...options,
      responsive: true,
      maintainAspectRatio: false,
      // FIXED: Add resize handling
      onResize: (chart, size) => {
        // Ensure chart doesn't grow beyond container
        const container = chart.canvas.parentElement;
        if (container) {
          const maxWidth = container.offsetWidth;
          const maxHeight = Math.min(container.offsetHeight, window.innerHeight * 0.8);

          if (size.width > maxWidth || size.height > maxHeight) {
            chart.resize(Math.min(size.width, maxWidth), Math.min(size.height, maxHeight));
          }
        }
      }
    };

    // FIXED: Special handling for pie/doughnut charts to ensure legend fits
    if (type === 'pie' || type === 'doughnut') {
      chartOptions.plugins.legend.position = 'bottom';
      chartOptions.layout.padding.bottom = 30;
    }

    // Create new chart
    const chart = new Chart(canvas, {
      type: type,
      data: data,
      options: chartOptions
    });

    // Register the chart
    registeredCharts.set(canvasId, chart);
    console.log(`Chart registered: ${canvasId}`);

    // FIXED: Add zoom change monitoring
    addZoomMonitoring(canvas, chart);

    // FIXED: Ensure chart resizes properly when container changes
    setTimeout(() => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    }, 100);

    return chart;
  } catch (error) {
    console.error("Error creating chart:", error);
    return null;
  }
}

/**
 * FIXED: Add zoom monitoring for individual charts
 */
function addZoomMonitoring(canvas, chart) {
  let lastDevicePixelRatio = window.devicePixelRatio;

  const checkZoom = () => {
    const currentDevicePixelRatio = window.devicePixelRatio;
    if (Math.abs(currentDevicePixelRatio - lastDevicePixelRatio) > 0.1) {
      lastDevicePixelRatio = currentDevicePixelRatio;

      setTimeout(() => {
        if (chart && chart.canvas && chart.canvas.isConnected) {
          // Reset canvas styling
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.maxWidth = '100%';
          canvas.style.maxHeight = '100%';

          // Force resize
          chart.resize();
          console.log(`Chart ${canvas.id} resized for zoom change`);
        }
      }, 50);
    }
  };

  window.addEventListener('resize', checkZoom);

  // Store for cleanup
  if (!canvas._zoomHandlers) {
    canvas._zoomHandlers = [];
  }
  canvas._zoomHandlers.push(checkZoom);
}

/**
 * Global resize handler with error protection
 */
function setupGlobalResizeHandler() {
  let resizeTimeout;

  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      try {
        registeredCharts.forEach((chartInstance, canvasId) => {
          // Check if chart and canvas still exist in DOM
          if (chartInstance && chartInstance.canvas && chartInstance.canvas.ownerDocument) {
            const canvas = document.getElementById(canvasId);
            if (canvas && canvas.isConnected) {
              chartInstance.resize();
            } else {
              // Chart canvas is no longer in DOM, clean it up
              console.log(`Cleaning up disconnected chart: ${canvasId}`);
              destroyChart(canvasId);
            }
          }
        });
      } catch (error) {
        console.error("Error in resize handler:", error);
        // Don't let resize errors break the app
      }
    }, 150);
  };

  window.addEventListener('resize', handleResize);

  // Return cleanup function
  return () => {
    clearTimeout(resizeTimeout);
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Safely destroys a chart and cleans up memory
 * @param {string} canvasId - The canvas ID
 */
export function destroyChart(canvasId) {
  const chartInstance = registeredCharts.get(canvasId);

  if (chartInstance) {
    try {
      // Check if chart is still valid before destroying
      if (chartInstance.canvas && chartInstance.canvas.ownerDocument) {
        chartInstance.destroy();
      }
      registeredCharts.delete(canvasId);
      console.log(`Chart destroyed: ${canvasId}`);
    } catch (error) {
      console.error(`Error destroying chart ${canvasId}:`, error);
      // Force removal from registry even if destroy fails
      registeredCharts.delete(canvasId);
    }
  }

  return null;
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
  const chart = registeredCharts.get(canvasId);
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
  console.log(`Cleaning up ${registeredCharts.size} chart instances`);

  registeredCharts.forEach((chart, id) => {
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

  registeredCharts.clear();
}

/**
 * Initialize chart containers with proper CSS for flexible heights
 */
export function initializeChartContainers() {
  const chartContainers = document.querySelectorAll('.chart-container, .chart-wrapper');

  chartContainers.forEach(container => {
    // FIXED: Set container CSS to allow flexible heights
    container.style.width = '100%';
    container.style.height = 'auto';
    container.style.minHeight = '400px';
    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Find canvas inside container
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.minHeight = '300px';
      canvas.style.maxHeight = 'none';
      canvas.style.flex = '1';
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
      const categoryData = categoryColors[category];
      // Handle both string and object category values
      if (typeof categoryData === 'string') {
        return categoryData;
      } else if (typeof categoryData === 'object' && categoryData.color) {
        return categoryData.color;
      }
    }
    // Fall back to default chart colors
    return getChartColor(index, isDarkMode);
  });
}

/**
 * Handle window resize events and trigger chart resizes
 */
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    try {
      registeredCharts.forEach((chart, canvasId) => {
        // Check if chart and its canvas still exist in DOM
        if (!chart || !chart.canvas || !chart.canvas.ownerDocument) {
          console.warn(`Chart ${canvasId} canvas no longer in DOM, removing from tracking`);
          registeredCharts.delete(canvasId);
          return;
        }

        // FIXED: Reset canvas dimensions before resize
        const canvas = chart.canvas;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';

        if (typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    } catch (error) {
      console.error("Error in resize handler:", error);
    }
  }, 100);
}

// Attach resize handler to window resize events
window.addEventListener('resize', handleResize);
