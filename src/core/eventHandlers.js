import { showCategoryModal } from "../ui/categories/categoryModal.js";
import { showMappingsModal } from "../mappings/mappingsManager.js"; // This import should work now
import { showMergedFilesModal } from "../ui/mergedFilesModal.js";
import { createNewFileInput } from "../ui/fileUpload.js";
import { exportMergedFilesAsCSV } from "../exports/exportManager.js";

/**
 * Initialize event listeners for the application
 */
export function initializeEventListeners() {
  console.log("Initializing event listeners...");

  // File upload events
  initFileUploadEvents();

  // Sidebar button events
  initSidebarButtonEvents();

  // Filter events
  initFilterEvents();

  // Export events
  initExportEvents();

  console.log("Event listeners initialized");
}

/**
 * Initialize file upload-related events
 */
function initFileUploadEvents() {
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => {
      const fileInput = createNewFileInput();
      if (fileInput) fileInput.click();
    });
  }
}

/**
 * Initialize sidebar button events
 */
function initSidebarButtonEvents() {
  // Categories button
  const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
  if (editCategoriesBtn) {
    editCategoriesBtn.addEventListener("click", () => {
      // Change this to use showCategoryModal instead of openEditCategoriesModal
      showCategoryModal();
    });
  }

  // Mappings button
  const showMappingsBtn = document.getElementById("showMappingsBtn");
  if (showMappingsBtn) {
    showMappingsBtn.addEventListener("click", showMappingsModal);
  }

  // Merged files button
  const showMergedFilesBtn = document.getElementById("showMergedFilesBtn");
  if (showMergedFilesBtn) {
    showMergedFilesBtn.addEventListener("click", showMergedFilesModal);
  }
}

/**
 * Initialize filter-related events
 */
function initFilterEvents() {
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      import('../ui/transactionManager.js')
        .then(module => {
          if (typeof module.applyFilters === 'function') {
            const filters = {
              startDate: document.getElementById("filterStartDate")?.value || null,
              endDate: document.getElementById("filterEndDate")?.value || null,
              category: document.getElementById("filterCategory")?.value || null,
              minAmount: document.getElementById("filterMinAmount")?.value || null,
              maxAmount: document.getElementById("filterMaxAmount")?.value || null
            };
            module.applyFilters(filters);
          }
        })
        .catch(err => console.error("Error applying filters:", err));
    });
  }
}

/**
 * Initialize export-related events
 */
function initExportEvents() {
  // Add export button event listeners here if needed
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportMergedFilesAsCSV);
  }
}
