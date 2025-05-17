import { AppState } from "../core/appState.js";
import { updateTimelineChart } from "./timelineChart.js";
import { updateIncomeExpenseChart } from "./incomeExpenseChart.js";
import { updateExpenseChart } from "./expenseChart.js";

// Store chart update functions for reuse
const updateFunctions = {
  timeline: updateTimelineChart,
  incomeExpense: updateIncomeExpenseChart,
  expense: updateExpenseChart
};

// Add these variables to track current periods
let currentTimelinePeriod = 'month';
let currentCategoryPeriod = 'all';

// Initialize variable before use
let incomeExpenseChart = null;

/**
 * Initialize chart period selectors
 */
export function initializeChartPeriodSelectors() {
  const timelinePeriodSelect = document.getElementById('timelineChartPeriod');
  const categoryPeriodSelect = document.getElementById('categoryChartPeriod');

  if (timelinePeriodSelect) {
    // Set initial value
    timelinePeriodSelect.value = currentTimelinePeriod;

    // Add event listener
    timelinePeriodSelect.addEventListener('change', (e) => {
      currentTimelinePeriod = e.target.value;
      updateChartsWithCurrentData();
    });
  }

  if (categoryPeriodSelect) {
    // Set initial value
    categoryPeriodSelect.value = currentCategoryPeriod;

    // Add event listener
    categoryPeriodSelect.addEventListener('change', (e) => {
      currentCategoryPeriod = e.target.value;
      updateChartsWithCurrentData();
    });
  }
}

/**
 * Safety wrapper to catch any chart errors
 */
function safeUpdateChart(updateFn, chartName, transactions) {
  try {
    return updateFn(transactions);
  } catch (error) {
    console.error(`Error updating ${chartName} chart:`, error);

    // Mark the chart as having errors to disable animations
    window.chartJsErrorCount = (window.chartJsErrorCount || 0) + 1;

    // Apply patches again to ensure they're active
    if (typeof applyAdvancedChartPatches === 'function') {
      applyAdvancedChartPatches();
    }

    return false;
  }
}

// Helper functions to update individual charts
function updateTimelineChartSafely(transactions, period) {
  safeUpdateChart(() => {
    // Check if the chart element exists before updating
    const chartElement = document.getElementById("timelineChart");
    if (!chartElement) {
      console.warn("Timeline chart element not found, skipping update");
      return;
    }

    // Try to destroy any existing chart instances on this canvas
    try {
      if (window.Chart && window.Chart.getChart) {
        const existingChart = window.Chart.getChart(chartElement);
        if (existingChart && typeof existingChart.destroy === 'function') {
          existingChart.destroy();
          console.log("Destroyed existing chart on timeline canvas");
        }
      }
    } catch (err) {
      console.warn("Error cleaning up existing chart:", err);
    }

    // Import and call the update function
    import("./timelineChart.js").then(module => {
      if (typeof module.updateTimelineChart === 'function') {
        try {
          module.updateTimelineChart(transactions, period);
        } catch (err) {
          console.error("Error in updateTimelineChart:", err);

          // Implement recovery - delay and retry once
          setTimeout(() => {
            try {
              // Clear the window reference first
              window.timelineChart = null;
              module.updateTimelineChart(transactions, period);
            } catch (retryErr) {
              console.error("Chart recovery failed:", retryErr);
            }
          }, 300);
        }
      }
    }).catch(err => {
      console.error("Error importing timeline chart module:", err);
    });
  }, "timeline");
}

function updateExpenseChartSafely(transactions) {
  return safeUpdateChart((tx) => updateExpenseChart(tx), "expense", transactions);
}

function updateIncomeExpenseChartSafely(transactions) {
  return safeUpdateChart((tx) => updateIncomeExpenseChart(tx), "income-expense", transactions);
}

/**
 * Updates all charts with current transaction data
 */
export function updateChartsWithCurrentData() {
  try {
    // Prevent multiple simultaneous chart updates
    if (AppState.isChartUpdateInProgress) {
      console.log("Chart update already in progress, skipping...");
      return;
    }

    AppState.isChartUpdateInProgress = true;
    console.log("Updating charts with current transaction data");

    // Get current transactions
    const transactions = AppState.transactions || [];

    // Check if there's data to display - IMPROVED LOGGING
    if (!transactions.length) {
      console.log("No transactions available - charts will display empty state");
    }

    // Use longer delays between chart updates to avoid conflicts
    setTimeout(function updateTimeline() {
      updateTimelineChartSafely(transactions, currentTimelinePeriod);

      setTimeout(function updateExpense() {
        updateExpenseChartSafely(transactions);

        setTimeout(function updateIncomeExpense() {
          updateIncomeExpenseChartSafely(transactions);
          AppState.isChartUpdateInProgress = false;
        }, 200); // Increased delay
      }, 200); // Increased delay
    }, 100);
  } catch (error) {
    console.error("Error in updateChartsWithCurrentData:", error);
    AppState.isChartUpdateInProgress = false;
  }
}

/**
 * Filters transactions based on selected time period
 * @param {Array} transactions - The transactions to filter
 * @param {string} period - Time period to filter by (all, year, month, etc)
 * @returns {Array} Filtered transactions
 */
function filterTransactionsByPeriod(transactions, period) {
  if (period === 'all' || !period) return transactions;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return transactions.filter(tx => {
    if (!tx.date) return false;

    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return false;

    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth();

    switch (period) {
      case 'year':
        return txYear === currentYear;
      case 'half':
        return txYear === currentYear &&
          Math.floor(txMonth / 6) === Math.floor(currentMonth / 6);
      case 'quarter':
        return txYear === currentYear &&
          Math.floor(txMonth / 3) === Math.floor(currentMonth / 3);
      case 'month':
        return txYear === currentYear && txMonth === currentMonth;
      default:
        return true;
    }
  });
}

/**
 * Initializes charts and adds event listeners for toggles
 */
export function initializeCharts() {
  // Call period selector initialization
  initializeChartPeriodSelectors();

  // Hide debug buttons by default, they're shown only in debug mode
  const chartControls = document.querySelectorAll('.chart-controls');
  chartControls.forEach(control => {
    control.style.display = 'none'; // Hide by default
  });

  // Attach event listeners to chart period selectors
  document.addEventListener('DOMContentLoaded', () => {
    const timelinePeriodSelect = document.getElementById('timelineChartPeriod');
    const categoryPeriodSelect = document.getElementById('categoryChartPeriod');

    // Add toggle handlers for all three charts
    const toggleIncomeExpenseBtn = document.getElementById('toggleIncomeExpenseChartBtn');
    const toggleExpenseChartBtn = document.getElementById('toggleExpenseChartBtn');
    const toggleTimelineChartBtn = document.getElementById('toggleTimelineChartBtn');

    if (toggleIncomeExpenseBtn) {
      toggleIncomeExpenseBtn.addEventListener('click', function () {
        const wrapper = document.getElementById('incomeExpenseChart').closest('.chart-wrapper');
        if (wrapper) {
          wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
          this.style.opacity = wrapper.style.display === 'none' ? 0.5 : 1;
        }
      });
    }

    if (toggleExpenseChartBtn) {
      toggleExpenseChartBtn.addEventListener('click', function () {
        const wrapper = document.getElementById('expenseChart').closest('.chart-wrapper');
        if (wrapper) {
          wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
          this.style.opacity = wrapper.style.display === 'none' ? 0.5 : 1;
        }
      });
    }

    if (toggleTimelineChartBtn) {
      toggleTimelineChartBtn.addEventListener('click', function () {
        const wrapper = document.getElementById('timelineChart').closest('.chart-wrapper');
        if (wrapper) {
          wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
          this.style.opacity = wrapper.style.display === 'none' ? 0.5 : 1;
        }
      });
    }

    // Period change handlers
    if (timelinePeriodSelect) {
      timelinePeriodSelect.addEventListener('change', updateChartsWithCurrentData);
    }

    if (categoryPeriodSelect) {
      categoryPeriodSelect.addEventListener('change', updateChartsWithCurrentData);
    }

    // Update charts initially
    if (AppState.transactions && AppState.transactions.length > 0) {
      setTimeout(updateChartsWithCurrentData, 300);
    }
  });
}

/**
 * Forces an update of all charts
 */
export function refreshAllCharts() {
  updateChartsWithCurrentData(); // FIXED: Changed from updateCharts
}

/**
 * Clean up all charts
 */
export function cleanupAllCharts() {
  cleanupExpenseChart();
  cleanupTimelineChart();
  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
    incomeExpenseChart = null;
  }
}

export function updateIncomeVsExpenseChart(transactions) {
  // ...existing code...

  // Use the initialized variable
  incomeExpenseChart = createSafeChart("incomeExpenseChart", config);

  // ...existing code...
}

export default {
  initializeCharts,
  updateChartsWithCurrentData,
  cleanupAllCharts
};
