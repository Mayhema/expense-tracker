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
      console.warn("Timeline chart element not found");
      return;
    }

    // Import and call the update function
    import("./timelineChart.js").then(module => {
      if (typeof module.updateTimelineChart === 'function') {
        module.updateTimelineChart(transactions, period);
      } else {
        console.error("updateTimelineChart function not found in module");
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
    if (AppState.isChartUpdateInProgress) {
      console.log("Chart update already in progress, skipping...");
      return;
    }

    AppState.isChartUpdateInProgress = true;
    console.log("Updating charts with current transaction data");

    const transactions = AppState.transactions || [];

    // Check if there's actually data to display
    if (!transactions.length) {
      console.log("No transactions available for charts");
      // Still call update functions but handle empty state in each chart
    }

    // Filter transactions by appropriate period for each chart type
    const timelineTransactions = transactions;
    const categoryTransactions = filterTransactionsByPeriod(transactions, currentCategoryPeriod);

    // Update charts sequentially without excessive nesting
    setTimeout(function updateTimeline() {
      updateTimelineChartSafely(timelineTransactions, currentTimelinePeriod);

      setTimeout(function updateExpense() {
        updateExpenseChartSafely(categoryTransactions);

        setTimeout(function updateIncomeExpense() {
          updateIncomeExpenseChartSafely(categoryTransactions);
          AppState.isChartUpdateInProgress = false;
        }, 50);
      }, 50);
    }, 50);
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
