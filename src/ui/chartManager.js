// Chart management with proper memory cleanup
const chartCache = {
  containers: new Map(),
  charts: new Map(),
  eventListeners: new Map()
};

/**
 * Initialize chart with proper error handling
 * @param {string} containerId - Chart container ID
 * @param {Object} chartData - Chart data
 * @param {string} chartType - Chart type
 * @returns {Promise<Chart|null>} Chart instance or null
 */
function initializeChart(containerId, chartData, chartType = 'doughnut') {
  // Cache DOM element
  if (!chartCache.containers.has(containerId)) {
    chartCache.containers.set(containerId, document.getElementById(containerId));
  }

  const container = chartCache.containers.get(containerId);
  if (!container) {
    console.error(`Chart container ${containerId} not found`);
    return Promise.resolve(null);
  }

  // Use requestAnimationFrame for better performance
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        // Clean up existing chart if it exists
        if (chartCache.charts.has(containerId)) {
          chartCache.charts.get(containerId).destroy();
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
          console.error('Chart.js is not available');
          resolve(null);
          return;
        }

        const chart = createChart(container, chartData, chartType);
        chartCache.charts.set(containerId, chart);
        resolve(chart);
      } catch (error) {
        console.error('Error initializing chart:', error);
        resolve(null);
      }
    });
  });
}

/**
 * Create chart instance
 * @param {HTMLElement} container - Chart container
 * @param {Object} chartData - Chart data
 * @param {string} chartType - Chart type
 * @returns {Chart} Chart instance
 */
function createChart(container, chartData, chartType) {
  const canvas = container.querySelector('canvas') || container;
  const ctx = canvas.getContext('2d');

  return new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

/**
 * Cleanup chart and remove from cache
 * @param {string} containerId - Chart container ID
 */
function cleanupChart(containerId) {
  // Remove chart
  if (chartCache.charts.has(containerId)) {
    try {
      chartCache.charts.get(containerId).destroy();
    } catch (error) {
      console.error(`Error destroying chart ${containerId}:`, error);
    }
    chartCache.charts.delete(containerId);
  }

  // Remove cached DOM element
  chartCache.containers.delete(containerId);

  // Clean up event listeners
  if (chartCache.eventListeners.has(containerId)) {
    const listeners = chartCache.eventListeners.get(containerId);
    listeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.error(`Error removing event listener:`, error);
      }
    });
    chartCache.eventListeners.delete(containerId);
  }
}

/**
 * Add event listener with cleanup tracking
 * @param {string} containerId - Chart container ID
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
function addEventListenerWithCleanup(containerId, element, event, handler) {
  if (!chartCache.eventListeners.has(containerId)) {
    chartCache.eventListeners.set(containerId, []);
  }

  chartCache.eventListeners.get(containerId).push({ element, event, handler });
  element.addEventListener(event, handler);
}

/**
 * Cleanup all charts
 */
function cleanupAllCharts() {
  chartCache.charts.forEach((chart, containerId) => {
    cleanupChart(containerId);
  });
  chartCache.containers.clear();
  chartCache.eventListeners.clear();
}

// Export functions
export {
  initializeChart,
  cleanupChart,
  addEventListenerWithCleanup,
  cleanupAllCharts
};
