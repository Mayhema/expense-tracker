const CATEGORIES_KEY = "expenseCategories";

let categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || {
  Food: "#FF6384",
  Transport: "#36A2EB",
  Housing: "#FFCE56"
};

export function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getCategories() {
  return categories;
}

export function renderCategoryList() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;

  const categories = getCategories();
  categoryList.innerHTML = Object.entries(categories)
    .map(
      ([name, color]) => `
      <button
        class="category-btn"
        style="background-color: ${color};"
        onclick="window.toggleCategoryFilter('${name}', this)"
      >
        ${name}
      </button>
    `
    )
    .join("");
}

export function toggleCategoryFilter(name, element) {
  const transactions = AppState.transactions || [];
  if (transactions.length === 0) {
    console.log("No transactions to filter.");
    return;
  }

  if (window.currentCategoryFilters.includes(name)) {
    window.currentCategoryFilters = window.currentCategoryFilters.filter(c => c !== name);
    element.style.opacity = 1;
  } else {
    window.currentCategoryFilters.push(name);
    element.style.opacity = 0.5;
  }
  renderTransactions(transactions);
}

let modalOpen = false;

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
      <ul id="editCategoryList"></ul>
      <button id="addCategoryBtn">Add Category</button>
      <button id="closeCategoryModalBtn">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  const editCategoryList = document.getElementById("editCategoryList");
  const categories = getCategories();
  editCategoryList.innerHTML = Object.entries(categories)
    .map(
      ([name, color]) => `
      <li>
        <input type="text" value="${name}" />
        <input type="color" value="${color}" />
        <button onclick="window.deleteCategory('${name}')">Delete</button>
      </li>
    `
    )
    .join("");

  document.getElementById("addCategoryBtn").onclick = () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory) {
      categories[newCategory] = "#cccccc";
      saveCategories();
      renderCategoryList();
      openEditCategoriesModal(); // Reopen modal to refresh the list
    }
  };

  document.getElementById("closeCategoryModalBtn").onclick = () => {
    modal.remove();
  };
}

export function deleteCategory(name) {
  const categories = getCategories();
  delete categories[name];
  saveCategories();
  renderCategoryList();
  openEditCategoriesModal(); // Reopen modal to reflect changes
}

// Attach functions to the window object for global access
window.deleteCategory = deleteCategory;
window.toggleCategoryFilter = toggleCategoryFilter;
