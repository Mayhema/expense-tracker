// Directory: /src/chartManager.js

import { AppState } from "./appState.js";
import { handleError } from "./uiManager.js";

let pieChart = null;
let timelineChart = null;
let isUpdatingChart = false;  // Flag to prevent multiple concurrent updates
let updateRequestPending = false; // Flag to track pending update requests

// Track if we've already shown the warning
let noTransactionsWarningShown = false;

// Add counters for aggregated warnings
let invalidDateCount = 0;
let missingDataCount = 0;
let warningsLogged = false;

function resetWarningCounters() {
  invalidDateCount = 0;
  missingDataCount = 0;
  warningsLogged = false;
}

// Update the chart prevention code

export function updateChart(transactions) {
  // Add a static variable to track if we're already in an update process
  if (updateChart.isUpdating) {
    console.log("Chart update already in progress, skipping to prevent infinite loop");
    return;
  }

  try {
    updateChart.isUpdating = true;
    clearCharts();
    
    if (!transactions || transactions.length === 0) {
      if (!noTransactionsWarningShown) {
        console.warn("No transactions to render charts.");
        noTransactionsWarningShown = true;
        displayNoDataMessage("expenseChart", "No transaction data available");
        displayNoDataMessage("timelineChart", "No transaction data available");
      }
      return;
    }
    
    noTransactionsWarningShown = false;
    
    // Limit data points to prevent browser freeze and "too far apart" errors
    const maxDataPoints = 100; // Reduced from 200 to 100
    let processedTransactions = transactions;
    
    if (transactions.length > maxDataPoints) {
      console.warn(`Limiting chart to ${maxDataPoints} out of ${transactions.length} transactions`);
      // Use a better sampling method to avoid extreme date ranges
      processedTransactions = sampleTransactionsEvenly(transactions, maxDataPoints);
    }
    
    // Verify date ranges before rendering to catch extreme date issues
    if (!validateDateRange(processedTransactions)) {
      displayNoDataMessage("expenseChart", "Invalid date range in transactions");
      displayNoDataMessage("timelineChart", "Invalid date range in transactions");
      console.error("Date range too extreme for chart rendering");
      return;
    }
    
    updateExpenseChart(processedTransactions);
    updateTimelineChart(processedTransactions);
  } catch (error) {
    console.error("Error updating charts:", error);
    // Display error message in chart areas
    displayNoDataMessage("expenseChart", "Error rendering chart");
    displayNoDataMessage("timelineChart", "Error rendering chart");
  } finally {
    // Always reset the flag when done
    updateChart.isUpdating = false;
  }
}

// Add new function to sample transactions more intelligently
function sampleTransactionsEvenly(transactions, maxSamples) {
  if (transactions.length <= maxSamples) return transactions;
  
  // First sort by date
  const sortedTx = [...transactions].filter(tx => tx.date)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (sortedTx.length <= maxSamples) return sortedTx;
  
  // If we still have more transactions than max samples, take evenly spaced samples
  const result = [];
  const step = sortedTx.length / maxSamples;
  
  // Always include first and last transaction for accurate date range
  result.push(sortedTx[0]);
  
  for (let i = 1; i < maxSamples - 1; i++) {
    const index = Math.floor(i * step);
    if (index < sortedTx.length) {
      result.push(sortedTx[index]);
    }
  }
  
  // Add the last transaction
  if (sortedTx.length > 1) {
    result.push(sortedTx[sortedTx.length - 1]);
  }
  
  return result;
}

// Add validation for date ranges
function validateDateRange(transactions) {
  const dates = transactions
    .filter(tx => tx.date)
    .map(tx => new Date(tx.date))
    .filter(date => !isNaN(date.getTime()));
  
  if (dates.length < 2) return true;
  
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Calculate difference in days
  const diffTime = Math.abs(maxDate - minDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If more than 10 years apart, probably an error
  return diffDays <= 3650;
}

function displayNoDataMessage(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set text style
  ctx.fillStyle = "#999";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Draw the message in the center
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function clearCharts() {
  pieChart = destroyChart(pieChart);
  timelineChart = destroyChart(timelineChart);
}

function destroyChart(chart) {
  if (chart) {
    chart.destroy();
    return null;
  }
  return chart;
}

function createChartContext(chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    throw new Error(`Canvas element with ID "${chartId}" not found.`);
  }
  return canvas.getContext("2d");
}

function updateExpenseChart(transactions) {
  const ctx = createChartContext("expenseChart");
  const categorySums = {};

  transactions.forEach(tx => {
    // Only use expenses for this chart
    if (tx.expenses) {
      const amt = parseFloat(tx.expenses);
      if (isNaN(amt)) return;
      const cat = tx.category || "Uncategorized";
      categorySums[cat] = (categorySums[cat] || 0) + amt;
    }
  });

  const labels = Object.keys(categorySums);
  const data = labels.map(label => categorySums[label]);
  const colors = labels.map(label => AppState.categories[label] || "#888888");

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Expenses by Category'
        }
      }
    },
  });
}

function updateTimelineChart(transactions) {
  const ctx = createChartContext("timelineChart");
  const incomeData = {};
  const expenseData = {};
  
  // Reset counters
  resetWarningCounters();

  transactions.forEach(tx => {
    if (!tx.date || typeof tx.date !== "string") {
      invalidDateCount++;
      return;
    }
    
    const date = tx.date.substring(0, 10);
    
    // Track income and expenses separately
    if (tx.income) {
      incomeData[date] = (incomeData[date] || 0) + parseFloat(tx.income);
    }
    
    if (tx.expenses) {
      expenseData[date] = (expenseData[date] || 0) + parseFloat(tx.expenses);
    }
    
    if (!tx.income && !tx.expenses) {
      missingDataCount++;
    }
  });

  // Log aggregated warnings
  if ((invalidDateCount > 0 || missingDataCount > 0) && !warningsLogged) {
    if (invalidDateCount > 0) {
      console.warn(`Chart skipped ${invalidDateCount} transactions with invalid dates`);
    }
    if (missingDataCount > 0) {
      console.warn(`Chart skipped ${missingDataCount} transactions with missing income/expense data`);
    }
    warningsLogged = true;
  }

  // Get all unique dates
  const allDates = [...new Set([...Object.keys(incomeData), ...Object.keys(expenseData)])].sort();
  
  // Create datasets
  const incomeValues = allDates.map(date => incomeData[date] || 0);
  const expenseValues = allDates.map(date => expenseData[date] || 0);

  timelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates,
      datasets: [
        {
          label: "Income",
          data: incomeValues,
          borderColor: "rgba(75, 192, 75, 1)",
          backgroundColor: "rgba(75, 192, 75, 0.2)",
          fill: true,
        },
        {
          label: "Expenses",
          data: expenseValues,
          borderColor: "rgba(192, 75, 75, 1)",
          backgroundColor: "rgba(192, 75, 75, 0.2)",
          fill: true,
        }
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
        },
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Income and Expenses Over Time'
        }
      }
    },
  });
}