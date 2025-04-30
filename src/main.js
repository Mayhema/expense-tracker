import { handleFileUpload, generateFileSignature } from "./fileHandler.js";
import { saveHeadersAndFormat, getMappingBySignature, renderMappingList, deleteMapping } from "./mappingsManager.js";
import { showElement, hideElement, showToast, toggleDarkMode } from "./uiManager.js";
import { renderTransactions, updateTransactions, saveTransactionData, getTransactionData, categorizeTransaction, openEditTransactionsModal } from "./transactionManager.js";
import { renderCategoryList, openEditCategoriesModal, deleteCategory } from "./categoryManager.js";
import { updateChart } from "./chartManager.js";
import { HEADERS } from "./constants.js";
import { AppState } from "./appState.js";
import { exportMergedFilesAsCSV } from "./exportManager.js";

let currentFileData = null;
let currentFileName = null;
let currentFileSignature = null;
let currentSuggestedMapping = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event fired.");

  const fileInput = document.getElementById("fileInput");
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  const saveButton = document.getElementById("saveHeadersBtn");
  const editCategoriesBtn = document.getElementById("editCategoriesBtn");

  if (fileInput && fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", onFileUpload);
  }

  if (saveButton) {
    saveButton.addEventListener("click", onSaveHeaders);
  }

  if (editCategoriesBtn) {
    editCategoriesBtn.addEventListener("click", openEditCategoriesModal);
  }

  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);
  document.getElementById("clearPreviewBtn").addEventListener("click", clearPreview);
  document.getElementById("toggleMergedBtn").addEventListener("click", toggleMergedFilesVisibility);
  document.getElementById("exportMergedBtn").addEventListener("click", exportMergedFilesAsCSV);

  window.mergedFiles = JSON.parse(localStorage.getItem("mergedFiles") || "[]");
  window.currentCategoryFilters = [];
  window.renderTransactions = renderTransactions;

  renderCategoryList();
  renderMappingList();
  updateTransactions();
  loadMergedFiles();
});

window.addMergedFile = function (data, mapping, name, signature) {
  const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;

  if (window.mergedFiles.some(f => f.signature === signature)) {
    showToast("This file is already merged.");
    return;
  }

  const merged = {
    fileName: name,
    headerMapping: mapping.filter(header => header !== "–"), // Exclude undefined headers
    data: data.map(row => row.filter((_, i) => mapping[i] !== "–")), // Exclude undefined columns
    dataRow: dataRowIndex,
    signature,
    selected: true
  };

  console.log("Adding merged file:", merged);
  window.mergedFiles.push(merged);
  localStorage.setItem("mergedFiles", JSON.stringify(window.mergedFiles));
  updateTransactions();
  renderMergedFiles();
};

function onFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("Uploading file:", file.name);

  handleFileUpload(file)
    .then(data => {
      console.log("Parsed file data:", data);

      currentFileData = data;
      currentFileName = file.name;
      currentFileSignature = JSON.stringify(data[0]);
      currentSuggestedMapping = suggestMapping(data);

      const existingMapping = getMappingBySignature(currentFileSignature);
      if (existingMapping) {
        console.log("File already mapped. Auto-merging...");
        window.addMergedFile(data, existingMapping, file.name, currentFileSignature);
        showToast("Auto-merged using saved header mapping.");
        return;
      }

      showElement("rowSelectionPanel");
      showElement("saveHeadersBtn");
      showElement("clearPreviewBtn");
      renderHeaderPreview(data);
      showToast("File uploaded successfully!", "success");
    })
    .catch(error => {
      console.error("Error uploading file:", error);
      showToast("Failed to parse file. Please check the format.", "error");
    });
}

function suggestMapping(data) {
  const headers = data[0];
  if (!headers || !Array.isArray(headers)) {
    console.error("Invalid headers row:", headers);
    return [];
  }

  return headers.map((cell, i) => {
    const text = (cell || "").toLowerCase();
    if (text.includes("date")) return "Date";

    const sample = data.slice(1, 4).map(row => row[i]);
    if (sample.every(v => !isNaN(parseFloat(v)))) {
      const numbers = sample.map(v => parseFloat(v));
      if (numbers.every(n => n >= 0)) return "Income";
      if (numbers.every(n < 0)) return "Expenses";
    }
    return "Description";
  });
}

function renderHeaderPreview(data) {
  const headerRowIndex = parseInt(document.getElementById("headerRowInput").value, 10) - 1;
  const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;

  if (!data[headerRowIndex] || !data[dataRowIndex]) {
    console.error("Invalid header or data row index.");
    return;
  }

  const headerRow = data[headerRowIndex];
  const dataRow = data[dataRowIndex];

  let html = "<table><thead><tr>";
  headerRow.forEach(cell => html += `<th>${cell || ""}</th>`);
  html += "</tr><tr>";
  headerRow.forEach((_, i) => {
    html += `<td><select data-index="${i}" class="header-map">`;
    HEADERS.forEach(opt => {
      const sel = currentSuggestedMapping[i] === opt ? "selected" : "";
      html += `<option value="${opt}" ${sel}>${opt}</option>`;
    });
    html += "</select></td>";
  });
  html += "</tr></thead><tbody><tr>";
  dataRow.forEach(cell => html += `<td>${cell || ""}</td>`);
  html += "</tr></tbody></table>";

  document.getElementById("previewTable").innerHTML = html;

  document.getElementById("headerRowInput").onchange = () => renderHeaderPreview(data);
  document.getElementById("dataRowInput").onchange = () => renderHeaderPreview(data);
}

function onSaveHeaders() {
  const selects = document.querySelectorAll(".header-map");
  const mapping = Array.from(selects).map(sel => sel.value);

  saveHeadersAndFormat(currentFileSignature, mapping);
  window.addMergedFile(currentFileData, mapping, currentFileName, currentFileSignature);

  clearPreview();
  showToast("File saved and merged.");
}

function clearPreview() {
  currentFileData = null;
  currentFileName = null;
  currentFileSignature = null;

  hideElement("rowSelectionPanel");
  hideElement("saveHeadersBtn");
  hideElement("clearPreviewBtn");
  document.getElementById("previewTable").innerHTML = "";
}

function deleteFormatAndAssociatedFiles(formatSignature) {
  const associatedFiles = window.mergedFiles.filter(file => file.signature === formatSignature);

  if (associatedFiles.length > 0) {
    const fileNames = associatedFiles.map(file => file.fileName).join(", ");
    const confirmDelete = confirm(
      `The following files are associated with this format and will be deleted:\n\n${fileNames}\n\nDo you want to proceed?`
    );

    if (!confirmDelete) return;

    // Remove associated files
    window.mergedFiles = window.mergedFiles.filter(file => file.signature !== formatSignature);
    localStorage.setItem("mergedFiles", JSON.stringify(window.mergedFiles));
    renderMergedFiles();
    updateTransactions();
  }

  // Remove the format
  deleteMapping(formatSignature);
}

function renderMergedFiles() {
  const list = document.getElementById("mergedFilesList");
  list.innerHTML = "";

  (AppState.mergedFiles || []).forEach((file, i) => {
    const li = document.createElement("li");
    li.textContent = file.fileName;

    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.onclick = () => {
      AppState.mergedFiles.splice(i, 1);
      localStorage.setItem("mergedFiles", JSON.stringify(AppState.mergedFiles));
      renderMergedFiles();
      updateTransactions();
      showToast("File removed.");
    };

    li.appendChild(btn);
    list.appendChild(li);
  });

  // If no files are left, clear the transactions section
  if (AppState.mergedFiles.length === 0) {
    AppState.transactions = [];
    renderTransactions([]);
  }
}

function loadMergedFiles() {
  window.mergedFiles = JSON.parse(localStorage.getItem("mergedFiles") || "[]");
  renderMergedFiles();
}

function toggleMergedFilesVisibility() {
  const section = document.getElementById("mergedFilesSection");
  section.classList.toggle("minimized");
}

function safeGetItem(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (error) {
    console.error("Failed to parse localStorage data:", error);
    return {};
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMergedFiles();
  renderMappingList();
  updateTransactions();
});
