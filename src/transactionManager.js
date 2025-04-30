import { AppState } from "./appState.js";
import { updateChart } from "./chartManager.js";
import { HEADERS } from "./constants.js";

const TRANSACTION_STORAGE_KEY = "transactions";

export function saveTransactionData(transactions) {
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
}

export function getTransactionData() {
  return JSON.parse(localStorage.getItem(TRANSACTION_STORAGE_KEY) || "[]");
}

export function categorizeTransaction(description, category) {
  const transactions = getTransactionData();
  transactions.forEach(transaction => {
    if (transaction.description === description) {
      transaction.category = category;
    }
  });
  saveTransactionData(transactions);
}

export function renderTransactions(transactions) {
  const table = document.getElementById("transactionsTable");
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        ${HEADERS.filter(header => header !== "–")
          .map(header => `<th>${header}</th>`)
          .join("")}
      </tr>
    </thead>
    <tbody>
      ${transactions
        .map(
          transaction => `
        <tr>
          <td>${transaction.date || ""}</td>
          <td>${transaction.description || ""}</td>
          <td>${transaction.category || "Uncategorized"}</td>
          <td>${transaction.amount || ""}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

  updateChart(transactions);
}

export function updateTransactions() {
  const transactions = AppState.mergedFiles.flatMap(file => {
    return file.data.slice(file.dataRow).map(row => {
      const transaction = {};
      file.headerMapping.forEach((header, i) => {
        if (header !== "–") {
          transaction[header.toLowerCase()] = row[i];
        }
      });

      if (transaction.date && typeof transaction.date !== "string") {
        transaction.date = String(transaction.date);
      }

      transaction.fileName = file.fileName;
      return transaction;
    });
  });

  AppState.transactions = transactions;
  renderTransactions(transactions);
  updateChart(transactions);
}

window.changeTxCategory = function (idx, cat) {
  const tx = AppState.transactions[idx];
  tx.category = cat;
  AppState.transactions.forEach(t => {
    if (t.description === tx.description && !t.category) {
      t.category = cat;
    }
  });
  renderTransactions(AppState.transactions);
  updateChart(AppState.transactions);
};

export function openEditTransactionsModal() {
  const modal = document.createElement("div");
  modal.id = "transactionModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.background = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
    <div>
      <h2>Edit Transactions</h2>
      <table id="editTransactionTable">
        <thead>
          <tr>
            ${HEADERS.map(header => `<th>${header}</th>`).join("")}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${AppState.transactions
            .map(
              (tx, idx) => `
            <tr>
              <td>${tx.date}</td>
              <td>${tx.description}</td>
              <td>
                <select onchange="changeTxCategory(${idx}, this.value)">
                  ${Object.keys(AppState.categories)
                    .map(cat => `<option value="${cat}" ${tx.category === cat ? "selected" : ""}>${cat}</option>`)
                    .join("")}
                </select>
              </td>
              <td>${tx.amount}</td>
              <td><button onclick="deleteTransaction(${idx})">Delete</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <button id="closeTransactionModalBtn">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeTransactionModalBtn").onclick = () => {
    modal.remove();
  };
}