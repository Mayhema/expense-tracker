// formatMapping.js

// Displays the header preview with row-selection controls and mapping dropdowns.
export function defineHeaderRow(data, fileName) {
  window.currentFileData = data;
  window.currentFileName = fileName;
  
  const previewContainer = document.getElementById("previewTable");
  if (!previewContainer) {
    console.error("Preview container not found.");
    return;
  }
  previewContainer.innerHTML = "";
  
  // Display file name.
  const fileInfo = document.createElement("div");
  fileInfo.textContent = "File: " + fileName;
  fileInfo.style.fontWeight = "bold";
  previewContainer.appendChild(fileInfo);
  
  // Show row selection panel if not already visible.
  const rowPanel = document.getElementById("rowSelectionPanel");
  if (rowPanel) {
    rowPanel.style.display = "block";
    document.getElementById("totalRowsLabel").textContent = "Total Rows: " + data.length;
  }
  
  // Container for header preview table.
  const tableContainer = document.createElement("div");
  tableContainer.style.maxHeight = "300px";
  tableContainer.style.overflowY = "auto";
  tableContainer.id = "headerPreviewContainer";
  previewContainer.appendChild(tableContainer);
  
  function renderHeaderPreview() {
    const headerRowIndex = parseInt(document.getElementById("headerRowInput").value, 10) - 1;
    const dataRowIndex = parseInt(document.getElementById("dataRowInput").value, 10) - 1;
    const headerRow = data[headerRowIndex] || [];
    const dataRow = data[dataRowIndex] || [];
    const mappingOptions = ["Date", "Income", "Expenses", "Description", "–"];
    
    let tableHtml = '<table style="width:100%; border-collapse:collapse;">';
    tableHtml += "<thead><tr>";
    headerRow.forEach((cell, index) => {
      tableHtml += `<th style="padding:5px; border:1px solid #ddd;">`;
      tableHtml += `<input type="text" class="header-input" data-index="${index}" value="${cell || ''}" style="width:70%;">`;
      tableHtml += `<br><select class="mapping-select" data-index="${index}" style="width:90%; margin-top:4px;">`;
      mappingOptions.forEach((opt) => {
        tableHtml += `<option value="${opt}">${opt === "–" ? "--" : opt}</option>`;
      });
      tableHtml += `</select></th>`;
    });
    tableHtml += "</tr></thead>";
    tableHtml += "<tbody><tr>";
    dataRow.forEach((cell) => {
      tableHtml += `<td style="padding:5px; border:1px solid #ddd;">${cell || ""}</td>`;
    });
    tableHtml += "</tr></tbody></table>";
    document.getElementById("headerPreviewContainer").innerHTML = tableHtml;
    
    // Auto-detect if a header input contains "date", select "Date" automatically.
    document.querySelectorAll(".header-input").forEach((inp, idx) => {
      if (inp.value.toLowerCase().includes("date")) {
        let sel = document.querySelector(`.mapping-select[data-index="${idx}"]`);
        if (sel) sel.value = "Date";
      }
    });
  }
  
  renderHeaderPreview();
  document.getElementById("headerRowInput").addEventListener("change", renderHeaderPreview);
  document.getElementById("dataRowInput").addEventListener("change", renderHeaderPreview);
  
  console.log("defineHeaderRow executed: preview rendered with row selectors.");
}

// Saves the header mapping and stores its signature.
export function saveHeadersAndFormat(formatName, headerMapping) {
  // Normalize headerMapping: any empty header is replaced with "–"
  const normalizedMapping = headerMapping.map((val) =>
    val && val.trim() !== "" ? val.trim() : "–"
  );
  // Compute unique signature from the chosen header row.
  const headerRowInput = document.getElementById("headerRowInput");
  let headerRowIndex = headerRowInput ? parseInt(headerRowInput.value, 10) - 1 : 0;
  const headerRow = window.currentFileData[headerRowIndex] || [];
  const fileSignature = JSON.stringify(headerRow);
  normalizedMapping.signature = fileSignature;
  
  // Save in localStorage.
  let allMappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "{}");
  allMappings[formatName] = normalizedMapping;
  localStorage.setItem("fileFormatMappings", JSON.stringify(allMappings));
  
  localStorage.setItem("userDefinedHeaders", JSON.stringify(normalizedMapping));
  alert(`Format "${formatName}" saved.`);
  
  // Clear preview.
  document.getElementById("previewTable").innerHTML = "";
  
  // Add merged file.
  if (window.currentFileData && window.currentFileName) {
    window.addMergedFile(window.currentFileData, normalizedMapping, window.currentFileName, fileSignature);
  }
  
  renderMappingList();
}

// Renders a table of saved mappings.
export function renderMappingList() {
  const mappingUI = document.getElementById("mappingTable");
  if (!mappingUI) return;
  mappingUI.innerHTML =
    "<tr><th>Format Name</th><th>Mapping</th><th>Actions</th></tr>";
  let allMappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "{}");
  Object.entries(allMappings).forEach(([formatName, mapping]) => {
    const mappingStr = mapping
      .filter((item) => typeof item === "string")
      .join(", ");
    mappingUI.innerHTML += `
      <tr>
        <td contenteditable="true" onblur="renameMapping('${formatName}', this.innerText.trim())">${formatName}</td>
        <td>${mappingStr}</td>
        <td>
          <button onclick="deleteMappingWithConfirmation('${formatName}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

window.deleteMappingWithConfirmation = function (formatName) {
  let allMappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "{}");
  const mappingToDelete = allMappings[formatName];
  if (!mappingToDelete) return;
  const sig = mappingToDelete.signature;
  const affectedFiles = window.mergedFiles
    ? window.mergedFiles.filter((file) => file.headerMapping.signature === sig)
    : [];
  let warningMessage = `Are you sure you want to delete mapping "${formatName}"?`;
  if (affectedFiles.length > 0) {
    warningMessage += ` This will remove ${affectedFiles.length} merged file(s) using this format.`;
  }
  if (confirm(warningMessage)) {
    window.mergedFiles = window.mergedFiles.filter(
      (file) => file.headerMapping.signature !== sig
    );
    updateTransactions();
    renderMergedFiles();
    delete allMappings[formatName];
    localStorage.setItem("fileFormatMappings", JSON.stringify(allMappings));
    renderMappingList();
  }
};