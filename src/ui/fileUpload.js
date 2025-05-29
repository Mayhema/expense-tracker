import { AppState, resetFileState } from '../core/appState.js';
import { addMergedFile } from '../core/fileManager.js';
import { renderMergedFiles } from './fileListUI.js';
import { showToast, hideElement } from './uiManager.js';
import { showModal } from './modalManager.js';
import { renderHeaderPreview } from './headerMapping.js';
import { updateTransactions } from './transactionManager.js';

// Global flag to prevent multiple file inputs
let fileInputInProgress = false;

/**
 * Cleanup any existing file input elements to prevent duplicates
 */
function cleanupExistingFileInputs() {
  const existingInputs = document.querySelectorAll('input[type="file"][id^="fileInput"]');
  existingInputs.forEach(input => {
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
  });
}

/**
 * Initialize file upload functionality
 */
export function initializeFileUpload() {
  console.log("Initializing file upload functionality");

  // Prevent multiple initializations
  if (fileInputInProgress) {
    console.log("File upload already initializing, skipping");
    return;
  }

  try {
    cleanupExistingFileInputs();

    const fileUploadBtn = document.getElementById('fileUploadBtn');
    if (fileUploadBtn) {
      // Remove existing listeners to prevent duplicates
      const newBtn = fileUploadBtn.cloneNode(true);
      fileUploadBtn.parentNode.replaceChild(newBtn, fileUploadBtn);

      // Add single click listener
      newBtn.addEventListener('click', handleFileUploadClick);
      console.log("File upload button initialized");
    } else {
      console.warn("File upload button not found");
    }
  } catch (error) {
    console.error("Error initializing file upload:", error);
  }
}

/**
 * Handle file upload button click
 */
function handleFileUploadClick(e) {
  e.preventDefault();
  e.stopPropagation();

  // Prevent rapid clicking
  if (fileInputInProgress) {
    console.log("File upload already in progress");
    showToast("File upload already in progress", "warning");
    return;
  }

  console.log("Creating new file input...");
  createNewFileInput();
}

/**
 * Creates a new file input element
 */
export function createNewFileInput() {
  // Prevent multiple file inputs
  if (fileInputInProgress) {
    console.log("File input already in progress");
    return;
  }

  fileInputInProgress = true;

  try {
    // Clean up any existing file inputs first
    cleanupExistingFileInputs();

    // Create file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv,.xlsx,.xls,.xml";
    fileInput.id = `fileInput_${Date.now()}`;
    fileInput.style.display = "none";

    // Add to DOM temporarily
    document.body.appendChild(fileInput);

    // Add event listener
    fileInput.addEventListener("change", (event) => {
      handleFileSelection(event);
      // Clean up after use
      setTimeout(() => {
        if (fileInput.parentNode) {
          fileInput.parentNode.removeChild(fileInput);
        }
        fileInputInProgress = false;
      }, 100);
    });

    // Handle user cancellation
    setTimeout(() => {
      if (fileInput.parentNode && !fileInput.files.length) {
        fileInput.parentNode.removeChild(fileInput);
        fileInputInProgress = false;
      }
    }, 10000); // 10 second timeout

    // Trigger file picker
    fileInput.click();

  } catch (error) {
    console.error("Error creating file input:", error);
    showToast("Error opening file picker", "error");
    fileInputInProgress = false;
  }
}

/**
 * Handle file selection with proper error handling
 */
function handleFileSelection(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    return;
  }

  console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

  try {
    // Import and use file handler
    import('../parsers/fileHandler.js').then(module => {
      module.handleFileUpload(file);
    }).catch(error => {
      console.error("Error loading file handler:", error);
      showToast("Error processing file", "error");
    });
  } catch (error) {
    console.error("Error handling file selection:", error);
    showToast("Error processing file", "error");
  }
}

/**
 * Process file upload and render preview
 */
export function onFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    fileInputInProgress = false;
    return;
  }

  console.log("Processing file:", file.name);
  handleFileUploadProcess(file);
}

/**
 * Handle file upload process
 */
function handleFileUploadProcess(file) {
  // Store file name in AppState
  AppState.currentFileName = file.name;

  console.log(`Processing upload for: ${file.name}`);

  // Check for duplicate file
  if (checkForDuplicateFile(file)) {
    handleDuplicateFile(file);
    return;
  }

  // Show loading state
  showToast("Processing file...", "info");

  // Process the file based on its type
  const fileExt = file.name.split('.').pop().toLowerCase();

  if (fileExt === 'csv') {
    handleCSVFile(file);
  } else if (['xlsx', 'xls'].includes(fileExt)) {
    handleExcelFile(file);
  } else if (fileExt === 'xml') {
    handleXMLFile(file);
  } else {
    showToast("Unsupported file format. Please use CSV, Excel, or XML files.", "error");
    resetFileState();
    fileInputInProgress = false;
  }
}

/**
 * Handle CSV file upload
 */
function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      import('../parser/csvParser.js').then(module => {
        const data = module.parseCSV(content);
        processUploadedData(file, data);
      }).catch(error => {
        console.error('Error loading CSV parser:', error);
        showToast("Error processing CSV file", "error");
        resetFileState();
        fileInputInProgress = false;
      });
    } catch (error) {
      handleFileUploadError(error);
    }
  };
  reader.readAsText(file);
}

/**
 * Handle Excel file upload
 */
function handleExcelFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      import('../parser/excelParser.js').then(module => {
        const parser = new module.default();
        parser.parse(content).then(data => {
          processUploadedData(file, data);
        }).catch(error => {
          handleFileUploadError(error);
        });
      }).catch(error => {
        console.error('Error loading Excel parser:', error);
        showToast("Error processing Excel file", "error");
        resetFileState();
        fileInputInProgress = false;
      });
    } catch (error) {
      handleFileUploadError(error);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Handle XML file upload
 */
function handleXMLFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      import('../parser/xmlParser.js').then(module => {
        const data = module.parseXML(content);
        processUploadedData(file, data);
      }).catch(error => {
        console.error('Error loading XML parser:', error);
        showToast("Error processing XML file", "error");
        resetFileState();
        fileInputInProgress = false;
      });
    } catch (error) {
      handleFileUploadError(error);
    }
  };
  reader.readAsText(file);
}

/**
 * Process uploaded data
 */
function processUploadedData(file, data) {
  if (!data || data.length === 0) {
    showToast("File appears to be empty or invalid", "error");
    resetFileState();
    fileInputInProgress = false;
    return;
  }

  // Store data and show preview
  storeFileDataInState(file, data);
  showFilePreviewModal(data);
  showToast(`File loaded: ${data.length} rows found`, "success");
  fileInputInProgress = false;
}

/**
 * Handle file upload errors
 */
function handleFileUploadError(error) {
  console.error("File upload error:", error);
  showToast(`Error processing file: ${error.message}`, "error");
  resetFileState();
  fileInputInProgress = false;
}

/**
 * Store file data in AppState
 */
function storeFileDataInState(file, data) {
  AppState.currentPreviewData = data;
  AppState.currentFileName = file.name;
  console.log(`Stored file data: ${file.name} with ${data.length} rows`);
}

/**
 * Check for duplicate file
 */
function checkForDuplicateFile(file) {
  const existingFiles = AppState.mergedFiles || [];
  return existingFiles.some(f => f.fileName === file.name);
}

/**
 * Handle duplicate file
 */
function handleDuplicateFile(file) {
  showToast(`File "${file.name}" already exists. Please rename the file or remove the existing one.`, "warning");
  resetFileState();
  fileInputInProgress = false;
}

/**
 * Show file preview modal
 */
function showFilePreviewModal(data) {
  // Get file extension for specific handling
  const fileExt = AppState.currentFileName ? AppState.currentFileName.split('.').pop().toLowerCase() : '';
  const isXmlFile = fileExt === 'xml';

  // Create modal content with enhanced structure
  const modalContent = document.createElement("div");
  modalContent.className = "file-preview-modal";

  // Set default row values based on file type
  const defaultHeaderRow = 1;
  const defaultDataRow = isXmlFile ? 1 : 2;

  // Calculate estimated values for display
  const estimatedTransactions = Math.max(0, data.length - defaultDataRow);

  modalContent.innerHTML = `
    <div class="file-info-section">
      <h3>📄 ${AppState.currentFileName}</h3>
      <div class="file-stats">
        <span class="stat">📊 ${data.length} rows</span>
        <span class="stat">📑 ${data[0]?.length || 0} columns</span>
        <span class="stat">📁 ${fileExt.toUpperCase()}</span>
        <span class="stat">📈 ~${estimatedTransactions} transactions</span>
      </div>
    </div>

    <div class="currency-section">
      <label for="modalFileCurrency">💰 Currency for this file:</label>
      <select id="modalFileCurrency" class="currency-select">
        <option value="USD" selected>$ USD</option>
        <option value="EUR">€ EUR</option>
        <option value="GBP">£ GBP</option>
        <option value="CAD">$ CAD</option>
        <option value="AUD">$ AUD</option>
      </select>
    </div>

    <div class="row-selection-section">
      <h4>📋 Data Structure</h4>
      <div class="row-inputs">
        <div class="input-group">
          <label for="modalHeaderRowInput">Header Row:</label>
          <input type="number" id="modalHeaderRowInput" min="1" value="${defaultHeaderRow}" max="${data.length}">
          <span class="hint">Row containing column names</span>
        </div>
        <div class="input-group">
          <label for="modalDataRowInput">Data Starts at Row:</label>
          <input type="number" id="modalDataRowInput" min="1" value="${defaultDataRow}" max="${data.length}">
          <span class="hint">First row with transaction data</span>
        </div>
      </div>

      ${isXmlFile ? `
        <div class="xml-notice">
          <strong>Note:</strong> XML files typically use the same row for both header and data since each row is self-describing.
        </div>
      ` : ''}
    </div>

    <div class="preview-section">
      <h4>📋 File Preview & Column Mapping</h4>
      <div id="modalPreviewTable" class="preview-table-container">
        <!-- Preview will be rendered here -->
      </div>
    </div>
  `;

  // Show the modal
  const modal = showModal({
    title: `Import: ${AppState.currentFileName}`,
    content: modalContent,
    size: "xlarge",
    closeOnClickOutside: false,
    className: "file-preview-modal"
  });

  // Store the modal in AppState for later access
  AppState.currentPreviewModal = modal;

  // Add footer buttons
  const footerDiv = document.createElement("div");
  footerDiv.className = "modal-footer";
  footerDiv.innerHTML = `
    <button id="modalCancelBtn" class="button cancel-btn">Cancel</button>
    <button id="modalSaveHeadersBtn" class="button primary-btn">Save Mapping & Import File</button>
  `;

  modalContent.appendChild(footerDiv);

  // Set up event listeners
  setupModalEventListeners(modal, data, fileExt);

  // Initial preview render
  setTimeout(() => {
    renderHeaderPreview(data, "modalPreviewTable", "modalHeaderRowInput", "modalDataRowInput");
  }, 150);
}

/**
 * Set up modal event listeners
 */
function setupModalEventListeners(modal, data, fileExt) {
  console.log("Setting up modal event listeners");

  // Wait for elements to be in DOM
  setTimeout(() => {
    const headerRowInput = document.getElementById("modalHeaderRowInput");
    const dataRowInput = document.getElementById("modalDataRowInput");
    const cancelBtn = document.getElementById("modalCancelBtn");
    const saveBtn = document.getElementById("modalSaveHeadersBtn");

    if (!headerRowInput || !dataRowInput) {
      console.error("Required input elements not found");
      return;
    }

    // Debounced update function
    let updateTimeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        renderHeaderPreview(data, "modalPreviewTable", "modalHeaderRowInput", "modalDataRowInput");
      }, 300);
    };

    // Add input listeners
    headerRowInput.addEventListener("input", debouncedUpdate);
    dataRowInput.addEventListener("input", debouncedUpdate);

    // Button listeners
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modal.close();
        resetFileState();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        onSaveHeaders(modal);
      });
    }

    console.log("Modal event listeners set up successfully");
  }, 100);
}

/**
 * Handle saving headers and merging the file
 */
export async function onSaveHeaders(modal) {
  try {
    console.log("Saving headers and merging file...");

    // Validate that we have the necessary data
    if (!AppState.currentPreviewData || !AppState.currentFileName) {
      showToast("No file data to save", "error");
      return;
    }

    // Get the current mapping from the modal
    const headerMapping = getCurrentMapping();
    if (!headerMapping) {
      showToast("Please configure column mappings", "error");
      return;
    }

    // Check if required mappings are present
    const hasDate = headerMapping.includes("Date");
    const hasAmount = headerMapping.includes("Income") || headerMapping.includes("Expenses");

    if (!hasDate || !hasAmount) {
      showToast("Please map at least one Date column and one Income or Expenses column", "error");
      return;
    }

    // Get row settings
    const headerRowInput = document.getElementById("modalHeaderRowInput");
    const dataRowInput = document.getElementById("modalDataRowInput");
    const currencySelect = document.getElementById("modalFileCurrency");

    const headerRow = parseInt(headerRowInput.value) - 1;
    const dataRow = parseInt(dataRowInput.value) - 1;
    const currency = currencySelect ? currencySelect.value : 'USD';

    // Generate file signature for mapping reuse
    const signature = generateFileSignature(AppState.currentPreviewData, headerMapping);

    // Call addMergedFile with correct parameters
    addMergedFile(
      AppState.currentPreviewData,  // fileData
      headerMapping,                // headerMapping
      AppState.currentFileName,     // fileName
      signature,                    // signature
      headerRow,                    // headerRowIndex
      dataRow,                      // dataRowIndex
      currency                      // currency
    );

    // Update UI
    updateTransactions();
    renderMergedFiles();

    // Close modal and reset state
    modal.close();
    resetFileState();

    showToast(`File "${AppState.currentFileName}" imported successfully!`, "success");

  } catch (error) {
    console.error("Error saving headers:", error);
    showToast("Error importing file", "error");
  }
}

/**
 * Get current mapping from the modal
 */
function getCurrentMapping() {
  const selects = document.querySelectorAll('#modalPreviewTable .header-map');
  if (selects.length === 0) {
    console.error("No header mapping selects found");
    return null;
  }

  return Array.from(selects).map(select => select.value);
}

/**
 * Generate file signature for mapping identification
 */
function generateFileSignature(data, headerMapping) {
  if (!data || !headerMapping) return 'unknown';

  // Create a simple signature based on file structure
  const columnCount = data[0]?.length || 0;
  const rowCount = data.length;
  const mappingString = headerMapping.join('-');

  return `${columnCount}col_${rowCount}row_${mappingString}`;
}

/**
 * Save merged files to localStorage
 */
function saveMergedFiles() {
  try {
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
  } catch (error) {
    console.error('Error saving merged files:', error);
  }
}

/**
 * Clear preview and reset state
 */
export function clearPreview() {
  console.log("Clearing preview and all temporary data");

  // Clear preview area
  const previewTable = document.getElementById("previewTable");
  if (previewTable) {
    previewTable.innerHTML = '';
  }

  // Hide UI controls
  hideElement("rowSelectionPanel");
  hideElement("saveHeadersBtn");
  hideElement("clearPreviewBtn");

  // Ensure all temporary data is removed
  localStorage.removeItem("tempFileSignature");

  // Clean up any file input elements
  cleanupExistingFileInputs();

  // Reset state
  resetFileState();
  fileInputInProgress = false;
}
