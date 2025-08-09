import { AppState, resetFileState } from '../core/appState.js';
import { showToast } from './uiManager.js';
import { showModal } from './modalManager.js';
import { autoDetectFieldType } from '../constants/fieldMappings.js';
import { isExcelDate, formatExcelDateForPreview } from '../utils/dateUtils.js';

// Global flag to prevent multiple file inputs
let fileInputInProgress = false;

// FIXED: Add missing fileUploadCache object
const fileUploadCache = {
  activeInputs: new Map(),
  modalElements: new Map(),
  eventListeners: new Map()
};

/**
 * Cleanup any existing file input elements to prevent duplicates
 */
function cleanupExistingFileInputs() {
  const existingInputs = document.querySelectorAll('input[type="file"]');
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
    console.log("File upload already in progress");
    return;
  }

  try {
    // Clean up any existing file inputs
    cleanupExistingFileInputs();

    // NEW: Initialize drag-and-drop
    initializeDragAndDrop();

    console.log("File upload initialized successfully with drag-and-drop");
  } catch (error) {
    console.error("Error initializing file upload:", error);
  }
}

/**
 * Creates a new file input element
 */
export function createNewFileInput() {
  // FIXED: Only check if input is in progress when actually processing
  if (fileInputInProgress) {
    console.log("CRITICAL: File input already in progress, returning");
    return null;
  }

  // FIXED: Set flag immediately to prevent race conditions
  fileInputInProgress = true;

  try {
    // Clean up existing inputs first
    cleanupExistingFileInputs();

    // FIXED: DON'T clone the upload button here - it's already handled in sidebarManager
    // This was causing the double file browser issue

    // Create new file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls,.xml';
    fileInput.style.display = 'none';

    const inputId = Date.now().toString();
    console.log("CRITICAL: Created file input with ID:", inputId);

    // Add event listener for file selection
    const handleFileSelection = (event) => {
      console.log("CRITICAL: File selection event triggered");
      const file = event.target.files[0];
      if (!file) {
        console.log("CRITICAL: No file selected in event");
        // FIXED: Reset progress flag if no file selected
        fileInputInProgress = false;
        cleanupFileInput(inputId);
        return;
      }

      console.log(`CRITICAL: File selected and processing: ${file.name} (${file.type}, ${file.size} bytes)`);

      try {
        // Process the file
        handleFileUploadProcess(file);
        // FIXED: Clean up input after processing starts
        setTimeout(() => cleanupFileInput(inputId), 500);
      } catch (error) {
        console.error("CRITICAL ERROR: Error processing file:", error);
        handleFileUploadError(error);
        fileInputInProgress = false;
        cleanupFileInput(inputId);
      }
    };

    const handleCancel = () => {
      console.log("CRITICAL: File selection cancelled");
      fileInputInProgress = false;
      cleanupFileInput(inputId);
    };

    fileInput.addEventListener('change', handleFileSelection);
    fileInput.addEventListener('cancel', handleCancel);

    // FIXED: Remove problematic focus listener that was causing double prompts
    // The window focus event was unnecessarily interfering with file selection

    // FIXED: Track listeners and element for cleanup
    const inputData = {
      element: fileInput,
      listeners: [
        { element: fileInput, event: 'change', handler: handleFileSelection },
        { element: fileInput, event: 'cancel', handler: handleCancel }
        // Note: focus listener added separately with delay
      ]
    };

    fileUploadCache.activeInputs.set(inputId, inputData);

    document.body.appendChild(fileInput);
    console.log("CRITICAL: File input appended to DOM, triggering click");

    // FIXED: Use requestAnimationFrame instead of setTimeout
    requestAnimationFrame(() => {
      fileInput.click();
      console.log("CRITICAL: File input click triggered");
    });

    return fileInput;

  } catch (error) {
    console.error("CRITICAL ERROR: Error creating file input:", error);
    fileInputInProgress = false;
    return null;
  }
}

// FIXED: Improved cleanup function
function cleanupFileInput(inputId) {
  const inputData = fileUploadCache.activeInputs.get(inputId);
  if (!inputData) return;

  const { element, listeners } = inputData;

  // Remove event listeners
  listeners.forEach(({ element: el, event, handler }) => {
    el.removeEventListener(event, handler);
  });

  // Remove from DOM
  if (element?.parentNode) {
    element.parentNode.removeChild(element);
  }

  // Remove from cache
  fileUploadCache.activeInputs.delete(inputId);
}

/**
 * Handle file upload process
 */
function handleFileUploadProcess(file) {
  console.log(`CRITICAL: handleFileUploadProcess called for: ${file.name}`);

  // Store file name in AppState
  AppState.currentFileName = file.name;

  console.log(`CRITICAL: Processing upload for: ${file.name}`);

  // Check for duplicate file
  if (checkForDuplicateFile(file)) {
    console.log("CRITICAL: Duplicate file detected, handling...");
    handleDuplicateFile(file);
    return;
  }

  // Show loading state
  showToast("Processing file...", "info");

  // Process the file based on its type
  const fileExt = file.name.split('.').pop().toLowerCase();
  console.log(`CRITICAL: File extension detected: ${fileExt}`);

  if (fileExt === 'csv') {
    handleCSVFile(file);
  } else if (fileExt === 'xlsx' || fileExt === 'xls') {
    handleExcelFile(file);
  } else if (fileExt === 'xml') {
    handleXMLFile(file);
  } else {
    console.error(`CRITICAL ERROR: Unsupported file type: ${fileExt}`);
    handleFileUploadError(new Error(`Unsupported file type: ${fileExt}`));
  }
}

/**
 * Handle CSV file upload
 */
function handleCSVFile(file) {
  console.log(`CRITICAL: Processing CSV file: ${file.name}`);
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      console.log(`CRITICAL: CSV file read successfully, length: ${csvText.length}`);
      processCsvFileContent(file, csvText);
    } catch (error) {
      console.error("CRITICAL ERROR: CSV processing failed:", error);
      handleFileUploadError(error);
    }
  };
  reader.readAsText(file);
}

// Helper function to process CSV line
function processCsvLine(line) {
  return line.split(',').map(field => field.replace(/^"(.*)"$/, '$1').trim());
}

// Helper function to process CSV file content
function processCsvFileContent(file, text) {
  const lines = text.split('\n').filter(line => line.trim());
  const data = lines.map(processCsvLine);
  processUploadedData(file, data);
}

// Helper function to read file content
function readFileContent(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      processCsvFileContent(file, e.target.result);
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
  console.log(`CRITICAL: Processing Excel file: ${file.name}`);
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // This would require XLSX library
      if (typeof XLSX === 'undefined') {
        console.error('CRITICAL ERROR: XLSX library not loaded');
        throw new Error('XLSX library not loaded');
      }

      console.log(`CRITICAL: Excel file read successfully`);
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log(`CRITICAL: Excel parsed into ${jsonData.length} rows`);
      processUploadedData(file, jsonData);
    } catch (error) {
      console.error("CRITICAL ERROR: Excel processing failed:", error);
      handleFileUploadError(error);
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Handle XML file upload
 */
async function handleXMLFile(file) {
  console.log(`CRITICAL: Processing XML file: ${file.name}`);
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const xmlText = e.target.result;
      console.log(`CRITICAL: XML file read successfully, length: ${xmlText.length}`);

      // Use the comprehensive XML parser instead of basic DOM parsing
      const { parseXML } = await import('../parsers/xmlParser.js');
      const data = parseXML(xmlText);

      console.log(`CRITICAL: XML parsed into ${data.length} rows using comprehensive parser`);

      // Only proceed if we have valid data
      if (!data || data.length === 0) {
        console.error("CRITICAL ERROR: XML parser returned no data");
        handleFileUploadError(new Error("No valid transaction data found in XML file"));
        return;
      }

      if (data.length === 1) {
        console.error("CRITICAL ERROR: XML parser found only headers, no transaction rows");
        handleFileUploadError(new Error("XML file contains headers but no transaction data"));
        return;
      }

      processUploadedData(file, data);
    } catch (error) {
      console.error("CRITICAL ERROR: XML processing failed:", error);
      handleFileUploadError(error);
    }
  };
  reader.readAsText(file);
}

// Helper function to validate basic file data
function validateFileData(file, data) {
  if (!data || data.length === 0) {
    console.error("CRITICAL ERROR: No data found in file");
    handleFileUploadError(new Error("No data found in file"));
    return false;
  }

  if (data.length === 1) {
    console.error("CRITICAL ERROR: File contains only header row, no transaction data");
    handleFileUploadError(new Error(`File "${file.name}" contains only headers but no transaction data. Please ensure your file contains actual transaction records.`));
    return false;
  }

  return true;
}

// Helper function to attempt CSV single-cell splitting
function attemptCsvSplit(data) {
  const headerRow = data[0];
  if (headerRow?.length === 1 && typeof headerRow[0] === 'string' && headerRow[0].includes(',')) {
    console.log("DEBUG: Detected CSV data in single cell, attempting to split");
    const splitData = data.map(row => {
      if (row?.[0] && typeof row[0] === 'string') {
        return row[0].split(',').map(cell => cell.trim());
      }
      return row;
    });

    if (splitData?.[0]?.length >= 2) {
      console.log("DEBUG: Successfully split CSV data, proceeding with split data");
      return { success: true, data: splitData };
    }
  }
  return { success: false, data };
}

// Helper function to filter empty Excel columns
function filterEmptyColumns(data) {
  console.log("DEBUG: Attempting to filter empty columns from Excel data");
  const filteredData = data.map(row => {
    if (Array.isArray(row)) {
      return row.filter(cell => cell !== undefined && cell !== null && cell !== '');
    }
    return row;
  });

  if (filteredData?.[0]?.length >= 2) {
    console.log("DEBUG: Successfully filtered empty columns, proceeding with filtered data");
    return { success: true, data: filteredData };
  }
  return { success: false, data };
}

// Helper function to check for sparse Excel data
function checkSparseExcelData(data) {
  console.log("DEBUG: Checking for sparse Excel data with varying column counts");
  let maxColumns = 0;
  data.forEach(row => {
    if (Array.isArray(row)) {
      const nonEmptyColumns = row.filter(cell => cell !== undefined && cell !== null && cell !== '').length;
      maxColumns = Math.max(maxColumns, nonEmptyColumns);
    }
  });

  if (maxColumns >= 2) {
    console.log(`DEBUG: Found rows with ${maxColumns} columns, proceeding with existing data`);
    return { success: true, data };
  }
  return { success: false, data };
}

// Helper function to fix data format issues
function fixDataFormatIssues(file, data) {
  const headerRow = data[0];
  console.log("DEBUG: First row data:", headerRow);
  console.log("DEBUG: Data structure:", data.slice(0, 3));
  console.log("DEBUG: File type:", file.name.split('.').pop());

  if (!headerRow || headerRow.length < 2) {
    // Try different strategies to fix the data
    let result = attemptCsvSplit(data);
    if (result.success) return result;

    result = filterEmptyColumns(data);
    if (result.success) return result;

    result = checkSparseExcelData(data);
    if (result.success) return result;

    // If nothing worked, return failure
    console.error("CRITICAL ERROR: File does not contain enough columns for transaction data");
    handleFileUploadError(new Error(`File "${file.name}" does not contain enough columns. Need at least 2 columns (date and amount).`));
    return { success: false, data };
  }

  return { success: true, data };
}

// Helper function to process existing mapping
async function processExistingMapping(file, data, signature) {
  const { findMappingBySignature } = await import('../mappings/mappingsManager.js');
  const existingMapping = findMappingBySignature(signature);

  if (existingMapping) {
    console.log('CRITICAL: Found existing mapping, auto-applying:', existingMapping);
    showToast(`🎯 Using saved mapping from "${existingMapping.fileName}"`, "info");
    await autoApplyMapping(file, data, existingMapping);
    return true;
  }
  return false;
}

// Helper function to handle auto-detection
async function handleAutoDetection(file, data) {
  console.log('CRITICAL: No existing mapping found, using auto-detection');

  try {
    const { autoDetectFieldType } = await import('../constants/fieldMappings.js');
    const headers = data[0] || [];
    const autoMapping = headers.map(header => autoDetectFieldType(header));

    console.log('CRITICAL: Auto-detected mapping:', autoMapping);

    // Enhanced validation for auto-detection
    const validMappings = autoMapping.filter(m => m && m !== '–').length;
    const hasDate = autoMapping.includes('Date');
    const hasAmount = autoMapping.includes('Income') || autoMapping.includes('Expenses');

    // Check data quality: ensure we have actual transaction data
    const sampleDataRow = data[1]; // Second row should contain sample data
    const hasNonEmptyData = sampleDataRow?.some(cell => cell?.toString().trim() !== '');

    if (validMappings >= 2 && hasDate && hasAmount && hasNonEmptyData) {
      console.log('CRITICAL: Auto-detection successful, processing file automatically');

      // Store data and process with auto-detected mapping
      storeFileDataInState(file, data);

      // Apply the auto-detected mapping
      await autoApplyDetectedMapping(file, data, autoMapping);
      return;
    } else {
      console.log('CRITICAL: Auto-detection insufficient or poor data quality, showing manual mapping modal');
      console.log('CRITICAL: Validation results - validMappings:', validMappings, 'hasDate:', hasDate, 'hasAmount:', hasAmount, 'hasNonEmptyData:', hasNonEmptyData);
    }
  } catch (autoError) {
    console.log('CRITICAL: Auto-detection failed, showing manual mapping modal:', autoError);
  }

  // If auto-detection failed, store data and show preview modal
  console.log('CRITICAL: Storing file data and showing preview modal');
  storeFileDataInState(file, data);
  showFilePreviewModal(data);
  showToast(`File loaded: ${data.length} rows found`, "success");
}

/**
 * Process uploaded data
 */
async function processUploadedData(file, data) {
  console.log(`CRITICAL: processUploadedData called with file: ${file.name}, data rows: ${data?.length}`);

  try {
    // Step 1: Validate basic file data
    if (!validateFileData(file, data)) {
      return;
    }

    // Step 2: Fix data format issues
    const fixResult = fixDataFormatIssues(file, data);
    if (!fixResult.success) {
      return;
    }
    data = fixResult.data;

    // Step 3: Check for duplicate file
    const isDuplicate = checkForDuplicateFile(file);
    if (isDuplicate) {
      console.log(`CRITICAL: Duplicate file detected: ${file.name}`);
      handleDuplicateFile(file);
      return;
    }

    // Step 4: Generate signature and set as current
    const { generateFileSignature } = await import('../parsers/fileHandler.js');
    const { setCurrentFileSignature } = await import('../core/appState.js');

    const signature = generateFileSignature(file.name, data);
    setCurrentFileSignature(signature);
    console.log('CRITICAL: Generated signature for file:', file.name, 'signature:', signature);

    // Step 5: Try to use existing mapping
    const mappingFound = await processExistingMapping(file, data, signature);
    if (mappingFound) {
      return;
    }

    // Step 6: Handle auto-detection
    await handleAutoDetection(file, data);

  } catch (error) {
    console.error('CRITICAL ERROR: Error in processUploadedData:', error);
    handleFileUploadError(error);
  } finally {
    fileInputInProgress = false;
  }
}

/**
 * FIXED: Auto-apply existing mapping to file
 */
async function autoApplyMapping(file, data, mapping) {
  try {
    console.log('CRITICAL: Auto-applying mapping:', mapping);

    // Store file data
    AppState.currentPreviewData = data;
    AppState.currentFileName = file.name;

    // Generate signature
    const { generateFileSignature } = await import('../parsers/fileHandler.js');
    const signature = generateFileSignature(file.name, data);

    // FIXED: Import date conversion function with error handling
    let convertExcelDate;
    try {
      const excelParserModule = await import('../parsers/excelParser.js');
      const excelParser = excelParserModule.excelParser || new excelParserModule.default();
      convertExcelDate = (value) => excelParser.convertExcelDate(value);
    } catch (error) {
      console.error('CRITICAL: Failed to import convertExcelDate:', error);
      // Fallback function if import fails
      convertExcelDate = (value) => String(value);
    }

    // Process transactions using the existing mapping
    const transactions = [];
    for (let i = mapping.dataRowIndex || 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

      const transaction = {
        fileName: file.name,
        currency: mapping.currency || 'USD',
        date: '',
        description: '',
        category: '',
        income: 0,
        expenses: 0
      };

      // Apply mapping to row data
      mapping.mapping.forEach((field, colIndex) => {
        if (field && field !== '–' && row[colIndex] !== undefined && row[colIndex] !== '') {
          let value = row[colIndex];

          if (field === 'Date') {
            if (isExcelDate(value)) {
              value = convertExcelDate(value);
            }
            transaction[field.toLowerCase()] = String(value).trim();
          } else if (field === 'Income' || field === 'Expenses') {
            const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
            if (numValue > 0) {
              transaction[field.toLowerCase()] = numValue;
            }
          } else {
            transaction[field.toLowerCase()] = String(value).trim();
          }
        }
      });

      // Only add if has essential data
      const hasValidDate = transaction.date?.length > 0;
      const hasValidAmount = (transaction.income > 0 || transaction.expenses > 0);
      const hasValidDescription = transaction.description?.trim().length > 0;

      if (hasValidDate || hasValidAmount || hasValidDescription) {
        transactions.push(transaction);
      }
    }

    // CRITICAL FIX: Validate that we have actual valid transactions before proceeding
    if (transactions.length === 0) {
      console.error('CRITICAL ERROR: Existing mapping produced no valid transactions');
      showToast(`No valid transactions found in ${file.name} using existing mapping. Please check the file format and try manual mapping.`, "error");

      // Fall back to manual mapping modal
      const { showFileUploadModal } = await import('./fileUploadModal.js');
      showFileUploadModal(data, file.name);
      fileInputInProgress = false;
      return;
    }

    console.log(`CRITICAL: Existing mapping produced ${transactions.length} valid transactions`);

    // Add to merged files
    const mergedFile = {
      fileName: file.name,
      headerRowIndex: mapping.headerRowIndex || 0,
      dataRowIndex: mapping.dataRowIndex || 1,
      data,
      transactions,
      headerMapping: mapping.mapping,
      signature,
      currency: mapping.currency || 'USD',
      mergedAt: new Date().toISOString()
    };

    if (!AppState.mergedFiles) {
      AppState.mergedFiles = [];
    }
    AppState.mergedFiles.push(mergedFile);

    if (!AppState.transactions) {
      AppState.transactions = [];
    }
    AppState.transactions.push(...transactions);

    // Save to localStorage
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    fileInputInProgress = false;
    showToast(`File imported automatically: ${transactions.length} transactions added`, "success");

    // Force UI update
    setTimeout(() => {
      import('./transactionManager.js').then(module => {
        module.renderTransactions(AppState.transactions, true);
      }).catch(error => {
        console.error('CRITICAL ERROR: Failed to import transaction manager:', error);
      });
    }, 100);

  } catch (error) {
    console.error('CRITICAL ERROR: Auto-apply mapping failed:', error);
    showToast("Auto-mapping failed, showing manual mapping", "warning");

    // FIXED: Show manual mapping modal when auto-apply fails
    storeFileDataInState(file, data);
    showFilePreviewModal(data);
    showToast(`File loaded: ${data.length} rows found - Manual mapping required`, "info");
    fileInputInProgress = false;
  }
}

/**
 * FIXED: Show confirmation dialog for existing mapping match (only when auto-apply fails)
 */
function showMappingConfirmationDialog(file, data, existingMapping, signature) {
  const modalContent = document.createElement('div');
  modalContent.className = 'mapping-confirmation-modal';

  // Build the fields display
  const mappingFields = existingMapping.mapping ?
    existingMapping.mapping.map((field, index) =>
      field !== '–' ? `Column ${index + 1}: ${field}` : null
    ).filter(field => field !== null).join(', ') : 'No field mappings';

  modalContent.innerHTML = `
    <div class="confirmation-content">
      <h3>⚠️ Auto-Mapping Failed</h3>
      <p>The automatic mapping failed, but we found a similar file structure. Would you like to use the existing mapping or map manually?</p>

      <div class="mapping-details">
        <h4>Existing Mapping Details:</h4>
        <p><strong>Original File:</strong> ${existingMapping.fileName || 'Unknown'}</p>
        <p><strong>Fields Mapped:</strong> ${mappingFields}</p>
        <p><strong>Header Row:</strong> ${(existingMapping.headerRowIndex || 0) + 1}</p>
        <p><strong>Data Row:</strong> ${(existingMapping.dataRowIndex || 1) + 1}</p>
        <p><strong>Currency:</strong> ${existingMapping.currency || 'USD'}</p>
      </div>

      <div class="file-info">
        <h4>Current File:</h4>
        <p><strong>File Name:</strong> ${file.name}</p>
        <p><strong>Rows:</strong> ${data.length}</p>
        <p><strong>Columns:</strong> ${data[0]?.length || 0}</p>
      </div>
    </div>

    <div class="confirmation-actions">
      <button id="retryMappingBtn" class="btn primary-btn">🔄 Retry Auto-Mapping</button>
      <button id="manualMappingBtn" class="btn secondary-btn">⚙️ Map Manually</button>
      <button id="cancelMappingBtn" class="btn danger-btn">❌ Cancel</button>
    </div>
  `;

  const modal = showModal({
    title: 'Auto-Mapping Failed',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Add event listeners
  const retryMappingBtn = modalContent.querySelector('#retryMappingBtn');
  const manualMappingBtn = modalContent.querySelector('#manualMappingBtn');
  const cancelMappingBtn = modalContent.querySelector('#cancelMappingBtn');

  if (retryMappingBtn) {
    retryMappingBtn.addEventListener('click', async () => {
      modal.close();
      console.log('CRITICAL: User chose to retry auto-mapping');
      // Try auto-apply again
      await autoApplyMapping(file, data, existingMapping);
    });
  }

  if (manualMappingBtn) {
    manualMappingBtn.addEventListener('click', () => {
      modal.close();
      console.log('CRITICAL: User chose manual mapping');
      // Store data and show manual mapping modal
      storeFileDataInState(file, data);
      showFilePreviewModal(data);
      showToast(`File loaded: ${data.length} rows found - Manual mapping selected`, "info");
      fileInputInProgress = false;
    });
  }

  if (cancelMappingBtn) {
    cancelMappingBtn.addEventListener('click', () => {
      modal.close();
      console.log('CRITICAL: User cancelled file upload');
      resetFileState();
      fileInputInProgress = false;
      showToast('File upload cancelled', 'info');
    });
  }
}

/**
 * Handle file upload errors
 */
function handleFileUploadError(error) {
  console.error("File upload error:", error);
  showToast(`Error processing file: ${error.message}`, "error");
  resetFileState();
  fileInputInProgress = false; // FIXED: Reset flag on error
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
  const shouldReplace = confirm(`File "${file.name}" already exists. Do you want to replace it?`);

  if (shouldReplace) {
    // Remove existing file and continue
    AppState.mergedFiles = AppState.mergedFiles.filter(f => f.fileName !== file.name);

    // Remove transactions from that file
    if (AppState.transactions) {
      AppState.transactions = AppState.transactions.filter(t => t.fileName !== file.name);
    }

    // Save updated state
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    showToast(`Replacing existing file: ${file.name}`, "info");

    // Continue with processing
    fileInputInProgress = false;

    // Re-trigger file processing
    setTimeout(() => {
      readFileContent(file);
    }, 100);

  } else {
    showToast(`Upload cancelled for duplicate file: ${file.name}`, "info");
    resetFileState();
    fileInputInProgress = false;
  }
}

// FIXED: Use only the 5 essential fields from TRANSACTION_FIELDS for mapping
const MAPPING_FIELDS = ['Date', 'Income', 'Expenses', 'Description', 'Currency'];

/**
 * FIXED: Show simplified file preview modal with clean structure
 */
function showFilePreviewModal(data) {
  console.log('CRITICAL: showFilePreviewModal called with data length:', data?.length);

  if (!data || data.length === 0) {
    console.error('CRITICAL ERROR: No data provided to showFilePreviewModal');
    showToast('No data to preview', 'error');
    return;
  }

  console.log('CRITICAL: Creating file preview modal for:', AppState.currentFileName);

  const fileExt = AppState.currentFileName ? AppState.currentFileName.split('.').pop().toLowerCase() : '';

  const modalContent = document.createElement('div');
  modalContent.className = 'file-preview-modal';

  // FIXED: Simplified clean structure
  modalContent.innerHTML = `
    <div class="file-info-section">
      <h3>📄 ${AppState.currentFileName}</h3>
      <div class="file-stats">
        <span>📊 ${data.length} rows</span>
        <span>📑 ${data[0]?.length || 0} columns</span>
        <span>📁 ${fileExt.toUpperCase()}</span>
      </div>
    </div>

    <div class="row-config-section">
      <div class="config-row">
        <label for="headerRowSelect">Header Row:</label>
        <select id="headerRowSelect">
          ${data
      .map((_, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${index + 1}</option>`)
      .join('')}
        </select>
      </div>
      <div class="config-row">
        <label for="dataRowSelect">Data Row:</label>
        <select id="dataRowSelect">
          ${data
      .map((_, index) => `<option value="${index}" ${index === 1 ? 'selected' : ''}>${index + 1}</option>`)
      .join('')}
        </select>
      </div>
    </div>

    <div id="previewContainer" class="preview-container"></div>

    <div class="modal-actions">
      <button id="saveHeadersBtn" class="btn primary-btn">Import File</button>
      <button id="cancelPreviewBtn" class="btn secondary-btn">Cancel</button>
    </div>
  `;

  console.log('CRITICAL: Creating modal with showModal...');

  // CRITICAL FIX: Create modal immediately and ensure it shows
  try {
    const modal = showModal({
      title: 'Import File: Column Mapping',
      content: modalContent,
      size: 'large',
      closeOnClickOutside: false,
    });

    if (!modal) {
      console.error('CRITICAL ERROR: Modal creation failed - showModal returned null/undefined');
      showToast('Error creating file preview modal', 'error');
      return;
    }

    console.log('CRITICAL: Modal created successfully, modal object:', modal);

    // CRITICAL FIX: Set up event listeners immediately after modal is created
    setupModalEventListeners(modal, data, fileExt, () => {
      console.log('CRITICAL: Calling updatePreview...');
      updatePreview();
    });

    // CRITICAL FIX: Run initial preview update immediately
    console.log('CRITICAL: Running initial preview update...');
    updatePreview();
    console.log('CRITICAL: File preview modal setup complete');

  } catch (error) {
    console.error('CRITICAL ERROR: Error creating modal:', error);
    showToast('Error creating file preview modal', 'error');
    return;
  }

  // Update preview function (move inside to access current data)
  function updatePreview() {
    console.log('CRITICAL: updatePreview called');
    const headerRowIndex = parseInt(document.getElementById('headerRowSelect')?.value || 0);
    const dataRowIndex = parseInt(document.getElementById('dataRowSelect')?.value || 1);

    if (headerRowIndex >= data.length || dataRowIndex >= data.length) {
      console.log('CRITICAL: Invalid row indices');
      return;
    }

    const headers = data[headerRowIndex] || [];
    const dataRow = data[dataRowIndex] || [];
    const previewContainer = document.getElementById('previewContainer');

    if (!previewContainer) {
      console.error('CRITICAL: Preview container not found');
      return;
    }

    // CRITICAL FIX: Preserve current user selections before regenerating HTML
    const currentSelections = {};
    const existingSelects = document.querySelectorAll('.header-select');
    existingSelects.forEach(select => {
      const index = parseInt(select.getAttribute('data-index'));
      if (!isNaN(index)) {
        currentSelections[index] = select.value;
        console.log(`CRITICAL: Preserving user selection for column ${index}: "${select.value}"`);
      }
    });

    // CRITICAL FIX: Only create mapping dropdowns for actual columns that exist
    const actualColumnCount = headers.length;
    console.log('CRITICAL: Creating mapping for', actualColumnCount, 'actual columns');

    // FIXED: Proper table structure with headers mapping above each column using only essential fields
    let html = `
      <div class="preview-table-wrapper">
        <table class="column-mapping-table">
          <thead>
            <tr class="mapping-row">
              ${headers
        .map((header, index) => {
          // CRITICAL FIX: Use preserved user selection if available, otherwise auto-detect
          let selectedValue = currentSelections[index];
          if (!selectedValue) {
            const suggested = autoDetectFieldType(header) || '–';
            selectedValue = MAPPING_FIELDS.includes(suggested) ? suggested : '–';
          }

          console.log(`CRITICAL: Column ${index} ("${header}") - using selection: "${selectedValue}"`);

          return `
                  <th class="mapping-cell">
                    <select class="header-select" data-index="${index}">
                      <option value="–" ${selectedValue === '–' ? 'selected' : ''}>-ignore-</option>
                      ${MAPPING_FIELDS.map(
            (field) => `<option value="${field}" ${selectedValue === field ? 'selected' : ''}>${field}</option>`
          ).join('')}
                    </select>
                  </th>
                `;
        })
        .join('')}
            </tr>
            <tr class="header-row">
              ${headers
        .map(
          (header) => `
                <th class="header-cell">
                  ${header || '<em>empty</em>'}
                </th>
              `
        )
        .join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="data-row">
              ${dataRow.map((cell, index) => {
          // FIXED: Show date conversion preview only for columns mapped as Date
          const mappings = getCurrentMapping();
          const isMappedAsDate = mappings[index] === 'Date';
          let displayValue = cell || '<em>empty</em>';

          if (cell && isMappedAsDate && isExcelDate(cell)) {
            displayValue = formatExcelDateForPreview(cell);
          } else if (cell) {
            // FIXED: Keep original format for non-Date columns
            displayValue = String(cell).replace(/data-field=.*$/i, '').trim() || '<em>empty</em>';
          }
          return `
                  <td class="data-cell">
                    ${displayValue}
                  </td>
                `;
        }).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    previewContainer.innerHTML = html;

    // Add change listeners
    document.querySelectorAll('.header-select').forEach(select => {
      select.addEventListener('change', (e) => {
        console.log('CRITICAL: Header select changed:', e.target.value);
        const newValue = e.target.value;
        const index = parseInt(e.target.getAttribute('data-index'));

        // FIXED: Prevent multiple Date mappings
        if (newValue === 'Date') {
          const currentMappings = getCurrentMapping();
          handleDateMappingConflict(currentMappings, index);
        }

        updateSaveButtonState();
        updatePreview(); // Refresh preview to show/hide date conversions
      });
    });

    updateSaveButtonState();
  }

  function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveHeadersBtn');
    if (saveBtn) {
      const mappings = getCurrentMapping();
      const hasDate = mappings.includes('Date');
      const hasAmount = mappings.includes('Income') || mappings.includes('Expenses');

      // CRITICAL FIX: Always enable the button to allow user interaction
      saveBtn.disabled = false;
      saveBtn.removeAttribute('disabled');
      saveBtn.style.pointerEvents = 'auto';
      saveBtn.style.cursor = 'pointer';
      saveBtn.style.opacity = '1';

      saveBtn.title = hasDate && hasAmount ? 'Ready to import' : 'Click to configure mapping (Date and Income/Expenses needed)';

      console.log('CRITICAL: fileUpload.js - Save button FORCE ENABLED');
    }
  }
}

/**
 * Set up modal event listeners with real-time preview updates
 */
function setupModalEventListeners(modal, data, fileExt, updatePreview) {
  const modalContent = modal.content || getCachedModalElement('.file-preview-modal');
  if (!modalContent) return;

  // FIXED: Cache frequently accessed elements
  const cancelBtn = modalContent.querySelector('#cancelPreviewBtn');
  const saveBtn = modalContent.querySelector('#saveHeadersBtn');

  // FIXED: Use event delegation for header selects
  const handleSelectChange = (e) => {
    if (e.target.matches('#headerRowSelect, #dataRowSelect')) {
      // FIXED: Use requestAnimationFrame for smooth updates
      requestAnimationFrame(updatePreview);
    }
  };

  modalContent.addEventListener('change', handleSelectChange);

  // FIXED: Track listeners for cleanup
  const modalId = modal.id || Date.now().toString();
  fileUploadCache.eventListeners.set(modalId, [
    { element: modalContent, event: 'change', handler: handleSelectChange }
  ]);

  if (cancelBtn) {
    const handleCancel = () => {
      modal.close();
      // FIXED: Add missing clearPreview function
      resetFileState();
      fileInputInProgress = false;
      cleanupModalEventListeners(modalId);
    };
    cancelBtn.addEventListener('click', handleCancel);
    fileUploadCache.eventListeners.get(modalId).push({
      element: cancelBtn, event: 'click', handler: handleCancel
    });
  }

  if (saveBtn) {
    const handleSave = () => {
      onSaveHeaders(modal);
      cleanupModalEventListeners(modalId);
    };
    saveBtn.addEventListener('click', handleSave);
    fileUploadCache.eventListeners.get(modalId).push({
      element: saveBtn, event: 'click', handler: handleSave
    });
  }
}

// FIXED: Clean up modal event listeners
function cleanupModalEventListeners(modalId) {
  const listeners = fileUploadCache.eventListeners.get(modalId);
  if (!listeners) return;

  listeners.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler);
  });

  fileUploadCache.eventListeners.delete(modalId);
}

// FIXED: Add missing getCachedModalElement function
function getCachedModalElement(selector) {
  if (!fileUploadCache.modalElements.has(selector)) {
    fileUploadCache.modalElements.set(selector, document.querySelector(selector));
  }
  return fileUploadCache.modalElements.get(selector);
}

// FIXED: Cleanup function for component unmounting
export function cleanupFileUpload() {
  cleanupExistingFileInputs();
  fileUploadCache.modalElements.clear();

  fileUploadCache.eventListeners.forEach((listeners, modalId) => {
    cleanupModalEventListeners(modalId);
  });

  fileUploadCache.activeInputs.clear();
}

/**
 * Validates file data and mapping before saving
 */
function validateFileDataAndMapping(data, mapping, headerRowIndex, dataRowIndex) {
  if (!data || data.length === 0) {
    return { valid: false, error: "No file data to validate" };
  }

  // Check required mappings
  const hasDate = mapping.includes('Date');
  const hasAmount = mapping.includes('Income') || mapping.includes('Expenses');

  if (!hasDate || !hasAmount) {
    return { valid: false, error: "Please map at least Date and one amount field (Income or Expenses)" };
  }

  // Validate column counts
  const actualColumnCount = data[headerRowIndex]?.length || data[0]?.length || 0;
  const mappedColumnCount = mapping.length;

  if (mappedColumnCount > actualColumnCount) {
    return { valid: false, error: `Error: File has ${actualColumnCount} columns but mapping has ${mappedColumnCount} columns` };
  }

  // Find the highest mapped column index that's not '–'
  const maxMappedColumnIndex = mapping.reduce((maxIndex, field, index) => {
    return field !== '–' ? Math.max(maxIndex, index) : maxIndex;
  }, -1);

  if (maxMappedColumnIndex >= actualColumnCount) {
    return { valid: false, error: `Error: Mapping uses column ${maxMappedColumnIndex + 1} but file only has ${actualColumnCount} columns` };
  }

  return { valid: true };
}

/**
 * Handles saving headers and merging the file
 */
export async function onSaveHeaders(modal) {
  try {
    const data = AppState.currentPreviewData;
    const fileName = AppState.currentFileName;

    console.log('CRITICAL: Saving headers for file:', fileName, 'Data rows:', data ? data.length : 0);

    if (!data || !fileName) {
      showToast("No file data to save", "error");
      return;
    }

    // Get mapping and settings
    const mapping = getCurrentMapping();
    const headerRowIndex = parseInt(document.getElementById('headerRowSelect')?.value || 0);
    const dataRowIndex = parseInt(document.getElementById('dataRowSelect')?.value || 1);

    console.log('CRITICAL: File processing settings:', {
      mapping,
      headerRowIndex,
      dataRowIndex,
      dataLength: data.length
    });

    // Validate mapping before proceeding
    const validation = validateFileDataAndMapping(data, mapping, headerRowIndex, dataRowIndex);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }

    // FIXED: Import date conversion function with error handling
    const convertExcelDate = await setupDateConversion();

    // CRITICAL FIX: Generate signature consistently - without mapping parameter
    const { generateFileSignature } = await import('../parsers/fileHandler.js');
    const { saveHeadersAndFormat } = await import('../mappings/mappingsManager.js');

    // FIXED: Generate signature without mapping to ensure consistency
    const signature = generateFileSignature(fileName, data);

    // CRITICAL FIX: Save mapping with all required parameters
    saveHeadersAndFormat(
      signature,
      mapping,
      fileName,
      headerRowIndex,
      dataRowIndex,
      'USD'
    );

    console.log('CRITICAL: Saved mapping with signature:', signature, 'mapping:', mapping);

    // CRITICAL FIX: Process transactions with proper field mapping and validation
    const transactions = processAllTransactions(data, mapping, fileName, dataRowIndex, convertExcelDate);

    /**
     * Processes a single transaction row
     */
    function processTransactionRow(row, mapping, fileName, convertExcelDate) {
      const transaction = {
        fileName,
        currency: 'USD',
        date: '',
        description: '',
        category: '',
        income: 0,
        expenses: 0
      };

      // Process each mapped column
      mapping.forEach((field, colIndex) => {
        if (field === '–' || colIndex >= row.length || !row[colIndex]) {
          return;
        }

        let value = row[colIndex];
        if (value === null || value === undefined || value === '') {
          return;
        }

        console.log(`CRITICAL: Processing column ${colIndex}, field ${field}, value:`, value);

        if (field === 'Date') {
          if (isExcelDate(value)) {
            value = convertExcelDate(value);
          }
          transaction[field.toLowerCase()] = String(value).trim();
        } else if (field === 'Income' || field === 'Expenses') {
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
          if (numValue > 0) {
            transaction[field.toLowerCase()] = numValue;
          }
        } else {
          const cleanValue = String(value).trim();
          transaction[field.toLowerCase()] = cleanValue;
        }
      });

      return transaction;
    }

    /**
     * Validates a processed transaction
     */
    function validateTransaction(transaction) {
      const hasValidDate = transaction.date?.length > 0 && typeof transaction.date === 'string';
      const hasValidAmount = (transaction.income > 0 || transaction.expenses > 0);
      const hasValidDescription = transaction.description?.trim().length > 0;

      // Check for invalid date format
      if (transaction.date && typeof transaction.date === 'number') {
        console.warn('CRITICAL: Invalid date format detected, skipping transaction:', transaction);
        return false;
      }

      // Check for numeric description (possible wrong mapping)
      if (transaction.description && !isNaN(parseFloat(transaction.description)) && isFinite(transaction.description)) {
        console.warn('CRITICAL: Description appears to be a number, possible wrong mapping:', transaction);
      }

      return hasValidDate || hasValidAmount || hasValidDescription;
    }

    /**
     * Processes all transactions from data
     */
    function processAllTransactions(data, mapping, fileName, dataRowIndex, convertExcelDate) {
      const transactions = [];

      for (let i = dataRowIndex; i < data.length; i++) {
        const row = data[i];
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

        const transaction = processTransactionRow(row, mapping, fileName, convertExcelDate);

        if (validateTransaction(transaction)) {
          transactions.push(transaction);
        }
      }

      return transactions;
    }

    /**
     * Sets up date conversion function
     */
    async function setupDateConversion() {
      try {
        const excelParserModule = await import('../parsers/excelParser.js');
        const excelParser = excelParserModule.excelParser || new excelParserModule.default();
        return (value) => excelParser.convertExcelDate(value);
      } catch (error) {
        console.error('CRITICAL: Failed to import convertExcelDate:', error);
        return (value) => String(value);
      }
    }

    console.log(`CRITICAL: Processed ${transactions.length} transactions from file:`, transactions.slice(0, 3));

    // CRITICAL FIX: Validate processed transactions before saving
    if (transactions.length === 0) {
      showToast("No valid transactions found in the file. Please check your column mapping.", "error");
      return;
    }

    // Validate sample transactions for data integrity
    const sampleTx = transactions[0];
    if (typeof sampleTx.date === 'number') {
      showToast("Invalid date format detected. Please check your Date column mapping.", "error");
      return;
    }

    // Save merged file data with ALL required fields
    const mergedFile = {
      fileName,
      headerRowIndex,
      dataRowIndex,
      data,
      transactions,
      headerMapping: mapping,
      signature,
      currency: 'USD',
      mergedAt: new Date().toISOString()
    };

    // Add to merged files
    if (!AppState.mergedFiles) {
      AppState.mergedFiles = [];
    }
    AppState.mergedFiles.push(mergedFile);

    // CRITICAL FIX: Update AppState.transactions immediately and force UI update
    if (!AppState.transactions) {
      AppState.transactions = [];
    }
    AppState.transactions.push(...transactions);

    console.log('CRITICAL: Updated AppState:', {
      mergedFiles: AppState.mergedFiles.length,
      totalTransactions: AppState.transactions.length,
      lastTransaction: AppState.transactions[AppState.transactions.length - 1]
    });

    // Save everything to localStorage
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    // Close modal and clear state
    modal.close();
    resetFileState();
    fileInputInProgress = false;

    // Show success message
    showToast(`File imported: ${transactions.length} transactions added`, "success");

    // CRITICAL: Force immediate transaction display update
    console.log('CRITICAL: Forcing transaction manager update...');

    // Use setTimeout to ensure DOM is ready, then force update
    setTimeout(() => {
      import('./transactionManager.js').then(module => {
        console.log('CRITICAL: Transaction manager imported, forcing renderTransactions...');
        // Force render with the actual transactions
        module.renderTransactions(AppState.transactions, true);
      }).catch(error => {
        console.error('CRITICAL ERROR: Failed to import transaction manager:', error);
      });
    }, 100);

  } catch (error) {
    console.error('CRITICAL ERROR: Error saving file:', error);
    showToast("Error importing file", "error");
  }
}

/**
 * Get current mapping from the modal
 */
function getCurrentMapping() {
  const selects = document.querySelectorAll('.header-select, .column-mapping');

  // CRITICAL FIX: If no DOM selects found, fall back to AppState mapping
  if (selects.length === 0) {
    console.log('CRITICAL: No header select elements found, falling back to AppState.currentSuggestedMapping');
    return AppState.currentSuggestedMapping || [];
  }

  // CRITICAL FIX: First, determine the actual number of columns needed
  let maxIndex = -1;
  selects.forEach((select) => {
    const dataIndex = parseInt(select.getAttribute('data-index'));
    if (!isNaN(dataIndex)) {
      maxIndex = Math.max(maxIndex, dataIndex);
    }
  });

  // CRITICAL FIX: Create properly sized array and fill with defaults
  const mapping = new Array(maxIndex + 1).fill('–');

  // CRITICAL FIX: Only update mappings for actual select elements that exist
  selects.forEach((select) => {
    const dataIndex = parseInt(select.getAttribute('data-index'));
    if (!isNaN(dataIndex) && dataIndex >= 0 && dataIndex < mapping.length) {
      const value = select.value || '–';
      mapping[dataIndex] = value;
      console.log(`CRITICAL: Setting mapping[${dataIndex}] = "${value}" from select element`);
    }
  });

  console.log('CRITICAL: Generated mapping array:', mapping, 'length:', mapping.length);

  // CRITICAL FIX: Validate that we haven't lost any user selections
  selects.forEach((select) => {
    const dataIndex = parseInt(select.getAttribute('data-index'));
    const selectValue = select.value;
    if (!isNaN(dataIndex) && selectValue && selectValue !== '–' && mapping[dataIndex] !== selectValue) {
      console.error(`CRITICAL ERROR: Lost mapping for index ${dataIndex}: expected "${selectValue}", got "${mapping[dataIndex]}"`);
      mapping[dataIndex] = selectValue; // Force correct value
    }
  });

  // CRITICAL FIX: As additional fallback, if all mapping values are "–", use AppState
  const hasAnyMappings = mapping.some(val => val !== '–');
  if (!hasAnyMappings && AppState.currentSuggestedMapping?.length > 0) {
    console.log('CRITICAL: No valid mappings found in DOM, using AppState.currentSuggestedMapping as fallback');
    return AppState.currentSuggestedMapping;
  }

  return mapping;
}

/**
 * Initialize drag-and-drop functionality for file uploads
 */
function initializeDragAndDrop() {
  const dropOverlay = document.getElementById('dropOverlay');

  if (!dropOverlay) {
    console.warn('Drop overlay element not found');
    return;
  }

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    document.body.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    if (e.dataTransfer.types.includes('Files')) {
      dropOverlay.style.display = 'flex';
      document.body.classList.add('drag-over');
    }
  }

  function unhighlight(e) {
    dropOverlay.style.display = 'none';
    document.body.classList.remove('drag-over');
  }

  // Handle dropped files
  document.body.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const file = files[0];
      console.log('File dropped:', file.name);

      // Process the dropped file
      handleFileUploadProcess(file);
    }
  }

  console.log('Drag and drop initialized successfully');
}

/**
 * FIXED: Auto-apply detected mapping to file without showing modal
 */
async function autoApplyDetectedMapping(file, data, autoMapping) {
  try {
    console.log('CRITICAL: Auto-applying detected mapping:', autoMapping);

    // Store file data
    AppState.currentPreviewData = data;
    AppState.currentFileName = file.name;

    // Process transactions using the auto-detected mapping
    const transactions = [];
    const dataStartRow = 1;

    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

      const transaction = {
        fileName: file.name,
        sourceFile: file.name,
        originalRowIndex: i
      };

      // Map fields based on auto-detected mapping
      autoMapping.forEach((fieldType, colIndex) => {
        const cellValue = row[colIndex] || '';

        switch (fieldType) {
          case 'Date':
            transaction.date = cellValue;
            break;
          case 'Description':
            transaction.description = cellValue;
            break;
          case 'Income':
            transaction.income = parseFloat(cellValue) || 0;
            break;
          case 'Expenses':
            transaction.expenses = parseFloat(cellValue) || 0;
            break;
          case 'Amount': {
            const amount = parseFloat(cellValue) || 0;
            if (amount >= 0) {
              transaction.income = amount;
              transaction.expenses = 0;
            } else {
              transaction.income = 0;
              transaction.expenses = Math.abs(amount);
            }
            break;
          }
          case 'Category':
            transaction.category = cellValue;
            break;
          case 'Currency':
            transaction.currency = cellValue;
            break;
          default:
            // Store unmapped fields as custom properties
            if (fieldType && fieldType !== '–') {
              transaction[fieldType.toLowerCase()] = cellValue;
            }
        }
      });

      // Set defaults
      if (!transaction.income && !transaction.expenses) {
        transaction.income = 0;
        transaction.expenses = 0;
      }
      if (!transaction.category) {
        transaction.category = 'Uncategorized';
      }
      if (!transaction.currency) {
        transaction.currency = 'USD';
      }

      transactions.push(transaction);
    }

    // CRITICAL FIX: Validate that we have actual valid transactions before proceeding
    if (transactions.length === 0) {
      console.error('CRITICAL ERROR: Auto-detected mapping produced no valid transactions');
      showToast(`No valid transactions found in ${file.name}. Please check the file format and try manual mapping.`, "error");

      // Store file data and show manual mapping modal instead
      storeFileDataInState(file, data);
      showFilePreviewModal(data);
      fileInputInProgress = false;
      return;
    }

    console.log(`CRITICAL: Auto-detected mapping produced ${transactions.length} valid transactions`);

    // Update AppState
    AppState.mergedFiles.push({
      fileName: file.name,
      data: data,
      signature: AppState.currentFileSignature,
      mappings: autoMapping,
      uploadDate: new Date().toISOString(),
      autoDetected: true
    });

    AppState.transactions.push(...transactions);

    // Save to localStorage
    localStorage.setItem('mergedFiles', JSON.stringify(AppState.mergedFiles));
    localStorage.setItem('transactions', JSON.stringify(AppState.transactions));

    fileInputInProgress = false;
    showToast(`File processed automatically: ${transactions.length} transactions imported`, "success");

    // Force UI update
    setTimeout(() => {
      import('./transactionManager.js').then(module => {
        module.renderTransactions(AppState.transactions, true);
      }).catch(error => {
        console.error('CRITICAL ERROR: Failed to import transaction manager:', error);
      });
    }, 100);

  } catch (error) {
    console.error('CRITICAL ERROR: Auto-detected mapping failed:', error);
    showToast("Auto-processing failed, showing manual mapping", "warning");

    // Fall back to manual mapping
    showFilePreviewModal(data);
    fileInputInProgress = false;
  }
}

// Helper function to find existing date mapping index
function findExistingDateMapping(currentMappings, excludeIndex) {
  return currentMappings.findIndex((field, i) => field === 'Date' && i !== excludeIndex);
}

// Helper function to handle date mapping conflict
function handleDateMappingConflict(currentMappings, index) {
  const existingDateIndex = findExistingDateMapping(currentMappings, index);

  if (existingDateIndex !== -1) {
    // Reset the existing Date mapping
    const existingSelect = document.querySelector(`.header-select[data-index="${existingDateIndex}"]`);
    if (existingSelect) {
      existingSelect.value = '–';
    }
  }
}
