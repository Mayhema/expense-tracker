import { AppState } from "../core/appState.js";
import { showModal } from "./modalManager.js";
import { suggestMapping } from "./headerMapping.js";
import { addMergedFile } from "../core/fileManager.js";
import { generateFileSignature } from "../parsers/fileHandler.js";
import { saveHeadersAndFormat } from "../mappings/mappingsManager.js";
import { showToast } from "./uiManager.js";
import { isExcelDate, formatExcelDateForPreview } from "../utils/dateUtils.js";

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
    <button id="cancelMappingBtn" class="button secondary-btn">Cancel</button>
    <button id="saveHeadersBtn" class="button primary-btn">Save & Merge File</button>
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
  setTimeout(() => {
    const saveBtn = document.getElementById('saveHeadersBtn');
    const cancelBtn = document.getElementById('cancelMappingBtn');

    if (saveBtn) {
      console.log('CRITICAL: Save button found, forcing enable state');

      // ULTRA AGGRESSIVE FIX: Force enable the button immediately with complete override
      saveBtn.disabled = false;
      saveBtn.removeAttribute('disabled');
      saveBtn.style.pointerEvents = 'auto';
      saveBtn.style.cursor = 'pointer';
      saveBtn.style.opacity = '1';
      saveBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
      saveBtn.style.color = 'white';
      saveBtn.classList.remove('disabled');
      saveBtn.classList.add('primary-btn');

      // Force override any potential conflicting styles with !important
      saveBtn.style.setProperty('pointer-events', 'auto', 'important');
      saveBtn.style.setProperty('cursor', 'pointer', 'important');
      saveBtn.style.setProperty('opacity', '1', 'important');

      console.log('CRITICAL: Save button initial state - disabled:', saveBtn.disabled);
      console.log('CRITICAL: Save button computed styles:', window.getComputedStyle(saveBtn));

      saveBtn.addEventListener('click', (event) => {
        console.log('CRITICAL: Save button clicked - event:', event);
        console.log('CRITICAL: Save button disabled state:', saveBtn.disabled);
        console.log('CRITICAL: Save button pointer events:', saveBtn.style.pointerEvents);

        // Prevent any potential event blocking
        event.stopPropagation();
        event.preventDefault();

        // Always proceed since we keep the button enabled
        console.log('CRITICAL: Button is enabled, proceeding with save');
        try {
          saveHeadersAndMergeFile(modal);
        } catch (error) {
          console.error('CRITICAL ERROR in saveHeadersAndMergeFile:', error);
          showToast("Error processing file: " + error.message, "error");
        }
      });
      console.log('CRITICAL: Save button event listener attached successfully');

      // Also add a fallback click handler with addEventListener options
      saveBtn.addEventListener('click', (event) => {
        console.log('CRITICAL: Fallback click handler triggered');
      }, { capture: true });

    } else {
      console.error('CRITICAL ERROR: saveHeadersBtn not found in DOM');
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.close();
      });
      console.log('CRITICAL: Cancel button event listener attached successfully');
    } else {
      console.error('CRITICAL ERROR: cancelMappingBtn not found in DOM');
    }

    // CRITICAL FIX: Update button state after event listeners are attached
    updateSaveButtonState();

    // ADDITIONAL FIX: Re-apply button styling every 100ms for the first second
    let attempts = 0;
    const ensureButtonEnabled = () => {
      const btn = document.getElementById('saveHeadersBtn');
      if (btn && attempts < 10) {
        btn.disabled = false;
        btn.style.setProperty('pointer-events', 'auto', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');
        btn.style.setProperty('opacity', '1', 'important');
        attempts++;
        setTimeout(ensureButtonEnabled, 100);
      }
    };
    ensureButtonEnabled();

  }, 100);

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
 * Updates the header mapping when a dropdown changes
 */
function updateHeaderMapping(select, index) {
  const newValue = select.value;

  console.log(`CRITICAL: updateHeaderMapping called - index: ${index}, newValue: "${newValue}"`);
  console.log(`CRITICAL: Current mapping before update:`, AppState.currentSuggestedMapping);

  // Skip further processing if setting to placeholder
  if (newValue === "–") {
    AppState.currentSuggestedMapping[index] = newValue;
    console.log(`CRITICAL: Set mapping[${index}] to "–"`);
    // Update preview to remove date conversion
    updateTablePreviewAfterMapping();
    return;
  }

  // FIXED: Check for duplicates on required fields (especially Date)
  if (newValue !== "Description") {
    const existingIndex = AppState.currentSuggestedMapping.findIndex(
      (value, i) => i !== index && value === newValue
    );

    // If this header type already exists elsewhere, reset the other one
    if (existingIndex !== -1) {
      console.log(`CRITICAL: Found duplicate mapping "${newValue}" at index ${existingIndex}, resetting it`);
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
  console.log(`CRITICAL: Set mapping[${index}] to "${newValue}"`);
  console.log(`CRITICAL: Updated mapping:`, AppState.currentSuggestedMapping);

  // FIXED: Update preview to show/hide date conversion
  updateTablePreviewAfterMapping();
}

/**
 * FIXED: Update table preview after mapping changes to show date conversion
 */
function updateTablePreviewAfterMapping() {
  const tablePreview = document.querySelector('.table-preview');
  if (!tablePreview || !AppState.currentFileData) return;

  const headerRowInput = document.getElementById('headerRowInput');
  const dataRowInput = document.getElementById('dataRowInput');

  const headerRowIndex = headerRowInput ? parseInt(headerRowInput.value, 10) - 1 : 0;
  const dataRowIndex = dataRowInput ? parseInt(dataRowInput.value, 10) - 1 : 1;

  // Update the table preview with current mapping
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

  updateSaveButtonState();
}

/**
 * Creates the table preview HTML with proper date conversion display
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
          ${dataRow.map((cell, index) => {
    // FIXED: Show converted date preview only if this column is mapped as Date
    const isMappedAsDate = mapping && mapping[index] === 'Date';
    let displayValue = cell || "<em>empty</em>";

    if (cell && isMappedAsDate && isExcelDate(cell)) {
      displayValue = formatExcelDateForPreview(cell);
    } else if (cell) {
      displayValue = String(cell);
    }

    return `<td>${displayValue}</td>`;
  }).join('')}
        </tr>
      </table>
    </div>
  `;

  return html;
}

/**
 * Updates save button state based on mapping validation
 */
function updateSaveButtonState() {
  const saveBtn = document.getElementById('saveHeadersBtn');
  if (!saveBtn) {
    console.error('CRITICAL ERROR: Save button not found when trying to update state');
    return;
  }

  const mapping = AppState.currentSuggestedMapping || [];
  const hasDate = mapping.includes('Date');
  const hasAmount = mapping.includes('Income') || mapping.includes('Expenses');

  console.log('CRITICAL: Updating save button state - mapping:', mapping, 'hasDate:', hasDate, 'hasAmount:', hasAmount);

  // ULTRA AGGRESSIVE FIX: Always enable the button with complete override
  saveBtn.disabled = false;
  saveBtn.removeAttribute('disabled');
  saveBtn.style.pointerEvents = 'auto';
  saveBtn.style.cursor = 'pointer';
  saveBtn.style.opacity = '1';
  saveBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
  saveBtn.style.color = 'white';
  saveBtn.classList.remove('disabled');
  saveBtn.classList.add('primary-btn');

  // Force override any potential conflicting styles
  saveBtn.style.setProperty('pointer-events', 'auto', 'important');
  saveBtn.style.setProperty('cursor', 'pointer', 'important');
  saveBtn.style.setProperty('opacity', '1', 'important');

  saveBtn.title = hasDate && hasAmount ?
    'Ready to import' :
    'Click to configure mapping (Date and Income/Expenses needed)';

  console.log('CRITICAL: Save button ULTRA FORCE ENABLED with complete styling override');
  console.log('CRITICAL: Button properties after update:', {
    disabled: saveBtn.disabled,
    pointerEvents: saveBtn.style.pointerEvents,
    cursor: saveBtn.style.cursor,
    opacity: saveBtn.style.opacity,
    className: saveBtn.className
  });
}

/**
 * Saves headers and merges the file
 */
function saveHeadersAndMergeFile(modal) {
  console.log('CRITICAL: saveHeadersAndMergeFile function called');

  try {
    // Get the mappings
    const mapping = AppState.currentSuggestedMapping;
    console.log('CRITICAL: Current mapping:', mapping);

    if (!mapping || !Array.isArray(mapping)) {
      console.error('CRITICAL ERROR: Invalid mapping state');
      showToast("Error: Invalid mapping state", "error");
      return;
    }

    // Validate required fields
    const hasDate = mapping.includes("Date");
    const hasAmount = mapping.includes("Income") || mapping.includes("Expenses");
    console.log('CRITICAL: Mapping validation - hasDate:', hasDate, 'hasAmount:', hasAmount);

    if (!hasDate || !hasAmount) {
      console.log('CRITICAL: Mapping validation failed');
      showToast("You must map at least Date and either Income or Expenses fields", "error");
      return;
    }

    // FIXED: Validate only one Date column is mapped
    const dateColumns = mapping.filter(field => field === "Date");
    if (dateColumns.length > 1) {
      console.log('CRITICAL: Multiple Date columns mapped');
      showToast("Only one column can be mapped as Date", "error");
      return;
    }

    // Get row indices and currency
    const headerRowInput = document.getElementById("headerRowInput");
    const dataRowInput = document.getElementById("dataRowInput");
    const currencySelect = document.getElementById("fileCurrency");

    if (!headerRowInput || !dataRowInput) {
      console.error('CRITICAL ERROR: Row input fields not found');
      showToast("Could not find row input fields", "error");
      return;
    }

    const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
    const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;
    const currency = currencySelect ? currencySelect.value : "USD";

    console.log('CRITICAL: Processing with headerRowIndex:', headerRowIndex, 'dataRowIndex:', dataRowIndex, 'currency:', currency);

    // CRITICAL FIX: Generate signature and save mapping
    const finalSignature = generateFileSignature(
      AppState.currentFileName,
      AppState.currentFileData,
      mapping
    );

    console.log('CRITICAL: Generated signature:', finalSignature);

    // CRITICAL FIX: Save mapping with correct structure expected by findMappingBySignature
    saveHeadersAndFormat(
      finalSignature,
      mapping,
      AppState.currentFileName,
      headerRowIndex,
      dataRowIndex,
      currency
    );

    console.log('CRITICAL: Saved mapping with signature:', finalSignature, 'mapping:', mapping);

    // Add merged file
    console.log('CRITICAL: Calling addMergedFile...');
    addMergedFile(
      AppState.currentFileData,
      mapping,
      AppState.currentFileName,
      finalSignature,
      headerRowIndex,
      dataRowIndex,
      currency
    );

    console.log('CRITICAL: Successfully added merged file');

    // Close modal and show success message
    modal.close();
    showToast("File merged successfully and mapping saved!", "success");

  } catch (error) {
    console.error("CRITICAL ERROR: Error saving headers:", error);
    showToast("Error saving mappings: " + error.message, "error");
  }
}
