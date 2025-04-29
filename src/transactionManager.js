// Directory: /src/transactionManager.js

import { AppState } from "./appState.js";
import { updateChart } from "./chartManager.js";

export function updateTransactions() {
  AppState.transactions = [];
  AppState.mergedFiles.forEach((file) => {
    if (!file.headerMapping || file.headerMapping.length === 0) return;
    for (let i = file.dataRow - 1; i < file.data.length; i++) {
      const row = file.data[i];
      if (!row || row.join("").trim() === "") continue;
      let tx = { date: "", description: "", amount: "", category: "", fileName: file.fileName };
      file.headerMapping.forEach((mapLabel, index) => {
        const value = row[index] || "";
        if (mapLabel === "Date") {
          let numVal = Number(value);
          if (!isNaN(numVal)) {
            const d = XLSX.SSF.parse_date_code(numVal);
            tx.date = d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : value;
          } else {
            tx.date = value;
          }
        } else if (mapLabel === "Income") {
          tx.amount = value;
        } else if (mapLabel === "Expenses") {
          tx.amount = value.startsWith("-") ? value : "-" + value;
        } else if (mapLabel === "Description") {
          tx.description = value;
        }
      });
      AppState.transactions.push(tx);
    }
  });
  applyCategoryAutoAssign();
  renderTransactions();
  updateChart();
}

function applyCategoryAutoAssign() {
  const descCategory = {};
  AppState.transactions.forEach(tx => {
    if (tx.category && tx.description) {
      descCategory[tx.description] = tx.category;
    }
  });
  AppState.transactions.forEach(tx => {
    if (!tx.category && tx.description && descCategory[tx.description]) {
      tx.category = descCategory[tx.description];
    }
  });
}

export function renderTransactions() {
  const table = document.getElementById("transactionsTable");
  if (!table) return;
  let filtered = AppState.transactions;
  if (AppState.currentCategoryFilters.length > 0) {
    filtered = filtered.filter(tx => AppState.currentCategoryFilters.includes(tx.category));
  }
  let html = '<tr><th>Date</th><th>Description</th><th>Income/Expenses</th><th>Category</th></tr>';
  filtered.forEach((tx, index) => {
    const selectStyle = (tx.category && AppState.categories[tx.category])
      ? `style="background-color: ${AppState.categories[tx.category]};"`
      : "";
    html += `<tr>
      <td>${tx.date}</td>
      <td>${tx.description}</td>
      <td>${tx.amount}</td>
      <td>
        <select onchange="window.changeTxCategory(${index}, this.value)" ${selectStyle}>
          <option value="" ${!tx.category ? 'selected' : ''}>--</option>
          ${Object.keys(AppState.categories)
            .map(cat => `<option value="${cat}" style="background-color: ${AppState.categories[cat]};" ${tx.category === cat ? 'selected' : ''}>${cat}</option>`)
            .join("")}
        </select>
      </td>
    </tr>`;
  });
  table.innerHTML = html;
}

window.changeTxCategory = function (idx, cat) {
  const tx = AppState.transactions[idx];
  tx.category = cat;
  AppState.transactions.forEach(t => {
    if (t.description === tx.description && !t.category) {
      t.category = cat;
    }
  });
  renderTransactions();
  updateChart();
};