import { AppState } from '../core/appState.js';

let chartInstances = {
  categoryChart: null,
  monthlyChart: null,
  trendChart: null
};

/**
 * Initialize charts functionality
 */
export async function initializeCharts() {
  console.log("Initializing charts...");

  try {
    // Create chart containers first
    createChartContainers();

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js not loaded, charts will not be available");
      return false;
    }

    console.log("Charts initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing charts:", error);
    return false;
  }
}

/**
 * Create chart containers if they don't exist
 */
function createChartContainers() {
  // Find or create charts section
  let chartsSection = document.getElementById('chartsSection');
  if (!chartsSection) {
    chartsSection = createChartsSection();
  }

  // Create chart containers in a grid layout
  const sectionContent = chartsSection.querySelector('.section-content');
  if (sectionContent && !sectionContent.querySelector('.charts-grid')) {
    sectionContent.innerHTML = `
      <div class="charts-grid">
        <div class="chart-container" id="categoryChartContainer">
          <h3>Category Distribution</h3>
          <canvas id="categoryChart"></canvas>
        </div>
        <div class="chart-container" id="monthlyChartContainer">
          <h3>Monthly Trends</h3>
          <canvas id="monthlyChart"></canvas>
        </div>
        <div class="chart-container full-width" id="trendChartContainer">
          <h3>Spending Timeline</h3>
          <canvas id="trendChart"></canvas>
        </div>
      </div>
    `;
  }
}

/**
 * Create charts section if it doesn't exist
 */
function createChartsSection() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) {
    console.error('Main content not found for charts section');
    return null;
  }

  const section = document.createElement('div');
  section.id = 'chartsSection';
  section.className = 'section charts-section debug-only';
  section.innerHTML = `
    <div class="section-header">
      <h2>📊 Charts & Analytics</h2>
    </div>
    <div class="section-content">
      <!-- Chart containers will be added here -->
    </div>
  `;

  mainContent.appendChild(section);
  return section;
}

/**
 * Update all charts
 */
export function updateCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not available, skipping chart updates");
    return;
  }

  const transactions = AppState.transactions || [];
  if (transactions.length === 0) {
    console.log("No transactions available for charts");
    return;
  }

  // Update all charts
  updateCategoryChart(transactions);
  updateMonthlyChart(transactions);
  updateTrendChart(transactions);
}

/**
 * Update category chart
 */
function updateCategoryChart(transactions) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.categoryChart) {
    chartInstances.categoryChart.destroy();
  }

  // Process data for category chart
  const categoryData = {};
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    const amount = Math.abs(parseFloat(tx.expenses) || 0);
    categoryData[category] = (categoryData[category] || 0) + amount;
  });

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  if (labels.length === 0) {
    return;
  }

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: generateColors(labels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        }
      }
    }
  });
}

/**
 * Update monthly chart
 */
function updateMonthlyChart(transactions) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.monthlyChart) {
    chartInstances.monthlyChart.destroy();
  }

  // Process data for monthly chart
  const monthlyData = {};
  transactions.forEach(tx => {
    if (!tx.date) return;

    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    monthlyData[monthKey].income += parseFloat(tx.income) || 0;
    monthlyData[monthKey].expenses += parseFloat(tx.expenses) || 0;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const incomeData = sortedMonths.map(month => monthlyData[month].income);
  const expenseData = sortedMonths.map(month => monthlyData[month].expenses);

  if (sortedMonths.length === 0) {
    return;
  }

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(40, 167, 69, 0.8)'
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(220, 53, 69, 0.8)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        }
      }
    }
  });
}

/**
 * Update trend chart
 */
function updateTrendChart(transactions) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  // Destroy existing chart
  if (chartInstances.trendChart) {
    chartInstances.trendChart.destroy();
  }

  // Process data for trend chart
  const dailyData = {};
  transactions.forEach(tx => {
    if (!tx.date) return;

    const dateKey = tx.date.split('T')[0]; // Get just the date part
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = 0;
    }

    dailyData[dateKey] += parseFloat(tx.expenses) || 0;
  });

  const sortedDates = Object.keys(dailyData).sort();
  const expenseData = sortedDates.map(date => dailyData[date]);

  if (sortedDates.length === 0) {
    return;
  }

  // Create chart with dark mode support
  const ctx = canvas.getContext('2d');
  const isDarkMode = document.body.classList.contains('dark-mode');

  chartInstances.trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Daily Expenses',
        data: expenseData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDarkMode ? '#e0e0e0' : '#666'
          },
          grid: {
            color: isDarkMode ? '#444' : '#e0e0e0'
          }
        }
      }
    }
  });
}

/**
 * Generate colors for charts
 */
function generateColors(count) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}
