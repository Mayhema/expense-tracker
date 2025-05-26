/**
 * Chart Bundle - Consolidates all chart-related functionality
 * This reduces the number of separate HTTP requests
 */

import { AppState } from '../core/appState.js';
import { showToast } from '../ui/uiManager.js';

// Re-export all chart functionality
export { updateTimelineChart } from '../charts/timelineChart.js';
export { updateIncomeExpenseChart } from '../charts/incomeExpenseChart.js';
export { updateExpenseChart, updateExpenseCategoryChart } from '../charts/expenseChart.js';

/**
 * Chart instances
 */
let incomeExpenseChart = null;
let expenseCategoryChart = null;
let timelineChart = null;

/**
 * Initialize all charts
 */
export function initializeCharts() {
  console.log("ChartBundle: Initializing charts with memory management");

  try {
    // CRITICAL: Initialize chart containers first to set proper dimensions
    import("../charts/chartCore.js").then(coreModule => {
      if (typeof coreModule.initializeChartContainers === 'function') {
        coreModule.initializeChartContainers();
      }
    });

    // Initialize individual charts with delay to prevent conflicts
    setTimeout(() => {
      initializeExpenseChart();
    }, 100);

    setTimeout(() => {
      initializeIncomeExpenseChart();
    }, 200);

    setTimeout(() => {
      initializeTimelineChart();
    }, 300);

    // Set up global chart update function with throttling
    setupGlobalChartUpdater();

    console.log("ChartBundle: All charts initialized");
  } catch (error) {
    console.error("ChartBundle: Error initializing charts:", error);
  }
}

/**
 * Sets up throttled global chart updater to prevent infinite loops
 */
function setupGlobalChartUpdater() {
  let updateInProgress = false;
  let pendingUpdate = false;

  window.updateChartsWithCurrentData = function () {
    if (updateInProgress) {
      pendingUpdate = true;
      return;
    }

    updateInProgress = true;

    try {
      console.log("ChartBundle: Updating all charts with current data");

      // Import AppState
      import("../core/appState.js").then(stateModule => {
        const transactions = stateModule.AppState.transactions || [];

        // Update each chart individually with error handling
        updateExpenseChartSafely(transactions);
        updateIncomeExpenseChartSafely(transactions);
        updateTimelineChartSafely(transactions);

      }).catch(error => {
        console.error("ChartBundle: Error accessing AppState:", error);
      }).finally(() => {
        updateInProgress = false;

        // Handle pending update
        if (pendingUpdate) {
          pendingUpdate = false;
          setTimeout(() => window.updateChartsWithCurrentData(), 100);
        }
      });

    } catch (error) {
      console.error("ChartBundle: Error in updateChartsWithCurrentData:", error);
      updateInProgress = false;
    }
  };
}

/**
 * Safely update expense chart
 */
function updateExpenseChartSafely(transactions) {
  try {
    import("../charts/expenseChart.js").then(module => {
      if (typeof module.updateExpenseChart === 'function') {
        module.updateExpenseChart(transactions);
      }
    }).catch(error => {
      console.error("ChartBundle: Error updating expense chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in updateExpenseChartSafely:", error);
  }
}

/**
 * Safely update income/expense chart
 */
function updateIncomeExpenseChartSafely(transactions) {
  try {
    import("../charts/incomeExpenseChart.js").then(module => {
      if (typeof module.updateIncomeExpenseChart === 'function') {
        module.updateIncomeExpenseChart(transactions);
      }
    }).catch(error => {
      console.error("ChartBundle: Error updating income/expense chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in updateIncomeExpenseChartSafely:", error);
  }
}

/**
 * Safely update timeline chart
 */
function updateTimelineChartSafely(transactions) {
  try {
    import("../charts/timelineChart.js").then(module => {
      if (typeof module.updateTimelineChart === 'function') {
        module.updateTimelineChart(transactions);
      }
    }).catch(error => {
      console.error("ChartBundle: Error updating timeline chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in updateTimelineChartSafely:", error);
  }
}

/**
 * Initialize expense chart safely
 */
function initializeExpenseChart() {
  try {
    import("../charts/expenseChart.js").then(module => {
      if (typeof module.initializeExpenseChart === 'function') {
        module.initializeExpenseChart();
        console.log("ChartBundle: Expense chart initialized");
      }
    }).catch(error => {
      console.error("ChartBundle: Error initializing expense chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in initializeExpenseChart:", error);
  }
}

/**
 * Initialize income/expense chart safely
 */
function initializeIncomeExpenseChart() {
  try {
    import("../charts/incomeExpenseChart.js").then(module => {
      if (typeof module.initializeIncomeExpenseChart === 'function') {
        module.initializeIncomeExpenseChart();
        console.log("ChartBundle: Income/Expense chart initialized");
      }
    }).catch(error => {
      console.error("ChartBundle: Error initializing income/expense chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in initializeIncomeExpenseChart:", error);
  }
}

/**
 * Initialize timeline chart safely
 */
function initializeTimelineChart() {
  try {
    import("../charts/timelineChart.js").then(module => {
      if (typeof module.initializeTimelineChart === 'function') {
        module.initializeTimelineChart();
        console.log("ChartBundle: Timeline chart initialized");
      }
    }).catch(error => {
      console.error("ChartBundle: Error initializing timeline chart:", error);
    });
  } catch (error) {
    console.error("ChartBundle: Error in initializeTimelineChart:", error);
  }
}

/**
 * Cleanup charts when needed
 */
export function cleanupCharts() {
  import("../charts/chartCore.js").then(coreModule => {
    if (typeof coreModule.cleanupAllCharts === 'function') {
      coreModule.cleanupAllCharts();
    }
  });
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other initialization to complete
  setTimeout(initializeCharts, 1000);
});
