// Directory: /src/chartManager.js

import { AppState } from "./appState.js";

// Remove the import for Chart.js, use the global Chart object

let pieChart = null;
let timelineChart = null;

export function updateChart(transactions) {
  clearCharts();
  if (transactions.length === 0) {
    console.warn("No transactions to render charts.");
    return;
  }
  updateExpenseChart(transactions);
  updateTimelineChart(transactions);
}

function clearCharts() {
  if (pieChart) {
    pieChart.destroy();
    pieChart = null;
  }
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }
}

function updateExpenseChart(transactions) {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const categorySums = {};

  transactions.forEach(tx => {
    const amt = parseFloat(tx.amount);
    if (isNaN(amt)) return;
    const cat = tx.category || "Uncategorized";
    categorySums[cat] = (categorySums[cat] || 0) + amt;
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
    },
  });
}

function updateTimelineChart(transactions) {
  const timelineData = {};

  transactions.forEach(tx => {
    if (!tx.date || typeof tx.date !== "string") {
      console.warn("Invalid date field in transaction:", tx);
      return;
    }
    const date = tx.date.substring(0, 10);
    if (!timelineData[date]) {
      timelineData[date] = 0;
    }
    timelineData[date] += parseFloat(tx.amount) || 0;
  });

  const labels = Object.keys(timelineData).sort();
  const data = labels.map(date => timelineData[date]);

  const ctx = document.getElementById("timelineChart").getContext("2d");

  timelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Expenses Over Time",
          data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
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
    },
  });
}