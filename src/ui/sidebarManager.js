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

  // Toggle sidebar on hamburger click
  hamburgerMenu.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Close sidebar when overlay is clicked
  sidebarOverlay.addEventListener("click", closeSidebar);

  // Close sidebar on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    if (mainContent) {
      mainContent.classList.add("sidebar-open");
    }
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
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

  // Set initial state immediately
  debugModeToggle.checked = isDebugMode;
  document.body.classList.toggle("debug-mode", isDebugMode);
  updateDebugVisibility(isDebugMode);

  // Remove any existing event listeners
  const newToggle = debugModeToggle.cloneNode(true);
  debugModeToggle.parentNode.replaceChild(newToggle, debugModeToggle);

  // Add the event listener to the checkbox input
  newToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    document.body.classList.toggle("debug-mode", isEnabled);
    localStorage.setItem("debugMode", isEnabled);
    updateDebugVisibility(isEnabled);

    // Re-initialize debug button listeners if debug mode is enabled
    if (isEnabled) {
      setTimeout(() => {
        import('../utils/debug.js').then(module => {
          if (module.attachDebugFunctions) {
            module.attachDebugFunctions();
          }
        });
      }, 100);
    }

    console.log(`Debug mode ${isEnabled ? 'enabled' : 'disabled'}`);
  });

  // Also add click event to the toggle switch container for better UX
  const toggleSwitch = newToggle.closest('.toggle-switch');
  if (toggleSwitch) {
    toggleSwitch.addEventListener('click', (e) => {
      // Prevent double-firing if clicking directly on the input
      if (e.target === newToggle) return;

      e.preventDefault();
      e.stopPropagation();
      newToggle.checked = !newToggle.checked;
      newToggle.dispatchEvent(new Event('change'));
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

  // Set initial state
  darkModeToggle.checked = isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);

  // Remove any existing event listeners
  const newToggle = darkModeToggle.cloneNode(true);
  darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);

  // Add event listener to the checkbox input
  newToggle.addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("darkMode", isDark);
    console.log(`Dark mode ${isDark ? 'enabled' : 'disabled'}`);
  });

  // Also add click event to the toggle switch container for better UX
  const toggleSwitch = newToggle.closest('.toggle-switch');
  if (toggleSwitch) {
    toggleSwitch.addEventListener('click', (e) => {
      // Prevent double-firing if clicking directly on the input
      if (e.target === newToggle) return;

      e.preventDefault();
      e.stopPropagation();
      newToggle.checked = !newToggle.checked;
      newToggle.dispatchEvent(new Event('change'));
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
  // File upload button
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  if (fileUploadBtn) {
    fileUploadBtn.addEventListener("click", () => {
      // Import and use the file upload functionality
      import("../ui/fileUpload.js").then(module => {
        if (module.createNewFileInput) {
          module.createNewFileInput();
        } else {
          console.error("createNewFileInput function not found");
        }
      }).catch(err => {
        console.error("Error loading file upload module:", err);
      });
    });
  }

  // Show mappings button
  const showMappingsBtn = document.getElementById("showMappingsBtn");
  if (showMappingsBtn) {
    showMappingsBtn.addEventListener("click", () => {
      _handleShowMappings();
    });
  }

  // Show merged files button
  const showMergedFilesBtn = document.getElementById("showMergedFilesBtn");
  if (showMergedFilesBtn) {
    showMergedFilesBtn.addEventListener("click", () => {
      _handleShowMergedFiles();
    });
  }

  // Edit categories button
  const editCategoriesBtn = document.getElementById("editCategoriesSidebarBtn");
  if (editCategoriesBtn) {
    editCategoriesBtn.addEventListener("click", () => {
      _handleEditCategories();
    });
  }

  // Export button - FIXED: Use the correct export function
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      // FIXED: Import the correct export manager module
      import('../exports/exportManager.js').then(module => {
        if (module.exportTransactionsAsCSV) {
          module.exportTransactionsAsCSV();
        } else {
          console.error('exportTransactionsAsCSV function not found');
        }
      }).catch(err => {
        console.error('Error loading export manager:', err);
        import('../ui/uiManager.js').then(uiModule => {
          if (uiModule.showToast) {
            uiModule.showToast('Error loading export function', 'error');
          }
        });
      });
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
      id: "saveLogBtn", handler: () => {
        // FIXED: Properly import and use console logger
        if (window.saveConsoleLogs) {
          window.saveConsoleLogs();
        } else {
          // Import console logger if not available
          import('../utils/console-logger.js').then(() => {
            setTimeout(() => {
              if (window.saveConsoleLogs) {
                window.saveConsoleLogs();
              } else {
                console.error("Console logger failed to initialize");
                import('../ui/uiManager.js').then(uiModule => {
                  if (uiModule.showToast) {
                    uiModule.showToast('Console logger not available', 'error');
                  }
                });
              }
            }, 100);
          }).catch(err => {
            console.error("Failed to load console logger:", err);
            import('../ui/uiManager.js').then(uiModule => {
              if (uiModule.showToast) {
                uiModule.showToast('Failed to load console logger', 'error');
              }
            });
          });
        }
      }
    },
    { id: "resetAppBtn", handler: _handleResetApp }
  ];

  debugButtons.forEach(({ id, handler }) => {
    const button = document.getElementById(id);
    if (button) {
      // Remove existing listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      // Add new listener
      newButton.addEventListener("click", handler);
      console.log(`Debug button ${id} initialized`);
    } else {
      console.warn(`Debug button ${id} not found`);
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
 * Reset application data
 */
function _handleResetApp() {
  if (confirm('Are you sure you want to reset the application? This will clear all data.')) {
    // CRITICAL FIX: Ensure default categories are loaded exactly like the reset button
    import('../constants/categories.js').then(categoriesModule => {
      import('../core/appState.js').then(appStateModule => {
        // Clear all data
        localStorage.clear();
        sessionStorage.clear();

        // Initialize default categories immediately
        appStateModule.AppState.categories = { ...categoriesModule.DEFAULT_CATEGORIES };
        localStorage.setItem('categories', JSON.stringify(appStateModule.AppState.categories));
        console.log('Reset App: Loaded default categories');

        // CRITICAL FIX: Call the exact same function as the Reset to Defaults button
        import('./categoryManager.js').then(categoryModule => {
          if (categoryModule.resetToDefaultCategories) {
            categoryModule.resetToDefaultCategories();
            console.log('CRITICAL: Called resetToDefaultCategories() exactly like the reset button');
          }
        }).catch(error => {
          console.warn('Could not call resetToDefaultCategories:', error);
        });

        // Reload after ensuring categories are saved
        setTimeout(() => {
          location.reload();
        }, 500);
      });
    });
  }
}
