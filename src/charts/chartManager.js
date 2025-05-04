import { displayNoDataMessage } from './chartCore.js';
import { updateExpenseChart, cleanupExpenseChart } from './expenseChart.js';
import { updateTimelineChart, cleanupTimelineChart } from './timelineChart.js';
import { AppState } from '../appState.js'; // Also adding AppState import

// Track which charts are enabled
export let expenseChartEnabled = true;
export let timelineChartEnabled = true;

/**
 * Updates all charts with the given transactions
 * @param {Array} transactions - The transactions to display
 */
export function updateCharts(transactions) {
  console.log("Chart update requested with", transactions?.length || 0, "transactions");
  
  // Add transaction logging to help debug
  if (transactions && transactions.length > 0) {
    console.log("First transaction:", JSON.stringify(transactions[0]));
  }
  
  // No need to update if no data
  if (!transactions || !transactions.length) {
    if (expenseChartEnabled) {
      try {
        updateExpenseChart([]);
      } catch (e) {
        console.error("Error updating empty expense chart:", e);
      }
    }
    
    if (timelineChartEnabled) {
      try {
        updateTimelineChart([]);
      } catch (e) {
        console.error("Error updating empty timeline chart:", e);
      }
    }
    return;
  }
  
  // Update expense chart first if enabled
  if (expenseChartEnabled) {
    try {
      // Use direct update instead of throttled to minimize race conditions
      updateExpenseChart(transactions);
    } catch (e) {
      console.error("Error in expense chart update:", e);
    }
  }
  
  // Short delay before updating timeline chart to avoid resource contention
  setTimeout(() => {
    if (timelineChartEnabled) {
      try {
        // Use direct update instead of throttled
        updateTimelineChart(transactions);
      } catch (e) {
        console.error("Error in timeline chart update:", e);
      }
    }
  }, 300);
}

// Update the toggle functions to be more robust

/**
 * Toggle the expense chart on/off
 * @returns {boolean} New state
 */
export function toggleExpenseChart() {
  try {
    expenseChartEnabled = !expenseChartEnabled;
    console.log(`Expense chart ${expenseChartEnabled ? 'enabled' : 'disabled'}`);
    
    if (!expenseChartEnabled) {
      cleanupExpenseChart();
      // Use try-catch around displayNoDataMessage
      try {
        displayNoDataMessage("expenseChart", "Expense chart disabled");
      } catch (err) {
        console.error("Failed to display message:", err);
      }
    } else if (typeof AppState !== 'undefined' && AppState.transactions && AppState.transactions.length > 0) {
      // Only update if AppState and data exist
      updateExpenseChart(AppState.transactions);
    } else {
      try {
        displayNoDataMessage("expenseChart", "No transaction data available");
      } catch (err) {
        console.error("Failed to display message:", err);
      }
    }
    
    return expenseChartEnabled;
  } catch (error) {
    console.error("Error in toggleExpenseChart:", error);
    return expenseChartEnabled;
  }
}

/**
 * Toggle the timeline chart on/off
 * @returns {boolean} New state
 */
export function toggleTimelineChart() {
  try {
    timelineChartEnabled = !timelineChartEnabled;
    console.log(`Timeline chart ${timelineChartEnabled ? 'enabled' : 'disabled'}`);
    
    if (!timelineChartEnabled) {
      cleanupTimelineChart();
      // Use try-catch around displayNoDataMessage
      try {
        displayNoDataMessage("timelineChart", "Timeline chart disabled");
      } catch (err) {
        console.error("Failed to display message:", err);
      }
    } else if (typeof AppState !== 'undefined' && AppState.transactions && AppState.transactions.length > 0) {
      // Only update if AppState and data exist
      updateTimelineChart(AppState.transactions);
    } else {
      try {
        displayNoDataMessage("timelineChart", "No transaction data available");
      } catch (err) {
        console.error("Failed to display message:", err);
      }
    }
    
    return timelineChartEnabled;
  } catch (error) {
    console.error("Error in toggleTimelineChart:", error);
    return timelineChartEnabled;
  }
}

/**
 * Clean up all charts
 */
export function cleanupCharts() {
  cleanupExpenseChart();
  cleanupTimelineChart();
}

/**
 * Reset all charts
 */
export function resetCharts() {
  cleanupCharts();
}

// Ensure cleanup on page unload
window.addEventListener('beforeunload', cleanupCharts);