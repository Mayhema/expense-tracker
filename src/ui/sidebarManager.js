// Module variables
let darkModeToggle = null;
let debugModeToggle = null;

/**
 * Sets up the sidebar functionality
 */
export function setupSidebarManager() {
  console.log("Setting up sidebar manager...");

  try {
    // Initialize components in order
    initializeHamburgerMenu();
    initializeToggles();
    initializeActionButtons();

    console.log("Sidebar manager setup complete");
  } catch (error) {
    console.error("Error setting up sidebar manager:", error);
  }
}

/**
 * Initialize hamburger menu functionality
 */
function initializeHamburgerMenu() {
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const mainContent = document.getElementById("mainContent");

  if (!hamburgerMenu || !sidebar || !sidebarOverlay) {
    console.warn("Required sidebar elements not found");
    return;
  }

  // FIXED: Remove existing event listeners by cloning the element
  const newHamburgerMenu = hamburgerMenu.cloneNode(true);
  hamburgerMenu.parentNode.replaceChild(newHamburgerMenu, hamburgerMenu);

  // FIXED: Remove existing overlay listeners
  const newSidebarOverlay = sidebarOverlay.cloneNode(true);
  sidebarOverlay.parentNode.replaceChild(newSidebarOverlay, sidebarOverlay);

  // Toggle sidebar on hamburger click
  newHamburgerMenu.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = sidebar.classList.contains("open");
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Close sidebar when overlay is clicked
  newSidebarOverlay.addEventListener("click", closeSidebar);

  // Close sidebar on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  function openSidebar() {
    sidebar.classList.add("open");
    newSidebarOverlay.classList.add("active");
    newHamburgerMenu.classList.add("active");
    if (mainContent) {
      mainContent.classList.add("sidebar-open");
    }
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    newSidebarOverlay.classList.remove("active");
    newHamburgerMenu.classList.remove("active");
    if (mainContent) {
      mainContent.classList.remove("sidebar-open");
    }
  }

  console.log("Hamburger menu initialized");
}

/**
 * Initialize toggle switches
 */
function initializeToggles() {
  // Initialize dark mode toggle
  initializeDarkModeToggle();

  // Initialize debug mode toggle
  initializeDebugModeToggle();

  console.log("Toggle switches initialized");
}

/**
 * Initialize debug mode toggle with proper event handling
 */
function initializeDebugModeToggle() {
  const debugModeToggle = document.getElementById("debugModeToggle");
  if (!debugModeToggle) {
    console.warn("Debug mode toggle not found");
    return;
  }

  // Get current state from localStorage
  const isDebugMode = localStorage.getItem("debugMode") === "true";

  // Remove any existing event listeners
  const newToggle = debugModeToggle.cloneNode(true);
  debugModeToggle.parentNode.replaceChild(newToggle, debugModeToggle);

  // FIXED: Set initial state AFTER cloning to ensure the new element has the correct state
  newToggle.checked = isDebugMode;
  document.body.classList.toggle("debug-mode", isDebugMode);
  updateDebugVisibility(isDebugMode);

  // Add the event listener ONLY to the checkbox input
  newToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle("debug-mode", isEnabled);
    localStorage.setItem("debugMode", isEnabled);
    updateDebugVisibility(isEnabled);

    // Re-initialize debug button listeners if debug mode is enabled
    if (isEnabled) {
      setTimeout(() => {
        // FIXED: Re-initialize debug buttons when debug mode is enabled
        initializeDebugButtons();

        import('../utils/debug.js').then(module => {
          if (module.attachDebugFunctions) {
            module.attachDebugFunctions();
          }
        });
      }, 100);
    }

    console.log(`Debug mode ${isEnabled ? 'enabled' : 'disabled'}`);
  });

  // FIXED: Add click listeners to toggle switch visual elements to make them clickable
  const toggleContainer = newToggle.parentNode;
  const slider = toggleContainer.querySelector('.slider');

  // FIXED: Also add click listener to the label to ensure visual state updates
  const label = document.querySelector('label[for="debugModeToggle"]');

  if (label) {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Debug label clicked, current state:', newToggle.checked);
      newToggle.checked = !newToggle.checked;
      console.log('Debug label new state:', newToggle.checked);
      // Trigger the same enhanced behavior as toggle clicks
      newToggle.dispatchEvent(new Event('change', { bubbles: true }));
      newToggle.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  if (toggleContainer?.classList.contains('toggle-switch')) {
    toggleContainer.addEventListener('click', (e) => {
      // Prevent double triggering if clicking the checkbox itself
      if (e.target !== newToggle) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Debug toggle container clicked, current state:', newToggle.checked);
        newToggle.checked = !newToggle.checked;
        console.log('Debug toggle new state:', newToggle.checked);
        // Use both change and input events to ensure CSS updates
        newToggle.dispatchEvent(new Event('change', { bubbles: true }));
        newToggle.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  if (slider) {
    slider.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Debug slider clicked, current state:', newToggle.checked);
      newToggle.checked = !newToggle.checked;
      console.log('Debug slider new state:', newToggle.checked);
      // Use both change and input events to ensure CSS updates
      newToggle.dispatchEvent(new Event('change', { bubbles: true }));
      newToggle.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  console.log("Debug mode toggle initialized successfully");
}

/**
 * Initialize dark mode toggle
 */
function initializeDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) {
    console.warn("Dark mode toggle not found");
    return;
  }

  // Get current state from localStorage
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  // Remove any existing event listeners
  const newToggle = darkModeToggle.cloneNode(true);
  darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);

  // FIXED: Set initial state AFTER cloning to ensure the new element has the correct state
  newToggle.checked = isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Add event listener ONLY to the checkbox input
  newToggle.addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("darkMode", isDark);
    console.log(`Dark mode ${isDark ? 'enabled' : 'disabled'}`);
  });

  // FIXED: Add click listeners to toggle switch visual elements to make them clickable
  const toggleContainer = newToggle.parentNode;
  const slider = toggleContainer.querySelector('.slider');

  // FIXED: Also add click listener to the label to ensure visual state updates
  const label = document.querySelector('label[for="darkModeToggle"]');

  if (label) {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Dark mode label clicked, current state:', newToggle.checked);
      newToggle.checked = !newToggle.checked;
      console.log('Dark mode label new state:', newToggle.checked);
      // Trigger the same enhanced behavior as toggle clicks
      newToggle.dispatchEvent(new Event('change', { bubbles: true }));
      newToggle.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  if (toggleContainer?.classList.contains('toggle-switch')) {
    toggleContainer.addEventListener('click', (e) => {
      // Prevent double triggering if clicking the checkbox itself
      if (e.target !== newToggle) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Dark mode toggle container clicked, current state:', newToggle.checked);
        newToggle.checked = !newToggle.checked;
        console.log('Dark mode toggle new state:', newToggle.checked);
        // Use both change and input events to ensure CSS updates
        newToggle.dispatchEvent(new Event('change', { bubbles: true }));
        newToggle.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  if (slider) {
    slider.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Dark mode slider clicked, current state:', newToggle.checked);
      newToggle.checked = !newToggle.checked;
      console.log('Dark mode slider new state:', newToggle.checked);
      // Use both change and input events to ensure CSS updates
      newToggle.dispatchEvent(new Event('change', { bubbles: true }));
      newToggle.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  console.log("Dark mode toggle initialized successfully");
}

/**
 * Updates debug element visibility based on debug mode state
 */
function updateDebugVisibility(isDebugMode) {
  const debugElements = document.querySelectorAll('.debug-only');
  console.log(`Found ${debugElements.length} debug elements to ${isDebugMode ? 'show' : 'hide'}`);

  debugElements.forEach(element => {
    if (isDebugMode) {
      // Show the element with proper display type
      if (element.classList.contains('inline-element')) {
        element.style.display = 'inline-block';
      } else if (element.classList.contains('flex-element')) {
        element.style.display = 'flex';
      } else {
        element.style.display = 'block';
      }
      element.style.visibility = 'visible';
    } else {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    }
  });

  // Ensure body class is correctly set
  document.body.classList.toggle('debug-mode', isDebugMode);

  console.log(`Debug visibility updated: ${isDebugMode ? 'shown' : 'hidden'} for ${debugElements.length} elements`);
}

/**
 * Initialize action buttons
 */
function initializeActionButtons() {
  // FIXED: Handle upload button with cloning to completely remove any duplicate listeners
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    // Clone the element to remove ALL existing event listeners
    const newUploadBtn = fileUploadBtn.cloneNode(true);
    fileUploadBtn.parentNode.replaceChild(newUploadBtn, fileUploadBtn);

    // Add single clean event listener
    newUploadBtn.addEventListener("click", handleFileUploadClick);
    console.log("Upload button initialized with clean event listener");
  }

  // FIXED: Add missing category manager button handler for the main header button
  const categoryManagerBtn = document.getElementById("categoryManagerBtn");
  if (categoryManagerBtn) {
    categoryManagerBtn.removeEventListener("click", handleCategoryManagerClick);
    categoryManagerBtn.addEventListener("click", handleCategoryManagerClick);
  }

  // FIXED: Add missing export button handler for the main header button
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.removeEventListener("click", handleExportClick);
    exportBtn.addEventListener("click", handleExportClick);
  }

  // FIXED: Remove existing event listeners from other buttons to prevent double modals
  const showMappingsBtn = document.getElementById("showMappingsBtn");
  if (showMappingsBtn) {
    const newMappingsBtn = showMappingsBtn.cloneNode(true);
    showMappingsBtn.parentNode.replaceChild(newMappingsBtn, showMappingsBtn);

    newMappingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _handleShowMappings();
    });
  }

  const showMergedFilesBtn = document.getElementById("showMergedFilesBtn");
  if (showMergedFilesBtn) {
    const newMergedFilesBtn = showMergedFilesBtn.cloneNode(true);
    showMergedFilesBtn.parentNode.replaceChild(newMergedFilesBtn, showMergedFilesBtn);

    newMergedFilesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _handleShowMergedFiles();
    });
  }

  const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
  if (editCategoriesBtn) {
    const newCategoriesBtn = editCategoriesBtn.cloneNode(true);
    editCategoriesBtn.parentNode.replaceChild(newCategoriesBtn, editCategoriesBtn);

    newCategoriesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _handleEditCategories();
    });
  }

  // Debug buttons
  initializeDebugButtons();

  console.log("Action buttons initialized");
}

/**
 * Initialize debug buttons
 */
function initializeDebugButtons() {
  const debugButtons = [
    {
      id: "debugFilesBtn", handler: () => {
        import("../utils/debug.js").then(module => {
          if (module.debugMergedFiles) {
            module.debugMergedFiles();
          }
        });
      }
    },
    {
      id: "debugSignaturesBtn", handler: () => {
        import("../utils/debug.js").then(module => {
          if (module.debugSignatures) {
            module.debugSignatures();
          }
        });
      }
    },
    {
      id: "debugTransactionsBtn", handler: () => {
        import("../utils/debug.js").then(module => {
          if (module.inspectTransactionData) {
            module.inspectTransactionData();
          }
        });
      }
    },
    {
      id: "saveLogBtn", handler: handleSaveLogClick
    },
    {
      id: "resetAppBtn", handler: () => {
        import("../utils/debug.js").then(module => {
          if (module.resetApplication) {
            module.resetApplication();
          }
        });
      }
    }
  ];

  debugButtons.forEach(button => {
    const element = document.getElementById(button.id);
    if (element) {
      // FIXED: Remove any existing listeners first to prevent duplicates
      element.removeEventListener("click", button.handler);
      element.addEventListener("click", button.handler);
      console.log(`Debug button initialized: ${button.id}`);
    } else {
      console.warn(`Debug button element not found: ${button.id}`);
    }
  });
}

/**
 * Show mappings manager modal
 */
function _handleShowMappings() {
  const mappings = JSON.parse(localStorage.getItem('fileFormatMappings') || '[]');

  const modalContent = document.createElement('div');
  modalContent.className = 'mappings-modal-content';

  // FIXED: Show current file signature properly
  const currentSignature = AppState.currentFileSignature || 'No current file signature available';

  let html = `
    <div class="current-signature-section">
      <h4>Current File Signature</h4>
      <div class="signature-display">${currentSignature}</div>
    </div>
  `;

  if (mappings.length === 0) {
    html += '<div class="empty-state"><p>No saved mappings found.</p></div>';
  } else {
    // CRITICAL FIX: Group mappings by signature and show all files that use each mapping
    const mappingsBySignature = {};
    mappings.forEach(mapping => {
      if (!mappingsBySignature[mapping.signature]) {
        mappingsBySignature[mapping.signature] = {
          signature: mapping.signature,
          mapping: mapping.mapping,
          files: [],
          created: mapping.created,
          lastUsed: mapping.lastUsed
        };
      }
      mappingsBySignature[mapping.signature].files.push(mapping.fileName);
    });

    const mappingsHTML = Object.values(mappingsBySignature).map((groupedMapping, index) => {
      const fields = groupedMapping.mapping ? groupedMapping.mapping.filter(m => m !== '–').join(', ') : 'No mapping';
      const created = groupedMapping.created ? new Date(groupedMapping.created).toLocaleString() : 'Unknown';
      const filesList = groupedMapping.files.join(', ');

      return `
        <div class="mapping-item" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
          <div><strong>Mapping ${index + 1}: ${groupedMapping.signature}</strong></div>
          <div><strong>Files:</strong> ${filesList}</div>
          <div><strong>Fields:</strong> ${fields}</div>
          <div><strong>Created:</strong> ${created}</div>
          <button class="danger" onclick="removeMapping(${index})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Remove</button>
        </div>
      `;
    }).join('');

    html += `
      <h3>Saved Format Mappings (${Object.keys(mappingsBySignature).length})</h3>
      ${mappingsHTML}
    `;
  }

  modalContent.innerHTML = html;

  // Show modal using the modal manager
  import('./modalManager.js').then(module => {
    const modal = module.showModal({
      title: '🗂️ File Format Mappings',
      content: modalContent,
      size: 'large',
      closeOnClickOutside: true
    });

    // Add remove function to window temporarily for the modal
    window.removeMapping = function (index) {
      if (confirm('Are you sure you want to remove this mapping?')) {
        const mappingsBySignature = {};
        mappings.forEach(mapping => {
          if (!mappingsBySignature[mapping.signature]) {
            mappingsBySignature[mapping.signature] = [];
          }
          mappingsBySignature[mapping.signature].push(mapping);
        });

        const signatureToRemove = Object.keys(mappingsBySignature)[index];
        const updatedMappings = mappings.filter(m => m.signature !== signatureToRemove);

        localStorage.setItem('fileFormatMappings', JSON.stringify(updatedMappings));
        modal.close();
        // Re-open with updated data
        setTimeout(() => _handleShowMappings(), 100);
      }
    };
  });
}

/**
 * Show merged files manager modal
 */
function _handleShowMergedFiles() {
  import('./fileListUI.js').then(module => {
    if (module.showMergedFilesModal) {
      module.showMergedFilesModal();
    } else {
      console.error('showMergedFilesModal function not found');
    }
  }).catch(err => {
    console.error('Error loading file list UI:', err);
    import('./uiManager.js').then(uiModule => {
      if (uiModule.showToast) {
        uiModule.showToast('Error opening file list manager', 'error');
      }
    });
  });
}

function _handleEditCategories() {
  import('./categoryManager.js').then(module => {
    if (module.showCategoryManagerModal) {
      module.showCategoryManagerModal();
    } else {
      console.error('showCategoryManagerModal function not found');
    }
  }).catch(err => {
    console.error('Error loading category manager:', err);
    import('./uiManager.js').then(uiModule => {
      if (uiModule.showToast) {
        uiModule.showToast('Error opening category manager', 'error');
      }
    });
  });
}

/**
 * FIXED: File upload button click handler - prevents double file dialogs
 */
function handleFileUploadClick(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log("CRITICAL: Upload button clicked - initiating file upload");

  import("../ui/fileUpload.js").then(module => {
    if (module.createNewFileInput) {
      console.log("CRITICAL: Calling createNewFileInput()");
      // FIXED: Don't call input.click() here - createNewFileInput() already handles the click
      module.createNewFileInput();
    } else {
      console.error("createNewFileInput function not found");
    }
  }).catch(err => {
    console.error("Error loading file upload module:", err);
  });
}

/**
 * FIXED: Category manager button click handler
 */
function handleCategoryManagerClick(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log("Category manager button clicked");

  import("../ui/categoryManager.js").then(module => {
    if (module.showCategoryManagerModal) {
      module.showCategoryManagerModal();
    } else {
      console.error("showCategoryManagerModal function not found");
    }
  }).catch(err => {
    console.error("Error loading category manager module:", err);
    // Fallback to alternative category modal
      import("../ui/categoryModal.js").then(fallbackModule => {
        if (fallbackModule.showCategoryManagerModal) {
          fallbackModule.showCategoryManagerModal();
        }
      }).catch(fallbackErr => {
        console.error("Error loading fallback category modal:", fallbackErr);
      });
    });
}

/**
 * FIXED: Add missing save log handler for debug buttons
 */
function handleSaveLogClick() {
  console.log("Save log button clicked");

  try {
    // Check if console logger is available
    if (window.saveConsoleLogs && typeof window.saveConsoleLogs === 'function') {
      window.saveConsoleLogs();
    } else {
      // Try to wait for console logger to initialize
      setTimeout(() => {
        if (window.saveConsoleLogs && typeof window.saveConsoleLogs === 'function') {
          window.saveConsoleLogs();
        } else {
          console.error("Console logger not available");
          showErrorToast('Console logger not available');
        }
      }, 100);
    }
  } catch (error) {
    console.error("Error saving console logs:", error);
    showErrorToast('Error saving console logs');
  }
}

/**
 * Resets categories to default
 */
async function resetToDefaultCategories() {
  try {
    const categoryModule = await import('./categoryManager.js');
    if (categoryModule.resetToDefaultCategories) {
      categoryModule.resetToDefaultCategories();
      console.log('CRITICAL: Called resetToDefaultCategories() exactly like the reset button');
    }
  } catch (error) {
    console.warn('Could not call resetToDefaultCategories:', error);
  }
}

/**
 * Handles export button click
 */
async function handleExportClick() {
  try {
    // FIXED: Check if export modal exists first, then fallback to direct export
    try {
      const exportModalModule = await import('../ui/exportManager.js');
      if (exportModalModule.showExportModal) {
        exportModalModule.showExportModal();
        return;
      }
    } catch (modalError) {
      console.log('Export modal not available, using direct export:', modalError.message);
      // Intentionally continue to fallback
    }

    // Fallback to direct export
    const module = await import('../exports/exportManager.js');
    if (module.exportTransactionsAsCSV) {
      module.exportTransactionsAsCSV();
    } else {
      console.error('exportTransactionsAsCSV function not found');
      await showErrorToast('Export function not available');
    }
  } catch (err) {
    console.error('Error loading export manager:', err);
    await showErrorToast('Error loading export function');
  }
}


/**
 * Waits for console logger to initialize
 */
async function waitForConsoleLogger() {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (window.saveConsoleLogs) {
        window.saveConsoleLogs();
        resolve();
      } else {
        console.error("Console logger failed to initialize");
        showErrorToast('Console logger not available');
        resolve();
      }
    }, 100);
  });
}

/**
 * Shows error toast message
 */
async function showErrorToast(message) {
  try {
    const uiModule = await import('../ui/uiManager.js');
    if (uiModule.showToast) {
      uiModule.showToast(message, 'error');
    }
  } catch (error) {
    console.error('Could not show error toast:', error);
  }
}
