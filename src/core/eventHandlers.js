import { showFormatMappingsModal } from "../ui/formatMappingsModal.js";
import { showMergedFilesModal } from "../ui/mergedFilesModal.js";
import { openEditCategoriesModal } from "../ui/categories/categoryModal.js";
import { applyFilters } from "../ui/transactionManager.js";
import { exportMergedFilesAsCSV } from "../exports/exportManager.js";
import { onFileUpload, createNewFileInput } from "../ui/fileUpload.js";

/**
 * Initializes global event listeners
 */
export function initializeEventListeners() {
  // Clear any existing handlers by removing and recreating elements

  // File upload button handler
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    // Clone to remove existing listeners
    const newBtn = fileUploadBtn.cloneNode(true);
    if (fileUploadBtn.parentNode) {
      fileUploadBtn.parentNode.replaceChild(newBtn, fileUploadBtn);
    }

    // Add single click handler that creates a fresh file input
    newBtn.addEventListener("click", () => {
      const input = createNewFileInput();
      if (input) {
        input.click();
      }
    });
  }

  // Reset file input event listener
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    // Create fresh event listener
    const newInput = fileInput.cloneNode(true);
    if (fileInput.parentNode) {
      fileInput.parentNode.replaceChild(newInput, fileInput);
    }
    newInput.addEventListener("change", onFileUpload);
  }

  // Initialize format mappings and merged files buttons
  const showMappingsBtn = document.getElementById("showMappingsBtn");
  const showMergedFilesBtn = document.getElementById("showMergedFilesBtn");
  const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
  const exportMergedBtn = document.getElementById("exportMergedBtn");

  if (showMappingsBtn) {
    showMappingsBtn.addEventListener("click", showFormatMappingsModal);
  }

  if (showMergedFilesBtn) {
    showMergedFilesBtn.addEventListener("click", showMergedFilesModal);
  }

  if (editCategoriesBtn) {
    editCategoriesBtn.addEventListener("click", openEditCategoriesModal);
  }

  if (exportMergedBtn) {
    exportMergedBtn.addEventListener("click", exportMergedFilesAsCSV);
  }

  // Initialize filter button
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      const filters = {
        startDate: document.getElementById("filterStartDate")?.value,
        endDate: document.getElementById("filterEndDate")?.value,
        category: document.getElementById("filterCategory")?.value,
        minAmount: parseFloat(document.getElementById("filterMinAmount")?.value || "0"),
        maxAmount: parseFloat(document.getElementById("filterMaxAmount")?.value || "0"),
      };
      applyFilters(filters);
    });
  }

  // Attach global functions that need to be accessible from HTML
  window.applyFilters = applyFilters;
}
