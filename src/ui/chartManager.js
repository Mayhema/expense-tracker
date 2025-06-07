// FIXED: Cache DOM elements to avoid repeated queries
const chartCache = {
  containers: new Map(),
  charts: new Map(),
  eventListeners: new Map()
};

// FIXED: Use requestAnimationFrame instead of arbitrary 500ms setTimeout
function initializeChart(containerId, chartData, chartType = 'doughnut') {
  // Cache DOM element
  if (!chartCache.containers.has(containerId)) {
    chartCache.containers.set(containerId, document.getElementById(containerId));
  }

  const container = chartCache.containers.get(containerId);
  if (!container) {
    console.error(`Chart container ${containerId} not found`);
    return null;
  }

  // FIXED: Use requestAnimationFrame for better performance
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      try {
        // Clean up existing chart if it exists
        if (chartCache.charts.has(containerId)) {
          chartCache.charts.get(containerId).destroy();
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

// FIXED: Proper cleanup function for memory leaks
function cleanupChart(containerId) {
  // Remove chart
  if (chartCache.charts.has(containerId)) {
    chartCache.charts.get(containerId).destroy();
    chartCache.charts.delete(containerId);
  }

  // Remove cached DOM element
  chartCache.containers.delete(containerId);

  // FIXED: Clean up event listeners
  if (chartCache.eventListeners.has(containerId)) {
    const listeners = chartCache.eventListeners.get(containerId);
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    chartCache.eventListeners.delete(containerId);
  }
}

// FIXED: Track event listeners for proper cleanup
function addEventListenerWithCleanup(containerId, element, event, handler) {
  if (!chartCache.eventListeners.has(containerId)) {
    chartCache.eventListeners.set(containerId, []);
  }

  chartCache.eventListeners.get(containerId).push({ element, event, handler });
  element.addEventListener(event, handler);
}

// FIXED: Cleanup all charts when needed
function cleanupAllCharts() {
  chartCache.charts.forEach((chart, containerId) => {
    cleanupChart(containerId);
  });
  chartCache.containers.clear();
  chartCache.eventListeners.clear();
}
