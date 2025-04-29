import { handleFileUpload } from "./fileHandler.js";
import { saveHeadersAndFormat, renderMappingList, getMappingBySignature } from "./mappingsManager.js";
import { showElement, hideElement, toggleDarkMode, showToast } from "./uiManager.js";
import { renderTransactions, updateTransactions } from "./transactionManager.js";
import { renderCategoryList, setupCategoryEditor } from "./categoryManager.js";
import { updateChart } from "./chartManager.js";

// App State
let currentFileData = null;
let currentFileName = null;
let currentFileSignature = null;
let currentSuggestedMapping = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileInput").addEventListener("change", onFileUpload);
  document.getElementById("saveHeadersBtn").addEventListener("click", onSaveHeaders);
  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);
  document.getElementById("addCategoryModalBtn").addEventListener("click", () => {
    const name = prompt("Category name?");
    if (name) window.addCategory(name);
  });
  document.getElementById("exportMergedBtn").addEventListener("click", exportMergedFiles);

  renderCategoryList();
  renderMappingList();
  updateTransactions();
});

function onFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  handleFileUpload(file).then(data => {
    const headerRow = data[0];
    currentFileData = data;
    currentFileName = file.name;
    currentFileSignature = JSON.stringify(headerRow);
    currentSuggestedMapping = suggestMapping(data);

    const existingMapping = getMappingBySignature(currentFileSignature);
    if (existingMapping) {
      showToast("File matches saved format. Auto-merging.");
      window.addMergedFile(data, existingMapping, file.name, currentFileSignature);
      return;
    }

    renderHeaderPreview(data);
    showElement("saveHeadersBtn");
  });
}

function renderHeaderPreview(data) {
  const headerRow = data[0];
  const dataRow = data[1] || [];
  const options = ["Date", "Income", "Expenses", "Description", "–"];
  const container = document.getElementById("previewTable");

  let html = "<table><tr>";
  headerRow.forEach(cell => html += `<th>${cell || ""}</th>`);
  html += "</tr><tr>";
  headerRow.forEach((_, i) => {
    html += `<td><select data-index="${i}">`;
    options.forEach(opt => {
      const sel = currentSuggestedMapping[i] === opt ? "selected" : "";
      html += `<option value="${opt}" ${sel}>${opt}</option>`;
    });
    html += "</select></td>";
  });
  html += "</tr><tr>";
  dataRow.forEach(cell => html += `<td>${cell || ""}</td>`);
  html += "</tr></table>";

  container.innerHTML = html;
}

function suggestMapping(data) {
  const headers = data[0];
  return headers.map((cell, i) => {
    const text = (cell || "").toString().toLowerCase();
    if (text.includes("date")) return "Date";

    const sampleValues = data.slice(1, 4).map(row => row[i]);
    if (sampleValues.every(v => !isNaN(parseFloat(v)))) {
      const nums = sampleValues.map(v => parseFloat(v));
      if (nums.every(n => n >= 0)) return "Income";
      if (nums.every(n => n < 0)) return "Expenses";
    }

    return "Description";
  });
}

function onSaveHeaders() {
  const selects = document.querySelectorAll("#previewTable select[data-index]");
  const mapping = Array.from(selects).map(sel => sel.value);
  saveHeadersAndFormat(currentFileSignature, mapping);

  window.addMergedFile(currentFileData, mapping, currentFileName, currentFileSignature);
  currentFileData = null;
  currentFileName = null;
  currentFileSignature = null;

  document.getElementById("previewTable").innerHTML = "";
  hideElement("saveHeadersBtn");

  showToast("Header format saved and file merged.");
  updateTransactions();
}

document.getElementById("editCategoriesBtn").addEventListener("click", () => {
    window.openEditCategoriesModal();
  });
  
function showRowSelectors() {
    document.getElementById("rowSelectionPanel").style.display = "block";
  }
  
  function hideRowSelectors() {
    document.getElementById("rowSelectionPanel").style.display = "none";
  }
  
function exportMergedFiles() {
  let csv = "";
  (window.mergedFiles || []).forEach(file => {
    file.data.forEach(row => csv += row.join(",") + "\n");
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "merged_data.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
