import { AppState } from "../appState.js";

// Add this safety check to the beginning of the file

// Make sure Chart.js is available
if (typeof Chart === 'undefined') {
  console.error('Chart.js not found! Charts will not render.');
}

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
 * Safely creates a Chart instance with error handling
 * @param {string} canvasId - ID of the canvas element
 * @param {object} config - Chart configuration
 * @returns {Chart|null} The Chart instance or null if error
 */
export function createSafeChart(canvasId, config) {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with ID ${canvasId} not found`);
      return null;
    }
    
    // Force clean any existing Chart instance
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    
    // Clear the canvas before creating a new chart
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add safeguards to config
    const safeConfig = {
      ...config,
      options: {
        ...(config.options || {}),
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // Disable animations
        },
        plugins: {
          ...(config.options?.plugins || {}),
          tooltip: {
            ...(config.options?.plugins?.tooltip || {}),
            enabled: true,
            position: 'nearest', // Simpler positioning
            events: ['mousemove', 'mouseout', 'click', 'touchstart'] // Limit events
          }
        },
        events: ['mousemove', 'mouseout', 'click', 'touchstart'] // Limit events that trigger repositioning
      }
    };
    
    return new Chart(ctx, safeConfig);
  } catch (error) {
    console.error(`Error creating chart for ${canvasId}:`, error);
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
  
  ctx.fillStyle = "#999";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
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
  
  return function(...args) {
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