// Directory: /src/chartManager.js

import { AppState } from "./appState.js";
import { handleError } from "./uiManager.js";
import { getContrastColor } from './utils.js';

let pieChart = null;
let timelineChart = null;
let isUpdatingChart = false;  // Flag to prevent multiple concurrent updates
let updateRequestPending = false; // Flag to track pending update requests
let chartDebugMode = false; // Add at the top of the file

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

// Add this function to toggle chart debugging
export function toggleChartDebugMode() {
  chartDebugMode = !chartDebugMode;
  console.log(`Chart debug mode: ${chartDebugMode ? "ON" : "OFF"}`);
  
  if (chartDebugMode) {
    // Show debug UI
    const debugPanel = document.createElement('div');
    debugPanel.id = 'chartDebugPanel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.top = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.zIndex = '9999';
    debugPanel.style.borderRadius = '5px';
    debugPanel.innerHTML = `
      <h3>Chart Debug</h3>
      <button id="disableCharts">Disable Charts</button>
      <button id="enableCharts">Enable Charts</button>
      <div id="chartDebugInfo"></div>
    `;
    document.body.appendChild(debugPanel);
    
    document.getElementById('disableCharts').addEventListener('click', () => {
      clearCharts();
      displayNoDataMessage("expenseChart", "Charts disabled for debugging");
      displayNoDataMessage("timelineChart", "Charts disabled for debugging");
      updateChart.disabled = true;
      console.log("Charts disabled");
    });
    
    document.getElementById('enableCharts').addEventListener('click', () => {
      updateChart.disabled = false;
      console.log("Charts enabled");
      updateChart(AppState.transactions);
    });
  } else {
    // Remove debug UI
    const debugPanel = document.getElementById('chartDebugPanel');
    if (debugPanel) debugPanel.remove();
  }
}

// Add more detailed debugging for charts

// Add new debug functions
let chartDebugLevel = 0; // 0=off, 1=basic, 2=detailed, 3=verbose

/**
 * Sets the chart debug level
 * @param {number} level - 0=off, 1=basic, 2=detailed, 3=verbose
 */
export function setChartDebugLevel(level) {
  chartDebugLevel = level;
  console.log(`Chart debug level set to ${level}`);
  
  // Show the debug panel if level > 0
  if (level > 0) {
    createOrUpdateChartDebugPanel();
  } else {
    const panel = document.getElementById('chartDebugPanel');
    if (panel) panel.remove();
  }
}

/**
 * Creates or updates the chart debug panel
 */
function createOrUpdateChartDebugPanel() {
  let panel = document.getElementById('chartDebugPanel');
  
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'chartDebugPanel';
    Object.assign(panel.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      zIndex: '9999',
      borderRadius: '5px',
      maxHeight: '80vh',
      overflow: 'auto',
      width: '350px',
      fontSize: '12px',
      fontFamily: 'monospace'
    });
    document.body.appendChild(panel);
  }
  
  panel.innerHTML = `
    <h3>Chart Debug (Level: ${chartDebugLevel})</h3>
    <div>
      <button onclick="window.setChartDebugLevel(0)">Off</button>
      <button onclick="window.setChartDebugLevel(1)">Basic</button>
      <button onclick="window.setChartDebugLevel(2)">Detailed</button>
      <button onclick="window.setChartDebugLevel(3)">Verbose</button>
    </div>
    <div id="chartDebugInfo"></div>
    <h4>Actions</h4>
    <div>
      <button onclick="window.disableCharts()">Disable Charts</button>
      <button onclick="window.enableCharts()">Enable Charts</button>
      <button onclick="window.analyzeChartData()">Analyze Data</button>
    </div>
    <div id="chartAnalysis"></div>
  `;
}

/**
 * Logs debug information to the chart debug panel
 * @param {string} message - Debug message to display
 * @param {number} level - Minimum debug level required to show this message
 */
function chartDebugLog(message, level = 1) {
  if (chartDebugLevel >= level) {
    console.log(`[CHART ${level}]: ${message}`);
    
    // Also add to debug panel if it exists
    const debugInfo = document.getElementById('chartDebugInfo');
    if (debugInfo) {
      const entry = document.createElement('div');
      entry.style.borderBottom = '1px solid #444';
      entry.style.paddingBottom = '4px';
      entry.style.marginBottom = '4px';
      entry.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
      debugInfo.prepend(entry);
      
      // Limit entries
      if (debugInfo.children.length > 20) {
        debugInfo.lastChild.remove();
      }
    }
  }
}

/**
 * Analyzes chart data for potential issues
 */
function analyzeChartData() {
  const analysis = document.getElementById('chartAnalysis');
  if (!analysis) return;
  
  if (!AppState.transactions || AppState.transactions.length === 0) {
    analysis.innerHTML = '<div style="color: orange">No transactions to analyze</div>';
    return;
  }
  
  // Extract dates and check for issues
  const dateValues = AppState.transactions
    .map(tx => tx.date ? { date: tx.date, source: tx.fileName } : null)
    .filter(Boolean);
  
  // Check date formats
  const invalidDates = dateValues.filter(d => {
    try {
      const date = new Date(d.date);
      return isNaN(date.getTime());
    } catch (e) {
      return true;
    }
  });
  
  // Convert dates to actual Date objects
  const validDates = dateValues
    .filter(d => !invalidDates.includes(d))
    .map(d => ({ 
      date: new Date(d.date), 
      source: d.source,
      original: d.date
    }));
  
  // Get date range
  const timestamps = validDates.map(d => d.date.getTime());
  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));
  const rangeDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
  
  // Build analysis HTML
  let html = `
    <div style="margin-top: 10px;">
      <div><b>Transactions:</b> ${AppState.transactions.length}</div>
      <div><b>With dates:</b> ${dateValues.length}</div>
      <div><b>Invalid dates:</b> ${invalidDates.length}</div>
      <div><b>Date range:</b> ${rangeDays} days</div>
      <div><b>Earliest:</b> ${minDate.toISOString().split('T')[0]}</div>
      <div><b>Latest:</b> ${maxDate.toISOString().split('T')[0]}</div>
  `;
  
  // Add warnings
  if (invalidDates.length > 0) {
    html += `<div style="color: red">⚠️ Found ${invalidDates.length} invalid dates</div>`;
    if (invalidDates.length < 10) {
      html += '<ul>';
      invalidDates.forEach(d => {
        html += `<li>${d.date} (${d.source})</li>`;
      });
      html += '</ul>';
    }
  }
  
  if (rangeDays > 3650) {
    html += `<div style="color: red">⚠️ Date range exceeds 10 years (${rangeDays} days)</div>`;
    
    // Look for outliers
    const avg = timestamps.reduce((sum, t) => sum + t, 0) / timestamps.length;
    const stdDev = Math.sqrt(
      timestamps.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / timestamps.length
    );
    
    const outliers = validDates.filter(d => 
      Math.abs(d.date.getTime() - avg) > 2 * stdDev
    );
    
    if (outliers.length > 0 && outliers.length < 20) {
      html += '<div>Potential outlier dates:</div><ul>';
      outliers.forEach(o => {
        html += `<li>${o.original} (${o.source})</li>`;
      });
      html += '</ul>';
    }
  }
  
  html += '</div>';
  analysis.innerHTML = html;
}

// Update the chart prevention code

export function updateChart(transactions) {
  // Add throttling to prevent too many updates
  const now = Date.now();
  updateChart.lastCallTime = updateChart.lastCallTime || 0;
  
  // If called too frequently, throttle updates
  if (now - updateChart.lastCallTime < 200) {
    chartDebugLog("Chart update throttled (too frequent)", 1);
    
    // Use setTimeout to ensure we eventually update
    if (!updateChart.timeoutId) {
      updateChart.timeoutId = setTimeout(() => {
        chartDebugLog("Running delayed chart update", 1);
        updateChart.lastCallTime = Date.now();
        updateChart.timeoutId = null;
        performChartUpdate(transactions);
      }, 300);
    }
    return;
  }
  
  // Update the last call time
  updateChart.lastCallTime = now;
  
  // Clear any pending timeout
  if (updateChart.timeoutId) {
    clearTimeout(updateChart.timeoutId);
    updateChart.timeoutId = null;
  }
  
  performChartUpdate(transactions);
}

// Separate the actual chart update logic into its own function
function performChartUpdate(transactions) {
  chartDebugLog(`Processing chart update with ${transactions?.length || 0} transactions`, 1);
  
  if (updateChart.disabled) {
    chartDebugLog("Charts are disabled", 1);
    return;
  }
  
  try {
    // Track update attempts to prevent cascading failures
    updateChart.updateCount = (updateChart.updateCount || 0) + 1;
    
    // Safety circuit breaker - if too many updates in short succession, disable charts
    if (updateChart.updateCount > 10) {
      const elapsed = Date.now() - (updateChart.firstUpdateTime || Date.now());
      if (elapsed < 2000) {
        console.error("Too many chart updates in short period - disabling charts to prevent infinite loop");
        updateChart.disabled = true;
        displayNoDataMessage("expenseChart", "Charts disabled due to rendering issues");
        displayNoDataMessage("timelineChart", "Charts disabled due to rendering issues");
        return;
      } else {
        // Reset counters if enough time has passed
        updateChart.updateCount = 1;
        updateChart.firstUpdateTime = Date.now();
      }
    }
    
    if (!updateChart.firstUpdateTime) {
      updateChart.firstUpdateTime = Date.now();
    }
    
    // Don't try to update charts if we don't have any transactions
    if (!transactions || transactions.length === 0) {
      chartDebugLog("No transactions to chart", 1);
      displayNoDataMessage("expenseChart", "No transaction data available");
      displayNoDataMessage("timelineChart", "No transaction data available");
      return;
    }
    
    // Only update enabled charts
    if (expenseChartEnabled) {
      chartDebugLog("Updating expense chart", 1);
      updateExpenseChart(transactions);
    } else {
      chartDebugLog("Expense chart is disabled", 1);
      displayNoDataMessage("expenseChart", "Expense chart disabled");
    }
    
    if (timelineChartEnabled) {
      chartDebugLog("Updating timeline chart", 1);
      updateTimelineChart(transactions);
    } else {
      chartDebugLog("Timeline chart is disabled", 1);
      displayNoDataMessage("timelineChart", "Timeline chart disabled");
    }
    
    chartDebugLog("Chart update completed successfully", 1);
  } catch (error) {
    console.error("Chart rendering error:", error);
    displayNoDataMessage("expenseChart", "Error rendering chart");
    displayNoDataMessage("timelineChart", "Error rendering chart");
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
  try {
    const dates = transactions
      .filter(tx => tx.date)
      .map(tx => new Date(tx.date))
      .filter(date => !isNaN(date.getTime()));
    
    if (dates.length < 2) return true;
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d.getTime())));
    
    // Calculate difference in days
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If more than 10 years apart, probably an error
    return diffDays <= 3650;
  } catch (error) {
    console.error("Error validating date range:", error);
    return false;
  }
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
  try {
    chartDebugLog("Starting expense chart rendering", 2);
    
    // Get the canvas and context
    const canvas = document.getElementById("expenseChart");
    if (!canvas) {
      chartDebugLog("Expense chart canvas not found", 1);
      return;
    }
    
    // CRITICAL FIX: Always destroy existing chart before creating a new one
    if (pieChart) {
      chartDebugLog("Destroying existing pie chart instance", 2);
      pieChart.destroy();
      pieChart = null;
    }
    
    // Group data by category
    const categoryTotals = {};
    
    transactions.forEach(tx => {
      const amount = parseFloat(tx.expenses) || 0;
      if (!amount) return;
      
      const category = tx.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    // Sort categories by amount (descending)
    const categories = Object.keys(categoryTotals).sort((a, b) => 
      categoryTotals[b] - categoryTotals[a]
    );
    
    // Prepare chart data
    const chartData = {
      labels: categories,
      datasets: [{
        data: categories.map(cat => categoryTotals[cat]),
        backgroundColor: generateCategoryColors(categories),
        borderWidth: 1
      }]
    };
    
    // Create and store the chart instance
    pieChart = new Chart(canvas, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `$${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
    
    chartDebugLog("Expense chart rendered successfully", 2);
  } catch (error) {
    console.error("Error rendering expense chart:", error);
    displayNoDataMessage("expenseChart", "Error rendering chart");
  }
}

function updateTimelineChart(transactions) {
  try {
    chartDebugLog("Starting timeline chart rendering", 2);
    
    // Get the canvas
    const canvas = document.getElementById("timelineChart");
    if (!canvas) {
      chartDebugLog("Timeline chart canvas not found", 1);
      return;
    }
    
    // CRITICAL FIX: Always destroy existing chart before creating a new one
    if (timelineChart) {
      chartDebugLog("Destroying existing timeline chart instance", 2);
      timelineChart.destroy();
      timelineChart = null;
    }
    
    // Rest of function remains the same...
    
    // Create and store the chart instance
    timelineChart = new Chart(canvas, {
      // Your configuration...
    });
    
    chartDebugLog("Timeline chart rendered successfully", 2);
  } catch (error) {
    console.error("Error rendering timeline chart:", error);
    displayNoDataMessage("timelineChart", "Error rendering chart");
  }
}

// Add these new helper functions
function sampleTransactions(transactions, maxCount) {
  if (transactions.length <= maxCount) return transactions;
  
  // Sort by date first
  const sortedByDate = [...transactions]
    .filter(tx => tx.date)
    .sort((a, b) => {
      try {
        return new Date(a.date) - new Date(b.date);
      } catch (e) {
        return 0;
      }
    });
  
  // Take evenly spaced samples
  const result = [];
  const step = Math.max(1, Math.floor(sortedByDate.length / maxCount));
  
  for (let i = 0; i < sortedByDate.length; i += step) {
    result.push(sortedByDate[i]);
    if (result.length >= maxCount) break;
  }
  
  return result;
}

// Expose functions for the debug panel
window.setChartDebugLevel = setChartDebugLevel;
window.analyzeChartData = analyzeChartData;
window.disableCharts = function() {
  updateChart.disabled = true;
  clearCharts();
  displayNoDataMessage("expenseChart", "Charts disabled for debugging");
  displayNoDataMessage("timelineChart", "Charts disabled for debugging");
  chartDebugLog("Charts manually disabled", 1);
};
window.enableCharts = function() {
  updateChart.disabled = false;
  chartDebugLog("Charts manually enabled", 1);
  updateChart(AppState.transactions);
};

// Add to the end of the file

// Track which charts are enabled
export let expenseChartEnabled = true;
export let timelineChartEnabled = true;

export function toggleExpenseChart() {
  expenseChartEnabled = !expenseChartEnabled;
  console.log(`Expense chart ${expenseChartEnabled ? 'enabled' : 'disabled'}`);
  
  if (!expenseChartEnabled) {
    // Clear the expense chart
    if (pieChart) {
      pieChart.destroy();
      pieChart = null;
      displayNoDataMessage("expenseChart", "Expense chart disabled");
    }
  } else {
    // Only update the expense chart
    try {
      const validTransactions = AppState.transactions || [];
      updateExpenseChart(validTransactions);
    } catch (error) {
      console.error("Error rendering expense chart:", error);
      displayNoDataMessage("expenseChart", "Error rendering expense chart");
    }
  }
  
  return expenseChartEnabled;
}

export function toggleTimelineChart() {
  timelineChartEnabled = !timelineChartEnabled;
  console.log(`Timeline chart ${timelineChartEnabled ? 'enabled' : 'disabled'}`);
  
  if (!timelineChartEnabled) {
    // Clear the timeline chart
    if (timelineChart) {
      timelineChart.destroy();
      timelineChart = null;
      displayNoDataMessage("timelineChart", "Timeline chart disabled");
    }
  } else {
    // Only update the timeline chart
    try {
      const validTransactions = AppState.transactions || [];
      updateTimelineChart(validTransactions);
    } catch (error) {
      console.error("Error rendering timeline chart:", error);
      displayNoDataMessage("timelineChart", "Error rendering timeline chart");
    }
  }
  
  return timelineChartEnabled;
}

// Modify the performChartUpdate function to respect these settings
function performChartUpdate(transactions) {
  // ... existing code ...
  
  // Only update charts that are enabled
  if (expenseChartEnabled) {
    try {
      console.log("Rendering expense chart...");
      updateExpenseChart(validTransactions);
    } catch (error) {
      console.error("Error rendering expense chart:", error);
      displayNoDataMessage("expenseChart", "Error rendering chart");
    }
  }
  
  if (timelineChartEnabled) {
    try {
      console.log("Rendering timeline chart...");
      updateTimelineChart(timelineData);
    } catch (error) {
      console.error("Error rendering timeline chart:", error);
      displayNoDataMessage("timelineChart", "Error rendering chart");
    }
  }
  
  // ... rest of the function ...
}

// Add this function
export function resetCharts() {
  chartDebugLog("Resetting all charts", 1);
  
  // Destroy the expense chart
  if (pieChart) {
    pieChart.destroy();
    pieChart = null;
  }
  
  // Destroy the timeline chart
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }
  
  // Reset update tracking
  updateChart.updateCount = 0;
  updateChart.firstUpdateTime = null;
  updateChart.disabled = false;
  updateChart.timeoutId = null;
  
  // Display empty state
  displayNoDataMessage("expenseChart", "Charts reset");
  displayNoDataMessage("timelineChart", "Charts reset");
  
  return true;
}

// Add a reset button in the UI for emergencies
document.addEventListener("DOMContentLoaded", () => {
  const chartControls = document.createElement("div");
  chartControls.className = "chart-controls";
  chartControls.innerHTML = `
    <button id="resetChartsBtn" class="icon-button" data-tooltip="Reset Charts">🔄</button>
  `;
  
  // Add after the chart toggles
  const chartSection = document.querySelector("#expenseChart").parentNode;
  chartSection.appendChild(chartControls);
  
  document.getElementById("resetChartsBtn").addEventListener("click", () => {
    resetCharts();
    showToast("Charts have been reset", "info");
  });
});