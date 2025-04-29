// Directory: /src/categoryManager.js

import { AppState, saveCategories } from "./appState.js";
import { updateChart } from "./chartManager.js";
import { renderTransactions } from "./transactionManager.js";

export function renderCategoryList() {
  const container = document.getElementById("transactionsHeaderCategories");
  if (!container) return;
  container.innerHTML = "";
  Object.entries(AppState.categories).forEach(([cat, color]) => {
    const span = document.createElement("span");
    span.style.marginRight = "10px";
    span.style.padding = "2px 6px";
    span.style.border = "1px solid #ccc";
    span.style.borderRadius = "4px";
    span.style.backgroundColor = color;
    span.textContent = cat;
    span.onclick = () => toggleCategoryFilter(cat, span);
    container.appendChild(span);
  });
}

export function toggleCategoryFilter(cat, span) {
  if (AppState.currentCategoryFilters.includes(cat)) {
    AppState.currentCategoryFilters = AppState.currentCategoryFilters.filter((c) => c !== cat);
    span.style.opacity = 1;
  } else {
    AppState.currentCategoryFilters.push(cat);
    span.style.opacity = 0.7;
  }
  renderTransactions();
}

export function addCategory(name) {
  if (!name) return;
  if (AppState.categories[name]) {
    alert("Category already exists!");
    return;
  }
  AppState.categories[name] = randomColor();
  saveCategories();
  renderCategoryList();
  updateChart();
  renderTransactions();
}

export function deleteCategory(name) {
  if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
  delete AppState.categories[name];
  saveCategories();
  renderCategoryList();
  renderTransactions();
  updateChart();
}

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}