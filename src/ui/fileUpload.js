import { AppState, resetFileState, saveMergedFiles } from "../core/appState.js";
import { handleFileUpload, isDuplicateFile, generateFileSignature } from "../parsers/fileHandler.js";
import { showToast, hideElement } from "./uiManager.js";
import { renderHeaderPreview } from "./headerMapping.js";
import { validateRowIndices } from "../utils/validation.js";
import { saveHeadersAndFormat } from "../mappings/mappingsManager.js";
import { addMergedFile, renderMergedFiles } from "../main.js";
import { updateTransactions } from "./transactionManager.js";
import { showModal } from "./modalManager.js";
import { CURRENCIES, DEFAULT_CURRENCY } from "../constants/currencies.js";

/**
 * Clears the file preview area
 */
export function clearPreview() {
  // Clear preview area
  document.getElementById("previewTable").innerHTML = "";

  // Hide UI controls
  hideElement("rowSelectionPanel");
  hideElement("saveHeadersBtn");
  hideElement("clearPreviewBtn");

  // Reset state
  resetFileState();
}

/**
 * Shows the file preview in a modal instead of inline
 */
function showFilePreviewModal(data) {
  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.className = "file-preview-modal";

  // Calculate appropriate width based on columns
  const columnCount = data[0]?.length || 0;
  const baseWidth = 600; // Base width
  const columnWidth = 70; // Width per column
  const recommendedWidth = Math.min(window.innerWidth * 0.9, baseWidth + columnCount * columnWidth);

  // Add currency selector at the top
  modalContent.innerHTML = `
    <div class="currency-selector" style="margin-bottom: 20px;">
      <label for="fileCurrency"><strong>File Currency:</strong></label>
      <select id="fileCurrency" class="currency-select" style="margin-left: 10px; padding: 5px;">
        ${Object.entries(CURRENCIES).map(([code, curr]) =>
    `<option value="${code}" ${code === DEFAULT_CURRENCY ? 'selected' : ''}>${curr.name} (${curr.symbol})</option>`
  ).join('')}
      </select>
      <p style="margin-top: 5px; font-size: 0.9em; color: #666;">
        This currency will be applied to all monetary values in this file.
      </p>
    </div>

    <div class="row-selection-panel" style="margin-bottom: 20px;">
      <div style="display: flex; gap: 20px; align-items: center;">
        <div>
          <label for="modalHeaderRowInput">Header Row:</label>
          <input type="number" id="modalHeaderRowInput" min="1" value="1" style="width: 60px;">
        </div>
        <div>
          <label for="modalDataRowInput">Data Starts at Row:</label>
          <input type="number" id="modalDataRowInput" min="1" value="2" style="width: 60px;">
        </div>
      </div>
    </div>

    <div id="modalPreviewTable" class="preview-table-wrapper" style="max-height: 400px; overflow-y: auto;"></div>
  `;

  // Show the modal with recommended width
  const modal = showModal({
    title: `Preview: ${AppState.currentFileName}`,
    content: modalContent,
    size: "custom", // Use custom size
    width: recommendedWidth,
    closeOnClickOutside: false
  });

  // Store the modal in AppState for later access
  AppState.currentPreviewModal = modal;

  // Render the header preview in the modal
  renderHeaderPreview(data, "modalPreviewTable", "modalHeaderRowInput", "modalDataRowInput");

  // Add save and cancel buttons to the modal footer
  const footerDiv = document.createElement("div");
  footerDiv.className = "modal-footer";
  footerDiv.innerHTML = `
    <button id="modalSaveHeadersBtn" class="button primary-btn">Save Mapping & Merge File</button>
    <button id="modalCancelBtn" class="button">Cancel</button>
  `;

  modalContent.appendChild(footerDiv);

  // Add event listeners to the buttons
  document.getElementById("modalSaveHeadersBtn").addEventListener("click", () => {
    onSaveHeaders(modal);
  });

  document.getElementById("modalCancelBtn").addEventListener("click", () => {
    modal.close();
    resetFileState();
  });

  // Add change listener to input fields - automatically update preview when changed
  document.getElementById("modalHeaderRowInput").addEventListener("input", () => {
    if (validateRowIndices(data, "modalHeaderRowInput", "modalDataRowInput")) {
      // Reset suggested mapping to force recalculation with new header row
      AppState.currentSuggestedMapping = null;
      renderHeaderPreview(data, "modalPreviewTable", "modalHeaderRowInput", "modalDataRowInput");
    }
  });

  document.getElementById("modalDataRowInput").addEventListener("input", () => {
    if (validateRowIndices(data, "modalHeaderRowInput", "modalDataRowInput")) {
      renderHeaderPreview(data, "modalPreviewTable", "modalHeaderRowInput", "modalDataRowInput");
    }
  });
}

/**
 * Processes file upload and renders preview
 * @param {Event} event - The file upload event
 */
export function onFileUpload(event) {
  try {
    // Extract file safely without any DOM manipulation
    const file = event?.target?.files?.[0];

    if (!file) {
      showToast("No file selected", "error");
      return;
    }

    console.log("Uploading file:", file.name);

    // Process the file - break into smaller functions
    handleFileUploadProcess(file);
  } catch (err) {
    console.error("Error in file upload handler:", err);
    showToast("File upload failed: " + (err.message || "Unknown error"), "error");
  }
}

// Break down complex function into smaller parts
function handleFileUploadProcess(file) {
  handleFileUpload(file)
    .then(data => processUploadedData(file, data))
    .catch(handleFileUploadError);
}

function processUploadedData(file, data) {
  if (!data || data.length === 0) {
    showToast("No valid data found in the file", "error");
    return;
  }

  // Store data in AppState
  storeFileDataInState(file, data);

  // Check for duplicates
  if (checkForDuplicateFile(file)) {
    return;
  }

  // Handle file format mapping
  handleFormatMapping(file, data);
}

/**
 * Handles errors during file upload
 * @param {Error} error - The error object
 */
function handleFileUploadError(error) {
  console.error("Error during file upload:", error);
  showToast("File upload failed: " + (error.message || "Unknown error"), "error");
}

/**
 * Stores file data in AppState
 * @param {File} file - The uploaded file
 * @param {Array<Array>} data - The parsed file data
 */
function storeFileDataInState(file, data) {
  if (!AppState || !AppState.mergedFiles) {
    console.error("AppState is not initialized.");
    return;
  }

  AppState.currentFileData = data;
  AppState.currentFileName = file.name;
  AppState.currentFileSignature = generateFileSignature(file.name, data);
}

function checkForDuplicateFile(file) {
  const exactNameDuplicate = AppState.mergedFiles.find(f => f.fileName === file.name);
  if (exactNameDuplicate) {
    return handleDuplicateFile(file);
  }
  return false;
}

function handleDuplicateFile(file) {
  if (confirm(`A file named "${file.name}" already exists. Do you want to replace it?`)) {
    AppState.mergedFiles = AppState.mergedFiles.filter(f => f.fileName !== file.name);
    saveMergedFiles();
    return false;
  }
  resetFileState();
  return true;
}

// Fixed handleFormatMapping function (no unused variables)
function handleFormatMapping(file, data) {
  if (file.name.toLowerCase().endsWith('.xml')) {
    const mapping = findXmlMapping(data);
    if (mapping) {
      applyMapping(mapping, file, data);
      return;
    }
  }

  const standardMapping = findStandardMapping(data);
  if (standardMapping) {
    applyMapping(standardMapping, file, data);
  } else {
    showFilePreviewModal(data);
  }
}

// Fix the stub functions that were returning an undefined variable
function isXmlFile(file) {
  return file.name.toLowerCase().endsWith('.xml');
}

function findXmlMapping(data) {
  // XML mapping lookup logic
  // For now, just return null until proper implementation
  return null;
}

function findStandardMapping(data) {
  // Standard mapping lookup logic
  // For now, just return null until proper implementation
  return null;
}

/**
 * Adds validation to row selection inputs
 * @param {Array<Array>} data - The file data
 */
function addRowInputValidation(data) {
  // First make sure the elements exist
  if (!ensureRowSelectionUI()) {
    console.error("Cannot add validation - UI elements not found");
    return false;
  }

  // Now add the event listeners - with careful null checks
  const headerRowInput = document.getElementById("headerRowInput");
  if (headerRowInput) {
    headerRowInput.addEventListener("input", () => {
      if (validateRowIndices(data)) {
        renderHeaderPreview(data); // Re-render whenever header row changes
      }
    });
  }

  const dataRowInput = document.getElementById("dataRowInput");
  if (dataRowInput) {
    dataRowInput.addEventListener("input", () => {
      if (validateRowIndices(data)) {
        renderHeaderPreview(data); // Re-render whenever data row changes
      }
    });
  }

  return true;
}

/**
 * Handles saving header mapping and merging the file
 */
export function onSaveHeaders(modal) {
  try {
    console.log("onSaveHeaders called");

    // Get selects from the correct context (modal or main page)
    let selects;
    if (modal && modal.element) {
      // If a modal is provided and has an element property
      selects = modal.element.querySelectorAll(".header-map");
    } else {
      // Fall back to querying the document
      selects = document.querySelectorAll(".header-map");
    }

    if (!selects || selects.length === 0) {
      // If we still don't have selects, try the modal content
      selects = document.querySelectorAll(".modal-content .header-map");
    }

    if (!selects || selects.length === 0) {
      // Last resort - log the issue and check for any select with header-map class
      console.error("Could not find header mapping selects");
      showToast("Error: Could not find header mappings", "error");
      return;
    }

    console.log(`Found ${selects.length} select elements for mapping`);

    // Debug the selects and their values
    const mapping = Array.from(selects).map(sel => {
      console.log(`Select: value=${sel.value}, options=${sel.options.length}`);
      return sel.value;
    });

    console.log("Mapping:", mapping);

    // Validate required fields
    const hasDate = mapping.includes("Date");
    const hasAmount = mapping.includes("Income") || mapping.includes("Expenses");

    console.log(`Validation: hasDate=${hasDate}, hasAmount=${hasAmount}`);

    if (!hasDate || !hasAmount) {
      showToast("You must map at least Date and either Income or Expenses fields", "error");
      return;
    }

    // Get row indices from the modal or regular inputs
    const headerRowInput = document.getElementById("modalHeaderRowInput") || document.getElementById("headerRowInput");
    const dataRowInput = document.getElementById("modalDataRowInput") || document.getElementById("dataRowInput");

    if (!headerRowInput || !dataRowInput) {
      showToast("Could not find header or data row inputs", "error");
      return;
    }

    const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
    const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;

    // Get selected currency
    const currencySelect = document.getElementById("fileCurrency");
    const currency = currencySelect ? currencySelect.value : DEFAULT_CURRENCY;

    // Generate the signature with currency
    const finalSignature = generateFileSignature(
      AppState.currentFileName,
      AppState.currentFileData,
      mapping,
      currency // Include currency in signature
    );

    // Get signature string
    const sigString = typeof finalSignature === 'object' ?
      (finalSignature.mappingSig || finalSignature.formatSig || finalSignature.contentSig || JSON.stringify(finalSignature)) :
      finalSignature;

    // Check for duplicate files
    const duplicateFile = isDuplicateFile(AppState.currentFileName, sigString);

    if (duplicateFile) {
      const confirmMerge = confirm(
        `A file with the same name or format "${duplicateFile.fileName}" is already in your merged list.\n\n` +
        `Adding this file might create duplicate transactions. Do you still want to add it?`
      );

      if (!confirmMerge) {
        showToast("File merge cancelled", "info");
        return;
      }
    }

    // Save the mapping with row indices and currency
    saveHeadersAndFormat(finalSignature, mapping, null, headerRowIndex, dataRowIndex, currency);

    // Call addMergedFile with explicit row indices and currency
    addMergedFile(
      AppState.currentFileData,
      mapping,
      AppState.currentFileName,
      sigString,
      headerRowIndex,
      dataRowIndex,
      currency // Add currency parameter
    );

    // Close the modal
    if (modal && typeof modal.close === 'function') {
      modal.close();
    }

    // Reset state
    resetFileState();

    showToast("File saved and merged successfully", "success");
    renderMergedFiles();
    updateTransactions();
  } catch (error) {
    console.error("Error saving headers:", error);
    showToast("Failed to save mapping: " + error.message, "error");
  }
}

/**
 * Creates a new file input element for each upload to avoid value manipulation
 */
export function createNewFileInput() {
  try {
    // Delete existing input element first
    const oldInput = document.getElementById("fileInput");
    if (oldInput && oldInput.parentNode) {
      oldInput.parentNode.removeChild(oldInput);
    }

    // Create a completely new input element
    const input = document.createElement("input");
    input.type = "file";
    input.id = "fileInput";
    input.style.display = "none";
    input.accept = ".csv,.xlsx,.xls,.xml";

    // Add to body first, then add event listener
    document.body.appendChild(input);

    // Add the event listener
    input.addEventListener("change", onFileUpload);

    console.log("New file input created with id: fileInput");
    return input;
  } catch (err) {
    console.error("Error creating new file input:", err);
    return null;
  }
}

// Replace refreshFileInput with createNewFileInput
export function refreshFileInput() {
  return createNewFileInput();
}

/**
 * Ensures the row selection UI elements exist
 * @returns {boolean} True if elements were created or already existed
 */
function ensureRowSelectionUI() {
  // First, ensure we have a preview table container
  let previewContainer = document.getElementById("previewContainer");
  if (!previewContainer) {
    // Create the whole file preview section if it doesn't exist
    const fileUploadSection = document.getElementById("fileUploadSection") ||
      document.querySelector(".section") ||
      document.body;

    previewContainer = document.createElement("div");
    previewContainer.id = "previewContainer";
    previewContainer.className = "preview-container";
    previewContainer.style.marginTop = "20px";
    fileUploadSection.appendChild(previewContainer);

    // Create preview table element
    const previewTable = document.createElement("div");
    previewTable.id = "previewTable";
    previewTable.className = "preview-table";
    previewContainer.appendChild(previewTable);

    console.log("Created preview table element");
  }

  // Now check for row selection panel
  let rowSelectionPanel = document.getElementById("rowSelectionPanel");
  if (!rowSelectionPanel) {
    // Create row selection panel with all its contents
    rowSelectionPanel = document.createElement("div");
    rowSelectionPanel.id = "rowSelectionPanel";
    rowSelectionPanel.className = "row-selection-panel";
    rowSelectionPanel.style.marginBottom = "15px";
    rowSelectionPanel.innerHTML = `
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
        <div>
          <label for="headerRowInput">Header Row:</label>
          <input type="number" id="headerRowInput" min="1" value="1" style="width: 60px;">
        </div>
        <div>
          <label for="dataRowInput">Data Starts at Row:</label>
          <input type="number" id="dataRowInput" min="1" value="2" style="width: 60px;">
        </div>
        <button id="updatePreviewBtn" class="button" style="padding: 5px 10px;">Update Preview</button>
      </div>
    `;

    // Insert at the beginning of the preview container
    if (previewContainer.firstChild) {
      previewContainer.insertBefore(rowSelectionPanel, previewContainer.firstChild);
    } else {
      previewContainer.appendChild(rowSelectionPanel);
    }

    // Add buttons for saving and clearing
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "15px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";

    const saveButton = document.createElement("button");
    saveButton.id = "saveHeadersBtn";
    saveButton.className = "button primary-btn";
    saveButton.textContent = "Save Mapping & Merge File";
    saveButton.onclick = onSaveHeaders;
    buttonContainer.appendChild(saveButton);

    const clearButton = document.createElement("button");
    clearButton.id = "clearPreviewBtn";
    clearButton.className = "button";
    clearButton.textContent = "Clear Preview";
    clearButton.onclick = clearPreview;
    buttonContainer.appendChild(clearButton);

    previewContainer.appendChild(buttonContainer);

    // Add event listener to update button
    const updateBtn = document.getElementById("updatePreviewBtn");
    if (updateBtn) {
      updateBtn.addEventListener("click", () => {
        if (AppState.currentFileData) {
          renderHeaderPreview(AppState.currentFileData);
        }
      });
    }

    console.log("Created row selection panel and buttons");
  }

  // Now we should have all required elements
  const headerRowInput = document.getElementById("headerRowInput");
  const dataRowInput = document.getElementById("dataRowInput");

  if (!headerRowInput || !dataRowInput) {
    console.error("Failed to create all required elements");
    return false;
  }

  return true;
}
