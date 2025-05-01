import { handleFileUpload, generateFileSignature, excelDateToJSDate } from "./fileHandler.js";
import { saveHeadersAndFormat, getMappingBySignature, renderMappingList, deleteMapping } from "./mappingsManager.js";
import { showElement, hideElement, showToast, toggleDarkMode, initializeDragAndDrop } from "./uiManager.js";
import { renderTransactions, updateTransactions, applyFilters } from "./transactionManager.js";
import { renderCategoryList, openEditCategoriesModal } from "./categoryManager.js";
import { updateChart } from "./chartManager.js";
import { HEADERS } from "./constants.js";
import { AppState, saveMergedFiles, resetFileState } from "./appState.js";
import { exportMergedFilesAsCSV } from "./exportManager.js";

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

  document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    const filters = {
      startDate: document.getElementById("filterStartDate").value,
      endDate: document.getElementById("filterEndDate").value,
      category: document.getElementById("filterCategory").value,
      minAmount: parseFloat(document.getElementById("filterMinAmount").value),
      maxAmount: parseFloat(document.getElementById("filterMaxAmount").value),
    };
    applyFilters(filters);
  });

  initializeDragAndDrop(onFileUpload); // Initialize drag-and-drop

  loadMergedFiles();
  renderCategoryList();
  renderMappingList();
  updateTransactions();
});

// Update the addMergedFile function

window.addMergedFile = function (data, mapping, name, signature) {
  const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;
  const headerRowIndex = parseInt(document.getElementById("headerRowInput").value, 10) - 1;

  if (AppState.mergedFiles.some(f => f.signature === signature)) {
    showToast("This file is already merged.", "error");
    return;
  }

  // Create a clean copy of mapping to avoid reference issues
  const cleanMapping = [...mapping];
  
  // Log the mapping and data for debugging
  console.log("Original mapping:", mapping);
  console.log("Header row:", data[headerRowIndex]);
  console.log("Data row:", data[dataRowIndex]);
  
  // Create processed data - only include columns with valid headers
  const processedData = data.slice(dataRowIndex).map(row => {
    return row.map((cell, i) => {
      // Convert Excel dates in Date columns
      if (cleanMapping[i] === "Date" && !isNaN(parseFloat(cell)) && 
          parseFloat(cell) > 30000 && parseFloat(cell) < 50000) {
        const excelDate = parseFloat(cell);
        return excelDateToJSDate(excelDate);
      }
      return cell;
    }).filter((_, i) => cleanMapping[i] !== "–");
  });
  
  // Only include mappings for columns we're keeping
  const processedMapping = cleanMapping.filter(header => header !== "–");
  
  console.log("Processed mapping:", processedMapping);
  console.log("Sample processed data:", processedData.slice(0, 2));

  const merged = {
    fileName: name,
    headerMapping: processedMapping,
    data: processedData,
    dataRow: dataRowIndex,
    headerRow: headerRowIndex,
    signature,
    selected: true,
  };

  console.log("Adding merged file:", merged);
  AppState.mergedFiles.push(merged);
  saveMergedFiles();
  
  // Update the UI components in the correct order
  renderMergedFiles();
  renderMappingList(); // This ensures format mappings are displayed immediately
  updateTransactions(); // This updates the transactions table
  
  showToast("File merged successfully!", "success");
};

// Special handling for XML files in file upload
function onFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("Uploading file:", file.name);

  // After checking the file extension:
  const isXml = file.name.toLowerCase().endsWith('.xml');

  handleFileUpload(file)
    .then(data => {
      console.log("Parsed file data:", data);

      if (!data || data.length === 0) {
        showToast("No valid data found in the file.", "error");
        return;
      }

      AppState.currentFileData = data;
      AppState.currentFileName = file.name;
      
      // Generate a preliminary signature based on file structure
      AppState.currentFileSignature = generateFileSignature(file.name, data);

      if (!AppState.currentFileSignature.structureSig) {
        showToast("Failed to process the file. Please try again.", "error");
        return;
      }

      // Generate mapping suggestions
      AppState.currentSuggestedMapping = suggestMapping(data);

      // Check if we have an existing mapping that matches this file structure
      const existingMapping = getMappingBySignature(AppState.currentFileSignature);
      if (existingMapping) {
        console.log("Found matching format signature:", AppState.currentFileSignature);
        
        // Double-check that the structure really matches by comparing column count
        const headerCount = data[0].length;
        if (existingMapping.length === headerCount) {
          console.log("Auto-merging with saved mapping:", existingMapping);
          window.addMergedFile(data, existingMapping, file.name, AppState.currentFileSignature);
          showToast("Auto-merged using saved header mapping.", "success");
          return;
        } else {
          console.log("Column count mismatch. Format found but not applied.");
        }
      } else {
        console.log("No matching format found. User needs to define mapping.");
      }

      showElement("rowSelectionPanel");
      showElement("saveHeadersBtn");
      showElement("clearPreviewBtn");
      
      // For XML files, default to the same row for header and data
      // if that's how the structure is
      if (isXml) {
        document.getElementById("headerRowInput").value = "1";
        document.getElementById("dataRowInput").value = "1";
      }

      // Initialize row validation
      addRowInputValidation(data);
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

  // Track if we've already found a Date column
  let dateColumnFound = false;
  
  return headers.map((cell, i) => {
    // Check header text first
    const headerText = (cell || "").toString().toLowerCase();
    
    // Comprehensive check for date-related headers
    if (!dateColumnFound && (
        headerText.includes("date") || 
        headerText.includes("time") || 
        headerText.includes("день") ||  // Russian
        headerText.includes("fecha") ||  // Spanish
        headerText.includes("data"))) {   // Portuguese/Italian
      dateColumnFound = true;
      return "Date";
    }
    
    // Check for expense-related headers
    if (headerText.includes("expense") || 
        headerText.includes("cost") || 
        headerText.includes("payment") ||
        headerText.includes("支出") ||       // Chinese
        headerText.includes("gasto") ||     // Spanish
        headerText.includes("ausgabe")) {  // German
      return "Expenses";
    }
    
    // Check for income-related headers  
    if (headerText.includes("income") || 
        headerText.includes("revenue") || 
        headerText.includes("earning") ||
        headerText.includes("收入") ||      // Chinese
        headerText.includes("ingreso") ||  // Spanish
        headerText.includes("einkommen")) {  // German
      return "Income";
    }
    
    // Check for description-related headers
    if (headerText.includes("desc") || 
        headerText.includes("detail") || 
        headerText.includes("note") ||
        headerText.includes("memo") ||
        headerText.includes("text") ||
        headerText.includes("descrip")) {
      return "Description";
    }

    // Sample data analysis - examine a few rows
    const sampleSize = Math.min(5, data.length - 1);
    const sample = data.slice(1, 1 + sampleSize)
      .map(row => i < row.length ? row[i] : null)
      .filter(Boolean);
    
    if (sample.length === 0) return "Description"; // Default if no samples
    
    // First check for date patterns before Excel dates
    // Date string pattern detection - more comprehensive
    const datePatterns = [
      /^\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}$/,  // yyyy-mm-dd, yyyy/mm/dd
      /^\d{1,2}[-/\.]\d{1,2}[-/\.]\d{4}$/,   // dd-mm-yyyy, mm-dd-yyyy
      /^\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2}$/,   // dd-mm-yy, mm-dd-yy
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/         // m/d/yyyy or mm/dd/yy
    ];
    
    if (!dateColumnFound && sample.some(v => {
      const str = String(v || '');
      return datePatterns.some(pattern => pattern.test(str));
    })) {
      console.log("Detected date string pattern for column", i);
      dateColumnFound = true;
      return "Date";
    }
    
    // Excel date detection - more comprehensive check
    if (!dateColumnFound && sample.every(v => !isNaN(parseFloat(v)))) {
      const numbers = sample.map(v => parseFloat(v));
      
      // Excel dates are typically between 36500-50000
      if (numbers.every(n => n > 36500 && n < 50000)) {
        console.log("Detected Excel date format for column", i, "with values", numbers);
        dateColumnFound = true;
        return "Date";
      }
      
      // Check for monetary values - look for decimal points (very common in money values)
      const hasDecimals = sample.some(v => String(v).includes('.'));
      
      // If values have decimal points, they're likely monetary
      if (hasDecimals) {
        // Determine if income or expenses
        if (numbers.every(n => n >= 0)) return "Income";
        if (numbers.every(n => n <= 0)) return "Expenses";
        // Mix of positive and negative could be either - check which is more common
        const positiveCount = numbers.filter(n => n >= 0).length;
        const negativeCount = numbers.filter(n => n < 0).length;
        return positiveCount >= negativeCount ? "Income" : "Expenses";
      }
      
      // Regular number check if no decimals
      if (numbers.every(n => n >= 0)) return "Income";
      if (numbers.every(n => n < 0)) return "Expenses";
    }
    
    // Check if the values look like text descriptions
    const hasWords = sample.some(v => {
      const str = String(v || '');
      return /[a-zA-Z]{3,}/.test(str); // At least 3 letters in a row
    });
    
    if (hasWords) {
      return "Description";
    }
    
    // Default to Description for text content
    return "Description";
  });
}

// Add these validation functions

// Update validation for header/data rows

function validateRowIndices(data) {
  const headerRowInput = document.getElementById("headerRowInput");
  const dataRowInput = document.getElementById("dataRowInput");
  
  const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
  const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;
  
  let isValid = true;
  
  // Check header row is valid
  if (headerRowIndex < 0 || headerRowIndex >= data.length) {
    headerRowInput.style.borderColor = "red";
    isValid = false;
  } else {
    headerRowInput.style.borderColor = "";
  }
  
  // Check data row is valid
  if (dataRowIndex < 0 || dataRowIndex >= data.length) {
    dataRowInput.style.borderColor = "red";
    isValid = false;
  } else {
    dataRowInput.style.borderColor = "";
  }
  
  // Check that data row is after header row (except for XML files)
  const isXmlFile = AppState.currentFileName && 
                   AppState.currentFileName.toLowerCase().endsWith('.xml');
  
  if (!isXmlFile && dataRowIndex <= headerRowIndex) {
    dataRowInput.style.borderColor = "red";
    isValid = false;
  }
  
  return isValid;
}

// Update the event listeners for row inputs
function addRowInputValidation(data) {
  document.getElementById("headerRowInput").addEventListener("change", () => {
    if (validateRowIndices(data)) {
      renderHeaderPreview(data);
    } else {
      showToast("Please enter valid row numbers. Data row must be after header row.", "error");
    }
  });
  
  document.getElementById("dataRowInput").addEventListener("change", () => {
    if (validateRowIndices(data)) {
      renderHeaderPreview(data);
    } else {
      showToast("Please enter valid row numbers. Data row must be after header row.", "error");
    }
  });
}

// Update renderHeaderPreview to enforce single column per header type

function renderHeaderPreview(data) {
  const headerRowIndex = parseInt(document.getElementById("headerRowInput").value, 10) - 1;
  const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;

  // Validate row indices
  if (headerRowIndex < 0 || headerRowIndex >= data.length || 
      dataRowIndex < 0 || dataRowIndex >= data.length) {
    showToast("Invalid row index. Please enter valid row numbers.", "error");
    return;
  }

  if (!data[headerRowIndex] || !data[dataRowIndex]) {
    console.error("Invalid header or data row index.");
    showToast("Invalid header or data row index.", "error");
    return;
  }

  const headerRow = data[headerRowIndex];
  const dataRow = data[dataRowIndex];

  // Pre-detect Excel dates to improve suggested mappings
  AppState.currentSuggestedMapping = AppState.currentSuggestedMapping || suggestMapping(data);
  
  // Create a scrollable container for the preview table
  let html = '<div style="width: 100%; overflow-x: auto; margin-bottom: 15px;">';
  html += "<table><thead><tr>";
  headerRow.forEach(cell => (html += `<th>${cell || ""}</th>`));
  html += "</tr><tr>";
  headerRow.forEach((_, i) => {
    html += `<td><select data-index="${i}" class="header-map" onchange="updateHeaderMapping(this, ${i})">`;
    HEADERS.forEach(opt => {
      const sel = AppState.currentSuggestedMapping[i] === opt ? "selected" : "";
      html += `<option value="${opt}" ${sel}>${opt}</option>`;
    });
    html += "</select></td>";
  });
  html += "</tr></thead><tbody><tr>";
  
  // Add visual hints for Excel dates and format numeric values
  dataRow.forEach((cell, i) => {
    let cellDisplay = cell || "";
    
    // Improved Excel date detection and conversion
    if (AppState.currentSuggestedMapping[i] === "Date") {
      if (typeof cell === 'number' || 
          (!isNaN(parseFloat(cell)) && 
           parseFloat(cell) > 36500 && parseFloat(cell) < 50000)) {
        // Convert Excel date to human-readable date
        const excelDate = parseFloat(cell);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        const formattedDate = jsDate.toISOString().split('T')[0];
        cellDisplay = formattedDate;
      }
    }
    // Format numbers with decimal places for better readability
    else if ((AppState.currentSuggestedMapping[i] === "Income" || 
              AppState.currentSuggestedMapping[i] === "Expenses") && 
             !isNaN(parseFloat(cell))) {
      cellDisplay = parseFloat(cell).toFixed(2);
    }
    
    html += `<td>${cellDisplay}</td>`;
  });
  
  html += "</tr></tbody></table></div>";
  html += '<div class="mapping-hint">Note: Only one column can be mapped to each header type (Date, Income, Expenses)</div>';

  document.getElementById("previewTable").innerHTML = html;
  
  // Add window function to handle header mapping changes
  window.updateHeaderMapping = function(select, index) {
    const newValue = select.value;
    
    // Reset all borders first
    document.querySelectorAll(".header-map").forEach(el => {
      el.style.borderColor = "";
    });
    
    let hasDuplicates = false;
    
    // Check if this header type is already in use elsewhere
    if (newValue !== "–" && newValue !== "Description") {
      const duplicateIndices = [];
      
      AppState.currentSuggestedMapping.forEach((mapping, i) => {
        if (i !== index && mapping === newValue) {
          duplicateIndices.push(i);
        }
      });
      
      if (duplicateIndices.length > 0) {
        // Show warning
        showToast(`Only one column can be mapped as "${newValue}". Please resolve duplicate mappings.`, "warning");
        
        // Highlight all duplicates with red border
        duplicateIndices.forEach(i => {
          const dropdown = document.querySelector(`.header-map[data-index="${i}"]`);
          if (dropdown) {
            dropdown.style.borderColor = "red";
          }
        });
        
        // Highlight the current selection too
        select.style.borderColor = "red";
        hasDuplicates = true;
      }
    }
    
    // Update the current mapping regardless
    AppState.currentSuggestedMapping[index] = newValue;
    
    // Update the save button state
    const saveButton = document.getElementById("saveHeadersBtn");
    if (saveButton) {
      saveButton.disabled = hasDuplicates;
      if (hasDuplicates) {
        saveButton.title = "Please resolve duplicate header mappings";
      } else {
        saveButton.title = "";
      }
    }
  };

  // Call updateHeaderMapping once to check for initial duplicates
  setTimeout(() => {
    checkForDuplicateHeaders();
  }, 100);
}

// Add a new function to check for duplicate headers
function checkForDuplicateHeaders() {
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
  
  // Update the save button state
  const saveButton = document.getElementById("saveHeadersBtn");
  if (saveButton) {
    saveButton.disabled = hasDuplicates;
    if (hasDuplicates) {
      saveButton.title = "Please resolve duplicate header mappings";
      showToast("Found duplicate header mappings. Please assign unique headers.", "warning");
    } else {
      saveButton.title = "";
    }
  }
}

function onSaveHeaders() {
  const selects = document.querySelectorAll(".header-map");
  const mapping = Array.from(selects).map(sel => sel.value);
  
  // Generate the signature AFTER the user has mapped the headers
  // This ensures the signature reflects the user's chosen structure
  const finalSignature = generateFileSignature(
    AppState.currentFileName, 
    AppState.currentFileData, 
    mapping
  );
  
  // Save the mapping with the new signature
  saveHeadersAndFormat(finalSignature, mapping);
  
  // Add merged file with the new signature
  window.addMergedFile(
    AppState.currentFileData, 
    mapping, 
    AppState.currentFileName, 
    finalSignature.mappingSig || finalSignature.structureSig
  );

  clearPreview();
  showToast("File saved and merged.", "success");
}

function clearPreview() {
  resetFileState();
  hideElement("rowSelectionPanel");
  hideElement("saveHeadersBtn");
  hideElement("clearPreviewBtn");
  document.getElementById("previewTable").innerHTML = "";
}

export function renderMergedFiles() {
  const list = document.getElementById("mergedFilesList");
  list.innerHTML = "";

  (AppState.mergedFiles || []).forEach((file, i) => {
    const li = document.createElement("li");
    li.textContent = file.fileName;

    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.onclick = () => {
      AppState.mergedFiles.splice(i, 1);
      saveMergedFiles();
      renderMergedFiles();
      updateTransactions();
      showToast("File removed.", "success");
    };

    li.appendChild(btn);
    list.appendChild(li);
  });

  if (AppState.mergedFiles.length === 0) {
    AppState.transactions = [];
    renderTransactions([]);
  }
}

function loadMergedFiles() {
  AppState.mergedFiles = JSON.parse(localStorage.getItem("mergedFiles") || "[]");
  renderMergedFiles();
}

function toggleMergedFilesVisibility() {
  const section = document.getElementById("mergedFilesSection");
  section.classList.toggle("minimized");
}
