import { AppState } from "../core/appState.js";
import { showToast } from "./uiManager.js";
import { HEADERS } from "../core/constants.js";

/**
 * Suggests mapping for headers based on naming
 * @param {string} headerText - The header text to analyze
 * @returns {string} The suggested mapping type
 */
export function suggestHeaderMapping(headerText) {
  if (!headerText) return "–";

  // Convert to lowercase for case-insensitive matching
  const text = String(headerText).toLowerCase().trim();

  // Check for date headers
  if (isDateHeader(text)) return "Date";

  // Check for expense headers
  if (isExpenseHeader(text)) return "Expenses";

  // Check for income headers
  if (isIncomeHeader(text)) return "Income";

  // Check for description headers
  if (isDescriptionHeader(text)) return "Description";

  // Default to placeholder
  return "–";
}

/**
 * Analyzes headers to suggest mappings
 * @param {Array} headers - The header row
 * @param {Object} state - State tracking object
 * @returns {Array} Suggested header mappings
 */
export function analyzeHeaders(headers, state) {
  return headers.map(cell => {
    // Handle null or undefined cells
    if (!cell) return "–";

    // Convert to string
    const headerText = String(cell).toLowerCase().trim();

    // Check for date headers with highest priority
    if (isDateHeader(headerText)) {
      if (!state.dateColumnFound) {
        state.dateColumnFound = true;
        return "Date";
      } else {
        // Allow multiple date columns if needed - just don't mark them as found
        return "Date";
      }
    }

    // Check for description headers - allow multiple
    if (isDescriptionHeader(headerText)) {
      return "Description";
    }

    // Check for expense headers
    if (isExpenseHeader(headerText)) {
      if (!state.expensesColumnFound) {
        state.expensesColumnFound = true;
        return "Expenses";
      }
    }

    // Check for income headers
    if (isIncomeHeader(headerText)) {
      if (!state.incomeColumnFound) {
        state.incomeColumnFound = true;
        return "Income";
      }
    }

    // Default to placeholder
    return "–";
  });
}

/**
 * Analyzes data content for better mapping suggestions
 * @param {Array} initialMapping - Initial header mappings
 * @param {Array<Array>} data - The 2D array of data
 * @param {Object} state - State tracking object
 * @returns {Array} Improved header mappings
 */
export function analyzeDataContent(initialMapping, data, state) {
  // Get sample rows
  const samples = getSampleRows(data);

  // First prioritize finding date columns
  for (let colIndex = 0; colIndex < initialMapping.length; colIndex++) {
    // Skip columns already mapped to something other than placeholder
    if (initialMapping[colIndex] !== "–") continue;

    // Get column values for analysis
    const columnValues = samples.map(row =>
      colIndex < row.length ? row[colIndex] : null
    ).filter(Boolean);

    if (columnValues.length === 0) continue;

    // Check for Excel date numbers specifically (high priority)
    if (!state.dateColumnFound && isExcelDateColumn(columnValues)) {
      initialMapping[colIndex] = "Date";
      state.dateColumnFound = true;
      console.log(`Column ${colIndex} identified as Excel Date based on content`);
      continue;
    }

    // Check for regular date formats
    if (!state.dateColumnFound && isDateColumn(columnValues)) {
      initialMapping[colIndex] = "Date";
      state.dateColumnFound = true;
      console.log(`Column ${colIndex} identified as Date based on content`);
    }
  }

  // Then look for description columns - now with higher priority for text content
  for (let colIndex = 0; colIndex < initialMapping.length; colIndex++) {
    if (initialMapping[colIndex] !== "–") continue;

    const columnValues = samples.map(row =>
      colIndex < row.length ? row[colIndex] : null
    ).filter(Boolean);

    if (columnValues.length === 0) continue;

    if (!state.descriptionColumnFound && isDescriptionColumn(columnValues)) {
      initialMapping[colIndex] = "Description";
      state.descriptionColumnFound = true;
      console.log(`Column ${colIndex} identified as Description based on text content`);
    }
  }

  // Finally process monetary columns
  for (let colIndex = 0; colIndex < initialMapping.length; colIndex++) {
    if (initialMapping[colIndex] !== "–") continue;

    const columnValues = samples.map(row =>
      colIndex < row.length ? row[colIndex] : null
    ).filter(Boolean);

    if (columnValues.length === 0) continue;

    if (isMonetaryColumn(columnValues)) {
      const newMapping = classifyMonetaryColumn(columnValues, state);
      console.log(`Column ${colIndex} identified as ${newMapping} based on monetary values`);
      initialMapping[colIndex] = newMapping;
    }
  }

  return initialMapping;
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
  const newValue = select.value;
  console.log(`Changing column ${index} mapping to ${newValue}`);

  // Skip further processing if setting to placeholder
  if (newValue === "–") {
    AppState.currentSuggestedMapping[index] = newValue;

    // Check if we have valid required fields for saving
    const hasDate = AppState.currentSuggestedMapping.includes("Date");
    const hasAmount = AppState.currentSuggestedMapping.includes("Income") ||
      AppState.currentSuggestedMapping.includes("Expenses");

    // Enable/disable save button
    const saveButton = document.getElementById("saveHeadersBtn");
    if (saveButton) {
      saveButton.disabled = !(hasDate && hasAmount);
      saveButton.title = hasDate && hasAmount ?
        "Save this mapping" :
        "You need at least Date and either Income or Expenses columns";
    }
    return;
  }

  // Check for duplicates on ALL fields (including Description)
  const existingIndex = AppState.currentSuggestedMapping.findIndex(
    (value, i) => i !== index && value === newValue
  );

  // If this header type already exists elsewhere, reset the other one
  if (existingIndex !== -1) {
    // Create a visual indication
    const existingDropdown = document.querySelector(`.header-map[data-index="${existingIndex}"]`);
    if (existingDropdown) {
      // Flash the element to show it was changed
      existingDropdown.style.backgroundColor = "#ffecec";
      existingDropdown.value = "–";

      // Reset after animation
      setTimeout(() => {
        existingDropdown.style.backgroundColor = "";
      }, 1000);
    }

    // Update the mapping
    AppState.currentSuggestedMapping[existingIndex] = "–";
    console.log(`Reset duplicate mapping at column ${existingIndex} to –`);
    showToast(`Only one column can be mapped as "${newValue}". Previous selection reset.`, "info");
  }

  // Update the current mapping
  AppState.currentSuggestedMapping[index] = newValue;

  // Check if we have valid required fields for saving
  const hasDate = AppState.currentSuggestedMapping.includes("Date");
  const hasAmount = AppState.currentSuggestedMapping.includes("Income") ||
    AppState.currentSuggestedMapping.includes("Expenses");

  // Enable/disable save button
  const saveButton = document.getElementById("saveHeadersBtn");
  if (saveButton) {
    saveButton.disabled = !(hasDate && hasAmount);
    saveButton.title = hasDate && hasAmount ?
      "Save this mapping" :
      "You need at least Date and either Income or Expenses columns";
  }

  // Check for duplicate headers immediately
  checkForDuplicateHeaders();
}

/**
 * Renders the header preview table
 * @param {Array<Array>} data - The data to preview
 * @param {string} targetElementId - ID of element to render into (default: "previewTable")
 * @param {string} headerRowInputId - ID of header row input (default: "headerRowInput")
 * @param {string} dataRowInputId - ID of data row input (default: "dataRowInput")
 */
export function renderHeaderPreview(data, targetElementId = "previewTable", headerRowInputId = "headerRowInput", dataRowInputId = "dataRowInput") {
  if (!data || data.length === 0) {
    console.error("No data to render for header preview");
    return;
  }

  // Get header and data row indices from input fields
  const headerRowInput = document.getElementById(headerRowInputId);
  const dataRowInput = document.getElementById(dataRowInputId);

  if (!headerRowInput || !dataRowInput) {
    console.error("Header row or data row input fields not found");
    return;
  }

  const headerRowIndex = parseInt(headerRowInput.value, 10) - 1; // Convert to 0-based
  const dataRowIndex = parseInt(dataRowInput.value, 10) - 1; // Convert to 0-based

  // Validate indices
  if (headerRowIndex < 0 || headerRowIndex >= data.length) {
    console.error("Header row index out of range");
    return;
  }

  if (dataRowIndex < 0 || dataRowIndex >= data.length) {
    console.error("Data row index out of range");
    return;
  }

  const headerRow = data[headerRowIndex];
  const dataRow = data[dataRowIndex];

  if (!headerRow || !dataRow) {
    console.error("Header or data row not found");
    return;
  }

  console.log("Rendering header preview with header row:", headerRow);
  console.log("Data sample row:", dataRow);

  // Check if we have an existing mapping
  if (!AppState.currentSuggestedMapping ||
    AppState.currentSuggestedMapping.length !== headerRow.length) {
    // Generate a new mapping suggestion
    AppState.currentSuggestedMapping = suggestMapping(data);
  }

  // Build HTML for the table
  let html = '<table class="preview-table" style="width: 100%; margin-top: 20px;">';

  // File format info
  const fileExt = AppState.currentFileName ? AppState.currentFileName.split('.').pop().toLowerCase() : 'unknown';
  html += `<tr><td colspan="${headerRow.length + 1}" style="text-align:left; padding:5px;">
    <strong>File Type:</strong> ${fileExt.toUpperCase()} |
    <strong>Header Row:</strong> ${headerRowIndex + 1} |
    <strong>Data Row:</strong> ${dataRowIndex + 1}
  </td></tr>`;

  // Header row with labels
  html += '<tr><th>Column</th>';

  // Add headers
  headerRow.forEach((header, i) => {
    html += `<th>${i + 1}</th>`;
  });

  html += '</tr>';

  // Original header row
  html += '<tr><td>Header</td>';

  headerRow.forEach(header => {
    html += `<td>${header || "<em>empty</em>"}</td>`;
  });

  html += '</tr>';

  // Add mapping dropdowns
  html += '<tr><td>Map To</td>';

  headerRow.forEach((_, i) => {
    const selected = AppState.currentSuggestedMapping && AppState.currentSuggestedMapping[i] ?
      AppState.currentSuggestedMapping[i] : "–";
    html += `
      <td>
        <select class="header-map" data-index="${i}">
          ${HEADERS.map(header =>
      `<option value="${header}" ${header === selected ? 'selected' : ''}>${header}</option>`
    ).join('')}
        </select>
      </td>`;
  });

  html += '</tr>';

  // Sample data row
  html += '<tr><td>Sample</td>';

  dataRow.forEach(cell => {
    html += `<td>${cell || "<em>empty</em>"}</td>`;
  });

  html += '</tr></table>';

  // Add mapping hint with clearer guidance based on file type
  html += `
    <div class="mapping-hint">
      <p>Map columns to: <strong>Date</strong> (required), <strong>Income</strong> or <strong>Expenses</strong> (at least one required),
      and optionally <strong>Description</strong>. Use "–" for columns to ignore.</p>

      <p class="file-format-note" style="font-size:0.9em; color:#666;">
        <strong>Note for ${fileExt.toUpperCase()} files:</strong>
        ${fileExt === 'xml' ?
      'XML files may use the same row index for both header and data if each row contains field names.' :
      fileExt === 'xlsx' || fileExt === 'xls' ?
        'Excel files typically have headers in row 1 and data starting from row 2.' :
        'Make sure header row contains column names and data row contains actual transaction data.'}
      </p>
    </div>
  `;

  // Update the specified preview area
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) {
    console.error(`Target element ${targetElementId} not found`);
    return;
  }

  targetElement.innerHTML = html;

  // Attach event listeners to each select
  document.querySelectorAll(`#${targetElementId} .header-map`).forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'), 10);
      updateHeaderMapping(e.target, index);
    });
  });

  // Enable the save button if we have the required fields
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

  // Show header mapping UI if hidden
  const rowSelectionPanel = document.getElementById("rowSelectionPanel");
  const saveHeadersBtn = document.getElementById("saveHeadersBtn");
  const clearPreviewBtn = document.getElementById("clearPreviewBtn");

  if (rowSelectionPanel) rowSelectionPanel.style.display = "block";
  if (saveHeadersBtn) saveHeadersBtn.style.display = "inline-block";
  if (clearPreviewBtn) clearPreviewBtn.style.display = "inline-block";

  // Get the number of columns to determine modal width
  const columnCount = headerRow.length;
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    // Set width based on column count, but no wider than 90% of viewport
    const baseWidth = 600; // Base width
    const columnWidth = 100; // Width per column
    const maxWidth = Math.min(window.innerWidth * 0.9, baseWidth + columnCount * columnWidth);
    modalContent.style.maxWidth = `${maxWidth}px`;
    modalContent.style.width = "90%";
  }
}

/**
 * Checks for duplicate header mappings
 */
export function checkForDuplicateHeaders() {
  if (!AppState.currentSuggestedMapping) return;

  // Count occurrences of each header type
  const headerCounts = {};
  AppState.currentSuggestedMapping.forEach(header => {
    if (header !== "–" && header !== "Description") {
      headerCounts[header] = (headerCounts[header] || 0) + 1;
    }
  });

  // Check for duplicates
  let hasDuplicates = false;

  for (const [header, count] of Object.entries(headerCounts)) {
    if (count > 1) {
      // Mark all instances of this header with red border
      AppState.currentSuggestedMapping.forEach((mapping, i) => {
        if (mapping === header) {
          const dropdown = document.querySelector(`.header-map[data-index="${i}"]`);
          if (dropdown) {
            dropdown.style.borderColor = "red";
          }
        }
      });
      hasDuplicates = true;
    }
  }

  // Enable/disable save button based on duplicates
  const saveButton = document.getElementById("saveHeadersBtn");
  if (saveButton) {
    saveButton.disabled = hasDuplicates;
    if (hasDuplicates) {
      saveButton.title = "Please resolve duplicate header mappings";
      showToast("Found duplicate header mappings. Please assign unique headers.", "warning");
    }
  }
}

// Helper functions
function isDateHeader(headerText) {
  const dateKeywords = ["date", "day", "time", "תאריך", "день"];
  return dateKeywords.some(keyword => headerText.includes(keyword));
}

function isExpenseHeader(headerText) {
  const expenseKeywords = ["expense", "debit", "cost", "payment", "out", "חובה", "gasto", "ausgabe"];
  return expenseKeywords.some(keyword => headerText.includes(keyword));
}

function isIncomeHeader(headerText) {
  const incomeKeywords = ["income", "credit", "deposit", "revenue", "in", "זכות", "ingreso", "einkommen"];
  return incomeKeywords.some(keyword => headerText.includes(keyword));
}

function isDescriptionHeader(headerText) {
  const descKeywords = ["desc", "note", "memo", "text", "detail", "תאור", "פרטים", "descrip"];
  return descKeywords.some(keyword => headerText.includes(keyword));
}

function getSampleRows(data) {
  // Skip header row (index 0) and take a few samples
  const MAX_SAMPLES = 5;
  const samples = [];

  // Start from row 1 (skip header)
  for (let i = 1; i < Math.min(data.length, MAX_SAMPLES + 1); i++) {
    if (data[i] && data[i].length > 0) {
      samples.push(data[i]);
    }
  }

  // If we couldn't get samples (maybe there's only a header row),
  // still return at least the header as a fallback
  if (samples.length === 0 && data.length > 0) {
    samples.push(data[0]);
  }

  return samples;
}

/**
 * Check if a column contains date values including Excel date numbers
 */
function isDateColumn(values) {
  // Check if column contains date-like values
  let dateCount = 0;

  for (const val of values) {
    if (!val) continue;
    const str = String(val).trim();

    // Check for Excel date numbers (large numbers around 40000-45000)
    const num = parseFloat(str);
    if (!isNaN(num) && num > 35000 && num < 50000) {
      dateCount++;
      console.log(`Found potential Excel date: ${str}`);
      continue;
    }

    // Check for various date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY etc.)
    const hasDateSeparators = /[-/.]/g.test(str);
    const matchesCommonDatePattern = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(str);
    const containsFourDigitYear = /\b\d{4}\b/.test(str);

    if (matchesCommonDatePattern || (hasDateSeparators && containsFourDigitYear)) {
      dateCount++;
    }
  }

  // If most values look like dates, return true
  return dateCount > values.length * 0.4;
}

function isMonetaryColumn(values) {
  // Check if column contains numeric/currency values
  const numericValues = values.filter(val => {
    if (!val) return false;
    const str = String(val).trim();

    // Remove currency symbols and commas
    const cleaned = str.replace(/[$,€£₪]/g, '');

    // Check if it's a number
    const num = parseFloat(cleaned);
    return !isNaN(num);
  });

  // If most values are numeric, it's likely a monetary column
  return numericValues.length > values.length * 0.5;
}

function classifyMonetaryColumn(values, state) {
  // Count positive and negative values
  let positives = 0, negatives = 0;

  values.forEach(val => {
    if (!val) return;
    const str = String(val).trim();

    // Remove currency symbols and commas
    const cleaned = str.replace(/[$,€£₪]/g, '');

    // Check if it's a number
    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    if (num > 0 || (!num && !str.includes('-'))) positives++;
    if (num < 0 || str.includes('-')) negatives++;
  });

  // If we haven't found income column yet and there are more positive values
  if (!state.incomeColumnFound && positives >= negatives) {
    state.incomeColumnFound = true;
    return "Income";
  } else {
    state.expensesColumnFound = true;
    return "Expenses";
  }
}

/**
 * Specifically checks for Excel date numbers
 */
function isExcelDateColumn(values) {
  // Count Excel date-like values (numbers between 35000-50000)
  let excelDateCount = 0;

  for (const val of values) {
    if (!val) continue;

    // Check for numeric value
    const num = parseFloat(String(val).trim());
    if (!isNaN(num) && num >= 35000 && num <= 50000) {
      excelDateCount++;
    }
  }

  // If majority of values look like Excel dates, return true
  return excelDateCount > values.length * 0.5;
}

/**
 * Improved check for description columns - text-heavy content
 */
function isDescriptionColumn(values) {
  // Check if column contains mostly text descriptions
  const textValues = values.filter(val => {
    if (!val) return false;
    const str = String(val).trim();

    // More aggressive checks for text content
    // 1. Check for multiple words
    const wordCount = str.split(/\s+/).length;
    if (wordCount > 1) return true;

    // 2. Check for text with letters (not just numbers)
    const hasLetters = /[a-zA-Z]/i.test(str);
    const hasSpecialChars = /[^\w\s]/i.test(str);
    const isLongString = str.length > 6;

    // 3. Not just a pure number
    const isNotPureNumber = hasLetters || hasSpecialChars ||
      isNaN(parseFloat(str)) || (!/^\d+([.,]\d+)?$/.test(str));

    return (hasLetters && isNotPureNumber) || (isLongString && isNotPureNumber);
  });

  // If most values are text-like, it's likely a description column
  return textValues.length > values.length * 0.4;
}
