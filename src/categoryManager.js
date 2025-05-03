import { AppState } from "./appState.js";
import { renderTransactions } from "./transactionManager.js";
import { updateChart } from "./chartManager.js";
import { getContrastColor } from "./utils.js";

const CATEGORIES_KEY = "expenseCategories";

export function getCategories() {
  return AppState.categories;
}

// Add this function at the top of the file to handle category saving

export function saveCategories() {
  localStorage.setItem("expenseCategories", JSON.stringify(AppState.categories));
}

// Update the category management to immediately reflect changes

export function renderCategoryList() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;

  categoryList.innerHTML = Object.entries(AppState.categories)
    .map(
      ([name, color]) => `
      <button
        class="category-btn active"
        style="background-color: ${color};"
        onclick="window.toggleCategoryFilter('${name}', this)"
        data-category="${name}"
      >
        ${name}
      </button>
    `
    )
    .join("");
    
  // Also update the filter dropdown
  updateCategoryFilterDropdown();
}

/**
 * Updates the category filter dropdown in the filters section
 */
export function updateCategoryFilterDropdown() {
  const filterCategory = document.getElementById("filterCategory");
  if (!filterCategory) return;
  
  // Save current selection
  const currentValue = filterCategory.value;
  
  // Generate new options
  const options = ['<option value="">All</option>'];
  Object.entries(AppState.categories).forEach(([name, color]) => {
    options.push(`<option value="${name}" style="background-color: ${color}; color: ${getContrastColor(color)};">${name}</option>`);
  });
  
  filterCategory.innerHTML = options.join('');
  
  // Restore selection if possible
  if (currentValue) {
    filterCategory.value = currentValue;
  }
}

export function addCategory(name, color = "#cccccc") {
  if (!name || name.trim() === '') return;
  
  // Add to categories
  AppState.categories[name] = color;
  
  // Save and update UI
  saveCategories();
  renderCategoryList();
  
  // Force transaction table redraw to show the new category
  if (AppState.transactions && AppState.transactions.length) {
    renderTransactions(AppState.transactions, true);
  }
  
  // Also update chart to reflect new category colors
  setTimeout(() => {
    updateChart(AppState.transactions);
  }, 100);
}

export function deleteCategory(name) {
  if (!AppState.categories[name]) return;
  
  // Remove from categories
  delete AppState.categories[name];
  
  // Remove this category from all transactions
  if (AppState.transactions) {
    AppState.transactions.forEach(tx => {
      if (tx.category === name) {
        tx.category = '';
      }
    });
  }
  
  // Save and update UI
  saveCategories();
  renderCategoryList();
  
  // Force transaction table redraw
  if (AppState.transactions && AppState.transactions.length) {
    renderTransactions(AppState.transactions, true);
  }
  
  // Add this line to refresh the edit modal immediately
  renderEditCategoryList();
  
  // Update chart with a small delay
  setTimeout(() => {
    updateChart(AppState.transactions);
  }, 100);
}

// Modify the openEditCategoriesModal function
export function openEditCategoriesModal() {
  const modal = document.getElementById("categoryModal") || document.createElement("div");
  modal.id = "categoryModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.background = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
    <div>
      <h2>Edit Categories</h2>
      <ul id="editCategoryList" style="list-style-type: none; padding: 0;"></ul>
      <div style="display: flex; margin-top: 15px;">
        <input type="text" id="newCategoryName" placeholder="New category name" style="flex: 1; margin-right: 5px;">
        <input type="color" id="newCategoryColor" value="#cccccc" style="width: 40px; margin-right: 5px;">
        <button id="addCategoryBtn">Add</button>
      </div>
      <button id="closeCategoryModalBtn" style="margin-top: 15px;">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Render the category list
  renderEditCategoryList();

  // Set up event handlers
  document.getElementById("addCategoryBtn").onclick = () => {
    const nameInput = document.getElementById("newCategoryName");
    const colorInput = document.getElementById("newCategoryColor");
    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (name) {
      addCategory(name, color);
      nameInput.value = '';
      renderEditCategoryList();
    }
  };

  document.getElementById("closeCategoryModalBtn").onclick = () => {
    modal.remove();
  };
}

function renderEditCategoryList() {
  const editCategoryList = document.getElementById("editCategoryList");
  if (!editCategoryList) return;
  
  editCategoryList.innerHTML = Object.entries(AppState.categories)
    .map(([name, color]) => `
      <li style="display: flex; align-items: center; margin-bottom: 10px; padding: 5px; border: 1px solid #eee; border-radius: 4px; background-color: ${color}25;">
        <span style="flex: 1; color: ${getContrastColor(color + '25')};">${name}</span>
        <input 
          type="color" 
          value="${color}" 
          onchange="window.updateCategoryColor('${name}', this.value)" 
          style="margin-right: 5px;"
        >
        <button onclick="window.deleteCategory('${name}')">Delete</button>
      </li>
    `)
    .join("");
}

export function updateCategoryColor(name, color) {
  if (!AppState.categories[name]) return;
  
  AppState.categories[name] = color;
  saveCategories();
  renderCategoryList();
  
  // Update UI
  renderEditCategoryList();
  renderTransactions(AppState.transactions, true);
  
  setTimeout(() => {
    updateChart(AppState.transactions);
  }, 100);
}

// Attach functions to window for event handling
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.updateCategoryColor = updateCategoryColor;

export function toggleCategoryFilter(name, element) {
  const transactions = AppState.transactions || [];
  if (transactions.length === 0) {
    console.log("No transactions to filter.");
    return;
  }

  if (window.currentCategoryFilters && window.currentCategoryFilters.includes(name)) {
    window.currentCategoryFilters = window.currentCategoryFilters.filter(c => c !== name);
    element.classList.remove('inactive');
    element.classList.add('active');
  } else {
    if (!window.currentCategoryFilters) {
      window.currentCategoryFilters = [];
    }
    window.currentCategoryFilters.push(name);
    element.classList.remove('active');
    element.classList.add('inactive');
  }
  
  renderTransactions(transactions);
}

let modalOpen = false;

// Add at the end of the file

// Make sure toggleCategoryFilter is attached to window
window.toggleCategoryFilter = toggleCategoryFilter;
