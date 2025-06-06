import { AppState, resetFileState } from '../core/appState.js';
import { showToast } from './uiManager.js';
import { showModal } from './modalManager.js';
import { TRANSACTION_FIELDS, autoDetectFieldType } from '../constants/fieldMappings.js'; // FIXED: Correct import

// Global flag to prevent multiple file inputs
let fileInputInProgress = false;

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

    console.log("File upload initialized successfully");
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
    console.log("File input already in progress");
    return null;
  }

  try {
    // Clean up existing inputs first
    cleanupExistingFileInputs();

    // Create new file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls,.xml';
    fileInput.style.display = 'none';

    // Add event listener for file selection
    fileInput.addEventListener('change', handleFileSelection);

    // FIXED: Add cancel handler to reset progress flag
    fileInput.addEventListener('cancel', () => {
      fileInputInProgress = false;
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    });

    // FIXED: Handle window focus to detect cancel
    const handleFocus = () => {
      setTimeout(() => {
        if (!fileInput.files.length && document.body.contains(fileInput)) {
          fileInputInProgress = false;
          document.body.removeChild(fileInput);
        }
        window.removeEventListener('focus', handleFocus);
      }, 300);
    };
    window.addEventListener('focus', handleFocus);

    // Add to DOM and trigger click
    document.body.appendChild(fileInput);

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      fileInput.click();
    }, 10);

    console.log("File input created and triggered");
    return fileInput;

  } catch (error) {
    console.error("Error creating file input:", error);
    fileInputInProgress = false;
    return null;
  }
}

/**
 * Handle file selection with proper error handling
 */
function handleFileSelection(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    // FIXED: Reset progress flag if no file selected
    fileInputInProgress = false;
    return;
  }

  // FIXED: Only set progress flag when file is actually selected
  fileInputInProgress = true;

  console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

  try {
    // Process the file
    handleFileUploadProcess(file);
  } catch (error) {
    console.error("Error processing file:", error);
    handleFileUploadError(error);
  } finally {
    // Clean up the file input
    if (event.target && event.target.parentNode) {
      event.target.parentNode.removeChild(event.target);
    }
  }
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
  } else if (fileExt === 'xlsx' || fileExt === 'xls') {
    handleExcelFile(file);
  } else if (fileExt === 'xml') {
    handleXMLFile(file);
  } else {
    handleFileUploadError(new Error(`Unsupported file type: ${fileExt}`));
  }
}

/**
 * Handle CSV file upload
 */
function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const lines = csvText.split('\n').filter(line => line.trim());
      const data = lines.map(line => {
        // Simple CSV parsing - could be enhanced
        return line.split(',').map(field => field.replace(/^"(.*)"$/, '$1').trim());
      });

      processUploadedData(file, data);
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
      // This would require XLSX library
      if (typeof XLSX === 'undefined') {
        throw new Error('XLSX library not loaded');
      }

      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      processUploadedData(file, jsonData);
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
      const xmlText = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Convert XML to array format for processing
      const transactions = xmlDoc.querySelectorAll('transaction, Transaction');
      const data = [];

      // Add header row
      if (transactions.length > 0) {
        const firstTransaction = transactions[0];
        const headers = Array.from(firstTransaction.children).map(child => child.tagName);
        data.push(headers);

        // Add data rows
        transactions.forEach(transaction => {
          const row = Array.from(transaction.children).map(child => child.textContent);
          data.push(row);
        });
      }

      processUploadedData(file, data);
    } catch (error) {
      handleFileUploadError(error);
    }
  };
  reader.readAsText(file);
}

/**
 * Process uploaded data
 */
async function processUploadedData(file, data) {
  if (!data || data.length === 0) {
    handleFileUploadError(new Error("No data found in file"));
    return;
  }

  // CRITICAL FIX: Check for duplicate file first
  const isDuplicate = checkForDuplicateFile(file);
  if (isDuplicate) {
    handleDuplicateFile(file);
    return;
  }

  // CRITICAL FIX: Generate signature and set as current
  const { generateFileSignature } = await import('../parsers/fileHandler.js');
  const { findMappingBySignature } = await import('../mappings/mappingsManager.js');
  const { setCurrentFileSignature } = await import('../core/appState.js');

  const signature = generateFileSignature(file.name, data);

  // FIXED: Set current file signature for display
  setCurrentFileSignature(signature);

  console.log('CRITICAL: Generated signature for file:', file.name, 'signature:', signature);

  const existingMapping = findMappingBySignature(signature);

  if (existingMapping) {
    console.log('CRITICAL: Found existing mapping, auto-applying:', existingMapping);

    // FIXED: Auto-apply existing mapping - this should work for same signatures
    console.log('CRITICAL: Auto-applying saved mapping for signature:', signature);
    autoApplyMapping(file, data, existingMapping);
    return;
  } else {
    console.log('CRITICAL: No existing mapping found for signature:', signature, 'showing manual mapping');
  }

  // Store data and show preview
  storeFileDataInState(file, data);
  showFilePreviewModal(data);
  showToast(`File loaded: ${data.length} rows found`, "success");
  fileInputInProgress = false;
}

/**
 * Auto-apply existing mapping to file
 */
async function autoApplyMapping(file, data, mapping) {
  try {
    console.log('CRITICAL: Auto-applying mapping:', mapping);

    // Store file data
    AppState.currentPreviewData = data;
    AppState.currentFileName = file.name;

    // Generate signature
    const { generateFileSignature } = await import('../parsers/fileHandler.js');
    const signature = generateFileSignature(file.name, data, mapping.mapping);

    // Process transactions
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

      mapping.mapping.forEach((field, colIndex) => {
        if (field && field !== '–' && row[colIndex] !== undefined) {
          const fieldName = field.toLowerCase();
          transaction[fieldName] = row[colIndex];
        }
      });

      // Convert string numbers
      if (transaction.income && typeof transaction.income === 'string') {
        transaction.income = parseFloat(transaction.income.replace(/[^\d.-]/g, '')) || 0;
      }
      if (transaction.expenses && typeof transaction.expenses === 'string') {
        transaction.expenses = parseFloat(transaction.expenses.replace(/[^\d.-]/g, '')) || 0;
      }

      if (transaction.date || transaction.description || transaction.income > 0 || transaction.expenses > 0) {
        transactions.push(transaction);
      }
    }

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
      });
    }, 100);

  } catch (error) {
    console.error('CRITICAL ERROR: Auto-apply mapping failed:', error);
    showToast("Auto-mapping failed, showing manual mapping", "warning");
    showFilePreviewModal(data);
  }
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
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          const data = lines.map(line => {
            return line.split(',').map(field => field.replace(/^"(.*)"$/, '$1').trim());
          });
          processUploadedData(file, data);
        } catch (error) {
          handleFileUploadError(error);
        }
      };
      reader.readAsText(file);
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
          ${data.map((_, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${index + 1}</option>`).join('')}
        </select>
      </div>
      <div class="config-row">
        <label for="dataRowSelect">Data Row:</label>
        <select id="dataRowSelect">
          ${data.map((_, index) => `<option value="${index}" ${index === 1 ? 'selected' : ''}>${index + 1}</option>`).join('')}
        </select>
      </div>
    </div>

    <div id="previewContainer" class="preview-container"></div>

    <div class="modal-actions">
      <button id="saveHeadersBtn" class="btn primary-btn">Import File</button>
      <button id="cancelPreviewBtn" class="btn secondary-btn">Cancel</button>
    </div>
  `;

  const modal = showModal({
    title: 'Import File: Column Mapping',
    content: modalContent,
    size: 'large',
    closeOnClickOutside: false
  });

  // Update preview function
  function updatePreview() {
    const headerRowIndex = parseInt(document.getElementById('headerRowSelect').value);
    const dataRowIndex = parseInt(document.getElementById('dataRowSelect').value);

    if (headerRowIndex >= data.length || dataRowIndex >= data.length) {
      return;
    }

    const headers = data[headerRowIndex] || [];
    const dataRow = data[dataRowIndex] || [];
    const previewContainer = document.getElementById('previewContainer');

    // CRITICAL FIX: Only create mapping dropdowns for actual columns that exist
    const actualColumnCount = headers.length;
    console.log('CRITICAL: Creating mapping for', actualColumnCount, 'actual columns');

    // FIXED: Proper table structure with headers mapping above each column using only essential fields
    let html = `
      <div class="preview-table-wrapper">
        <table class="column-mapping-table">
          <thead>
            <tr class="mapping-row">
              ${headers.map((header, index) => {
      const suggested = autoDetectFieldType(header) || '–';
      // FIXED: Only show essential mapping fields
      const validSuggestion = MAPPING_FIELDS.includes(suggested) ? suggested : '–';
      return `
                  <th class="mapping-cell">
                    <select class="header-select" data-index="${index}">
                      <option value="–" ${validSuggestion === '–' ? 'selected' : ''}>-ignore-</option>
                      ${MAPPING_FIELDS.map(field =>
        `<option value="${field}" ${validSuggestion === field ? 'selected' : ''}>${field}</option>`
      ).join('')}
                    </select>
                  </th>
                `;
    }).join('')}
            </tr>
            <tr class="header-row">
              ${headers.map(header => `
                <th class="header-cell">
                  ${header || '<em>empty</em>'}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="data-row">
              ${dataRow.map((cell, index) => {
      // FIXED: Convert Excel dates for preview and clean display value
      let displayValue = cell || '<em>empty</em>';
      if (cell && isExcelDate(cell)) {
        const convertedDate = convertExcelDate(cell);
        displayValue = `${convertedDate} <small>(was: ${cell})</small>`;
      } else if (cell) {
        // CRITICAL FIX: Clean any unwanted text from display value
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
      select.addEventListener('change', () => {
        updateSaveButtonState();
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

      saveBtn.disabled = !(hasDate && hasAmount);
      saveBtn.title = hasDate && hasAmount ?
        'Ready to import' :
        'Need at least Date and Income/Expenses columns';
    }
  }

  // Set up event listeners
  setupModalEventListeners(modal, data, fileExt, updatePreview);

  // Initial render
  updatePreview();
}

function autoDetectColumn(header, sampleData) {
  // FIXED: Use the utility function from fieldMappings
  return autoDetectFieldType(header);
}

/**
 * Set up modal event listeners with real-time preview updates
 */
function setupModalEventListeners(modal, data, fileExt, updatePreview) {
  // Update preview when row selects change
  const headerRowSelect = document.getElementById('headerRowSelect');
  const dataRowSelect = document.getElementById('dataRowSelect');

  if (headerRowSelect) {
    headerRowSelect.addEventListener('change', updatePreview);
  }
  if (dataRowSelect) {
    dataRowSelect.addEventListener('change', updatePreview);
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelPreviewBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.close();
      clearPreview();
    });
  }

  // Save button
  const saveBtn = document.getElementById('saveHeadersBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      onSaveHeaders(modal);
    });
  }
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
    const hasDate = mapping.includes('Date');
    const hasAmount = mapping.includes('Income') || mapping.includes('Expenses');

    if (!hasDate || !hasAmount) {
      showToast("Please map at least Date and one amount field (Income or Expenses)", "error");
      return;
    }

    // CRITICAL FIX: Validate that we have enough columns in the data
    const actualColumnCount = data[headerRowIndex]?.length || data[0]?.length || 0;
    const mappedColumnCount = mapping.length;

    console.log('CRITICAL: Column validation:', {
      actualColumnCount,
      mappedColumnCount,
      headerRow: data[headerRowIndex],
      dataRow: data[dataRowIndex]
    });

    if (mappedColumnCount > actualColumnCount) {
      showToast(`Error: File has ${actualColumnCount} columns but mapping has ${mappedColumnCount} columns`, "error");
      return;
    }

    // CRITICAL FIX: Find the highest mapped column index that's not '–'
    const maxMappedColumnIndex = mapping.reduce((maxIndex, field, index) => {
      return field !== '–' ? Math.max(maxIndex, index) : maxIndex;
    }, -1);

    if (maxMappedColumnIndex >= actualColumnCount) {
      showToast(`Error: Mapping uses column ${maxMappedColumnIndex + 1} but file only has ${actualColumnCount} columns`, "error");
      return;
    }

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
    const transactions = [];
    for (let i = dataRowIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

      const transaction = {
        fileName,
        currency: 'USD',
        date: '',
        description: '',
        category: '',
        income: 0,
        expenses: 0
      };

      // CRITICAL FIX: Only process columns that exist in the actual data AND are mapped
      mapping.forEach((field, colIndex) => {
        // Skip if field is not mapped, column doesn't exist, or cell is empty
        if (field === '–' || colIndex >= row.length || !row[colIndex]) {
          return;
        }

        let value = row[colIndex];

        // Skip empty values
        if (value === null || value === undefined || value === '') {
          return;
        }

        console.log(`CRITICAL: Processing column ${colIndex}, field ${field}, value:`, value);

        // FIXED: Apply Excel date conversion during processing
        if (field === 'Date' && isExcelDate(value)) {
          value = convertExcelDate(value);
        }

        // CRITICAL FIX: Ensure proper data type conversion and validation
        if (field === 'Income' || field === 'Expenses') {
          // Convert to number for amount fields
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
          if (numValue > 0) { // Only set if positive value
            transaction[field.toLowerCase()] = numValue;
          }
        } else {
          // Convert to string for other fields
          const cleanValue = String(value).trim();
          transaction[field.toLowerCase()] = cleanValue;
        }
      });

      // CRITICAL FIX: Validate transaction has meaningful data and correct data types
      const hasValidDate = transaction.date && transaction.date !== '' && typeof transaction.date === 'string';
      const hasValidAmount = (transaction.income > 0 || transaction.expenses > 0);
      const hasValidDescription = transaction.description && transaction.description.trim() !== '';

      // Additional validation: ensure date is not a number (which indicates wrong mapping)
      if (transaction.date && typeof transaction.date === 'number') {
        console.warn('CRITICAL: Invalid date format detected, skipping transaction:', transaction);
        continue;
      }

      // Additional validation: ensure description is not a number (which indicates wrong mapping)
      if (transaction.description && !isNaN(parseFloat(transaction.description)) && isFinite(transaction.description)) {
        console.warn('CRITICAL: Description appears to be a number, possible wrong mapping:', transaction);
      }

      // Only add if has essential data
      if (hasValidDate || hasValidAmount || hasValidDescription) {
        transactions.push(transaction);
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
  const mapping = [];

  // CRITICAL FIX: Only get mappings for actual select elements that exist
  selects.forEach((select, index) => {
    const dataIndex = parseInt(select.getAttribute('data-index'));
    if (!isNaN(dataIndex)) {
      mapping[dataIndex] = select.value || '–';
    }
  });

  console.log('CRITICAL: Generated mapping array:', mapping, 'length:', mapping.length);
  return mapping;
}

/**
 * Generate file signature for mapping identification
 */
function generateFileSignature(data, headerMapping) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 'empty-file';
    }

    // Create a simple signature based on structure, not content
    const signature = {
      columnCount: data[0] ? data[0].length : 0,
      rowCount: Math.min(data.length, 5), // Only use first 5 rows
      mapping: headerMapping || []
    };

    // Convert to string and encode safely
    const signatureString = JSON.stringify(signature);

    // Use a simple hash instead of btoa to avoid encoding issues
    let hash = 0;
    for (let i = 0; i < signatureString.length; i++) {
      const char = signatureString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `sig_${Math.abs(hash).toString(36)}`;
  } catch (error) {
    console.error('Error generating file signature:', error);
    // Return a fallback signature
    return `fallback_${Date.now()}`;
  }
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
function clearPreview() {
  console.log("Clearing preview and all temporary data");

  // Reset state
  resetFileState();
  fileInputInProgress = false;

  // Clean up any file input elements
  cleanupExistingFileInputs();
}

/**
 * Auto-detect column types based on headers and sample data
 */
function autoDetectColumns(headers, data, headerRowIndex, dataRowIndex) {
  const mapping = [];

  headers.forEach((header, index) => {
    const sampleData = getSampleData(data, dataRowIndex, index);
    mapping[index] = autoDetectColumn(header, sampleData);
  });

  return mapping;
}

/**
 * Get sample data for a column
 */
function getSampleData(data, dataRowIndex, columnIndex) {
  if (!data || dataRowIndex >= data.length) return 'No data';

  const sampleRows = data.slice(dataRowIndex, Math.min(dataRowIndex + 3, data.length));
  const samples = sampleRows.map(row => row[columnIndex] || '').filter(val => val).slice(0, 2);

  return samples.length > 0 ? samples.join(', ') : 'Empty';
}

// FIXED: Add Excel date detection and conversion functions
function isExcelDate(value) {
  if (!value) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 25000 && num < 100000 && /^\d+(\.\d+)?$/.test(value.toString());
}

function convertExcelDate(excelDate) {
  try {
    const num = parseFloat(excelDate);
    if (isNaN(num)) return excelDate;

    // Excel date conversion (Excel epoch starts 1900-01-01, but with leap year bug)
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error converting Excel date:', error);
    return excelDate;
  }
}
