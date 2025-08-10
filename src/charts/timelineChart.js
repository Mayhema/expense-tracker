import { AppState } from "../core/appState.js";
import { createChart, destroyChart, getChartColors } from "./chartCore.js";
import { formatDateToDDMMYYYY, parseDDMMYYYY } from "../utils/dateUtils.js";

/**
 * Validates chart data before processing
 * @param {Array} data - Chart data to validate
 * @returns {boolean} True if data is valid
 */
function validateChartData(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log("Timeline chart: No valid data to display");
    return false;
  }
  return true;
}

/**
 * Hides the timeline chart when there's no data
 */
function hideTimelineChart() {
  const chartWrapper = document.getElementById("timelineChartWrapper");
  const chartContainer = document.getElementById("timelineChart");

  if (chartWrapper) {
    chartWrapper.style.display = "none";
  }

  if (chartContainer) {
    // Clear any existing chart
    const canvas = chartContainer.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    chartContainer.innerHTML =
      '<p style="text-align: center; color: #666; padding: 20px;">No transaction data available for timeline chart</p>';
  }

  console.log("Timeline chart hidden - no data available");
}

/**
 * Creates and updates the timeline chart
 * @param {Array} transactions - Array of transaction objects
 */
export function updateTimelineChart(transactions = []) {
  if (!validateChartData(transactions)) {
    hideTimelineChart();
    return;
  }

  try {
    console.log("Updating timeline chart...");

    if (!validateChartData(transactions)) {
      clearTimelineChart();
      return false;
    }

    const timelineData = processTimelineData(transactions);

    if (timelineData.labels.length === 0) {
      clearTimelineChart();
      return false;
    }

    initializeTimelineChart();
    return true;
  } catch (error) {
    console.error("Error updating timeline chart:", error);
    return false;
  }
}

/**
 * Prepares data for timeline chart
 * @param {Array} transactions - Filtered transactions
 * @returns {Object} Chart.js data object
 */
function prepareTimelineData(transactions) {
  const monthlyData = {};

  // Group transactions by month
  transactions.forEach((tx) => {
    if (!tx.date) return;

    try {
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      monthlyData[monthKey].income += parseFloat(tx.income) || 0;
      monthlyData[monthKey].expenses += parseFloat(tx.expenses) || 0;
    } catch (error) {
      console.warn("Error processing date for timeline:", tx.date, error);
    }
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort((a, b) =>
    a.localeCompare(b)
  );

  if (sortedMonths.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Prepare chart data
  const incomeData = sortedMonths.map((month) => monthlyData[month].income);
  const expenseData = sortedMonths.map((month) => monthlyData[month].expenses);

  // Format labels for display (MMM YYYY)
  const labels = sortedMonths.map((month) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(year, monthNum - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  });

  return {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        tension: 0.1,
        fill: false,
      },
      {
        label: "Expenses",
        data: expenseData,
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        tension: 0.1,
        fill: false,
      },
    ],
  };
}

/**
 * Clears the timeline chart
 * @param {HTMLCanvasElement} canvas - Chart canvas
 */
function clearChart(canvas) {
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Clear the chart instance
  storeChartInstance("timeline", null);
}

// Store chart instance
let timelineChart = null;
let timelineChartInstance = null;

/**
 * Initialize timeline chart with error handling
 */
export function initializeTimelineChart() {
  const canvas = document.getElementById("timelineChart");
  if (!canvas) {
    console.warn(
      "Timeline chart canvas not found - charts section may not be loaded yet"
    );

    // Try again after a delay
    setTimeout(() => {
      const retryCanvas = document.getElementById("timelineChart");
      if (retryCanvas) {
        console.log("Found timeline chart canvas on retry, initializing...");
        initializeTimelineChartWithCanvas(retryCanvas);
      } else {
        console.error(
          "Timeline chart canvas still not found after retry. Check if charts section exists in HTML."
        );
      }
    }, 1000);
    return;
  }

  initializeTimelineChartWithCanvas(canvas);
}

/**
 * Initialize chart with canvas element
 */
function initializeTimelineChartWithCanvas(canvas) {
  // Get colors for the chart
  const isDarkMode = document.body.classList.contains("dark-mode");
  const colors = getChartColors(2, isDarkMode);

  const config = {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          borderColor: colors[0],
          backgroundColor: colors[0] + "20",
          tension: 0.1,
          fill: false,
        },
        {
          label: "Expenses",
          data: [],
          borderColor: colors[1],
          backgroundColor: colors[1] + "20",
          tension: 0.1,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false, // Title handled by HTML h3
        },
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  createChart(canvas, "line", config.data, config.options);
  console.log("Timeline chart initialized successfully");
}

/**
 * Clear the timeline chart
 */
export function clearTimelineChart() {
  if (timelineChart) {
    try {
      timelineChart.destroy();
      timelineChart = null;
      console.log("Timeline chart cleared");
    } catch (error) {
      console.error("Error clearing timeline chart:", error);
    }
  }
}

/**
 * Destroy existing timeline chart instance
 */
export function destroyTimelineChart() {
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
    console.log("Timeline chart destroyed");
  }
}

/**
 * Update timeline chart with current period
 */
function updateTimelineChartInternal() {
  console.log("Updating timeline chart...");

  // Destroy existing chart first
  destroyTimelineChart();

  try {
    const period = getChartPeriod();
    console.log(`Updating timeline chart with period: ${period}`);

    const timelineData = calculateTimelineData(period);

    if (!timelineData.hasData) {
      console.log("No valid transaction data for timeline");
      showEmptyStateChart();
      return;
    }

    // Initialize new chart
    initializeTimelineChart();

    // Get the chart instance from the canvas
    const canvas = document.getElementById("timelineChart");
    timelineChartInstance = canvas ? Chart.getChart(canvas) : null;

    if (!timelineChartInstance) {
      console.error("Could not initialize timeline chart");
      return;
    }

    timelineChartInstance.data.labels = timelineData.labels;
    timelineChartInstance.data.datasets[0].data = timelineData.income;
    timelineChartInstance.data.datasets[1].data = timelineData.expenses;
    timelineChartInstance.update("none");

    console.log("Timeline chart updated");
  } catch (error) {
    console.error("Error creating timeline chart:", error);
    destroyTimelineChart(); // Clean up on error
  }
}

/**
 * Updates the timeline chart with transaction data
 */
function refreshTimelineChart(period = "month") {
  const timelineCanvas = document.getElementById("timelineChart");
  if (!timelineCanvas) return;

  // Check if we have transaction data to display
  if (!AppState.transactions || AppState.transactions.length === 0) {
    console.log("No valid timeline data to display - showing empty state");
    showEmptyStateChart();
    return;
  }

  try {
    // Group transactions by period
    const groupedData = groupTransactionsByPeriod(
      AppState.transactions,
      period
    );
    const chartData = formatChartData(groupedData);

    // Ensure layout padding is properly defined to prevent errors
    const config = {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Define theme-dependent colors locally
        // so we don't rely on undefined globals
        // and satisfy ESLint no-undef
        // These will be referenced in scales and legend
        // below for consistent theming
        // eslint-disable-next-line no-unused-vars
        _theme: (() => {
          const dark = document.body.classList.contains("dark-mode");
          const grid = dark ? "#444" : "#e0e0e0";
          const text = dark ? "#e0e0e0" : "#333";
          return { dark, grid, text };
        })(),
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          tooltip: {
            enabled: true,
            position: "nearest",
            callbacks: {
              label: function (context) {
                let value = context.raw;
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (typeof value === "number") {
                  return label + value.toFixed(2);
                }
                return label + value;
              },
            },
          },
          legend: {
            position: "top",
            labels: {
              color: (function () {
                const dark = document.body.classList.contains("dark-mode");
                return dark ? "#e0e0e0" : "#333";
              })(),
              font: {
                size: 14,
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: (function () {
                const dark = document.body.classList.contains("dark-mode");
                return dark ? "#444" : "#e0e0e0";
              })(),
            },
            ticks: {
              color: (function () {
                const dark = document.body.classList.contains("dark-mode");
                return dark ? "#e0e0e0" : "#333";
              })(),
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            grid: {
              color: (function () {
                const dark = document.body.classList.contains("dark-mode");
                return dark ? "#444" : "#e0e0e0";
              })(),
            },
            ticks: {
              color: (function () {
                const dark = document.body.classList.contains("dark-mode");
                return dark ? "#e0e0e0" : "#333";
              })(),
              // FIX: Use safer number formatting to avoid the RangeError
              callback: function (value) {
                if (value % 1 === 0) {
                  return value.toString();
                }
                return value.toFixed(2);
              },
            },
            beginAtZero: true,
          },
        },
      },
    };

    // Destroy any existing chart instance
    if (window.timelineChart) {
      destroyChart(window.timelineChart);
      window.timelineChart = null;
    }

    // Create the new chart instance
    window.timelineChart = new Chart(timelineCanvas, config);

    console.log("Timeline chart updated successfully");
  } catch (error) {
    console.error("Error creating timeline chart:", error);
    showEmptyStateChart();
  }
}

/**
 * Shows empty state for timeline chart
 */
function showEmptyStateChart() {
  console.log("No valid timeline data to display - showing empty state");

  // Destroy any existing chart first
  destroyTimelineChart();

  try {
    // Create empty chart
    initializeTimelineChart();

    // Get the chart instance from the canvas
    const canvas = document.getElementById("timelineChart");
    timelineChartInstance = canvas ? Chart.getChart(canvas) : null;

    if (timelineChartInstance) {
      timelineChartInstance.data.labels = ["No Data"];
      timelineChartInstance.data.datasets[0].data = [0];
      timelineChartInstance.data.datasets[1].data = [0];
      timelineChartInstance.update("none");
    }
  } catch (error) {
    console.error("Error creating empty state chart:", error);
  }
}

/**
 * Helper function to safely destroy a Chart.js instance
 */
function destroyChartInstance(chart) {
  if (!chart) return;

  // First check if it's a valid Chart.js instance
  if (typeof chart.destroy === "function") {
    chart.destroy();
  } else {
    // Fallback for invalid instance - try to access the chart's internal canvas
    try {
      const chartCanvas = chart?.canvas || chart?.ctx?.canvas;
      if (chartCanvas?.id) {
        // Try to find and destroy any Chart.js instance on this canvas
        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart && typeof existingChart?.destroy === "function") {
          existingChart.destroy();
        }
      }
    } catch (err) {
      console.warn("Failed to destroy chart via fallback method:", err);
    }
  }
}

/**
 * Groups transactions by date with the specified granularity
 * @param {Array} transactions - The transactions to group
 * @param {string} period - The period granularity ('month', 'quarter', etc.)
 * @returns {Object} Grouped transactions
 */
function groupTransactionsByPeriod(transactions, period) {
  const grouped = {};

  transactions.forEach((tx) => {
    if (!tx.date) return;

    let date = new Date(tx.date);
    let key;

    // Create the appropriate grouping key based on period
    switch (period) {
      case "year":
        key = date.getFullYear().toString();
        break;
      case "half": {
        const half = Math.floor(date.getMonth() / 6) + 1;
        key = `${date.getFullYear()} H${half}`;
        break;
      }
      case "quarter": {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()} Q${quarter}`;
        break;
      }
      case "month":
      default: {
        // Format as YYYY-MM for sorting
        const month = date.getMonth() + 1;
        key = `${date.getFullYear()}-${month.toString().padStart(2, "0")}`;
        break;
      }
    }

    if (!grouped[key]) {
      grouped[key] = {
        income: 0,
        expenses: 0,
        date: date,
        label: formatPeriodLabel(key, period),
      };
    }

    if (tx.income) grouped[key].income += parseFloat(tx.income) || 0;
    if (tx.expenses) grouped[key].expenses += parseFloat(tx.expenses) || 0;
  });

  return grouped;
}

/**
 * Formats a period key into a display label
 * @param {string} key - The period key
 * @param {string} period - The period type
 * @returns {string} Formatted label
 */
function formatPeriodLabel(key, period) {
  switch (period) {
    case "year": {
      return key; // Already just the year
    }
    case "half": {
      return key; // Already formatted as "YYYY HX"
    }
    case "quarter": {
      return key; // Already formatted as "YYYY QX"
    }
    case "month":
    default: {
      // Convert YYYY-MM to more readable format
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    }
  }
}

/**
 * Get chart options based on selected period
 * @param {string} period - The time period (year, half, quarter, month)
 * @returns {Object} Chart options
 */
function getTimelineOptions(period) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Income & Expenses By ${capitalize(period)}`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw || 0;
            return (
              context.dataset.label +
              ": $" +
              value.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })
            );
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount ($)",
        },
      },
    },
  };

  return baseOptions;
}

/**
 * Initialize period map for a given date range and period type
 * @param {Date} firstDate - Start date
 * @param {Date} lastDate - End date
 * @param {string} period - Period type
 * @returns {Object} Initialized period map
 */
function initializePeriodMap(firstDate, lastDate, period) {
  const periodMap = {};
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (
    let year = firstDate.getFullYear();
    year <= lastDate.getFullYear();
    year++
  ) {
    if (period === "year") {
      periodMap[year] = { income: 0, expenses: 0 };
    } else if (period === "half") {
      periodMap[`${year}-1H`] = { income: 0, expenses: 0 };
      periodMap[`${year}-2H`] = { income: 0, expenses: 0 };
    } else if (period === "quarter") {
      for (let q = 1; q <= 4; q++) {
        periodMap[`${year}-Q${q}`] = { income: 0, expenses: 0 };
      }
    } else {
      // month
      for (let month = 0; month < 12; month++) {
        periodMap[`${year}-${month}`] = {
          income: 0,
          expenses: 0,
          label: `${months[month]} ${year}`,
        };
      }
    }
  }

  return periodMap;
}

/**
 * Create a period key for a transaction based on its date and period type
 * @param {Date} date - Transaction date
 * @param {string} period - Period type
 * @returns {string} Period key
 */
function createPeriodKey(date, period) {
  const year = date.getFullYear();

  switch (period) {
    case "year":
      return year.toString();
    case "half":
      return `${year}-${date.getMonth() < 6 ? "1H" : "2H"}`;
    case "quarter":
      return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    default: // month
      return `${year}-${date.getMonth()}`;
  }
}

/**
 * Aggregate transaction data by the selected period
 * @param {Array} transactions - The transactions to aggregate
 * @param {string} period - The time period (year, half, quarter, month)
 * @returns {Object} Object containing labels and data arrays
 */
function aggregateByPeriod(transactions, period) {
  if (!transactions || transactions.length === 0) {
    return { labels: [], incomeData: [], expenseData: [] };
  }

  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get date range
  const firstDate = new Date(transactions[0].date);
  const lastDate = new Date(transactions[transactions.length - 1].date);

  // Initialize period map
  const periodMap = initializePeriodMap(firstDate, lastDate, period);

  // Aggregate data
  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const key = createPeriodKey(date, period);

    if (periodMap[key]) {
      periodMap[key].income += parseFloat(tx.income || 0);
      periodMap[key].expenses += parseFloat(tx.expenses || 0);
    }
  });

  // Convert to arrays for chart
  const periods = Object.keys(periodMap).sort((a, b) => a.localeCompare(b));
  const labels = periods.map((p) =>
    period === "month" ? periodMap[p].label : p
  );
  const incomeData = periods.map((p) => periodMap[p].income);
  const expenseData = periods.map((p) => periodMap[p].expenses);

  return { labels, incomeData, expenseData };
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Cleans up the timeline chart
 */
export function cleanupTimelineChart() {
  timelineChart = destroyChart(timelineChart);
}

// Keep only one declaration of each function
function getPeriodLabel(date, period) {
  // Implementation
  const d = new Date(date);
  switch (period) {
    case "year":
      return d.getFullYear().toString();
    case "half":
      return `${d.getFullYear()} ${d.getMonth() < 6 ? "H1" : "H2"}`;
    case "quarter":
      return `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`;
    case "month":
      return `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    default:
      return date;
  }
}

/**
 * Renders the timeline chart
 * @param {Array} data - The transaction data to render
 */
function renderTimelineChart(data) {
  const groupedData = groupTransactionsByPeriod(data, "month");
  const chartData = formatChartData(groupedData);
  // Find canvas and create chart with basic options
  const canvas = document.getElementById("timelineChart");
  if (!canvas) return;
  createChart(canvas, "line", chartData, getTimelineOptions("month"));
}

/**
 * Prepares transaction data for timeline visualization with period options
 * @param {Array} transactions - The transaction data to display
 * @param {string} periodOption - The time period option (month, quarter, year)
 * @returns {Object} Object with labels, incomeData, and expensesData arrays
 */
function prepareTimelineDataWithPeriod(transactions, periodOption = "month") {
  // Default empty results
  const result = {
    labels: [],
    incomeData: [],
    expensesData: [],
  };

  if (
    !transactions ||
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {
    // Use info level logging instead of warning for expected empty state
    console.log("No valid transaction data for timeline");
    return result;
  }

  try {
    // Group transactions by period
    const periodData = {};

    // Process each transaction
    transactions.forEach((tx) => {
      if (!tx.date) return;

      // Parse the transaction date
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return;

      // Get period key based on selected periodOption
      const periodKey = getPeriodKey(txDate, periodOption);

      // Initialize period if it doesn't exist
      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          income: 0,
          expenses: 0,
        };
      }

      // Add income and expenses
      if (tx?.income && !isNaN(parseFloat(tx.income))) {
        periodData[periodKey].income += parseFloat(tx.income);
      }

      if (tx?.expenses && !isNaN(parseFloat(tx.expenses))) {
        periodData[periodKey].expenses += parseFloat(tx.expenses);
      }
    });

    // Sort periods chronologically
    const sortedPeriods = Object.keys(periodData).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Generate final data arrays
    result.labels = sortedPeriods.map((period) =>
      formatPeriodDisplayLabel(period, periodOption)
    );
    result.incomeData = sortedPeriods.map(
      (period) => periodData[period].income
    );
    result.expensesData = sortedPeriods.map(
      (period) => periodData[period].expenses
    );

    return result;
  } catch (error) {
    console.error("Error preparing timeline data:", error);
    return result;
  }
}

/**
 * Gets period key for grouping transactions
 * @param {Date} date - The transaction date
 * @param {string} periodOption - The selected period (month, quarter, year)
 * @returns {string} The period key
 */
function getPeriodKey(date, periodOption) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based month

  switch (periodOption) {
    case "year":
      return `${year}`;

    case "quarter": {
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    }

    case "half": {
      const half = month <= 6 ? 1 : 2;
      return `${year}-H${half}`;
    }

    case "month":
    default:
      return `${year}-${month.toString().padStart(2, "0")}`;
  }
}

/**
 * Formats period key into readable label
 * @param {string} periodKey - The period key
 * @param {string} periodOption - The selected period type
 * @returns {string} Formatted label
 */
function formatPeriodDisplayLabel(periodKey, periodOption) {
  if (periodOption === "year") {
    return periodKey;
  }

  if (periodOption === "quarter") {
    const [year, quarter] = periodKey.split("-");
    return `${quarter} ${year}`;
  }

  if (periodOption === "half") {
    const [year, half] = periodKey.split("-");
    return `${half === "H1" ? "Jan-Jun" : "Jul-Dec"} ${year}`;
  }

  // Default: month
  const [year, month] = periodKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/**
 * Creates the timeline chart
 */
export async function createTimelineChart() {
  console.log("Creating timeline chart...");

  try {
    // Use global Chart.js (loaded via CDN in HTML)
    if (typeof Chart === "undefined") {
      throw new Error("Chart.js is not loaded");
    }

    const canvas = document.getElementById("timelineChart");
    if (!canvas) {
      console.warn("Timeline chart canvas not found");
      return null;
    }

    // Destroy existing chart
    if (window.timelineChartInstance) {
      window.timelineChartInstance.destroy();
    }

    // Get chart data
    const data = getTimelineData();

    if (!data || data.labels.length === 0) {
      showNoDataMessage(canvas);
      return null;
    }

    // Create the chart
    const chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Income",
            data: data.income,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            fill: false,
            tension: 0.4,
          },
          {
            label: "Expenses",
            data: data.expenses,
            borderColor: "#f44336",
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: getTimelineOptions("month"),
    });

    // Store reference
    window.timelineChartInstance = chartInstance;

    console.log("✓ timeline chart created successfully");
    return chartInstance;
  } catch (error) {
    console.error("❌ Error creating timeline chart:", error);
    return null;
  }
}

// Initialize the timeline chart when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Set up period selector
  const periodSelect = document.getElementById("timelineChartPeriod");
  if (periodSelect) {
    periodSelect.addEventListener("change", function () {
      // Only update if we have transactions
      if (AppState.transactions?.length > 0) {
        refreshTimelineChart(this.value);
      }
    });
  }

  // Initial render will happen when transactions are loaded
});

// Export functions for use in other modules
export { renderTimelineChart, groupTransactionsByPeriod, getPeriodLabel };

/**
 * Format numbers safely for chart labels
 * @param {number} value - The value to format
 * @returns {string} Formatted value
 */
function safeFormatNumber(value) {
  if (typeof value !== "number") return value;

  try {
    // Use simple toFixed for formatting to avoid locale issues
    return value.toFixed(2);
  } catch (err) {
    // Log the error and provide context for debugging
    console.warn("Error formatting number value:", err, value);
    // Fallback to basic string conversion
    return String(value);
  }
}

/**
 * Process timeline data from transactions
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Processed timeline data with dd/mm/yyyy formatted labels
 */
function processTimelineData(transactions) {
  const timelineData = {
    labels: [],
    incomeData: [],
    expenseData: [],
  };

  if (!transactions || !Array.isArray(transactions)) {
    return timelineData;
  }

  // Group transactions by date
  const dailyTotals = {};

  transactions.forEach((transaction) => {
    const date = transaction.date;
    if (!date) return;

    // FIXED: Use formatDateToDDMMYYYY for consistent date format
    const formattedDate = formatDateToDDMMYYYY(date);
    if (!formattedDate) return;

    if (!dailyTotals[formattedDate]) {
      dailyTotals[formattedDate] = { income: 0, expenses: 0 };
    }

    const income = parseFloat(transaction.income || 0);
    const expenses = parseFloat(transaction.expenses || 0);

    dailyTotals[formattedDate].income += income;
    dailyTotals[formattedDate].expenses += expenses;
  });

  // Sort dates and prepare data arrays
  const sortedDates = Object.keys(dailyTotals).sort((a, b) => {
    // Convert back to Date objects for proper sorting
    const dateA = parseDDMMYYYY(a);
    const dateB = parseDDMMYYYY(b);
    return dateA - dateB;
  });

  timelineData.labels = sortedDates;
  timelineData.incomeData = sortedDates.map((date) => dailyTotals[date].income);
  timelineData.expenseData = sortedDates.map(
    (date) => dailyTotals[date].expenses
  );

  return timelineData;
}

/**
 * Get current chart period from UI
 */
function getChartPeriod() {
  const periodSelect = document.getElementById("timelineChartPeriod");
  return periodSelect ? periodSelect.value : "month";
}

/**
 * Calculate timeline data for given period
 */
function calculateTimelineData(period) {
  const transactions = AppState.transactions || [];

  if (!transactions.length) {
    return { hasData: false, labels: [], income: [], expenses: [] };
  }

  const data = processTimelineData(transactions);
  return {
    hasData: data.labels.length > 0,
    labels: data.labels,
    income: data.incomeData,
    expenses: data.expenseData,
  };
}

/**
 * Store chart instance safely
 */
function storeChartInstance(chartType, instance) {
  if (chartType === "timeline") {
    timelineChart = instance;
  }
}

/**
 * Get timeline data for chart
 */
function getTimelineData() {
  const transactions = AppState.transactions || [];
  return processTimelineData(transactions);
}

/**
 * Show no data message on canvas
 */
function showNoDataMessage(canvas, message = "No data available") {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#666";
  ctx.font = "14px Arial";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/**
 * Formats grouped data into Chart.js data structure
 * @param {Object} groupedData - Map of label -> { income, expenses }
 * @returns {Object} Chart.js data object
 */
function formatChartData(groupedData) {
  const labels = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));
  const income = labels.map((k) => groupedData[k].income || 0);
  const expenses = labels.map((k) => groupedData[k].expenses || 0);

  return {
    labels,
    datasets: [
      {
        label: "Income",
        data: income,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        tension: 0.1,
        fill: false,
      },
      {
        label: "Expenses",
        data: expenses,
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        tension: 0.1,
        fill: false,
      },
    ],
  };
}
