import { AppState } from "../core/appState.js";
import { showModal } from "./modalManager.js";
import { suggestMapping } from "./headerMapping.js";
import { addMergedFile } from "../main.js";
import { generateFileSignature } from "../parsers/fileHandler.js";
import { saveHeadersAndFormat } from "../mappings/mappingsManager.js";
import { showToast } from "./uiManager.js";

/**
 * Shows the file upload and mapping modal
 * @param {Array<Array>} data - The parsed file data
 * @param {string} fileName - The name of the file
 */
export function showFileUploadModal(data, fileName) {
  if (!data || !data.length) {
    showToast("No data to map", "error");
    return;
  }

  // Store in AppState
  AppState.currentFileData = data;
  AppState.currentFileName = fileName;

  // Generate mapping suggestion
  AppState.currentSuggestedMapping = suggestMapping(data);

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'file-upload-modal';

  // Create table preview
  const tablePreview = document.createElement('div');
  tablePreview.className = 'table-preview';
  tablePreview.innerHTML = createTablePreview(data, AppState.currentSuggestedMapping);

  // Create row selection panel
  const rowSelectionPanel = document.createElement('div');
  rowSelectionPanel.className = 'row-selection-panel';
  rowSelectionPanel.innerHTML = `
    <div style="margin-bottom: 15px;">
      <label for="headerRowInput">Header Row: </label>
      <input type="number" id="headerRowInput" min="1" max="${data.length}" value="1" style="width: 60px;">

      <label for="dataRowInput" style="margin-left: 15px;">Data Starts at Row: </label>
      <input type="number" id="dataRowInput" min="1" max="${data.length}" value="2" style="width: 60px;">

      <label for="fileCurrency" style="margin-left: 15px;">Currency: </label>
      <select id="fileCurrency" style="width: 80px;">
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="ILS">ILS</option>
      </select>
    </div>
  `;

  // Add all elements to modal content
  modalContent.appendChild(rowSelectionPanel);
  modalContent.appendChild(tablePreview);

  // Create buttons
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button id="cancelMappingBtn" class="button secondary">Cancel</button>
    <button id="saveHeadersBtn" class="button primary">Save & Merge File</button>
  `;

  modalContent.appendChild(footer);

  // Show modal
  const modal = showModal({
    title: `Map File: ${fileName}`,
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Add event listeners
  document.getElementById('saveHeadersBtn').addEventListener('click', () => {
    saveHeadersAndMergeFile(modal);
  });

  document.getElementById('cancelMappingBtn').addEventListener('click', () => {
    modal.close();
  });

  // Add event listeners for mapping dropdowns
  setTimeout(() => {
    document.querySelectorAll('.header-map').forEach((select, index) => {
      select.addEventListener('change', (e) => {
        updateHeaderMapping(e.target, index);
      });
    });

    // Add event listeners for row selection
    const headerRowInput = document.getElementById('headerRowInput');
    const dataRowInput = document.getElementById('dataRowInput');

    if (headerRowInput && dataRowInput) {
      headerRowInput.addEventListener('change', updateTablePreview);
      dataRowInput.addEventListener('change', updateTablePreview);
    }
  }, 100);
}

/**
 * Updates the table preview when row indices change
 */
function updateTablePreview() {
  const headerRowInput = document.getElementById('headerRowInput');
  const dataRowInput = document.getElementById('dataRowInput');
  const tablePreview = document.querySelector('.table-preview');

  if (!headerRowInput || !dataRowInput || !tablePreview) return;

  const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
  const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;

  if (isNaN(headerRowIndex) || isNaN(dataRowIndex)) return;

  // Get the header and data rows
  const headerRow = AppState.currentFileData[headerRowIndex];
  const dataRow = AppState.currentFileData[dataRowIndex];

  if (!headerRow || !dataRow) return;

  // Update the table preview
  tablePreview.innerHTML = createTablePreview(
    AppState.currentFileData,
    AppState.currentSuggestedMapping,
    headerRowIndex,
    dataRowIndex
  );

  // Re-add event listeners for mapping dropdowns
  document.querySelectorAll('.header-map').forEach((select, index) => {
    select.addEventListener('change', (e) => {
      updateHeaderMapping(e.target, index);
    });
  });
}

/**
 * Creates the table preview HTML
 */
function createTablePreview(data, mapping, headerRowIndex = 0, dataRowIndex = 1) {
  if (!data || !data.length) return '<p>No data to preview</p>';

  const headerRow = data[headerRowIndex] || [];
  const dataRow = data[dataRowIndex] || [];

  let html = `
    <div class="preview-info">
      <p>Map columns to the required fields below. At minimum, you need Date and either Income or Expenses.</p>
    </div>
    <div class="preview-table-container">
      <table class="preview-table">
        <tr>
          <th>Column</th>
          ${headerRow.map((_, i) => `<th>${i + 1}</th>`).join('')}
        </tr>
        <tr>
          <td>Header</td>
          ${headerRow.map(header => `<td>${header || "<em>empty</em>"}</td>`).join('')}
        </tr>
        <tr>
          <td>Map To</td>
          ${headerRow.map((_, i) => {
    const selected = mapping && mapping[i] ? mapping[i] : "–";
    return `
              <td>
                <select class="header-map" data-index="${i}">
                  <option value="–" ${selected === "–" ? 'selected' : ''}>–</option>
                  <option value="Date" ${selected === "Date" ? 'selected' : ''}>Date</option>
                  <option value="Description" ${selected === "Description" ? 'selected' : ''}>Description</option>
                  <option value="Income" ${selected === "Income" ? 'selected' : ''}>Income</option>
                  <option value="Expenses" ${selected === "Expenses" ? 'selected' : ''}>Expenses</option>
                </select>
              </td>
            `;
  }).join('')}
        </tr>
        <tr>
          <td>Sample</td>
          ${dataRow.map(cell => `<td>${cell || "<em>empty</em>"}</td>`).join('')}
        </tr>
      </table>
    </div>
  `;

  return html;
}

/**
 * Updates the header mapping when a dropdown changes
 */
function updateHeaderMapping(select, index) {
  const newValue = select.value;

  // Skip further processing if setting to placeholder
  if (newValue === "–") {
    AppState.currentSuggestedMapping[index] = newValue;
    return;
  }

  // Check for duplicates on required fields
  if (newValue !== "Description") {
    const existingIndex = AppState.currentSuggestedMapping.findIndex(
      (value, i) => i !== index && value === newValue
    );

    // If this header type already exists elsewhere, reset the other one
    if (existingIndex !== -1) {
      const existingDropdown = document.querySelector(`.header-map[data-index="${existingIndex}"]`);
      if (existingDropdown) {
        existingDropdown.value = "–";
      }

      // Update the mapping
      AppState.currentSuggestedMapping[existingIndex] = "–";
    }
  }

  // Update the current mapping
  AppState.currentSuggestedMapping[index] = newValue;
}

/**
 * Saves headers and merges the file
 */
function saveHeadersAndMergeFile(modal) {
  try {
    // Get the mappings
    const mapping = AppState.currentSuggestedMapping;

    // Validate required fields
    const hasDate = mapping.includes("Date");
    const hasAmount = mapping.includes("Income") || mapping.includes("Expenses");

    if (!hasDate || !hasAmount) {
      showToast("You must map at least Date and either Income or Expenses fields", "error");
      return;
    }

    // Get row indices and currency
    const headerRowInput = document.getElementById("headerRowInput");
    const dataRowInput = document.getElementById("dataRowInput");
    const currencySelect = document.getElementById("fileCurrency");

    if (!headerRowInput || !dataRowInput) {
      showToast("Could not find row input fields", "error");
      return;
    }

    const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
    const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;
    const currency = currencySelect ? currencySelect.value : "USD";

    // Generate signature
    const finalSignature = generateFileSignature(
      AppState.currentFileName,
      AppState.currentFileData,
      mapping
    );

    // Save mapping for future use
    saveHeadersAndFormat(finalSignature, mapping, null, headerRowIndex, dataRowIndex);

    // Add merged file
    addMergedFile(
      AppState.currentFileData,
      mapping,
      AppState.currentFileName,
      finalSignature,
      headerRowIndex,
      dataRowIndex,
      currency
    );

    // Close modal and show success message
    modal.close();
    showToast("File merged successfully!", "success");
  } catch (error) {
    console.error("Error saving headers:", error);
    showToast("Error saving mappings: " + error.message, "error");
  }
}
