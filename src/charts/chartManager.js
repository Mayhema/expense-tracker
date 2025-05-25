import { AppState } from "../core/appState.js";

// Global chart instances storage with better tracking
const chartInstances = new Map();
let chartUpdateInProgress = false;

// Global registry to track all Chart.js instances
const globalChartRegistry = new Map();

// Add a flag to prevent multiple simultaneous updates
let isUpdating = false;

/**
 * Get chart canvas and ensure it's clean
 */
function getCleanCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }

  // Destroy any existing chart on this canvas
  if (chartInstances.has(canvasId)) {
    const existingChart = chartInstances.get(canvasId);
    try {
      existingChart.destroy();
      console.log(`Destroyed existing chart on canvas ${canvasId}`);
    } catch (error) {
      console.warn(`Error destroying chart on ${canvasId}:`, error);
    }
    chartInstances.delete(canvasId);
  }

  // Clear the canvas completely
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset canvas size to force re-initialization
  const parentWidth = canvas.parentElement?.offsetWidth || 400;
  const parentHeight = canvas.parentElement?.offsetHeight || 300;

  canvas.width = parentWidth;
  canvas.height = parentHeight;
  canvas.style.width = parentWidth + 'px';
  canvas.style.height = parentHeight + 'px';

  return canvas;
}

/**
 * Destroy chart from global registry
 */
function destroyFromGlobalRegistry(canvasId) {
  if (!globalChartRegistry.has(canvasId)) {
    return;
  }

  const chart = globalChartRegistry.get(canvasId);
  try {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
      console.log(`Destroyed chart from registry: ${canvasId}`);
    }
  } catch (error) {
    console.warn(`Error destroying chart from registry ${canvasId}:`, error);
  }
  globalChartRegistry.delete(canvasId);
}

/**
 * Destroy chart from Chart.js global registry
 */
function destroyFromChartJsRegistry(canvas, canvasId) {
  if (!window.Chart || !window.Chart.getChart) {
    return;
  }

  const chartInstance = window.Chart.getChart(canvas);
  if (!chartInstance) {
    return;
  }

  try {
    chartInstance.destroy();
    console.log(`Destroyed chart from Chart.js registry: ${canvasId}`);
  } catch (error) {
    console.warn(`Error destroying from Chart.js registry ${canvasId}:`, error);
  }
}

/**
 * Clear canvas context safely
 */
function clearCanvasContext(canvas, canvasId) {
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch (error) {
    console.warn(`Error clearing canvas ${canvasId}:`, error);
  }
}

/**
 * Force destroy a chart with more careful cleanup
 */
function forceDestroyChart(canvasId) {
  console.log(`Force destroying chart for canvas: ${canvasId}`);

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas ${canvasId} not found`);
    return;
  }

  destroyFromGlobalRegistry(canvasId);
  destroyFromChartJsRegistry(canvas, canvasId);
  clearCanvasContext(canvas, canvasId);
}

/**
 * Clear all chart instances with better timing
 */
async function clearAllCharts() {
  console.log("Clearing all chart instances with aggressive cleanup");

  const canvasIds = ['incomeExpenseChart', 'expenseCategoryChart', 'timelineChart'];

  // Force destroy all charts
  canvasIds.forEach(canvasId => {
    forceDestroyChart(canvasId);
  });

  // Clear our registry
  globalChartRegistry.clear();

  // Wait for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 50)); // Reduced wait time

  console.log("Chart cleanup completed");
}

/**
 * Filter transactions for chart display based on current filters
 */
function filterTransactionsForCharts(transactions) {
  if (!Array.isArray(transactions)) {
    console.warn("filterTransactionsForCharts: transactions is not an array");
    return [];
  }

  // Get current filter values
  const periodFilter = document.getElementById('chartPeriodSelect')?.value || 'all';
  const currencyFilter = document.getElementById('chartCurrencySelect')?.value || 'all';

  let filtered = [...transactions];

  // Apply period filter
  if (periodFilter !== 'all') {
    const now = new Date();
    let startDate;

    switch (periodFilter) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter(tx => {
        try {
          const txDate = new Date(tx.date);
          if (isNaN(txDate.getTime())) {
            throw new Error(`Invalid date format: ${tx.date}`);
          }
          return txDate >= startDate;
        } catch (e) {
          console.warn("Invalid date in transaction:", tx.date, "Error:", e.message);
          // Handle the exception by excluding invalid transactions
          return false;
        }
      });
    }
  }

  // Apply currency filter
  if (currencyFilter !== 'all') {
    filtered = filtered.filter(tx => tx.currency === currencyFilter);
  }

  return filtered;
}

/**
 * Create chart with improved registration and error handling
 */
function createChartWithRegistration(canvasId, config) {
  // Ensure canvas is completely clean first
  forceDestroyChart(canvasId);

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas ${canvasId} not found`);
    return null;
  }

  try {
    // Add a small delay to ensure canvas is ready
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Could not get 2D context for canvas ${canvasId}`);
      return null;
    }

    // Ensure canvas has proper dimensions
    if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
      console.warn(`Canvas ${canvasId} has zero dimensions, setting defaults`);
      canvas.style.width = '400px';
      canvas.style.height = '300px';
    }

    const chart = new Chart(ctx, config);

    // Register in our global registry
    globalChartRegistry.set(canvasId, chart);

    console.log(`Created and registered chart: ${canvasId}`);
    return chart;
  } catch (error) {
    console.error(`Error creating chart for ${canvasId}:`, error);
    return null;
  }
}

/**
 * Updates all charts with current transaction data - improved version
 */
export async function updateChartsWithCurrentData() {
  // Prevent concurrent updates
  if (isUpdating) {
    console.log("Chart update already in progress, skipping");
    return;
  }

  // Prevent concurrent updates from main.js
  if (chartUpdateInProgress) {
    console.log("Chart update in progress (from chartUpdateInProgress flag), skipping");
    return;
  }

  isUpdating = true;
  chartUpdateInProgress = true;

  try {
    console.log("Updating charts with current data...");

    const transactions = AppState.transactions || [];
    if (transactions.length === 0) {
      console.log("No transactions to chart");
      await clearAllCharts();
      return;
    }

    const filteredTransactions = filterTransactionsForCharts(transactions);
    console.log(`Updating charts with ${filteredTransactions.length} transactions`);

    // Clear existing charts first and wait for completion
    await clearAllCharts();

    // Create charts with better error handling and delays
    const chartPromises = [
      createIncomeExpenseChartSafely(filteredTransactions),
      createExpenseCategoryChartSafely(filteredTransactions),
      createTimelineChartSafely(filteredTransactions)
    ];

    // Wait for all charts to be created
    await Promise.allSettled(chartPromises);

    console.log("All charts updated successfully");

  } catch (error) {
    console.error("Error in updateChartsWithCurrentData:", error);
  } finally {
    isUpdating = false;
    chartUpdateInProgress = false;
  }
}

// Helper functions for safe chart creation
async function createIncomeExpenseChartSafely(filteredTransactions) {
  try {
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
    const incomeExpenseModule = await import("./incomeExpenseChart.js");
    if (typeof incomeExpenseModule.createIncomeExpenseChart === 'function') {
      const chartInstance = incomeExpenseModule.createIncomeExpenseChart(filteredTransactions, createChartWithRegistration);
      if (chartInstance) {
        console.log("Income/expense chart created successfully");
      }
    }
  } catch (error) {
    console.error("Error updating Income/Expense Chart:", error);
  }
}

async function createExpenseCategoryChartSafely(filteredTransactions) {
  try {
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
    const expenseModule = await import("./expenseChart.js");
    if (typeof expenseModule.createExpenseCategoryChart === 'function') {
      const chartInstance = expenseModule.createExpenseCategoryChart(filteredTransactions, createChartWithRegistration);
      if (chartInstance) {
        console.log("Expense category chart created successfully");
      }
    }
  } catch (error) {
    console.error("Error updating Expense Category Chart:", error);
  }
}

async function createTimelineChartSafely(filteredTransactions) {
  try {
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
    const timelineModule = await import("./timelineChart.js");
    if (typeof timelineModule.createTimelineChart === 'function') {
      const chartInstance = timelineModule.createTimelineChart(filteredTransactions, createChartWithRegistration);
      if (chartInstance) {
        console.log("Timeline chart created successfully");
      }
    }
  } catch (error) {
    console.error("Error updating Timeline Chart:", error);
  }
}

/**
 * Initialize chart event listeners and setup
 */
export function initializeCharts() {
  console.log("Initializing charts...");

  // Initialize chart controls if they exist
  const periodSelect = document.getElementById('chartPeriodSelect');
  const currencySelect = document.getElementById('chartCurrencySelect');

  if (periodSelect) {
    periodSelect.addEventListener('change', () => {
      updateChartsWithCurrentData();
    });
  }

  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      updateChartsWithCurrentData();
    });
  }

  // Initial chart update
  updateChartsWithCurrentData();
  console.log("Charts initialized successfully");
}

// Export chart management functions
export { chartInstances, clearAllCharts };
