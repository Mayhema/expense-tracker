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
  // Prevent multiple file inputs
  if (fileInputInProgress) {
    console.log("File input already in progress");
    return null;
  }

  fileInputInProgress = true;

  try {
    // Clean up existing inputs first
    cleanupExistingFileInputs();

    // Create new file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `fileInput_${Date.now()}`;
    fileInput.accept = '.csv,.xlsx,.xls,.xml';
    fileInput.style.display = 'none';

    // Add event listener for file selection
    fileInput.addEventListener('change', handleFileSelection);

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
    fileInputInProgress = false;
    return;
  }

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

/**
 * Show file preview modal with real-time updates
 */
function showFilePreviewModal(data) {
  // Get file extension for specific handling
  const fileExt = AppState.currentFileName ? AppState.currentFileName.split('.').pop().toLowerCase() : '';

  // Create modal content with enhanced structure
  const modalContent = document.createElement('div');
  modalContent.className = 'file-preview-modal';

  modalContent.innerHTML = `
    <div class="preview-content">
      <div class="file-info">
        <h3>📄 ${AppState.currentFileName}</h3>
        <div class="file-stats">
          <span class="stat">📊 ${data.length} rows</span>
          <span class="stat">📑 ${data[0]?.length || 0} columns</span>
          <span class="stat">📁 ${fileExt.toUpperCase()}</span>
        </div>
      </div>

      <div class="row-config-section">
        <h4>📋 Data Structure Configuration</h4>
        <div class="row-config">
          <div class="config-group">
            <label for="headerRowSelect">Header Row:</label>
            <select id="headerRowSelect">
              ${data.map((_, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${index + 1}</option>`).join('')}
            </select>
          </div>
          <div class="config-group">
            <label for="dataRowSelect">Data Starts At Row:</label>
            <select id="dataRowSelect">
              ${data.map((_, index) => `<option value="${index}" ${index === 1 ? 'selected' : ''}>${index + 1}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div id="headerMappingContainer" class="header-mapping-section"></div>
      <div id="previewTableContainer" class="preview-table-section"></div>

      <div class="modal-actions">
        <button id="saveHeadersBtn" class="button primary-btn">Save & Import File</button>
        <button id="cancelPreviewBtn" class="button secondary-btn">Cancel</button>
      </div>
    </div>
  `;

  const modal = showModal({
    title: 'Import File: Column Mapping',
    content: modalContent,
    size: 'xlarge',
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
    const mappingContainer = document.getElementById('headerMappingContainer');

    // Auto-detect column types using FIXED import
    const suggestedMapping = autoDetectColumns(headers, data, headerRowIndex, dataRowIndex);

    // Render header mapping interface as a proper table
    let html = `
      <h4>🎯 Column Mapping</h4>
      <div class="mapping-table-container">
        <table class="mapping-table">
          <thead>
            <tr>
              <th>File Column</th>
              <th>Sample Data</th>
              <th>Map To Field</th>
            </tr>
          </thead>
          <tbody>
    `;

    headers.forEach((header, index) => {
      const sampleData = getSampleData(data, dataRowIndex, index);
      const suggested = suggestedMapping[index] || '–';

      html += `
        <tr>
          <td class="column-header">
            <strong>${header || `Column ${index + 1}`}</strong>
          </td>
          <td class="sample-data">
            <em>${sampleData}</em>
          </td>
          <td class="mapping-select-cell">
            <select class="header-select" data-index="${index}">
              <option value="–" ${suggested === '–' ? 'selected' : ''}>– Ignore –</option>
              ${TRANSACTION_FIELDS.map(field =>
        `<option value="${field}" ${suggested === field ? 'selected' : ''}>${field}</option>`
      ).join('')}
            </select>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    mappingContainer.innerHTML = html;

    // Add change listeners to selects
    document.querySelectorAll('.header-select').forEach(select => {
      select.addEventListener('change', () => {
        updateSaveButtonState();
        updatePreviewTable();
      });
    });

    // Initial preview table render
    updatePreviewTable();
    updateSaveButtonState();
  }

  function updatePreviewTable() {
    const headerRowIndex = parseInt(document.getElementById('headerRowSelect').value);
    const dataRowIndex = parseInt(document.getElementById('dataRowSelect').value);
    const previewContainer = document.getElementById('previewTableContainer');

    if (!previewContainer) return;

    const headers = data[headerRowIndex] || [];
    const mapping = getCurrentMapping();

    // Generate preview table
    let previewHTML = `
      <h4>📋 Data Preview (First 5 rows)</h4>
      <div class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
    `;

    headers.forEach((header, index) => {
      const mappedType = mapping[index] || '–';
      const isMapped = mappedType !== '–';
      previewHTML += `
        <th class="${isMapped ? 'mapped-column' : 'unmapped-column'}">
          <div class="column-header">
            <span class="original-name">${header}</span>
            ${isMapped ? `<span class="mapped-to">→ ${mappedType}</span>` : '<span class="ignored">Ignored</span>'}
          </div>
        </th>
      `;
    });

    previewHTML += `
            </tr>
          </thead>
          <tbody>
    `;

    // Show first 5 data rows
    const previewRows = data.slice(dataRowIndex, Math.min(dataRowIndex + 5, data.length));
    previewRows.forEach((row) => {
      previewHTML += '<tr>';
      headers.forEach((header, index) => {
        const value = row[index] || '';
        const mappedType = mapping[index] || '–';
        const isMapped = mappedType !== '–';
        previewHTML += `
          <td class="${isMapped ? 'mapped-data' : 'unmapped-data'}">
            ${value}
          </td>
        `;
      });
      previewHTML += '</tr>';
    });

    previewHTML += `
          </tbody>
        </table>
      </div>
    `;

    previewContainer.innerHTML = previewHTML;
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

  // Set up modal event listeners with real-time updates
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

    // CRITICAL FIX: Process transactions with proper field mapping
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

      mapping.forEach((field, colIndex) => {
        if (field && field !== '–' && row[colIndex] !== undefined) {
          let value = row[colIndex];

          // Apply date conversion for Excel date fields
          if (field === 'Date' && typeof value === 'string' && /^\d{5}$/.test(value.trim())) {
            const excelDate = parseFloat(value);
            if (excelDate > 0 && excelDate < 100000) {
              const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
              value = jsDate.toISOString().split('T')[0];
            }
          }

          // Map to lowercase field names to match transaction structure
          const fieldName = field.toLowerCase();
          transaction[fieldName] = value;
        }
      });

      // Convert string numbers to proper numbers
      if (transaction.income && typeof transaction.income === 'string') {
        transaction.income = parseFloat(transaction.income.replace(/[^\d.-]/g, '')) || 0;
      }
      if (transaction.expenses && typeof transaction.expenses === 'string') {
        transaction.expenses = parseFloat(transaction.expenses.replace(/[^\d.-]/g, '')) || 0;
      }

      // Only add if has essential data
      if (transaction.date || transaction.description || transaction.income > 0 || transaction.expenses > 0) {
        transactions.push(transaction);
      }
    }

    console.log(`CRITICAL: Processed ${transactions.length} transactions from file:`, transactions.slice(0, 3));

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

  selects.forEach((select, index) => {
    mapping[index] = select.value || '–';
  });

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

// Convert Excel date number to readable date
function convertExcelDate(excelDate) {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
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
