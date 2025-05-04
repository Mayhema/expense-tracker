import { handleFileUpload, generateFileSignature, excelDateToJSDate } from "./fileHandler.js";
import { saveHeadersAndFormat, getMappingBySignature, renderMappingList, deleteMapping } from "./mappingsManager.js";
import { showElement, hideElement, showToast, toggleDarkMode, initializeDragAndDrop } from "./uiManager.js";
import { renderTransactions, updateTransactions, applyFilters } from "./transactionManager.js";
import { renderCategoryList, openEditCategoriesModal } from "./categoryManager.js";
import { HEADERS } from "./constants.js";
import { AppState, saveMergedFiles, resetFileState } from "./appState.js";
import { exportMergedFilesAsCSV } from "./exportManager.js";
import { updateCharts, resetCharts, toggleExpenseChart, toggleTimelineChart } from "./charts/chartManager.js";


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

  // Replace the debugChartsBtn event listener

  document.getElementById("debugChartsBtn").addEventListener("click", () => {
    // Target the section containing charts instead of a non-existent "charts" element
    const chartSection = document.querySelector("#expenseChart").parentNode;
    if (chartSection) {
      chartSection.classList.toggle("debug-mode");
      console.log("Chart debug mode toggled");
      showToast("Chart debug mode toggled", "info");
      
      // Force refresh charts when debug mode is toggled
      setTimeout(() => {
        if (AppState.transactions && AppState.transactions.length) {
          resetCharts(); // Reset charts first
          setTimeout(() => updateCharts(AppState.transactions), 100); // Then update with fresh data
        }
      }, 200);
    }
  });

  initializeDragAndDrop(onFileUpload); // Initialize drag-and-drop

  loadMergedFiles();
  renderCategoryList();
  renderMappingList();
  updateTransactions();

  document.getElementById("toggleExpenseChartBtn").addEventListener("click", () => {
    console.log("Toggle expense chart clicked");
    try {
      const enabled = toggleExpenseChart();
      console.log(`Expense chart ${enabled ? 'enabled' : 'disabled'}`);
      showToast(`Expense chart ${enabled ? 'enabled' : 'disabled'}`, "info");
    } catch (error) {
      console.error("Error toggling expense chart:", error);
      showToast("Failed to toggle expense chart", "error");
    }
  });

  document.getElementById("toggleTimelineChartBtn").addEventListener("click", () => {
    console.log("Toggle timeline chart clicked");
    try {
      const enabled = toggleTimelineChart();
      console.log(`Timeline chart ${enabled ? 'enabled' : 'disabled'}`);
      showToast(`Timeline chart ${enabled ? 'enabled' : 'disabled'}`, "info");
    } catch (error) {
      console.error("Error toggling timeline chart:", error);
      showToast("Failed to toggle timeline chart", "error");
    }
  });

  // Add this at the bottom of the DOMContentLoaded handler
  
  // Set up deleteAllMappingsBtn with single event listener
  const deleteAllBtn = document.getElementById("deleteAllMappingsBtn");
  if (deleteAllBtn) {
    // Clean up any existing listeners
    const newBtn = deleteAllBtn.cloneNode(true);
    deleteAllBtn.parentNode.replaceChild(newBtn, deleteAllBtn);
    
    // Add a single event listener
    newBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all Format Mappings?")) {
        localStorage.removeItem("fileFormatMappings");
        renderMappingList();
        AppState.mergedFiles = [];
        saveMergedFiles();
        renderMergedFiles();
        updateTransactions();
        showToast("All format mappings have been deleted.", "success");
      }
    });
  }

  // Add to your DOMContentLoaded event handler

  document.getElementById("resetChartsBtn").addEventListener("click", () => {
    console.log("Resetting charts");
    resetCharts();
    showToast("Charts reset successfully", "info");
    
    // Update charts with current data after reset
    setTimeout(() => {
      if (AppState.transactions && AppState.transactions.length) {
        updateCharts(AppState.transactions);
      }
    }, 300);
  });
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
  
  // Create map of which columns to keep and their types
  const columnMap = {};
  cleanMapping.forEach((headerType, index) => {
    if (headerType !== "–") {
      columnMap[index] = headerType;
    }
  });
  
  // Create processed data - only include columns with valid headers
  const processedData = data.slice(dataRowIndex).map(row => {
    const processedRow = [];
    Object.entries(columnMap).forEach(([origIndex, headerType]) => {
      const colIndex = parseInt(origIndex, 10);
      let cellValue = colIndex < row.length ? row[colIndex] : '';
      
      // Convert Excel dates in Date columns
      if (headerType === "Date" && !isNaN(parseFloat(cellValue)) && 
          parseFloat(cellValue) > 30000 && parseFloat(cellValue) < 50000) {
        const excelDate = parseFloat(cellValue);
        cellValue = excelDateToJSDate(excelDate);
      }
      
      processedRow.push(cellValue);
    });
    return processedRow;
  });
  
  // Only include mappings for columns we're keeping
  const processedMapping = Object.values(columnMap);
  
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

// Update the suggestMapping function

function suggestMapping(data) {
  if (!data || !data.length || !data[0]) {
    return [];
  }
  
  const headers = data[0];
  let dateColumnFound = false;
  let incomeColumnFound = false;
  let expensesColumnFound = false;
  
  // First pass - check headers for obvious matches
  const initialMapping = headers.map((cell, i) => {
    const headerText = (cell || "").toString().toLowerCase().trim();
    
    // Date detection in headers
    if (!dateColumnFound && (
        headerText.includes("date") || 
        headerText.includes("day") ||
        headerText.includes("time") || 
        headerText.includes("תאריך"))) { // Hebrew word for date
      dateColumnFound = true;
      return "Date";
    }
    
    // Expense detection in headers
    if (!expensesColumnFound && (
        headerText.includes("expense") || 
        headerText.includes("debit") || 
        headerText.includes("cost") ||
        headerText.includes("payment") ||
        headerText.includes("out") ||
        headerText.includes("חובה"))) { // Hebrew word for debit/expense
      expensesColumnFound = true;
      return "Expenses";
    }
    
    // Income detection in headers
    if (!incomeColumnFound && (
        headerText.includes("income") || 
        headerText.includes("credit") || 
        headerText.includes("deposit") ||
        headerText.includes("revenue") ||
        headerText.includes("in") ||
        headerText.includes("זכות"))) { // Hebrew word for credit/income
      incomeColumnFound = true;
      return "Income";
    }
    
    // Description detection in headers
    if (headerText.includes("desc") || 
        headerText.includes("note") || 
        headerText.includes("memo") ||
        headerText.includes("text") ||
        headerText.includes("detail") ||
        headerText.includes("תאור") ||    // Hebrew word for description
        headerText.includes("פרטים")) {   // Hebrew word for details
      return "Description";
    }
    
    return null; // Placeholder to be filled in second pass
  });
  
  // Get some data samples for analysis
  const sampleRows = Math.min(5, data.length - 1);
  const samples = [];
  
  for (let i = 1; i <= sampleRows; i++) {
    if (i < data.length) {
      samples.push(data[i]);
    }
  }
  
  // Second pass - analyze the data in each column
  return initialMapping.map((mapping, colIndex) => {
    // If we already have a mapping from header detection, keep it
    if (mapping) return mapping;
    
    // Get column values from samples
    const columnValues = samples.map(row => 
      colIndex < row.length ? row[colIndex] : null
    ).filter(Boolean);
    
    if (columnValues.length === 0) return "–";
    
    // Only try to detect another date column if we don't already have one
    if (!dateColumnFound) {
      // Excel date detection
      const numberValues = columnValues.filter(v => 
        !isNaN(parseFloat(v)) && isFinite(v)
      ).map(v => parseFloat(v));
      
      if (numberValues.length > 0 && 
          numberValues.some(n => n > 35000 && n < 50000)) {
        console.log("Found potential Excel date column:", colIndex, numberValues);
        dateColumnFound = true;
        return "Date";
      }
      
      // Text date patterns detection
      const datePatterns = [
        /\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}/,  // DD/MM/YYYY or MM/DD/YYYY
        /\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}/     // YYYY/MM/DD
      ];
      
      if (columnValues.some(v => {
        const str = String(v);
        return datePatterns.some(pattern => pattern.test(str));
      })) {
        console.log("Found text date patterns in column:", colIndex);
        dateColumnFound = true;
        return "Date";
      }
    }
    
    // Check for monetary values and assign as income or expenses if not already found
    if (!incomeColumnFound || !expensesColumnFound) {
      // Check for monetary values (often contain decimal points)
      const numberValues = columnValues.filter(v => 
        !isNaN(parseFloat(v)) && isFinite(v)
      ).map(v => parseFloat(v));
      
      if (numberValues.length > 0) {
        // If all values are negative or zero, likely expenses
        if (!expensesColumnFound && numberValues.every(n => n <= 0)) {
          expensesColumnFound = true;
          return "Expenses";
        }
        
        // If all values are positive or zero, likely income
        if (!incomeColumnFound && numberValues.every(n => n >= 0)) {
          incomeColumnFound = true;
          return "Income";
        }
      }
    }
    
    // Check for text content (likely descriptions)
    if (columnValues.some(v => 
      typeof v === 'string' && 
      v.length > 3 && 
      // Include Latin and Hebrew character ranges
      /[a-zA-Z\u0590-\u05FF]{3,}/.test(v))) {
      return "Description";
    }
    
    // Default to placeholder for anything else
    return "–";
  });
}

// Add these validation functions

// Replace the row validation functions

function validateRowIndices(data) {
  const headerRowInput = document.getElementById("headerRowInput");
  const dataRowInput = document.getElementById("dataRowInput");
  
  const headerRowIndex = parseInt(headerRowInput.value, 10) - 1;
  const dataRowIndex = parseInt(dataRowInput.value, 10) - 1;
  
  let isValid = true;
  let errorMessages = [];
  
  // Check header row is valid
  if (isNaN(headerRowIndex) || headerRowIndex < 0 || headerRowIndex >= data.length) {
    headerRowInput.style.borderColor = "red";
    errorMessages.push("Header row must be between 1 and " + data.length);
    isValid = false;
  } else {
    headerRowInput.style.borderColor = "";
  }
  
  // Check data row is valid
  if (isNaN(dataRowIndex) || dataRowIndex < 0 || dataRowIndex >= data.length) {
    dataRowInput.style.borderColor = "red";
    errorMessages.push("Data row must be between 1 and " + data.length);
    isValid = false;
  } else {
    dataRowInput.style.borderColor = "";
  }
  
  // Check that data row is after header row (except for XML files)
  const isXmlFile = AppState.currentFileName && 
                   AppState.currentFileName.toLowerCase().endsWith('.xml');
  
  if (!isXmlFile && dataRowIndex <= headerRowIndex) {
    dataRowInput.style.borderColor = "red";
    errorMessages.push("Data row must be after header row");
    isValid = false;
  }
  
  if (errorMessages.length > 0) {
    showToast(errorMessages.join(". "), "error");
  }
  
  return isValid;
}

// Complete the addRowInputValidation function

function addRowInputValidation(data) {
  // Use input event instead of change for more responsive validation
  document.getElementById("headerRowInput").addEventListener("input", () => {
    // Apply validation with slight delay to let user finish typing
    setTimeout(() => {
      if (validateRowIndices(data)) {
        // Re-run suggestion mapping with new row indices
        AppState.currentSuggestedMapping = suggestMapping(data);
        renderHeaderPreview(data);
      }
    }, 300);
  });
  
  document.getElementById("dataRowInput").addEventListener("input", () => {
    setTimeout(() => {
      if (validateRowIndices(data)) {
        AppState.currentSuggestedMapping = suggestMapping(data);
        renderHeaderPreview(data);
      }
    }, 300);
  });
}

// Update renderHeaderPreview to enforce single column per header type

// Replace the renderHeaderPreview function 

function renderHeaderPreview(data) {
  const headerRowIndex = parseInt(document.getElementById("headerRowInput").value, 10) - 1;
  const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;

  console.log("Rendering header preview with rows:", headerRowIndex, dataRowIndex);

  // Validate indices
  if (headerRowIndex < 0 || headerRowIndex >= data.length || 
      dataRowIndex < 0 || dataRowIndex >= data.length) {
    showToast("Invalid row index. Please enter valid row numbers.", "error");
    return;
  }

  const headerRow = data[headerRowIndex] || [];
  const dataRow = data[dataRowIndex] || [];

  console.log("Header row:", headerRow);
  console.log("Data row:", dataRow);

  // When row indices change, update suggestions
  AppState.currentSuggestedMapping = suggestMapping(data);
  console.log("Updated mapping suggestions:", AppState.currentSuggestedMapping);
  
  // Create scrollable preview table
  let html = '<div style="width: 100%; overflow-x: auto; margin-bottom: 15px;">';
  html += "<table><thead><tr>";
  
  // Add header row
  headerRow.forEach(cell => (html += `<th>${cell || ""}</th>`));
  html += "</tr><tr>";
  
  // Add mapping dropdowns
  headerRow.forEach((_, i) => {
    html += `<td><select data-index="${i}" class="header-map" onchange="updateHeaderMapping(this, ${i})">`;
    HEADERS.forEach(opt => {
      const sel = AppState.currentSuggestedMapping[i] === opt ? "selected" : "";
      html += `<option value="${opt}" ${sel}>${opt}</option>`;
    });
    html += "</select></td>";
  });
  html += "</tr></thead><tbody><tr>";
  
  // Add sample data row with formatted values
  dataRow.forEach((cell, i) => {
    let cellDisplay = cell || "";
    const mapping = AppState.currentSuggestedMapping[i];
    
    // Improved Excel date detection and display
    if (mapping === "Date") {
      // Check if it's a number that could be an Excel date
      if (typeof cell === 'number' || (!isNaN(parseFloat(cell)) && isFinite(cell))) {
        const numValue = parseFloat(cell);
        // Excel dates are typically in this range
        if (numValue > 30000 && numValue < 50000) {
          try {
            const jsDate = new Date((numValue - 25569) * 86400 * 1000);
            const formattedDate = jsDate.toISOString().split('T')[0];
            cellDisplay = formattedDate; // Clean display without the original number
            console.log(`Converted Excel date ${cell} to ${formattedDate}`);
          } catch (e) {
            console.error("Error converting Excel date:", e);
            cellDisplay = `${cell} (Invalid date)`;
          }
        }
      }
    }
    // Format numbers for monetary values
    else if ((mapping === "Income" || mapping === "Expenses") && 
              !isNaN(parseFloat(cell))) {
      cellDisplay = parseFloat(cell).toFixed(2);
    }
    
    html += `<td>${cellDisplay}</td>`;
  });
  
  html += "</tr></tbody></table></div>";
  html += '<div class="mapping-hint">Note: Only one column can be mapped to each header type (Date, Income, Expenses).</div>';

  document.getElementById("previewTable").innerHTML = html;
  
  // Setup header mapping change handler
  window.updateHeaderMapping = function(select, index) {
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
  };
  
  // Check for initial duplicates immediately
  checkForDuplicateHeaders();
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

// Export the renderMergedFiles function
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

// Add at the end of the file

window.debugLastFileMapping = function() {
  if (AppState.mergedFiles.length === 0) {
    console.log("No merged files available");
    return;
  }
  
  const lastFile = AppState.mergedFiles[AppState.mergedFiles.length - 1];
  
  console.log("Last file mapping debug info:");
  console.log("File name:", lastFile.fileName);
  console.log("Header mapping:", lastFile.headerMapping);
  
  // Show a sample of data rows
  console.log("Data sample:");
  lastFile.data.slice(0, 3).forEach((row, i) => {
    const mappedRow = {};
    lastFile.headerMapping.forEach((header, j) => {
      if (j < row.length) {
        mappedRow[header] = row[j];
      }
    });
    console.log(`Row ${i}:`, mappedRow);
  });
  
  // Analyze the transactions created from this file
  const fileTransactions = AppState.transactions.filter(tx => tx.fileName === lastFile.fileName);
  console.log(`Transactions from this file: ${fileTransactions.length}`);
  console.log("Sample transactions:", fileTransactions.slice(0, 3));
}

// Add to the end of the file

window.inspectTransactionData = function() {
  const debugDiv = document.createElement('div');
  debugDiv.id = 'transactionDebug';
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = '50%';
  debugDiv.style.left = '50%';
  debugDiv.style.transform = 'translate(-50%, -50%)';
  debugDiv.style.backgroundColor = '#fff';
  debugDiv.style.border = '1px solid #ccc';
  debugDiv.style.padding = '20px';
  debugDiv.style.zIndex = '1000';
  debugDiv.style.maxHeight = '80vh';
  debugDiv.style.overflow = 'auto';
  debugDiv.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
  
  let html = `
    <h2>Transaction Debug</h2>
    <p>${AppState.transactions.length} transactions found</p>
  `;
  
  // Show file info
  html += `<h3>Files:</h3><ul>`;
  AppState.mergedFiles.forEach(file => {
    html += `<li>
      <strong>${file.fileName}</strong>: 
      ${file.headerMapping.join(', ')}
    </li>`;
  });
  html += `</ul>`;
  
  // Show transaction samples
  html += `<h3>Sample Transactions:</h3><table border="1">
    <tr><th>Date</th><th>Description</th><th>Category</th><th>Income</th><th>Expenses</th><th>Source</th></tr>
  `;
  
  AppState.transactions.slice(0, 5).forEach(tx => {
    html += `<tr>
      <td>${tx.date || ''}</td>
      <td>${tx.description || ''}</td>
      <td>${tx.category || ''}</td>
      <td>${tx.income || ''}</td>
      <td>${tx.expenses || ''}</td>
      <td>${tx.fileName}</td>
    </tr>`;
  });
  
  html += `</table>
    <button id="closeDebugBtn">Close</button>
  `;
  
  debugDiv.innerHTML = html;
  document.body.appendChild(debugDiv);
  
  document.getElementById('closeDebugBtn').addEventListener('click', () => {
    debugDiv.remove();
  });
};

// Add a debug button to the header
document.getElementById("fileUploadBtn").addEventListener("dblclick", () => {
  window.inspectTransactionData();
});
