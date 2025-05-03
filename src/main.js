// Add this at the beginning of your main.js file (before any other code)
// Make sure it's outside any function scope
window.debugMergedFiles = function() {
  console.log("Current merged files:", AppState.mergedFiles);
  
  AppState.mergedFiles.forEach((file, i) => {
    console.log(`File ${i+1}: ${file.fileName}, Signature: ${file.signature}`);
    console.log(`Header mapping:`, file.headerMapping);
    console.log(`Data rows: ${file.data.length}`);
    console.log(`Sample row:`, file.data[1] || "No data rows");
  });
  
  console.log("Current transactions:", AppState.transactions);
};

import { handleFileUpload, generateFileSignature, excelDateToJSDate } from "./fileHandler.js";
import { saveHeadersAndFormat, getMappingBySignature, renderMappingList, deleteMapping } from "./mappingsManager.js";
import { showElement, hideElement, showToast, toggleDarkMode, initializeDragAndDrop } from "./uiManager.js";
import { renderTransactions, updateTransactions, applyFilters } from "./transactionManager.js";
import { renderCategoryList, openEditCategoriesModal } from "./categoryManager.js";
import { updateChart, toggleChartDebugMode, toggleExpenseChart, toggleTimelineChart } from "./chartManager.js";
import { HEADERS } from "./constants.js";
import { AppState, saveMergedFiles, resetFileState } from "./appState.js";
import { exportMergedFilesAsCSV } from "./exportManager.js";

// Add this function near the top of the file, after imports but before other functions
function migrateSignatures() {
  // Get existing merged files
  const mergedFiles = JSON.parse(localStorage.getItem("mergedFiles") || "[]");
  
  // Update each file with new signature format
  const updatedFiles = mergedFiles.map(file => {
    if (!file.formatSig || !file.contentSig) {
      // Generate new signatures
      const signatures = generateFileSignature(file.fileName, file.data, file.headerMapping);
      
      return {
        ...file,
        formatSig: signatures.formatSig,
        contentSig: signatures.contentSig,
        // Keep original signature for compatibility
        signature: file.signature || signatures.contentSig
      };
    }
    return file;
  });
  
  // Save updated files
  localStorage.setItem("mergedFiles", JSON.stringify(updatedFiles));
  
  console.log("Migrated signatures for", updatedFiles.length, "files");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event fired.");
  
  // Add this line at the beginning of the function
  migrateSignatures();
  
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

  document.getElementById("debugChartsBtn").addEventListener("click", () => {
    toggleChartDebugMode();
  });

  initializeDragAndDrop(onFileUpload); // Initialize drag-and-drop

  loadMergedFiles();
  renderCategoryList();
  renderMappingList();
  updateTransactions();
  
  document.getElementById("deleteAllMappingsBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all Format Mappings?")) {
      localStorage.removeItem("fileFormatMappings");
      renderMappingList();
      showToast("All format mappings have been deleted.", "success");
    }
  });

  // Explicitly set up the delete all mappings button with debug logging
  const deleteAllBtn = document.getElementById("deleteAllMappingsBtn");
  if (deleteAllBtn) {
    console.log("Delete All Mappings button found, attaching event listener");
    deleteAllBtn.addEventListener("click", function() {
      console.log("Delete All Mappings button clicked");
      if (confirm("Are you sure you want to delete all Format Mappings?")) {
        console.log("User confirmed deletion");
        
        // Remove format mappings
        localStorage.removeItem("fileFormatMappings");
        
        // Also remove all merged files that depend on these mappings
        AppState.mergedFiles = [];
        saveMergedFiles();
        
        // Update UI
        renderMappingList();
        renderMergedFiles();
        updateTransactions();
        
        showToast("All format mappings and associated files have been deleted.", "success");
      }
    });
  } else {
    console.error("Delete All Mappings button not found in the DOM", document.getElementById("deleteAllMappingsBtn"));
  }

  // Add event listeners for chart toggle buttons
  const toggleExpenseChartBtn = document.getElementById("toggleExpenseChartBtn");
  const toggleTimelineChartBtn = document.getElementById("toggleTimelineChartBtn");
  
  if (toggleExpenseChartBtn) {
    toggleExpenseChartBtn.addEventListener("click", () => {
      const enabled = toggleExpenseChart();
      showToast(`Expense chart ${enabled ? 'enabled' : 'disabled'}`, "info");
    });
  }
  
  if (toggleTimelineChartBtn) {
    toggleTimelineChartBtn.addEventListener("click", () => {
      const enabled = toggleTimelineChart();
      showToast(`Timeline chart ${enabled ? 'enabled' : 'disabled'}`, "info");
    });
  }
});

// Update the addMergedFile function

window.addMergedFile = function(data, headerMapping, fileName, signature) {
  console.log("Adding file to merged files:", fileName);
  
  // Generate comprehensive signatures
  const signatures = generateFileSignature(fileName, data, headerMapping);
  console.log("Generated signatures:", signatures);
  
  // For duplicate check, use contentSig which represents actual file content
  const isDuplicate = AppState.mergedFiles.some(file => {
    const contentMatch = file.contentSig === signatures.contentSig || file.signature === signatures.contentSig;
    const nameMatch = file.fileName === fileName;
    
    // Only consider it a duplicate if BOTH content matches AND name matches
    return contentMatch && nameMatch;
  });
  
  if (isDuplicate) {
    console.log("This exact file is already in the merged files list.");
    showToast("File already exists in your merged files.", "warning");
    return;
  }
  
  // Create a copy of the data to avoid reference issues
  const fileCopy = {
    data: JSON.parse(JSON.stringify(data)),
    headerMapping: [...headerMapping],
    fileName,
    formatSig: signatures.formatSig,  // For format recognition
    contentSig: signatures.contentSig, // For duplicate detection
    mappingSig: signatures.mappingSig, // For header mapping
    structureSig: signatures.structureSig || signatures.formatSig, // For backward compatibility
    signature: signatures.contentSig,  // Legacy field for compatibility
    headerRow: fileName.toLowerCase().endsWith('.xml') ? 0 : 0,
    dataRow: fileName.toLowerCase().endsWith('.xml') ? 0 : 1,
    selected: true
  };
  
  // Add the file
  AppState.mergedFiles.push(fileCopy);
  saveMergedFiles();
  
  // Make sure to call these functions to update the UI
  console.log("About to render merged files list");
  renderMergedFiles();  // This must be called to update the UI
  updateTransactions();
  
  console.log("File added to merged files:", fileName, "with signature:", signatures.contentSig);
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

      if (!AppState.currentFileSignature.structureSig && !AppState.currentFileSignature.formatSig) {
        showToast("Failed to process the file. Please try again.", "error");
        return;
      }

      // Generate mapping suggestions
      AppState.currentSuggestedMapping = suggestMapping(data);

      // Check if we have an existing mapping that matches this file structure
      const existingMapping = getMappingBySignature(
        AppState.currentFileSignature.structureSig || AppState.currentFileSignature.formatSig
      );
      if (existingMapping) {
        console.log("Found matching format signature:", AppState.currentFileSignature);
        
        // Double-check that the structure really matches by comparing column count
        const headerCount = data[0].length;
        if (existingMapping.length === headerCount) {
          console.log("Using existing mapping:", existingMapping);
          
          // Generate signature with the existing mapping - IMPORTANT FIX HERE
          const autoSignature = generateFileSignature(
            AppState.currentFileName,
            AppState.currentFileData,
            existingMapping
          );

          // Use the discovered mapping signature - NOT the file signature
          const signatureToUse = autoSignature.mappingSig || autoSignature.formatSig;
          console.log("Using signature for merged file:", signatureToUse);
          
          // Check if this exact file is already merged - use both name AND content
          const fileContent = JSON.stringify(AppState.currentFileData);
          const isDuplicate = AppState.mergedFiles.some(f => 
            f.fileName === AppState.currentFileName && 
            JSON.stringify(f.data) === fileContent
          );
          
          if (isDuplicate) {
            console.log("This exact file is already in the merged files list.");
            showToast("File already exists in your merged files.", "warning");
            clearPreview();
            return;
          }
          
          // Add the file to merged files with mapping signature
          window.addMergedFile(
            AppState.currentFileData,
            existingMapping,
            AppState.currentFileName,
            signatureToUse
          );
          
          clearPreview();
          showToast("File automatically processed with existing mapping.", "success");
          return;
        } else {
          console.log("Column count mismatch: existing mapping has", existingMapping.length, "but file has", headerCount);
          // Continue with manual mapping
        }
      } else {
        console.log("No matching format found. User needs to define mapping.");
      }

      showElement("rowSelectionPanel");
      showElement("saveHeadersBtn");
      showElement("clearPreviewBtn");
      
      // For XML files, default to the same row for header and data
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

// Enhance the suggestMapping function for better description detection

function suggestMapping(data) {
  if (!data || !data.length || !data[0]) {
    return [];
  }
  
  const headers = data[0];
  const dateColumnIndex = []; // Track multiple potential date columns
  
  // First pass - check headers for obvious matches
  const initialMapping = headers.map((cell, i) => {
    const headerText = (cell || "").toString().toLowerCase().trim();
    
    // Date detection in headers
    if (headerText.includes("date") || 
        headerText.includes("day") ||
        headerText.includes("time")) {
      dateColumnIndex.push(i);
      return "Date";
    }
    
    // Expense detection in headers
    if (headerText.includes("expense") || 
        headerText.includes("debit") || 
        headerText.includes("cost") ||
        headerText.includes("payment") ||
        headerText.includes("out")) {
      return "Expenses";
    }
    
    // Income detection in headers
    if (headerText.includes("income") || 
        headerText.includes("credit") || 
        headerText.includes("deposit") ||
        headerText.includes("revenue") ||
        headerText.includes("in")) {
      return "Income";
    }
    
    // Description detection in headers
    if (headerText.includes("desc") || 
        headerText.includes("note") || 
        headerText.includes("memo") ||
        headerText.includes("text") ||
        headerText.includes("detail")) {
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
    
    // Check for Excel dates (numeric values between 35000-50000)
    const numberValues = columnValues.filter(v => 
      !isNaN(parseFloat(v)) && isFinite(v)
    ).map(v => parseFloat(v));
    
    if (numberValues.length > 0 && 
        dateColumnIndex.length === 0 && // Only if we haven't found a date column yet
        numberValues.some(n => n > 35000 && n < 50000)) {
      console.log("Found potential Excel date column:", colIndex, numberValues);
      dateColumnIndex.push(colIndex);
      return "Date";
    }
    
    // Check for text date patterns
    const datePatterns = [
      /\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}/,  // DD/MM/YYYY or MM/DD/YYYY
      /\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}/     // YYYY/MM/DD
    ];
    
    if (dateColumnIndex.length === 0 && // Only if we haven't found a date column yet
        columnValues.some(v => {
          const str = String(v);
          return datePatterns.some(pattern => pattern.test(str));
        })) {
      console.log("Found text date patterns in column:", colIndex);
      dateColumnIndex.push(colIndex);
      return "Date";
    }
    
    // Check for monetary values (often contain decimal points)
    if (numberValues.length > 0 && columnValues.some(v => String(v).includes('.'))) {
      // Separate positive/negative
      if (numberValues.every(n => n >= 0)) return "Income";
      if (numberValues.every(n => n <= 0)) return "Expenses";
      
      // Mix of positive/negative - go with most common
      const positiveCount = numberValues.filter(n => n >= 0).length;
      const negativeCount = numberValues.filter(n => n < 0).length;
      return positiveCount >= negativeCount ? "Income" : "Expenses";
    }
    
    // Improved description detection for XML
    // Look for text content with certain characteristics
    if (columnValues.some(v => {
      const str = String(v);
      // Check for longer text that looks like descriptions
      return (
        // Longer strings are likely descriptions
        (str.length > 8) || 
        // Strings with spaces are likely descriptions
        (str.includes(' ') && str.length > 5) ||
        // Strings with multiple words
        (str.split(' ').length > 2) ||
        // Strings with special characters typical in descriptions
        (/[,#&\-:]/.test(str)) || 
        // Strings that start with capital letters (proper nouns common in descriptions)
        (/^[A-Z][a-z]/.test(str))
      );
    })) {
      return "Description";
    }
    
    // Default to Description for anything else with content
    return "Description";
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
    
    // Reset all dropdown borders first
    document.querySelectorAll(".header-map").forEach(el => {
      el.style.borderColor = "";
    });
    
    // If selecting Date, Income, or Expenses (not Description or placeholder)
    // check if another column already has this mapping
    if (newValue !== "–" && newValue !== "Description") {
      // Find any existing column with the same mapping
      const existingIndex = AppState.currentSuggestedMapping.findIndex(
        (mapping, i) => i !== index && mapping === newValue
      );
      
      if (existingIndex !== -1) {
        // Change the previous column to placeholder
        AppState.currentSuggestedMapping[existingIndex] = "–";
        // Update the dropdown visually
        const previousDropdown = document.querySelector(`.header-map[data-index="${existingIndex}"]`);
        if (previousDropdown) {
          previousDropdown.value = "–";
        }
        showToast(`Only one column can be mapped as "${newValue}". Previous mapping has been reset.`, "info");
      }
    }
    
    // Update the mapping
    AppState.currentSuggestedMapping[index] = newValue;
    
    // If changing to Date, update preview row with formatted date
    if (newValue === "Date") {
      const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;
      if (dataRowIndex >= 0 && AppState.currentFileData && 
          dataRowIndex < AppState.currentFileData.length) {
        
        const dataRow = AppState.currentFileData[dataRowIndex];
        if (index < dataRow.length) {
          const cell = dataRow[index];
          // Format date for preview
          const previewRow = document.querySelector("#previewTable tbody tr");
          if (previewRow && previewRow.cells[index]) {
            let formattedDate = cell;
            
            // For Excel dates
            if (!isNaN(parseFloat(cell)) && parseFloat(cell) > 30000 && parseFloat(cell) < 50000) {
              try {
                const jsDate = new Date((parseFloat(cell) - 25569) * 86400 * 1000);
                formattedDate = jsDate.toISOString().split('T')[0];
              } catch(e) {
                console.error("Error formatting Excel date:", e);
              }
            }
            
            previewRow.cells[index].textContent = formattedDate;
          }
        }
      }
    }
    
    // Ensure we don't have duplicates
    checkForDuplicateHeaders();
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

// Update the onSaveHeaders function

function onSaveHeaders() {
  // Get the current mapping from the dropdowns
  const selects = document.querySelectorAll(".header-map");
  const mapping = Array.from(selects).map(sel => sel.value);
  
  // Validate the mapping - ensure required fields exist
  const hasDate = mapping.includes("Date");
  const hasAmount = mapping.includes("Income") || mapping.includes("Expenses");
  
  if (!hasDate || !hasAmount) {
    showToast("Please map at least a Date column and either Income or Expenses.", "error");
    return;
  }
  
  // Generate the signature AFTER the user has mapped the headers
  // This ensures the signature reflects the user's chosen structure
  const finalSignature = generateFileSignature(
    AppState.currentFileName, 
    AppState.currentFileData, 
    mapping
  );
  
  console.log("Saving mapping:", mapping);
  console.log("With signature:", finalSignature);
  
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
  const mergedFilesList = document.getElementById("mergedFilesList");
  if (!mergedFilesList) {
    console.error("Could not find mergedFilesList element");
    return;
  }
  
  console.log("Rendering merged files list:", AppState.mergedFiles);
  
  // Clear existing content
  mergedFilesList.innerHTML = '';
  
  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.textContent = "No merged files yet";
    emptyMsg.classList.add("empty-list-message");
    mergedFilesList.appendChild(emptyMsg);
    return;
  }
  
  // Create list items for each merged file
  AppState.mergedFiles.forEach((file, index) => {
    const li = document.createElement("li");
    li.classList.add("merged-file-item");
    
    // Create checkbox for file selection
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = file.selected !== false; // Default to true
    checkbox.addEventListener("change", () => {
      file.selected = checkbox.checked;
      saveMergedFiles();
      updateTransactions();
    });
    
    // File info
    const fileInfo = document.createElement("span");
    fileInfo.textContent = `${file.fileName} (${file.data.length} rows)`;
    fileInfo.classList.add("file-name");
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.classList.add("icon-button");
    deleteBtn.title = "Remove file";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Remove ${file.fileName} from merged files?`)) {
        AppState.mergedFiles.splice(index, 1);
        saveMergedFiles();
        renderMergedFiles();
        updateTransactions();
      }
    });
    
    // Assemble the list item
    li.appendChild(checkbox);
    li.appendChild(fileInfo);
    li.appendChild(deleteBtn);
    mergedFilesList.appendChild(li);
  });
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
  lastFile.data.slice(0, 3).forEach((row, i) => {
    const mappedRow = {};
    lastFile.headerMapping.forEach((header, j) => {
      if (j < row.length && header !== "–") {
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

// Add this near the end of the file

// Ensure global functions are defined
window.updateHeaderMapping = window.updateHeaderMapping || function() {};
window.toggleCategoryFilter = window.toggleCategoryFilter || function() {};

// Find the updateTransactions function and check it:

// DELETE the following function around line 849
// function updateTransactions() {
//   console.log("Updating transactions from", AppState.mergedFiles.length, "merged files");
//   
//   // Reset transactions
//   AppState.transactions = [];
//   
//   if (!AppState.mergedFiles.length) {…}
//   
//   // Process each merged file
//   AppState.mergedFiles.forEach(file => {…});
//   
//   console.log("Total transactions:", AppState.transactions.length);
//   renderTransactions(AppState.transactions);
// }

// Instead, just use the imported updateTransactions function throughout the file

// Add this function at the end of the file

window.debugMergedFiles = function() {
  console.log("Current merged files:", AppState.mergedFiles);
  
  AppState.mergedFiles.forEach((file, i) => {
    console.log(`File ${i+1}: ${file.fileName}, Signature: ${file.signature}`);
    console.log(`Header mapping:`, file.headerMapping);
    console.log(`Data rows: ${file.data.length}`);
    console.log(`Sample row:`, file.data[1] || "No data rows");
  });
  
  console.log("Current transactions:", AppState.transactions);
};
