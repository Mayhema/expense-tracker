import { AppState } from '../core/appState.js';
import { showToast } from './uiManager.js';

/**
 * Suggests mapping for headers based on naming
 * @param {string} headerText - The header text to analyze
 * @returns {string} The suggested mapping type
 */
export function suggestHeaderMapping(headerText) {
  if (!headerText) return "–";

  const text = String(headerText).toLowerCase().trim();

  // Check each type in order of priority
  if (/date|day|time|תאריך|день/i.test(text)) return "Date";
  if (/expense|debit|cost|payment|out|חובה|gasto|ausgabe/i.test(text)) return "Expenses";
  if (/income|credit|deposit|revenue|in|זכות|ingreso|einkommen/i.test(text)) return "Income";
  if (/desc|note|memo|text|detail|תאור|פרטים|descrip/i.test(text)) return "Description";

  return "–"; // Default case
}

/**
 * Analyzes headers to suggest mappings
 * @param {Array} headers - The header row
 * @param {Object} state - State tracking object
 * @returns {Array} Suggested header mappings
 */
export function analyzeHeaders(headers, state) {
  return headers.map(cell => processHeaderCell(cell, state));
}

function processHeaderCell(cell, state) {
  // Process individual header cell logic
  if (!cell) return "–";

  const headerText = String(cell).toLowerCase().trim();

  if (isDateHeader(headerText)) {
    return processDateHeader(headerText, state);
  }

  if (isDescriptionHeader(headerText)) {
    return "Description";
  }

  if (isExpenseHeader(headerText)) {
    return processExpenseHeader(headerText, state);
  }

  if (isIncomeHeader(headerText)) {
    return processIncomeHeader(headerText, state);
  }

  return "–";
}

// Helper functions for header detection
function isDateHeader(text) {
  return /date|day|time|תאריך|день/i.test(text);
}

function isDescriptionHeader(text) {
  return /desc|note|memo|text|detail|תאור|פרטים|descrip/i.test(text);
}

function isExpenseHeader(text) {
  return /expense|debit|cost|payment|out|חובה|gasto|ausgabe/i.test(text);
}

function isIncomeHeader(text) {
  return /income|credit|deposit|revenue|in|זכות|ingreso|einkommen/i.test(text);
}

function processDateHeader(headerText, state) {
  if (!state.dateColumnFound) {
    state.dateColumnFound = true;
    return "Date";
  } else {
    // Only map one date column to be consistent with other mappings
    return "–";
  }
}

function processExpenseHeader(headerText, state) {
  if (!state.expensesColumnFound) {
    state.expensesColumnFound = true;
    return "Expenses";
  }
  return "–";
}

function processIncomeHeader(headerText, state) {
  if (!state.incomeColumnFound) {
    state.incomeColumnFound = true;
    return "Income";
  }
  return "–";
}

/**
 * Analyzes data content for better mapping suggestions
 * @param {Array} initialMapping - Initial header mappings
 * @param {Array<Array>} data - The 2D array of data
 * @param {Object} state - State tracking object
 * @returns {Array} Improved header mappings
 */
export function analyzeDataContent(initialMapping, data, state) {
  identifyDateColumns(initialMapping, data, state);
  identifyDescriptionColumns(initialMapping, data, state);
  identifyMonetaryColumns(initialMapping, data, state);

  return initialMapping;
}

// Helper functions for data analysis
function getSampleRows(data) {
  // Get first 5 data rows (skip header)
  return data.slice(1, 6);
}

function getColumnValues(rows, columnIndex) {
  return rows.map(row => row[columnIndex]).filter(val => val !== null && val !== undefined && val !== '');
}

function isExcelDateColumn(values) {
  // Check if values look like Excel date numbers
  return values.every(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 35000 && num < 50000; // Excel date range
  });
}

function isDateColumn(values) {
  // Check if values look like dates
  return values.some(val => {
    try {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.getFullYear() > 1900;
    } catch {
      return false;
    }
  });
}

function isDescriptionColumn(values) {
  // Check if values are text-like
  return values.some(val => {
    return typeof val === 'string' && val.length > 5 && /[a-zA-Z]/.test(val);
  });
}

function isMonetaryColumn(values) {
  // Check if values are numeric
  return values.some(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num !== 0;
  });
}

function classifyMonetaryColumn(values, state) {
  // Simple heuristic: positive values are income, negative are expenses
  const hasPositive = values.some(val => parseFloat(val) > 0);
  const hasNegative = values.some(val => parseFloat(val) < 0);

  if (hasNegative && !hasPositive && !state.expensesColumnFound) {
    state.expensesColumnFound = true;
    return "Expenses";
  } else if (hasPositive && !state.incomeColumnFound) {
    state.incomeColumnFound = true;
    return "Income";
  } else if (!state.expensesColumnFound)

    return "–";
}

// Helper functions to reduce complexity
function identifyDateColumns(mapping, data, state) {
  const samples = getSampleRows(data);

  // Find date columns first
  for (let i = 0; i < mapping.length; i++) {
    if (mapping[i] !== "–") continue;

    const values = getColumnValues(samples, i);
    if (values.length === 0) continue;

    if (!state.dateColumnFound) {
      if (isExcelDateColumn(values) || isDateColumn(values)) {
        mapping[i] = "Date";
        state.dateColumnFound = true;
        break; // Stop after finding one date column
      }
    }
  }
}

function identifyDescriptionColumns(mapping, data, state) {
  const samples = getSampleRows(data);

  if (state.descriptionColumnFound) return;

  for (let i = 0; i < mapping.length; i++) {
    if (mapping[i] !== "–") continue;

    const values = getColumnValues(samples, i);
    if (!values.length) continue;

    if (isDescriptionColumn(values)) {
      mapping[i] = "Description";
      state.descriptionColumnFound = true;
      break;
    }
  }
}

function identifyMonetaryColumns(mapping, data, state) {
  const samples = getSampleRows(data);

  for (let i = 0; i < mapping.length; i++) {
    if (mapping[i] !== "–") continue;

    const values = getColumnValues(samples, i);
    if (!values.length) continue;

    if (isMonetaryColumn(values)) {
      mapping[i] = classifyMonetaryColumn(values, state);
    }
  }
}

/**
 * Suggests header mappings based on data analysis
 * @param {Array<Array>} data - The data to analyze
 * @returns {Array} Suggested header mappings
 */
export function suggestMapping(data) {
  if (!data || data.length < 2) {
    console.warn("Not enough data for header mapping");
    return [];
  }

  try {
    // Track state across analyses
    const state = {
      dateColumnFound: false,
      incomeColumnFound: false,
      expensesColumnFound: false
    };

    // Get the header row (first row by default)
    const headerRow = data[0] || [];

    // First pass: analyze headers
    const initialMapping = analyzeHeaders(headerRow, state);

    // Second pass: analyze data content to improve suggestions
    const improvedMapping = analyzeDataContent(initialMapping, data, state);

    return improvedMapping;
  } catch (error) {
    console.error("Error suggesting mapping:", error);
    return Array(data[0]?.length || 0).fill("–");
  }
}

/**
 * Updates the header mapping when a dropdown is changed
 * @param {HTMLSelectElement} select - The dropdown that was changed
 * @param {number} index - The index of the column being mapped
 */
export function updateHeaderMapping(select, index) {
  // Split into smaller functions
  const newValue = select.value;

  if (newValue === "–") {
    handlePlaceholderSelection(select, newValue);
    return;
  }

  if (isDuplicateMapping(newValue, index)) {
    handleDuplicateMapping(newValue, index);
  }

  updateCurrentMapping(index, newValue);
  updateSaveButtonState();
  checkForDuplicateHeaders();
}

// Helper functions to break down complexity
function handlePlaceholderSelection(selectElement, selectedValue) {
  const columnIndex = Array.from(selectElement.closest('tr').children).indexOf(selectElement.closest('td'));

  console.log(`Handling placeholder selection: ${selectedValue} for column ${columnIndex}`);

  // Update the current mapping array
  if (!currentMapping) {
    currentMapping = new Array(document.querySelectorAll('.header-select').length).fill('–');
  }
  if (columnIndex >= 0 && columnIndex < currentMapping.length) {
    currentMapping[columnIndex] = selectedValue;
  }

  console.log("Updated mapping:", currentMapping);
}

function isDuplicateMapping(selectedValue, currentColumnIndex) {
  if (!currentMapping || !Array.isArray(currentMapping)) {
    return false;
  }

  return currentMapping.findIndex((mapping, index) => {
    return mapping === selectedValue && index !== currentColumnIndex;
  }) !== -1;
}

function handleDuplicateMapping(newValue, index) {
  // Find the other column with this mapping
  const existingIndex = AppState.currentSuggestedMapping.findIndex(
    (val, i) => i !== index && val === newValue
  );

  if (existingIndex !== -1) {
    // Clear the existing mapping
    AppState.currentSuggestedMapping[existingIndex] = "–";

    // Update the UI for the affected dropdown
    const existingSelect = document.querySelector(`select[data-column-index="${existingIndex}"]`);
    if (existingSelect) {
      existingSelect.value = "–";
    }

    showToast(`Moved ${newValue} mapping from column ${existingIndex + 1} to column ${index + 1}`, 'info');
  }
}

function updateCurrentMapping(index, newValue) {
  AppState.currentSuggestedMapping[index] = newValue;
}

function updateSaveButtonState() {
  const hasDate = AppState.currentSuggestedMapping.includes("Date");
  const hasAmount = AppState.currentSuggestedMapping.includes("Income") ||
    AppState.currentSuggestedMapping.includes("Expenses");

  const saveButton = document.getElementById("saveHeadersBtn");
  if (saveButton) {
    saveButton.disabled = !(hasDate && hasAmount);
    saveButton.title = hasDate && hasAmount ?
      "Save this mapping" :
      "You need at least Date and either Income or Expenses columns";
  }
}

function checkForDuplicateHeaders() {
  // This function can be implemented if needed to highlight duplicate mappings
  // For now, we handle duplicates in handleDuplicateMapping
}

/**
 * Renders header preview for file upload modal
 * @param {Array<Array>} data - The file data
 * @param {string} containerId - ID of container to render into
 * @param {string} headerInputId - ID of header row input
 * @param {string} dataInputId - ID of data row input
 */
export function renderHeaderPreview(data, containerId, headerInputId, dataInputId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Get row indices
  const headerRowInput = document.getElementById(headerInputId);
  const dataRowInput = document.getElementById(dataInputId);

  const headerRowIndex = headerRowInput ? parseInt(headerRowInput.value, 10) - 1 : 0;
  const dataRowIndex = dataRowInput ? parseInt(dataRowInput.value, 10) - 1 : 1;

  // Validate indices
  if (headerRowIndex < 0 || headerRowIndex >= data.length ||
    dataRowIndex < 0 || dataRowIndex >= data.length) {
    container.innerHTML = '<p>Invalid row selection</p>';
    return;
  }

  const headerRow = data[headerRowIndex] || [];
  const dataRow = data[dataRowIndex] || [];

  // Generate mapping suggestions
  const suggestedMapping = suggestMapping(data);

  // Create preview table
  let html = `
    <div class="preview-info">
      <p>Map columns to the required fields below. At minimum, you need Date and either Income or Expenses.</p>
    </div>
    <div class="preview-table-container">
      <table class="preview-table" style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;">Column</th>
          ${headerRow.map((_, i) => `<th style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;">${i + 1}</th>`).join('')}
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Header</td>
          ${headerRow.map(header => `<td style="padding: 8px; border: 1px solid #ddd;">${header || "<em>empty</em>"}</td>`).join('')}
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Map To</td>
          ${headerRow.map((_, i) => {
    const selected = suggestedMapping && suggestedMapping[i] ? suggestedMapping[i] : "–";
    return `
              <td style="padding: 8px; border: 1px solid #ddd;">
                <select class="header-map" data-column-index="${i}" style="width: 100%;">
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
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sample</td>
          ${dataRow.map(cell => `<td style="padding: 8px; border: 1px solid #ddd;">${cell || "<em>empty</em>"}</td>`).join('')}
        </tr>
      </table>
    </div>
  `;

  container.innerHTML = html;

  // Add event listeners to dropdowns
  setTimeout(() => {
    const selects = container.querySelectorAll('.header-map');
    selects.forEach((select, index) => {
      select.addEventListener('change', (e) => {
        updateHeaderMapping(e.target, index);
      });
    });
  }, 100);
}
