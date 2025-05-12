import { AppState } from "../core/appState.js";
import { updateTimelineChart } from "./timelineChart.js";
import { updateIncomeExpenseChart } from "./incomeExpenseChart.js";
import { updateExpenseChart } from "./expenseChart.js";
import { throttle } from "./chartCore.js";

// Store chart update functions for reuse
const updateFunctions = {
  timeline: updateTimelineChart,
  incomeExpense: updateIncomeExpenseChart,
  expense: updateExpenseChart
};

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

    // Use a safety wrapper to catch any chart errors
    const safeUpdateChart = (updateFn, chartName, transactions) => {
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
    };

    const transactions = AppState.transactions || [];

    // Check if there's actually data to display
    if (!transactions.length) {
      console.log("No transactions available for charts");
      // Still call update functions but handle empty state in each chart
    }

    // Update charts with safety wrappers
    setTimeout(() => {
      safeUpdateChart(updateTimelineChart, "timeline", transactions);

      setTimeout(() => {
        safeUpdateChart(updateExpenseChart, "expense", transactions);

        setTimeout(() => {
          safeUpdateChart(updateIncomeExpenseChart, "income-expense", transactions);
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

export default {
  initializeCharts,
  updateChartsWithCurrentData,
  cleanupAllCharts
};
