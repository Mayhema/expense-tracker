import { AppState } from "./appState.js";
import { resetCharts } from "./charts/chartManager.js";
import { renderMappingList } from "./mappingsManager.js";
import { renderMergedFiles } from "./main.js";
import { renderTransactions } from "./transactionManager.js";
import { showToast } from "./uiManager.js";

// Debug function for merged files
export function debugMergedFiles() {
  console.log("Current merged files:", AppState.mergedFiles);
  
  if (!AppState.mergedFiles || AppState.mergedFiles.length === 0) {
    console.log("No merged files found!");
    alert("No merged files found in AppState");
    return;
  }
  
  AppState.mergedFiles.forEach((file, i) => {
    console.log(`File ${i+1}: ${file.fileName}, Signature: ${file.signature}`);
    console.log(`Header mapping:`, file.headerMapping);
    console.log(`Data rows: ${file.data.length}`);
    console.log(`Sample row:`, file.data[1] || "No data rows");
  });
  
  console.log("Current transactions:", AppState.transactions);
}

// Debug function for signatures
export function debugSignatures() {
  console.log("===== SIGNATURE DEBUG =====");
  
  // Create a UI dialog to show the debug info
  const dialog = document.createElement('div');
  dialog.style.position = 'fixed';
  dialog.style.top = '50%';
  dialog.style.left = '50%';
  dialog.style.transform = 'translate(-50%, -50%)';
  dialog.style.backgroundColor = '#fff';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '8px';
  dialog.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
  dialog.style.zIndex = '1000';
  dialog.style.maxHeight = '80vh';
  dialog.style.overflow = 'auto';
  dialog.style.width = '80%';
  dialog.style.maxWidth = '800px';
  
  let html = '<h2>Signature Debug Info</h2>';
  
  // Current file signature
  html += '<h3>Current File Signature</h3>';
  if (AppState.currentFileSignature) {
    html += `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f5f5f5;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Type</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Value</th>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Format Signature</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${AppState.currentFileSignature.formatSig || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Content Signature</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${AppState.currentFileSignature.contentSig || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Mapping Signature</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${AppState.currentFileSignature.mappingSig || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Structure Signature</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${AppState.currentFileSignature.structureSig || 'N/A'}</td>
        </tr>
      </table>
    `;
  } else {
    html += '<p>No current file signature (no file is being previewed)</p>';
  }
  
  // Saved mappings - show in a more organized way
  const mappings = JSON.parse(localStorage.getItem("fileFormatMappings") || "{}");
  html += '<h3>Saved Format Mappings</h3>';
  
  if (Object.keys(mappings).length > 0) {
    html += `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f5f5f5;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Signature</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Fields</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Created</th>
        </tr>
    `;
    
    // Keep track of unique mapping contents to avoid duplicates
    const uniqueMappingContents = new Set();
    
    for (const [sig, entry] of Object.entries(mappings)) {
      // Skip invalid entries
      if (!entry || !entry.mapping) continue;
      
      // Skip duplicates based on mapping content
      const mappingContent = JSON.stringify(entry.mapping);
      if (uniqueMappingContents.has(mappingContent)) continue;
      uniqueMappingContents.add(mappingContent);
      
      const fields = entry.mapping.filter(m => m !== "–").join(", ");
      const created = entry.created ? new Date(entry.created).toLocaleString() : 'Unknown';
      
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><code>${sig}</code></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${fields}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${created}</td>
        </tr>
      `;
    }
    html += '</table>';
  } else {
    html += '<p>No saved mappings found</p>';
  }
  
  // Merged files signatures
  html += '<h3>Merged Files Signatures</h3>';
  if (AppState.mergedFiles && AppState.mergedFiles.length > 0) {
    html += `
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f5f5f5;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">File Name</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Signature</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Header Fields</th>
        </tr>
    `;
    
    AppState.mergedFiles.forEach(file => {
      const fields = file.headerMapping.join(", ");
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${file.fileName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;"><code>${file.signature || 'missing'}</code></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${fields}</td>
        </tr>
      `;
    });
    
    html += '</table>';
  } else {
    html += '<p>No merged files found</p>';
  }
  
  html += '<div style="text-align: center; margin-top: 20px;"><button id="closeSignatureDebug" style="padding: 8px 16px;">Close</button></div>';
  
  dialog.innerHTML = html;
  document.body.appendChild(dialog);
  
  document.getElementById('closeSignatureDebug').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

// Add this recovery function
export function resetApplication() {
  if (!confirm("⚠️ WARNING: This will reset the entire application and delete all your data. Continue?")) {
    return;
  }
  
  if (!confirm("Are you ABSOLUTELY sure? This cannot be undone!")) {
    return;
  }
  
  // Clear localStorage
  localStorage.removeItem("mergedFiles");
  localStorage.removeItem("fileFormatMappings");
  localStorage.removeItem("expenseCategories");
  localStorage.removeItem("transactions");
  
  // Reset application state
  AppState.mergedFiles = [];
  AppState.transactions = [];
  AppState.currentFileData = null;
  AppState.currentFileName = null;
  AppState.currentFileSignature = null;
  AppState.currentSuggestedMapping = null;
  AppState.categories = {
    Food: "#FF6384",
    Transport: "#36A2EB",
    Housing: "#FFCE56",
  };
  
  // Clean up UI
  resetCharts();
  renderMappingList();
  renderMergedFiles();
  renderTransactions([]);
  
  console.log("Application reset completed");
  showToast("Application has been reset", "info");
  
  // Force page reload after a brief delay
  setTimeout(() => {
    location.reload();
  }, 1500);
}

// Explicitly attach to window object, with more robust approach
function attachDebugFunctions() {
  window.debugMergedFiles = debugMergedFiles;
  window.debugSignatures = debugSignatures;
  window.resetApplication = resetApplication;
  console.log("Debug functions attached to window");
}

// Ensure functions are attached on module load
attachDebugFunctions();

// Also attach them after DOM is loaded for extra safety
document.addEventListener("DOMContentLoaded", () => {
  attachDebugFunctions();
  
  // Add a hidden reset button that activates on special key combo
  document.addEventListener('keydown', function(e) {
    // Ctrl+Alt+R for reset
    if (e.ctrlKey && e.altKey && e.key === 'r') {
      window.resetApplication();
    }
  });
});

// For immediate verification
console.log("Debug module loaded, functions attached:", 
  Boolean(window.debugMergedFiles), 
  Boolean(window.debugSignatures));