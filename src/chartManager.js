// Directory: /src/chartManager.js

import { AppState } from "./appState.js";

let pieChart = null;
let timelineChart = null;

export function updateChart() {
  updatePieChart();
  updateTimelineChart();
}

function updatePieChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const categorySums = {};
  AppState.transactions.forEach((tx) => {
    const amt = parseFloat(tx.amount);
    if (isNaN(amt)) return;
    const cat = tx.category || "Uncategorized";
    categorySums[cat] = (categorySums[cat] || 0) + amt;
  });
  const labels = Object.keys(categorySums);
  const data = labels.map((label) => categorySums[label]);
  const colors = labels.map((label) => AppState.categories[label] || "#888888");

  if (pieChart) {
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = data;
    pieChart.data.datasets[0].backgroundColor = colors;
    pieChart.update();
  } else {
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
}

function updateTimelineChart() {
  const ctx = document.getElementById("timelineChart").getContext("2d");
  const dateSums = {};
  AppState.transactions.forEach((tx) => {
    if (!tx.date) return;
    const month = tx.date.substring(0, 7);
    const amt = parseFloat(tx.amount);
    if (isNaN(amt)) return;
    dateSums[month] = (dateSums[month] || 0) + amt;
  });
  const labels = Object.keys(dateSums).sort();
  const data = labels.map((label) => dateSums[label]);

  if (timelineChart) {
    timelineChart.data.labels = labels;
    timelineChart.data.datasets[0].data = data;
    timelineChart.update();
  } else {
    timelineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Expenses",
          data,
          borderColor: "#007bff",
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}