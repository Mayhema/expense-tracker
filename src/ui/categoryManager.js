import { AppState, categoriesInitialized, saveCategories } from "../core/appState.js";
// DEFAULT_CATEGORIES import is not strictly needed here if appState.js handles defaults
// import { DEFAULT_CATEGORIES } from "../core/constants.js";
import { showToast } from "./uiManager.js";
import { updateCategoryNameInMappings, updateSubcategoryNameInMappings } from "./categoryMapping.js";

// Debug logging for imports
console.log("Loading categoryManager.js with imports:", {
  updateCategoryNameInMappings: typeof updateCategoryNameInMappings,
  updateSubcategoryNameInMappings: typeof updateSubcategoryNameInMappings
});

// Store category order separately
let categoryOrder = [];

/**
 * Handle regex editor button click
 */
function handleRegexEditorClick(modal) {
  // First close the current modal to avoid multiple modals
  if (modal && typeof modal.close === 'function') {
    modal.close();
  }

  // Now import and call the correct RegexRuleEditor
  import("../ui/RegexRuleEditor.js").then(module => {
    handleRegexRuleEditorModule(module);
  }).catch(err => {
    console.error("Error loading RegexRuleEditor:", err);
    import("../ui/uiManager.js").then(uiModule => {
      if (uiModule.showToast) {
        uiModule.showToast("Error loading regex rule editor", "error");
      }
    });
  });
}

/**
 * Handle the loaded regex rule editor module
 */
function handleRegexRuleEditorModule(module) {
  if (typeof module.openRegexRuleEditor === 'function') {
    module.openRegexRuleEditor();
  } else {
    console.error("openRegexRuleEditor function not found in RegexRuleEditor module");
    import("../ui/uiManager.js").then(uiModule => {
      if (uiModule.showToast) {
        uiModule.showToast("Regex editor not available", "error");
      }
    });
  }
}

/**
 * Setup event listeners for category manager modal
 */
function setupCategoryManagerEventListeners(modal, modalContent) {
  // Now render the categories UI in the modal
  renderCategoryUI(modalContent);

  // Setup event listeners for the new "Add" button
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const newCategoryNameInput = document.getElementById("newCategoryName");
  const newCategoryColorInput = document.getElementById("newCategoryColor");

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      handleAddCategoryClick(newCategoryNameInput, newCategoryColorInput, modalContent);
    });
  }

  // IMPORTANT FIX: Make sure Edit Rules button opens the correct modal
  const openRegexEditorBtnCM = document.getElementById("openRegexEditorBtnCM");
  if (openRegexEditorBtnCM) {
    openRegexEditorBtnCM.addEventListener("click", () => {
      handleRegexEditorClick(modal);
    });
  }

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.className = "button";
  closeBtn.style = "margin-top: 20px; float: right;";
  modalContent.appendChild(closeBtn);
  closeBtn.addEventListener("click", () => {
    if (modal && typeof modal.close === 'function') {
      modal.close();
    }
  });
}

/**
 * Handle add category button click
 */
function handleAddCategoryClick(nameInput, colorInput, modalContent) {
  const name = nameInput.value.trim();
  const color = colorInput.value;

  if (name) {
    if (addCategory(name, color)) {
      nameInput.value = '';
      colorInput.value = '#cccccc';
      // Re-render the category UI to show the new category
      renderCategoryUI(modalContent);
    }
  } else {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast("Please enter a category name", "error");
      }
    });
  }
}

// Export the functions needed by categoryModal.js
export function initializeCategories() {
  // AppState.categories should be initialized by appState.js's IIFE before this is called.
  // categoriesInitialized.value will be true if appState.js has run.
  if (!categoriesInitialized.value) {
    console.warn("categoryManager.js: Categories not yet initialized by appState.js. Waiting...");
    return;
  }

  console.log("categoryManager.js: Initializing categories UI aspects. Current AppState categories:", Object.keys(AppState.categories || {}).length);

  // Initialize or load category order (relies on AppState.categories)
  initializeCategoryOrder();
  attachCategoryEventListeners();
}

/**
 * Initialize or load the saved category order
 */
function initializeCategoryOrder() {
  const savedOrder = localStorage.getItem("categoryOrder");
  if (savedOrder) {
    try {
      categoryOrder = JSON.parse(savedOrder);
    } catch (e) {
      console.error("Error parsing saved category order:", e);
      categoryOrder = [];
    }
  }

  // If no saved order or invalid, create from current categories
  if (!Array.isArray(categoryOrder) || categoryOrder.length === 0) {
    categoryOrder = Object.keys(AppState.categories || {});
    saveCategoryOrder();
  }
}

/**
 * Save the current category order to localStorage
 */
function saveCategoryOrder() {
  localStorage.setItem("categoryOrder", JSON.stringify(categoryOrder));
}

/**
 * Add event handlers for category management buttons
 */
function attachCategoryEventListeners() {
  document.addEventListener('DOMContentLoaded', () => {
    const editCategoriesBtn = document.getElementById("editCategoriesBtn");
    if (editCategoriesBtn) {
      editCategoriesBtn.addEventListener("click", showCategoryManagerModal);
    }
  });
}

/**
 * Add a new category
 */
export function addCategory(name, color) {
  if (!name) {
    console.error("Category name is required");
    return false;
  }

  // Make sure name is unique
  if (AppState.categories[name]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Category "${name}" already exists`, "error");
      }
    });
    return false;
  }

  // Simple category with just a color
  AppState.categories[name] = color || "#cccccc";
  saveCategories();

  // Add to category order at the end
  if (!categoryOrder.includes(name)) {
    categoryOrder.push(name);
    saveCategoryOrder();
  }

  // Update UI components that use categories
  updateCategoryUIComponents();

  import("../ui/uiManager.js").then(module => {
    if (module.showToast) {
      module.showToast(`Category '${name}' added`, "success");
    }
  });
  return true;
}

/**
 * Update an existing category
 */
export function updateCategory(oldName, newName, newColor) {
  if (!oldName || !newName) return false;

  // Check if the new name already exists (unless it's the same name)
  if (oldName !== newName && AppState.categories[newName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Category "${newName}" already exists`, "error");
      }
    });
    return false;
  }

  // Get the current category value
  const currentValue = AppState.categories[oldName];

  // Handle complex vs. simple category format
  let updatedValue;
  if (typeof currentValue === 'object') {
    updatedValue = { ...currentValue };
    if (newColor) updatedValue.color = newColor;
  } else {
    updatedValue = newColor || currentValue;
  }

  // If name changed, delete old and add new
  if (oldName !== newName) {
    delete AppState.categories[oldName];
    AppState.categories[newName] = updatedValue;

    // Update category order
    const orderIndex = categoryOrder.indexOf(oldName);
    if (orderIndex !== -1) {
      categoryOrder[orderIndex] = newName;
      saveCategoryOrder();
    }

    // Update category mappings
    updateCategoryNameInMappings(oldName, newName);
  } else {
    AppState.categories[oldName] = updatedValue;
  }

  // Update UI components that use categories
  updateCategoryUIComponents();

  saveCategories();
  return true;
}

/**
 * Delete a category
 */
export function deleteCategory(name) {
  if (!name || !AppState.categories[name]) return false;

  delete AppState.categories[name];
  saveCategories();

  // Remove from category order
  categoryOrder = categoryOrder.filter(cat => cat !== name);
  saveCategoryOrder();

  // Update UI components that use categories
  updateCategoryUIComponents();

  import("../ui/uiManager.js").then(module => {
    if (module.showToast) {
      module.showToast(`Category '${name}' deleted`, "success");
    }
  });
  return true;
}

/**
 * Add a subcategory to a parent category
 */
export function addSubcategory(parentName, subName, subColor) {
  if (!parentName || !subName) return false;

  // Make sure parent exists
  if (!AppState.categories[parentName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Parent category "${parentName}" not found`, "error");
      }
    });
    return false;
  }

  // Convert simple category to complex if needed
  let parentCategory = AppState.categories[parentName];
  if (typeof parentCategory === 'string') {
    parentCategory = { color: parentCategory, subcategories: {} };
    AppState.categories[parentName] = parentCategory;
  }

  // Make sure the subcategories object exists
  if (!parentCategory.subcategories) {
    parentCategory.subcategories = {};
  }

  // Check if subcategory already exists
  if (parentCategory.subcategories[subName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Subcategory "${subName}" already exists`, "error");
      }
    });
    return false;
  }

  // Add the subcategory
  parentCategory.subcategories[subName] = subColor || "#cccccc";
  saveCategories();

  // Update UI components that use categories
  updateCategoryUIComponents();

  import("../ui/uiManager.js").then(module => {
    if (module.showToast) {
      module.showToast(`Subcategory '${subName}' added`, "success");
    }
  });
  return true;
}

/**
 * Update a subcategory
 */
export function updateSubcategory(parentName, oldSubName, newSubName, newSubColor) {
  if (!parentName || !oldSubName || !newSubName) return false;

  // Make sure parent exists
  const parentCategory = AppState.categories[parentName];
  if (!parentCategory || typeof parentCategory !== 'object' || !parentCategory.subcategories) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Parent category "${parentName}" not found or has no subcategories`, "error");
      }
    });
    return false;
  }

  // Check if the old subcategory exists
  if (!parentCategory.subcategories[oldSubName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Subcategory "${oldSubName}" not found`, "error");
      }
    });
    return false;
  }

  // Check if the new name already exists (unless it's the same name)
  if (oldSubName !== newSubName && parentCategory.subcategories[newSubName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Subcategory "${newSubName}" already exists`, "error");
      }
    });
    return false;
  }

  // Update subcategory
  if (oldSubName !== newSubName) {
    const oldColor = parentCategory.subcategories[oldSubName];
    delete parentCategory.subcategories[oldSubName];
    parentCategory.subcategories[newSubName] = newSubColor || oldColor;

    // Update subcategory mappings
    updateSubcategoryNameInMappings(parentName, oldSubName, newSubName);
  } else {
    parentCategory.subcategories[oldSubName] = newSubColor || parentCategory.subcategories[oldSubName];
  }

  // Update UI components that use categories
  updateCategoryUIComponents();

  saveCategories();
  return true;
}

/**
 * Delete a subcategory
 */
export function deleteSubcategory(parentName, subName) {
  if (!parentName || !subName) return false;

  // Make sure parent exists
  const parentCategory = AppState.categories[parentName];
  if (!parentCategory || typeof parentCategory !== 'object' || !parentCategory.subcategories) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Parent category "${parentName}" not found or has no subcategories`, "error");
      }
    });
    return false;
  }

  // Check if the subcategory exists
  if (!parentCategory.subcategories[subName]) {
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast(`Subcategory "${subName}" not found`, "error");
      }
    });
    return false;
  }

  // Delete the subcategory
  delete parentCategory.subcategories[subName];
  saveCategories();

  // Update UI components that use categories
  updateCategoryUIComponents();

  import("../ui/uiManager.js").then(module => {
    if (module.showToast) {
      module.showToast(`Subcategory '${subName}' deleted`, "success");
    }
  });
  return true;
}

/**
 * Opens the category manager modal
 */
export function showCategoryManagerModal() {
  // Check if a modal is already open and close it first
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) {
    existingModal.remove();
  }

  const modalContent = document.createElement("div");
  modalContent.className = "category-manager-container";

  modalContent.innerHTML = `
    <div class="category-section">
      <div class="add-category-form" style="margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
        <h4>Add New Category</h4>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <input type="text" id="newCategoryName" placeholder="Category name" style="flex: 1; padding: 8px;">
          <input type="color" id="newCategoryColor" value="#cccccc" style="width: 40px; height: 36px;">
          <button id="addCategoryBtn" class="button icon-btn" title="Add Category">➕</button>
        </div>
      </div>

      <div id="categoriesList" class="categories-sortable-list" style="margin-top: 20px;"></div>
    </div>

    <div class="category-mapping-section" style="margin-top: 30px;">
      <h3>Category Mappings</h3>
      <p>View and manage automatic transaction categorization rules.</p>
      <button id="openRegexEditorBtnCM" class="button">Edit Automatic Rules</button>
      <div id="categoryMappingContainerCM"></div>
    </div>

    <style>
      .categories-sortable-list {
        margin-top: 15px;
      }
      .category-edit-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 8px;
        background-color: #f9f9f9;
        border-radius: 4px;
        cursor: grab;
      }
      .dark-mode .category-edit-row {
        background-color: #333;
      }
      .category-edit-row:hover {
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .category-edit-row.dragging {
        opacity: 0.5;
        box-shadow: 0 5px 10px rgba(0,0,0,0.2);
      }
      .category-drag-handle {
        margin-right: 10px;
        cursor: grab;
        color: #999;
      }
      .category-drag-handle:hover {
        color: #555;
      }
      .dark-mode .category-drag-handle:hover {
        color: #aaa;
      }
      .category-counter {
        margin-left: auto;
        margin-right: 10px;
        padding: 3px 8px;
        border-radius: 10px;
        background-color: #eee;
        font-size: 0.8em;
        min-width: 30px;
        text-align: center;
      }
      .dark-mode .category-counter {
        background-color: #555;
      }
    </style>
  `;

  import("../ui/modalManager.js").then(module => {
    if (typeof module.showModal === 'function') {
      const modal = module.showModal({
        title: "Category Manager",
        content: modalContent,
        size: "large"
      });

      setupCategoryManagerEventListeners(modal, modalContent);
    } else {
      console.error("showModal function not found in modalManager");
    }
  }).catch(err => {
    console.error("Error loading modal manager:", err);
    import("../ui/uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast("Error opening category manager", "error");
      }
    });
  });
}

/**
 * Initialize drag and drop for category reordering
 */
function initDragAndDrop(container) {
  if (!container) return;

  let draggedItem = null;

  const onDragStart = (e) => {
    // Ensure dragging only main category rows via the handle
    if (!e.target.classList.contains('category-drag-handle')) {
      e.preventDefault(); // Prevent drag if not on handle
      return;
    }
    draggedItem = e.target.closest('.category-edit-row');
    if (!draggedItem || draggedItem.classList.contains('subcategory-row')) { // Do not drag subcategories this way
      draggedItem = null;
      e.preventDefault();
      return;
    }
    // setTimeout is a common trick to allow the browser to render the drag image before styles change
    setTimeout(() => {
      if (draggedItem) draggedItem.classList.add('dragging');
    }, 0);

    e.dataTransfer.effectAllowed = 'move';
    if (draggedItem) { // Ensure draggedItem is set
      e.dataTransfer.setData('text/plain', draggedItem.dataset.name); // Store name for identification
    } else {
      e.preventDefault(); // Should not happen if checks above are correct
    }
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    if (!draggedItem) return; // Guard clause: if no item is being dragged, do nothing

    const targetItem = e.target.closest('.category-edit-row:not(.subcategory-row)');
    if (targetItem && targetItem !== draggedItem && !targetItem.classList.contains('subcategory-row')) {
      const rect = targetItem.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      // Decide whether to insert before or after based on mouse position within the target item
      if (offsetY > rect.height / 2) {
        targetItem.parentNode.insertBefore(draggedItem, targetItem.nextSibling);
      } else {
        targetItem.parentNode.insertBefore(draggedItem, targetItem);
      }
    }
  };

  const onDragEnd = () => {
    if (!draggedItem) return;
    draggedItem.classList.remove('dragging');

    // Update categoryOrder based on new DOM order
    const newOrder = Array.from(
      container.querySelectorAll('.category-edit-row:not(.subcategory-row)') // Ensure only main categories
    ).map(item => item.dataset.name);

    if (newOrder.length > 0 && JSON.stringify(newOrder) !== JSON.stringify(categoryOrder)) {
      categoryOrder = newOrder;
      saveCategoryOrder();
      // Optionally, inform user or update other UI components if needed
      // updateCategoryUIComponents(); // This might be too much, re-rendering the whole list
      showToast("Category order saved", "info");
    }
    draggedItem = null;
  };

  // Add draggable attribute and event listeners to main category rows
  container.querySelectorAll('.category-edit-row:not(.subcategory-row) .category-drag-handle').forEach(handle => {
    const item = handle.closest('.category-edit-row');
    item.setAttribute('draggable', true); // Make the whole row draggable
    item.addEventListener('dragstart', onDragStart);
    item.addEventListener('dragend', onDragEnd);
  });

  // Add dragover listener to the container to handle reordering
  container.addEventListener('dragover', onDragOver);
}


/**
 * Builds the HTML content for the category manager modal
 */
function buildCategoryManagerContent() {
  return `
    <div class="category-section">
      <h3>Manage Categories</h3>
      <p>Add, edit, and delete expense categories. Each category can have a unique color and subcategories.</p>

      <div class="add-category-form">
        <input type="color" id="newCategoryColor" value="#4CAF50">
        <input type="text" id="newCategoryName" placeholder="New Category Name">
        <button id="addCategoryBtn" class="button">Add Category</button>
      </div>

      <div id="categoriesList" class="categories-sortable-list"></div>
    </div>

    <div class="category-mapping-section">
      <h3>Category Mappings</h3>
      <p>View and manage automatic transaction categorization rules.</p>
      <button id="openRegexEditorBtn" class="button">Edit Rules</button>
      <div id="categoryMappingContainer"></div>
    </div>

    <style>
      .categories-sortable-list {
        margin-top: 15px;
      }
      .category-edit-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 8px;
        background-color: #f9f9f9;
        border-radius: 4px;
        cursor: grab;
      }
      .dark-mode .category-edit-row {
        background-color: #333;
      }
      .category-edit-row:hover {
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .category-edit-row.dragging {
        opacity: 0.5;
        box-shadow: 0 5px 10px rgba(0,0,0,0.2);
      }
      .category-drag-handle {
        margin-right: 10px;
        cursor: grab;
        color: #999;
      }
      .category-drag-handle:hover {
        color: #555;
      }
      .dark-mode .category-drag-handle:hover {
        color: #aaa;
      }
      .category-counter {
        margin-left: auto;
        margin-right: 10px;
        padding: 3px 8px;
        border-radius: 10px;
        background-color: #eee;
        font-size: 0.8em;
        min-width: 30px;
        text-align: center;
      }
      .dark-mode .category-counter {
        background-color: #555;
      }
    </style>
  `;
}

/**
 * Get category counts from transactions
 */
function getCategoryCounts() {
  const counts = {};

  if (AppState.transactions && Array.isArray(AppState.transactions)) {
    AppState.transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
    });
  }

  return counts;
}

/**
 * Render the category UI with improved subcategory toggle and drag-and-drop ordering
 */
function renderCategoryUI(container) {
  const categoriesList = container.querySelector("#categoriesList");
  if (!categoriesList) {
    console.error("Categories list container not found");
    return;
  }

  const categoryCounts = getCategoryCounts();
  let html = '';

  // Use categoryOrder for rendering sequence
  const currentCategories = AppState.categories || {};
  const orderedCategoryNames = [...categoryOrder].filter(name => currentCategories[name]);

  // Add any new categories not in the order
  Object.keys(currentCategories).forEach(name => {
    if (!orderedCategoryNames.includes(name)) {
      orderedCategoryNames.push(name);
      categoryOrder.push(name);
    }
  });

  orderedCategoryNames.forEach((categoryName, index) => {
    const category = currentCategories[categoryName];
    const categoryColor = typeof category === 'object' ? category.color : category;
    const count = categoryCounts[categoryName] || 0;
    const hasSubcategories = typeof category === 'object' && category.subcategories && Object.keys(category.subcategories).length > 0;

    html += `
      <div class="category-edit-row" data-category="${categoryName}" draggable="true">
        <span class="category-drag-handle" title="Drag to reorder">≡</span>
        <div class="category-color-preview" style="background-color: ${categoryColor}; width: 20px; height: 20px; border-radius: 3px; margin-right: 10px;"></div>
        <input type="text" class="category-name-input" value="${categoryName}" data-original="${categoryName}" style="flex: 1; margin-right: 10px;">
        <input type="color" class="category-color-input" value="${categoryColor}" data-category="${categoryName}" style="width: 40px; margin-right: 10px;">
        <span class="category-counter">${count}</span>

        ${hasSubcategories ? `
          <button class="category-toggle-btn" data-category="${categoryName}" title="Toggle subcategories" style="background: none; border: 1px solid #ccc; padding: 4px 8px; margin: 0 5px; border-radius: 3px; cursor: pointer;">
            <span class="toggle-icon">▶</span>
          </button>
        ` : ''}

        <button class="category-delete-btn" data-category="${categoryName}" title="Delete category" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">✕</button>
      </div>

      ${hasSubcategories ? `
        <div id="subcategories-${categoryName}" class="subcategories-panel" style="display: none; margin-left: 40px; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
          <h5 style="margin: 0 0 10px 0; color: #666;">Subcategories for ${categoryName}</h5>
          <div class="subcategories-list">
            ${Object.entries(category.subcategories || {}).map(([subName, subColor]) => `
              <div class="subcategory-row" style="display: flex; align-items: center; margin-bottom: 8px; padding: 5px; background: white; border-radius: 3px;">
                <div style="background-color: ${subColor}; width: 15px; height: 15px; border-radius: 2px; margin-right: 8px;"></div>
                <input type="text" class="subcategory-name-input" value="${subName}" data-parent="${categoryName}" data-original="${subName}" style="flex: 1; margin-right: 8px; padding: 2px 5px;">
                <input type="color" class="subcategory-color-input" value="${subColor}" data-parent="${categoryName}" data-subcategory="${subName}" style="width: 30px; margin-right: 8px;">
                <button class="subcategory-delete-btn" data-parent="${categoryName}" data-subcategory="${subName}" style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 12px;">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="add-subcategory-btn" data-parent="${categoryName}" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 5px;">+ Add Subcategory</button>
        </div>
      ` : ''}
    `;
  });

  categoriesList.innerHTML = html;

  // Attach event handlers
  attachCategoryUIEventHandlers(categoriesList);

  // Initialize improved drag and drop with real-time updates
  initializeImprovedDragAndDrop(categoriesList);
}

/**
 * Initialize improved drag and drop with real-time category order updates
 */
function initializeImprovedDragAndDrop(container) {
  if (!container) return;

  let draggedItem = null;

  // Handle drag start
  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('category-edit-row')) {
      draggedItem = e.target;
      draggedItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', draggedItem.outerHTML);
    }
  });

  // Handle drag over
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(draggedItem);
    } else {
      container.insertBefore(draggedItem, afterElement);
    }
  });

  // Handle drag end with real-time updates
  container.addEventListener('dragend', (e) => {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');

      // Get new order from DOM
      const newOrder = Array.from(container.children)
        .filter(el => el.classList.contains('category-edit-row'))
        .map(el => el.dataset.category);

      // Update category order and save
      updateCategoryOrder(newOrder);

      draggedItem = null;
    }
  });
}

/**
 * Update category order and trigger real-time UI updates
 */
function updateCategoryOrder(newOrder) {
  if (!Array.isArray(newOrder) || newOrder.length === 0) return;

  // Update the module-level categoryOrder
  categoryOrder.splice(0, categoryOrder.length, ...newOrder);

  // Save to localStorage
  saveCategoryOrder();

  console.log("Category order updated:", newOrder);

  // Real-time updates - update all UI components that show categories
  setTimeout(() => {
    // Update category buttons in transaction filter
    import("./transactionManager.js").then(module => {
      if (typeof module.renderCategoryButtons === 'function') {
        module.renderCategoryButtons();
      }
    });

    // Update any other category displays
    document.dispatchEvent(new CustomEvent('categoryOrderChanged', {
      detail: { newOrder }
    }));

    import("./uiManager.js").then(module => {
      if (module.showToast) {
        module.showToast("Category order updated", "success", 1500);
      }
    });
  }, 100);
}

/**
 * Attach improved event handlers for category UI elements
 */
function attachCategoryUIEventHandlers(container) {
  // Subcategory toggle buttons with improved UI
  container.addEventListener('click', (e) => {
    if (e.target.closest('.category-toggle-btn')) {
      const btn = e.target.closest('.category-toggle-btn');
      const categoryName = btn.dataset.category;
      const panel = document.getElementById(`subcategories-${categoryName}`);
      const icon = btn.querySelector('.toggle-icon');

      if (panel) {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? '▼' : '▶';
        btn.style.backgroundColor = isHidden ? '#e9ecef' : 'transparent';
      }
    }
  });

  // Category name changes with real-time updates
  container.addEventListener('blur', (e) => {
    if (e.target.classList.contains('category-name-input')) {
      const input = e.target;
      const oldName = input.dataset.original;
      const newName = input.value.trim();

      if (newName && newName !== oldName) {
        updateCategory(oldName, newName, null);
        input.dataset.original = newName;

        // Update the data attribute on the parent row
        const row = input.closest('.category-edit-row');
        if (row) {
          row.dataset.category = newName;
        }
      }
    }
  });

  // Category color changes with real-time updates
  container.addEventListener('change', (e) => {
    if (e.target.classList.contains('category-color-input')) {
      const categoryName = e.target.dataset.category;
      const newColor = e.target.value;

      updateCategory(categoryName, categoryName, newColor);

      // Update color preview immediately
      const colorPreview = e.target.parentElement.querySelector('.category-color-preview');
      if (colorPreview) {
        colorPreview.style.backgroundColor = newColor;
      }
    }
  });

  // Category delete buttons
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-delete-btn')) {
      const categoryName = e.target.dataset.category;
      if (confirm(`Delete category "${categoryName}"? This cannot be undone.`)) {
        deleteCategory(categoryName);

        // Remove from DOM immediately
        const row = e.target.closest('.category-edit-row');
        const subcategoriesPanel = document.getElementById(`subcategories-${categoryName}`);

        if (row) row.remove();
        if (subcategoriesPanel) subcategoriesPanel.remove();
      }
    }
  });

  // Add subcategory buttons
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-subcategory-btn')) {
      const parentCategory = e.target.dataset.parent;
      const subName = prompt('Enter subcategory name:');

      if (subName && subName.trim()) {
        addSubcategory(parentCategory, subName.trim(), '#cccccc');

        // Re-render the category UI to show the new subcategory
        setTimeout(() => renderCategoryUI(container.closest('.category-manager-container')), 100);
      }
    }
  });
}

/**
 * Helper function for drag and drop positioning
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.category-edit-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Updates all UI components that display categories
 */
function updateCategoryUIComponents() {
  console.log("Updating category UI components...");

  try {
    // Update category buttons (this works)
    import("./transactionManager.js").then(module => {
      if (typeof module.renderCategoryButtons === 'function') {
        module.renderCategoryButtons();
        console.log("Category buttons updated");
      }
    }).catch(err => {
      console.error("Error updating category buttons:", err);
    });

    // Update charts if available
    if (typeof window.updateChartsWithCurrentData === 'function') {
      setTimeout(() => {
        window.updateChartsWithCurrentData();
      }, 100);
    }

    // Trigger any category change events
    document.dispatchEvent(new CustomEvent('categoriesUpdated', {
      detail: { categories: AppState.categories }
    }));

  } catch (error) {
    console.error("Error updating category UI components:", error);
  }
}
