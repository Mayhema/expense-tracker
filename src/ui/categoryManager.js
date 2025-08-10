import { AppState } from "../core/appState.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";

/**
 * Utility function to convert RGB color to hex format
 */
function rgbToHex(rgb) {
  if (!rgb || rgb === "transparent") return "#000000";

  // If it's already hex, return as is
  if (rgb.startsWith("#")) return rgb;

  // Parse rgb() or rgba() format
  const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)/;
  const match = rgbRegex.exec(rgb);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  return "#000000"; // fallback
}

/**
 * Ensure category modal uses singleton pattern:
 */
let categoryManagerModalInstance = null;

/**
 * Show the category manager modal
 */
export function showCategoryManagerModal() {
  // FIXED: Check if modal is actually visible before preventing multiple modals
  if (categoryManagerModalInstance) {
    const modalElement = document.querySelector(
      ".modal-overlay .category-manager-content"
    );
    if (modalElement?.closest(".modal-overlay")?.style.display !== "none") {
      console.log("Category manager modal already open and visible");
      return categoryManagerModalInstance;
    } else {
      // Modal reference exists but not visible, reset it
      categoryManagerModalInstance = null;
    }
  }

  console.log("Opening category manager modal...");

  const modalContent = document.createElement("div");
  modalContent.className = "category-manager-content";
  modalContent.innerHTML = buildCategoryManagerHTML();

  const modal = showModal({
    title: "Category Manager", // Fixed: Use the modal title properly
    content: modalContent,
    size: "large",
    closeOnClickOutside: false,
  });

  // Store reference and override close method
  categoryManagerModalInstance = modal;
  const originalClose = modal.close;
  modal.close = function () {
    categoryManagerModalInstance = null;
    originalClose.call(this);
  };

  attachCategoryManagerEventListeners(modalContent, modal);

  return modal;
}

function buildCategoryManagerHTML() {
  const categories = AppState.categories || {};

  return (
    "" +
    '<div class="add-category-section">' +
    '<div class="add-section-header">' +
    '<h4><span class="section-icon">✨</span> Add New Category</h4>' +
    '<p class="section-description">Create a new category with custom color and name</p>' +
    "</div>" +
    '<div class="add-category-card">' +
    '<div class="input-group" role="group" aria-label="Add new category form">' +
    '<div class="input-wrapper">' +
    '<label for="newCategoryName" class="input-label">Category Name</label>' +
    '<input type="text" id="newCategoryName" placeholder="e.g., Groceries, Entertainment" class="form-input" aria-required="true" aria-describedby="categoryNameHelp" />' +
    '<small id="categoryNameHelp" class="sr-only">Enter a unique name for the category</small>' +
    "</div>" +
    '<div class="input-wrapper">' +
    '<label for="newCategoryColor" class="input-label">Color</label>' +
    '<div class="color-picker-wrapper">' +
    '<input type="color" id="newCategoryColor" value="#3498db" class="color-picker" aria-describedby="colorHelp" />' +
    '<div class="color-preview" id="colorPreview" role="img" aria-label="Color preview"></div>' +
    '<small id="colorHelp" class="sr-only">Choose a color for the category</small>' +
    "</div>" +
    "</div>" +
    '<div class="input-wrapper">' +
    '<button class="btn btn-primary btn-add" id="addCategoryBtn" type="button" aria-describedby="addBtnHelp">' +
    '<span class="btn-icon" aria-hidden="true">+</span>' +
    '<span class="btn-text">Add Category</span>' +
    "</button>" +
    '<small id="addBtnHelp" class="sr-only">Click to add the new category</small>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="categories-section">' +
    '<div class="section-header">' +
    '<div class="header-left">' +
    '<h4><span class="section-icon">🏷️</span> Manage Categories</h4>' +
    '<div class="category-count-badge" role="status" aria-live="polite">' +
    Object.keys(categories).length +
    "</div>" +
    "</div>" +
    '<div class="header-actions">' +
    '<div class="search-wrapper">' +
    '<input type="text" id="categorySearch" placeholder="Search categories..." class="search-input" role="search" aria-label="Search categories" />' +
    '<span class="search-icon" aria-hidden="true">🔍</span>' +
    "</div>" +
    '<button class="btn btn-warning btn-reset" id="resetCategoriesBtn" title="Reset to default categories" type="button" aria-describedby="resetBtnHelp">' +
    '<span class="btn-icon" aria-hidden="true">🔄</span>' +
    '<span class="btn-text">Reset</span>' +
    "</button>" +
    '<small id="resetBtnHelp" class="sr-only">Reset all categories to default values</small>' +
    "</div>" +
    "</div>" +
    (Object.keys(categories).length === 0
      ? buildEmptyState()
      : buildCategoriesGrid(categories)) +
    "</div>" +
    '<div class="modal-footer">' +
    '<div class="footer-content">' +
    '<div class="footer-info">' +
    '<span class="info-text">💡 Tip: Drag categories to reorder them</span>' +
    "</div>" +
    '<button class="btn btn-secondary btn-close" id="closeCategoryManagerBtn" type="button" aria-label="Close category manager">' +
    '<span class="btn-icon" aria-hidden="true">✕</span>' +
    '<span class="btn-text">Close</span>' +
    "</button>" +
    "</div>" +
    "</div>"
  );
}

function buildEmptyState() {
  return (
    "" +
    '<div class="empty-state-container">' +
    '<div class="empty-state-icon">📂</div>' +
    '<h3 class="empty-state-title">No Categories Yet</h3>' +
    '<p class="empty-state-description">Create your first category to start organizing your expenses</p>' +
    '<div class="empty-state-suggestions">' +
    "<h4>Popular categories:</h4>" +
    '<div class="suggestion-chips">' +
    '<button class="suggestion-chip" data-name="Food & Dining" data-color="#e74c3c">🍕 Food & Dining</button>' +
    '<button class="suggestion-chip" data-name="Transportation" data-color="#3498db">🚗 Transportation</button>' +
    '<button class="suggestion-chip" data-name="Entertainment" data-color="#9b59b6">🎬 Entertainment</button>' +
    '<button class="suggestion-chip" data-name="Shopping" data-color="#f39c12">🛒 Shopping</button>' +
    '<button class="suggestion-chip" data-name="Bills & Utilities" data-color="#2ecc71">💡 Bills & Utilities</button>' +
    '<button class="suggestion-chip" data-name="Healthcare" data-color="#e67e22">⚕️ Healthcare</button>' +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function buildCategoriesGrid(categories) {
  // Get sorted categories by order
  const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => {
    const orderA =
      typeof a === "object" && a?.order !== undefined ? a.order : 999;
    const orderB =
      typeof b === "object" && b?.order !== undefined ? b.order : 999;
    return orderA - orderB;
  });

  let html = '<div class="categories-grid" id="categoriesGrid">';

  sortedCategories.forEach(([categoryName, categoryData], index) => {
    const order =
      typeof categoryData === "object" && categoryData?.order !== undefined
        ? categoryData.order
        : index;
    const color =
      typeof categoryData === "string"
        ? categoryData
        : categoryData?.color || "#cccccc";
    const subcategories =
      typeof categoryData === "object" && categoryData?.subcategories
        ? categoryData.subcategories
        : {};
    const subCount = Object.keys(subcategories).length;

    html +=
      '<div class="category-card" data-category="' +
      categoryName +
      '" data-order="' +
      order +
      '" draggable="true">' +
      '<div class="category-card-header">' +
      '<div class="category-visual">' +
      '<div class="category-color-display" style="background-color: ' +
      color +
      '"></div>' +
      '<div class="drag-handle">⋮⋮</div>' +
      "</div>" +
      '<div class="category-info">' +
      '<h5 class="category-name-display">' +
      categoryName +
      "</h5>" +
      '<span class="category-order">Order: ' +
      order +
      "</span>" +
      "</div>" +
      '<div class="category-actions">' +
      '<button class="btn-icon-small btn-edit" title="Edit category" data-category="' +
      categoryName +
      '">' +
      "✏️" +
      "</button>" +
      '<button class="btn-icon-small btn-delete" title="Delete category" data-category="' +
      categoryName +
      '">' +
      "🗑️" +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="category-card-body">' +
      '<div class="category-stats">' +
      '<div class="stat">' +
      '<span class="card-stat-label">Subcategories</span>' +
      '<span class="stat-value">' +
      subCount +
      "</span>" +
      "</div>" +
      "</div>" +
      (subCount > 0
        ? '<button class="btn-subcategories" data-category="' +
        categoryName +
        '">' +
        '<span class="subcategory-icon">📁</span>' +
        "<span>Manage " +
        subCount +
        " subcategories</span>" +
        '<span class="expand-icon">▼</span>' +
        "</button>"
        : '<button class="btn-add-subcategory" data-category="' +
        categoryName +
        '">' +
        '<span class="add-icon">+</span>' +
        "<span>Add subcategory</span>" +
        "</button>") +
      "</div>" +
      "<!-- Edit Form (hidden by default) -->" +
      '<div class="category-edit-form" style="display: none;">' +
      '<div class="edit-form-header">' +
      "<h6>Edit Category</h6>" +
      '<button class="btn-close-edit" data-category="' +
      categoryName +
      '">✕</button>' +
      "</div>" +
      '<div class="edit-form-body">' +
      '<div class="input-group-inline">' +
      '<div class="input-wrapper-small">' +
      "<label>Name</label>" +
      '<input type="text" class="edit-name-input" value="' +
      categoryName +
      '" data-category="' +
      categoryName +
      '">' +
      "</div>" +
      '<div class="input-wrapper-small">' +
      "<label>Color</label>" +
      '<input type="color" class="edit-color-input" value="' +
      color +
      '" data-category="' +
      categoryName +
      '">' +
      "</div>" +
      '<div class="input-wrapper-small">' +
      "<label>Order</label>" +
      '<input type="number" class="edit-order-input" value="' +
      order +
      '" data-category="' +
      categoryName +
      '" min="0" max="999">' +
      "</div>" +
      "</div>" +
      '<div class="edit-form-actions">' +
      '<button class="btn btn-success btn-sm btn-save-edit" data-category="' +
      categoryName +
      '">' +
      '<span class="btn-icon">💾</span> Save' +
      "</button>" +
      '<button class="btn btn-secondary btn-sm btn-cancel-edit" data-category="' +
      categoryName +
      '">' +
      "Cancel" +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "<!-- Subcategories Section (hidden by default) -->" +
      '<div class="subcategories-section" style="display: none;" data-category="' +
      categoryName +
      '">' +
      buildSubcategoriesSection(categoryName, subcategories) +
      "</div>" +
      "</div>";
  });

  html += "</div>";
  return html;
}

function buildSubcategoriesSection(categoryName, subcategories) {
  let html =
    "" +
    '<div class="subcategories-header">' +
    '<h5><span class="subcategory-icon">📁</span> Subcategories for ' +
    categoryName +
    "</h5>" +
    '<button class="btn-close-subcategories" data-category="' +
    categoryName +
    '" title="Close subcategories">✕</button>' +
    "</div>" +
    '<div class="add-subcategory-form">' +
    '<div class="subcategory-form-row">' +
    '<div class="input-wrapper-small">' +
    "<label>Name</label>" +
    '<input type="text"' +
    ' class="subname-input"' +
    ' placeholder="Subcategory name"' +
    ' data-parent="' +
    categoryName +
    '">' +
    "</div>" +
    '<div class="input-wrapper-small">' +
    "<label>Color</label>" +
    '<input type="color"' +
    ' class="subcolor-input"' +
    ' value="#e74c3c"' +
    ' data-parent="' +
    categoryName +
    '">' +
    "</div>" +
    '<div class="input-wrapper-small">' +
    '<button class="btn btn-success btn-sm add-subcategory-btn" data-parent="' +
    categoryName +
    '">' +
    '<span class="btn-icon">+</span>' +
    '<span class="btn-text">Add</span>' +
    "</button>" +
    "</div>" +
    "</div>" +
    "</div>";

  if (Object.keys(subcategories).length > 0) {
    html += '<div class="subcategories-grid">';

    Object.entries(subcategories).forEach(function ([subName, subColor]) {
      html +=
        "" +
        '<div class="subcategory-card" data-parent="' +
        categoryName +
        '" data-subcategory="' +
        subName +
        '">' +
        '<div class="subcategory-header">' +
        '<div class="subcategory-color" style="background-color: ' +
        subColor +
        '"></div>' +
        '<span class="subcategory-name">' +
        subName +
        "</span>" +
        '<div class="subcategory-actions">' +
        '<button class="btn-icon-mini btn-edit-subcategory" ' +
        'title="Edit subcategory"' +
        ' data-parent="' +
        categoryName +
        '" ' +
        ' data-subcategory="' +
        subName +
        '">✏️</button>' +
        '<button class="btn-icon-mini btn-delete-subcategory" ' +
        'title="Delete subcategory"' +
        ' data-parent="' +
        categoryName +
        '" ' +
        ' data-subcategory="' +
        subName +
        '">🗑️</button>' +
        "</div>" +
        "</div>" +
        "<!-- Edit form for subcategory (hidden by default) -->" +
        '<div class="subcategory-edit-form" style="display: none;">' +
        '<div class="edit-inputs">' +
        '<input type="text"' +
        ' class="edit-subname-input"' +
        ' value="' +
        subName +
        '"' +
        ' data-parent="' +
        categoryName +
        '"' +
        ' data-subcategory="' +
        subName +
        '">' +
        '<input type="color"' +
        ' class="edit-subcolor-input"' +
        ' value="' +
        subColor +
        '"' +
        ' data-parent="' +
        categoryName +
        '"' +
        ' data-subcategory="' +
        subName +
        '">' +
        "</div>" +
        '<div class="edit-actions">' +
        '<button class="btn-icon-mini btn-save-subcategory" ' +
        ' data-parent="' +
        categoryName +
        '" ' +
        ' data-subcategory="' +
        subName +
        '">💾</button>' +
        '<button class="btn-icon-mini btn-cancel-subcategory" ' +
        ' data-parent="' +
        categoryName +
        '" ' +
        ' data-subcategory="' +
        subName +
        '">✕</button>' +
        "</div>" +
        "</div>" +
        "</div>";
    });

    html += "</div>";
  } else {
    html +=
      "" +
      '<div class="subcategories-empty">' +
      "<p>No subcategories yet. Add one above to get started.</p>" +
      "</div>";
  }

  return html;
}

function attachCategoryManagerEventListeners(container, modal) {
  // Add category button
  const addCategoryBtn = container.querySelector("#addCategoryBtn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      const nameInput = container.querySelector("#newCategoryName");
      const colorInput = container.querySelector("#newCategoryColor");

      if (nameInput.value.trim()) {
        if (addCategory(nameInput.value.trim(), colorInput.value)) {
          // Clear inputs and refresh the modal content
          nameInput.value = "";
          colorInput.value = "#3498db";
          container.innerHTML = buildCategoryManagerHTML();
          attachCategoryManagerEventListeners(container, modal);
        }
      }
    });
  }

  // Reset to default categories button
  const resetCategoriesBtn = container.querySelector("#resetCategoriesBtn");
  if (resetCategoriesBtn) {
    resetCategoriesBtn.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to reset all categories to defaults? This will remove all your custom categories and cannot be undone."
        )
      ) {
        resetToDefaultCategories();
        // Refresh the modal content
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  }

  // FIXED: Add search functionality with proper selector
  const searchInput = container.querySelector("#categorySearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const categoryCards = container.querySelectorAll(".category-card");

      categoryCards.forEach((card) => {
        // Fix: Use the correct selector for category name
        const categoryNameElement = card.querySelector(
          ".category-name-display"
        );
        const categoryName =
          categoryNameElement?.textContent?.toLowerCase() || "";
        const shouldShow = !searchTerm || categoryName.includes(searchTerm);
        card.style.display = shouldShow ? "block" : "none";
      });

      // Update category count
      const visibleCount = Array.from(categoryCards).filter(
        (card) => card.style.display !== "none"
      ).length;
      const countBadge = container.querySelector(".category-count-badge");
      if (countBadge) {
        countBadge.textContent = visibleCount;
      }
    });
  }

  // Close button
  const closeBtn = container.querySelector("#closeCategoryManagerBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.close();
    });
  }

  // Suggestion chips for empty state
  container.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      const name = e.target.dataset.name;
      const color = e.target.dataset.color;
      if (name && color) {
        addCategory(name, color);
        // Refresh the modal content
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modal);
      }
    });
  });

  // Edit category buttons (new card layout)
  container.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const editForm = categoryCard.querySelector(".category-edit-form");

      if (editForm) {
        // Toggle edit form visibility
        const isVisible = editForm.style.display !== "none";
        editForm.style.display = isVisible ? "none" : "block";
      }
    });
  });

  // Delete category buttons (new card layout)
  container.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryName = (e.currentTarget || e.target).dataset.category;
      if (confirm('Delete category "' + categoryName + '"?')) {
        if (deleteCategory(categoryName)) {
          container.innerHTML = buildCategoryManagerHTML();
          attachCategoryManagerEventListeners(container, modal);
        }
      }
    });
  });

  // Save edit buttons
  container.querySelectorAll(".btn-save-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget || e.target;
      const categoryName = target.dataset.category;
      const categoryCard = target.closest(".category-card");
      const nameInput = categoryCard.querySelector(".edit-name-input");
      const colorInput = categoryCard.querySelector(".edit-color-input");
      const orderInput = categoryCard.querySelector(".edit-order-input");

      if (nameInput?.value && colorInput?.value) {
        const newName = nameInput.value.trim();
        const newColor = colorInput.value;
        const newOrder = parseInt(orderInput.value) || 0;

        if (newName) {
          // Update the category
          const oldData = AppState.categories[categoryName];
          const updatedData = {
            ...oldData,
            color: newColor,
            order: newOrder,
          };

          // If name changed, need to handle rename
          if (newName !== categoryName) {
            delete AppState.categories[categoryName];
            AppState.categories[newName] = updatedData;
          } else {
            AppState.categories[categoryName] = updatedData;
          }

          // Save to localStorage
          localStorage.setItem(
            "categories",
            JSON.stringify(AppState.categories)
          );

          // Update category UI in transaction areas
          refreshCategoryDropdowns();

          // Refresh modal content
          container.innerHTML = buildCategoryManagerHTML();
          attachCategoryManagerEventListeners(container, modal);

          import("./uiManager.js").then((module) => {
            module.showToast(
              'Category "' + newName + '" updated successfully',
              "success"
            );
          });
        }
      }
    });
  });

  // Cancel edit buttons
  container.querySelectorAll(".btn-cancel-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const editForm = categoryCard.querySelector(".category-edit-form");
      if (editForm) {
        editForm.style.display = "none";
      }
    });
  });

  // Close edit buttons
  container.querySelectorAll(".btn-close-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const editForm = categoryCard.querySelector(".category-edit-form");
      if (editForm) {
        editForm.style.display = "none";
      }
    });
  });

  // Subcategory management buttons
  container.querySelectorAll(".btn-subcategories").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const subcategoriesSection = categoryCard.querySelector(
        ".subcategories-section"
      );

      if (subcategoriesSection) {
        const isVisible = subcategoriesSection.style.display !== "none";
        subcategoriesSection.style.display = isVisible ? "none" : "block";

        // Update button text
        const expandIcon = btn.querySelector(".expand-icon");
        if (expandIcon) {
          expandIcon.textContent = isVisible ? "▼" : "▲";
        }

        if (!isVisible) {
          // Attach subcategory listeners when showing
          attachSubcategoryEventListeners(
            subcategoriesSection,
            container,
            modal
          );
        }
      }
    });
  });

  // Add subcategory buttons
  container.querySelectorAll(".btn-add-subcategory").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const subcategoriesSection = categoryCard.querySelector(
        ".subcategories-section"
      );

      if (subcategoriesSection) {
        subcategoriesSection.style.display = "block";
        // Focus on the subcategory name input
        const nameInput = subcategoriesSection.querySelector(".subname-input");
        if (nameInput) {
          nameInput.focus();
        }
        attachSubcategoryEventListeners(subcategoriesSection, container, modal);
      }
    });
  });

  // FIXED: Add close subcategories functionality
  container.querySelectorAll(".btn-close-subcategories").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const categoryCard = e.target.closest(".category-card");
      const subcategoriesSection = categoryCard.querySelector(
        ".subcategories-section"
      );
      if (subcategoriesSection) {
        subcategoriesSection.style.display = "none";

        // Update expand icon
        const expandBtn = categoryCard.querySelector(".btn-subcategories");
        const expandIcon = expandBtn?.querySelector(".expand-icon");
        if (expandIcon) {
          expandIcon.textContent = "▼";
        }
      }
    });
  });

  // FIXED: Add drag and drop functionality for categories
  setupCategoryDragAndDrop(container, modal);
}

/**
 * Setup drag and drop functionality for category reordering
 */
function setupCategoryDragAndDrop(container, modal) {
  const categoriesGrid = container.querySelector("#categoriesGrid");
  if (!categoriesGrid) return;

  let draggedElement = null;
  let dropTarget = null;

  // FIXED: Remove existing event listeners to prevent duplicates
  container.querySelectorAll(".category-card").forEach((card) => {
    // Clone the element to remove all event listeners
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
  });

  // FIXED: Re-query the updated cards and add fresh event listeners
  container.querySelectorAll(".category-card").forEach((card) => {
    // Make sure the card is draggable
    card.draggable = true;

    card.addEventListener("dragstart", (e) => {
      draggedElement = card;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", card.outerHTML);

      // FIXED: Add opacity to dragged element
      card.style.opacity = "0.5";

      // Store category name for debugging
      console.log("Drag started for category:", card.dataset.category);
    });

    card.addEventListener("dragend", (e) => {
      card.classList.remove("dragging");
      card.style.opacity = "1"; // FIXED: Reset opacity
      draggedElement = null;
      dropTarget = null;

      // Remove all drop indicators and drag-over classes
      container.querySelectorAll(".drop-indicator").forEach((indicator) => {
        indicator.remove();
      });
      container.querySelectorAll(".drag-over").forEach((element) => {
        element.classList.remove("drag-over");
      });

      console.log("Drag ended");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const currentCard = e.target.closest(".category-card");
      if (currentCard && currentCard !== draggedElement) {
        dropTarget = currentCard;

        // Add visual drop indicator
        const rect = dropTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isAfter = e.clientY > midpoint;

        // Remove existing indicators
        container.querySelectorAll(".drop-indicator").forEach((indicator) => {
          indicator.remove();
        });

        // Add new indicator
        const indicator = document.createElement("div");
        indicator.className = "drop-indicator";
        indicator.style.cssText =
          "" +
          "height: 4px;" +
          "background: linear-gradient(90deg, #6366f1, #8b5cf6);" +
          "margin: 8px 0;" +
          "border-radius: 4px;" +
          "opacity: 0.9;" +
          "box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);" +
          "animation: pulse-indicator 1s ease-in-out infinite;";

        if (isAfter) {
          dropTarget.parentNode.insertBefore(indicator, dropTarget.nextSibling);
        } else {
          dropTarget.parentNode.insertBefore(indicator, dropTarget);
        }
      }
    });

    // FIXED: Add drag enter and leave events for better visual feedback
    card.addEventListener("dragenter", (e) => {
      e.preventDefault();
      const currentCard = e.target.closest(".category-card");
      if (currentCard && currentCard !== draggedElement) {
        currentCard.classList.add("drag-over");
      }
    });

    card.addEventListener("dragleave", (e) => {
      const currentCard = e.target.closest(".category-card");
      if (currentCard && !currentCard.contains(e.relatedTarget)) {
        currentCard.classList.remove("drag-over");
      }
    });

    // FIXED: Single drop event listener with proper logic
    card.addEventListener("drop", (e) => {
      e.preventDefault();

      console.log("Drop event triggered");

      if (draggedElement && dropTarget && draggedElement !== dropTarget) {
        const draggedCategory = draggedElement.dataset.category;
        const targetCategory = dropTarget.dataset.category;

        console.log(
          "Reordering:",
          draggedCategory,
          "relative to",
          targetCategory
        );

        // Calculate drop position
        const rect = dropTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isAfter = e.clientY > midpoint;

        // Reorder categories in AppState
        reorderCategories(draggedCategory, targetCategory, isAfter);

        // FIXED: Get modal reference from the container's parent modal
        const modalElement = container.closest(".modal-overlay");
        const modalInstance = modalElement
          ? modalElement.modalInstance || categoryManagerModalInstance
          : categoryManagerModalInstance;

        // FIXED: Refresh the modal but preserve the open state of any expanded sections
        const openSubcategories = [];
        container
          .querySelectorAll('.subcategories-section[style*="block"]')
          .forEach((section) => {
            openSubcategories.push(section.dataset.category);
          });

        // Rebuild and reattach
        container.innerHTML = buildCategoryManagerHTML();
        attachCategoryManagerEventListeners(container, modalInstance);

        // FIXED: Restore open subcategory sections
        openSubcategories.forEach((categoryName) => {
          const categoryCard = container.querySelector(
            '[data-category="' + categoryName + '"]'
          );
          if (categoryCard) {
            const subcategoriesSection = categoryCard.querySelector(
              ".subcategories-section"
            );
            if (subcategoriesSection) {
              subcategoriesSection.style.display = "block";
              const expandBtn = categoryCard.querySelector(
                ".btn-subcategories .expand-icon"
              );
              if (expandBtn) expandBtn.textContent = "▲";
              attachSubcategoryEventListeners(
                subcategoriesSection,
                container,
                modalInstance
              );
            }
          }
        });

        // Show success message
        import("./uiManager.js").then((module) => {
          module.showToast("Categories reordered successfully! 🎉", "success");
        });
      }

      // Clean up
      draggedElement = null;
      dropTarget = null;
    });
  });
}

/**
 * Reorder categories by updating their order values
 */
function reorderCategories(
  draggedCategoryName,
  targetCategoryName,
  insertAfter
) {
  const categories = AppState.categories || {};

  // Get current orders
  const categoryEntries = Object.entries(categories)
    .map(([name, data]) => ({
      name,
      data,
      order:
        typeof data === "object" && data.order !== undefined ? data.order : 999,
    }))
    .sort((a, b) => a.order - b.order);

  // Find dragged and target positions
  const draggedIndex = categoryEntries.findIndex(
    (cat) => cat.name === draggedCategoryName
  );
  const targetIndex = categoryEntries.findIndex(
    (cat) => cat.name === targetCategoryName
  );

  if (draggedIndex === -1 || targetIndex === -1) return;

  // Remove dragged item
  const [draggedItem] = categoryEntries.splice(draggedIndex, 1);

  // Insert at new position
  const newTargetIndex =
    draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = insertAfter ? newTargetIndex + 1 : newTargetIndex;
  categoryEntries.splice(insertIndex, 0, draggedItem);

  // Update orders
  categoryEntries.forEach((item, index) => {
    if (typeof item.data === "object") {
      item.data.order = index + 1;
    } else {
      // Convert string to object format
      AppState.categories[item.name] = {
        color: item.data,
        order: index + 1,
        subcategories: {},
      };
    }
  });

  // Save to localStorage
  localStorage.setItem("categories", JSON.stringify(AppState.categories));

  // Update all category UI elements
  refreshCategoryDropdowns();
}

function saveCategoryChanges(categoryName, container) {
  const row = container.querySelector('[data-category="' + categoryName + '"]');
  if (!row) return;

  const orderInput = row.querySelector(".order-input");
  const colorInput = row.querySelector(".color-input");
  const nameInput = row.querySelector(".name-input");

  const newOrder = parseInt(orderInput.value) || 0;
  const newColor = colorInput.value;
  const newName = nameInput.value.trim();

  if (!newName) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category name cannot be empty", "error");
    });
    return;
  }

  updateCategory(categoryName, newName, newColor);

  // Update order if it's different
  if (
    AppState.categories[newName] &&
    typeof AppState.categories[newName] === "object"
  ) {
    AppState.categories[newName].order = newOrder;
    localStorage.setItem("categories", JSON.stringify(AppState.categories));
  }
}

function saveSubcategoryChanges(parentCategory, subcategoryName, container) {
  // Implementation for saving subcategory changes
  console.log("Saving subcategory changes:", parentCategory, subcategoryName);
}

/**
 * Reset to default categories
 */
export function resetToDefaultCategories() {
  // Import default categories
  import("../constants/categories.js")
    .then((categoriesModule) => {
      // Clear existing categories
      AppState.categories = {};

      // Set default categories
      AppState.categories = { ...categoriesModule.DEFAULT_CATEGORIES };

      // Save to localStorage
      localStorage.setItem("categories", JSON.stringify(AppState.categories));

      // FIXED: Clear invalid category selections from transactions
      if (AppState.transactions) {
        const validCategories = Object.keys(AppState.categories);
        AppState.transactions.forEach((transaction) => {
          if (
            transaction.category &&
            !validCategories.includes(transaction.category)
          ) {
            transaction.category = ""; // Clear invalid category
            transaction.subcategory = ""; // Clear subcategory too
          }
        });

        // Save updated transactions
        localStorage.setItem(
          "transactions",
          JSON.stringify(AppState.transactions)
        );
      }

      // Clear any existing category mappings
      import("./categoryMapping.js")
        .then((mappingModule) => {
          if (mappingModule.resetCategoryMappingsForDefaults) {
            mappingModule.resetCategoryMappingsForDefaults();
          }
        })
        .catch((error) => {
          console.warn("Could not reset category mappings:", error);
        });

      console.log(
        "Reset: Loaded " +
        Object.keys(AppState.categories).length +
        " default categories"
      );

      // Update all category UI elements
      refreshCategoryDropdowns();

      // Update transaction manager to render fresh data
      import("./transactionManager.js")
        .then((module) => {
          if (module.renderTransactions) {
            module.renderTransactions(AppState.transactions || [], false);
          }
        })
        .catch((error) => {
          console.warn("Could not update transaction UI:", error);
        });

      // FIXED: Update charts after reset
      setTimeout(async () => {
        try {
          const chartsModule = await import("./charts.js");
          if (chartsModule?.updateCharts) {
            chartsModule.updateCharts();
            console.log("Charts updated after category reset");
          }
        } catch (error) {
          console.log("Charts not available for update:", error.message);
        }
      }, 300);

      import("./uiManager.js").then((module) => {
        if (module.showToast) {
          module.showToast("Categories reset to defaults", "success");
        }
      });
    })
    .catch((error) => {
      console.error("Error loading default categories:", error);
    });
}

/**
 * Handle managing subcategories for a category
 */
function handleManageSubcategories(categoryName) {
  console.log("Managing subcategories for: " + categoryName);

  const categories = AppState.categories || {};
  const categoryData = categories[categoryName] || {};
  const subcategories = categoryData.subcategories || {};

  const modalContent = document.createElement("div");
  modalContent.className = "subcategory-manager-content";

  let html =
    '<div class="subcategory-header">' +
    "<h3>Manage Subcategories for: " +
    categoryName +
    "</h3>" +
    "<p>Organize your transactions with more specific subcategories.</p>" +
    "</div>" +
    '<div class="add-subcategory-section">' +
    "<h4>Add New Subcategory</h4>" +
    '<div class="subcategory-form">' +
    '<input type="text" id="newSubcategoryName" placeholder="Subcategory name" maxlength="50">' +
    '<input type="color" id="newSubcategoryColor" value="#3498db" title="Choose color">' +
    '<button id="addSubcategoryBtn" class="button primary-btn">Add Subcategory</button>' +
    "</div>" +
    "</div>" +
    '<div class="existing-subcategories-section">' +
    "<h4>Existing Subcategories (" +
    Object.keys(subcategories).length +
    ")</h4>" +
    '<div id="subcategoriesList" class="subcategories-list">';

  if (Object.keys(subcategories).length === 0) {
    html +=
      '<div class="empty-subcategories">' +
      "<p>No subcategories yet. Add some above!</p>" +
      "</div>";
  } else {
    Object.entries(subcategories).forEach(([subName, subColor]) => {
      html +=
        '<div class="subcategory-item" data-subcategory="' +
        subName +
        '">' +
        '<div class="subcategory-info">' +
        '<span class="subcategory-color" style="background-color: ' +
        subColor +
        ';"></span>' +
        '<span class="subcategory-name">' +
        subName +
        "</span>" +
        "</div>" +
        '<div class="subcategory-actions">' +
        '<input type="color" class="subcategory-color-picker" value="' +
        subColor +
        '" data-subcategory="' +
        subName +
        '" title="Change color">' +
        '<button class="remove-subcategory-btn" data-subcategory="' +
        subName +
        '" title="Remove subcategory">🗑️</button>' +
        "</div>" +
        "</div>";
    });
  }

  html +=
    "</div>" +
    "</div>" +
    '<div class="subcategory-actions-footer">' +
    '<button id="closeSubcategoryModal" class="button secondary-btn">Close</button>' +
    "</div>";

  modalContent.innerHTML = html;

  const subcategoryModal = showModal({
    title: "Subcategories: " + categoryName,
    content: modalContent,
    size: "medium",
    closeOnClickOutside: false,
  });

  // Attach event listeners
  attachSubcategoryModalEventListeners(
    modalContent,
    subcategoryModal,
    categoryName
  );
}

/**
 * Attach event listeners for subcategory management modal
 */
function attachSubcategoryModalEventListeners(container, modal, categoryName) {
  // Add subcategory button
  const addBtn = container.querySelector("#addSubcategoryBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const nameInput = container.querySelector("#newSubcategoryName");
      const colorInput = container.querySelector("#newSubcategoryColor");

      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        showToast("Please enter a subcategory name", "warning");
        return;
      }

      // Add subcategory
      if (!AppState.categories[categoryName]) {
        AppState.categories[categoryName] = {};
      }
      if (!AppState.categories[categoryName].subcategories) {
        AppState.categories[categoryName].subcategories = {};
      }

      AppState.categories[categoryName].subcategories[name] = color;

      // Save to localStorage
      localStorage.setItem("categories", JSON.stringify(AppState.categories));

      showToast('Subcategory "' + name + '" added successfully', "success");

      // Refresh the modal
      modal.close();
      setTimeout(() => handleManageSubcategories(categoryName), 100);
    });
  }

  // Remove subcategory buttons
  container.querySelectorAll(".remove-subcategory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const subcategoryName = e.target.getAttribute("data-subcategory");

      if (
        confirm(
          'Are you sure you want to remove the subcategory "' +
          subcategoryName +
          '"?'
        )
      ) {
        delete AppState.categories[categoryName].subcategories[subcategoryName];

        // Save to localStorage
        localStorage.setItem("categories", JSON.stringify(AppState.categories));

        showToast('Subcategory "' + subcategoryName + '" removed', "success");

        // Refresh the modal
        modal.close();
        setTimeout(() => handleManageSubcategories(categoryName), 100);
      }
    });
  });

  // Color picker changes
  container.querySelectorAll(".subcategory-color-picker").forEach((picker) => {
    picker.addEventListener("change", (e) => {
      const subcategoryName = e.target.getAttribute("data-subcategory");
      const newColor = e.target.value;

      AppState.categories[categoryName].subcategories[subcategoryName] =
        newColor;

      // Save to localStorage
      localStorage.setItem("categories", JSON.stringify(AppState.categories));

      // Update the color display
      const colorSpan = e.target
        .closest(".subcategory-item")
        .querySelector(".subcategory-color");
      colorSpan.style.backgroundColor = newColor;

      showToast('Color updated for "' + subcategoryName + '"', "success");
    });
  });

  // Close button
  const closeBtn = container.querySelector("#closeSubcategoryModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.close();
    });
  }
}

/**
 * Refresh category dropdowns in the transaction area
 */
function refreshCategoryDropdowns() {
  // Update category dropdowns in all transaction rows
  const categorySelects = document.querySelectorAll(
    'select[data-field="category"], .category-select'
  );
  categorySelects.forEach((select) => {
    const currentValue = select.value;

    // Regenerate the dropdown options
    const categories = AppState.categories || {};
    const categoryEntries = Object.entries(categories);

    let options = '<option value="">Select Category</option>';
    categoryEntries.forEach(([categoryName, categoryData]) => {
      const selected = categoryName === currentValue ? "selected" : "";
      options +=
        '<option value="' +
        categoryName +
        '" ' +
        selected +
        ">" +
        categoryName +
        "</option>";
    });

    select.innerHTML = options;

    // FIXED: Add change event listener to update charts in real time
    if (!select.hasAttribute("data-chart-listener")) {
      select.setAttribute("data-chart-listener", "true");
      select.addEventListener("change", () => {
        // FIXED: Update charts immediately when category selection changes
        setTimeout(async () => {
          try {
            const chartsModule = await import("./charts.js");
            if (chartsModule?.updateCharts) {
              chartsModule.updateCharts();
              console.log("Charts updated after category selection change");
            }
          } catch (error) {
            console.log("Charts not available for update:", error.message);
          }
        }, 100);
      });
    }
  });

  // Update bulk category select dropdowns
  const bulkCategorySelects = document.querySelectorAll("#bulkCategorySelect");
  bulkCategorySelects.forEach((select) => {
    const currentValue = select.value;
    const categories = AppState.categories || {};

    let options = '<option value="">Choose Category</option>';
    Object.keys(categories)
      .sort((a, b) => a.localeCompare(b))
      .forEach((categoryName) => {
        const selected = categoryName === currentValue ? "selected" : "";
        options +=
          '<option value="' +
          categoryName +
          '" ' +
          selected +
          ">" +
          categoryName +
          "</option>";
      });

    select.innerHTML = options;
  });

  // Also refresh advanced filters
  const categoryFilters = document.querySelectorAll(
    "#categoryFilter, .category-select-btn"
  );
  categoryFilters.forEach((filter) => {
    // Trigger a refresh of the advanced filters if they exist
    if (
      window.refreshAdvancedFilters &&
      typeof window.refreshAdvancedFilters === "function"
    ) {
      window.refreshAdvancedFilters();
    }
  });

  // Update advanced filters category dropdown specifically
  setTimeout(async () => {
    try {
      const advancedFiltersModule = await import(
        "./filters/advancedFilters.js"
      );
      if (advancedFiltersModule.updateCategoryFilterOptions) {
        advancedFiltersModule.updateCategoryFilterOptions();
        console.log("✅ Advanced filters category dropdown updated");
      }
    } catch (error) {
      console.log("Advanced filters module not available:", error.message);
    }
  }, 50);

  // Update transaction manager to render fresh dropdowns
  setTimeout(() => {
    import("./transactionManager.js")
      .then((module) => {
        if (module.renderTransactions && AppState.transactions) {
          module.renderTransactions(AppState.transactions, false);
        }
      })
      .catch((error) => {
        console.warn("Could not refresh transaction manager:", error);
      });
  }, 100);

  // FIXED: Update charts when categories change
  setTimeout(async () => {
    try {
      const chartsModule = await import("./charts.js");
      if (chartsModule?.updateCharts) {
        chartsModule.updateCharts();
        console.log("Charts updated after category changes");
      }
    } catch (error) {
      console.log("Charts not available for update:", error.message);
    }
  }, 200);
}

/**
 * Add a new category
 */
export function addCategory(name, color) {
  if (!name?.trim()) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category name cannot be empty", "error");
    });
    return false;
  }

  name = name.trim();

  if (AppState.categories[name]) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category already exists", "error");
    });
    return false;
  }

  // Get next order number
  const existingOrders = Object.values(AppState.categories)
    .map((cat) =>
      typeof cat === "object" && cat.order !== undefined ? cat.order : 999
    )
    .sort((a, b) => a - b);

  const nextOrder =
    existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

  AppState.categories[name] = {
    color: color || "#3498db",
    order: nextOrder,
    subcategories: {},
  };

  localStorage.setItem("categories", JSON.stringify(AppState.categories));
  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast('Category "' + name + '" added successfully', "success");
  });

  return true;
}

/**
 * Delete a category
 */
export function deleteCategory(name) {
  if (!name || !AppState.categories[name]) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category not found", "error");
    });
    return false;
  }

  delete AppState.categories[name];
  localStorage.setItem("categories", JSON.stringify(AppState.categories));

  // Clear category from transactions
  if (AppState.transactions) {
    AppState.transactions.forEach((transaction) => {
      if (transaction.category === name) {
        transaction.category = "";
        transaction.subcategory = "";
      }
    });
    localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
  }

  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast('Category "' + name + '" deleted', "success");
  });

  return true;
}

/**
 * Update a category
 */
export function updateCategory(oldName, newName, newColor) {
  if (!oldName || !AppState.categories[oldName]) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category not found", "error");
    });
    return false;
  }

  if (!newName?.trim()) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category name cannot be empty", "error");
    });
    return false;
  }

  newName = newName.trim();

  if (newName !== oldName && AppState.categories[newName]) {
    import("./uiManager.js").then((module) => {
      module.showToast("Category name already exists", "error");
    });
    return false;
  }

  const categoryData = AppState.categories[oldName];

  if (newName !== oldName) {
    // Update transactions that use this category
    if (AppState.transactions) {
      AppState.transactions.forEach((transaction) => {
        if (transaction.category === oldName) {
          transaction.category = newName;
        }
      });
      localStorage.setItem(
        "transactions",
        JSON.stringify(AppState.transactions)
      );
    }

    // Delete old and create new
    delete AppState.categories[oldName];
  }

  AppState.categories[newName] = {
    ...categoryData,
    color: newColor,
  };

  localStorage.setItem("categories", JSON.stringify(AppState.categories));
  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast(
      'Category "' + newName + '" updated successfully',
      "success"
    );
  });

  return true;
}

/**
 * Add a subcategory
 */
export function addSubcategory(parentName, subName, subColor) {
  // FIXED: Better error handling and parent category validation
  if (!parentName?.trim()) {
    import("./uiManager.js").then((module) => {
      module.showToast("Parent category name is required", "error");
    });
    return false;
  }

  parentName = parentName.trim();

  // FIXED: Initialize categories if not exists
  if (!AppState.categories) {
    AppState.categories = {};
  }

  // FIXED: Check if parent category exists, if not create it
  if (!AppState.categories[parentName]) {
    import("./uiManager.js").then((module) => {
      module.showToast(
        'Parent category "' +
        parentName +
        '" not found. Please create it first.',
        "error"
      );
    });
    return false;
  }

  if (!subName?.trim()) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory name cannot be empty", "error");
    });
    return false;
  }

  subName = subName.trim();

  // FIXED: Ensure parent category has proper structure
  if (typeof AppState.categories[parentName] === "string") {
    AppState.categories[parentName] = {
      color: AppState.categories[parentName],
      order: 999,
      subcategories: {},
    };
  }

  if (!AppState.categories[parentName].subcategories) {
    AppState.categories[parentName].subcategories = {};
  }

  if (AppState.categories[parentName].subcategories[subName]) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory already exists", "error");
    });
    return false;
  }

  AppState.categories[parentName].subcategories[subName] =
    subColor || "#e74c3c";
  localStorage.setItem("categories", JSON.stringify(AppState.categories));
  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast(
      'Subcategory "' + subName + '" added successfully',
      "success"
    );
  });

  return true;
}

/**
 * Update a subcategory
 */
export function updateSubcategory(
  parentName,
  oldSubName,
  newSubName,
  newSubColor
) {
  if (
    !parentName ||
    !AppState.categories[parentName]?.subcategories?.[oldSubName]
  ) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory not found", "error");
    });
    return false;
  }

  if (!newSubName?.trim()) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory name cannot be empty", "error");
    });
    return false;
  }

  newSubName = newSubName.trim();

  if (
    newSubName !== oldSubName &&
    AppState.categories[parentName].subcategories[newSubName]
  ) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory name already exists", "error");
    });
    return false;
  }

  if (newSubName !== oldSubName) {
    // Update transactions that use this subcategory
    if (AppState.transactions) {
      AppState.transactions.forEach((transaction) => {
        if (
          transaction.category === parentName &&
          transaction.subcategory === oldSubName
        ) {
          transaction.subcategory = newSubName;
        }
      });
      localStorage.setItem(
        "transactions",
        JSON.stringify(AppState.transactions)
      );
    }

    // Delete old and create new
    delete AppState.categories[parentName].subcategories[oldSubName];
  }

  AppState.categories[parentName].subcategories[newSubName] = newSubColor;
  localStorage.setItem("categories", JSON.stringify(AppState.categories));
  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast(
      'Subcategory "' + newSubName + '" updated successfully',
      "success"
    );
  });

  return true;
}

/**
 * Delete a subcategory
 */
export function deleteSubcategory(parentName, subName) {
  if (
    !parentName ||
    !AppState.categories[parentName]?.subcategories?.[subName]
  ) {
    import("./uiManager.js").then((module) => {
      module.showToast("Subcategory not found", "error");
    });
    return false;
  }

  delete AppState.categories[parentName].subcategories[subName];
  localStorage.setItem("categories", JSON.stringify(AppState.categories));

  // Clear subcategory from transactions
  if (AppState.transactions) {
    AppState.transactions.forEach((transaction) => {
      if (
        transaction.category === parentName &&
        transaction.subcategory === subName
      ) {
        transaction.subcategory = "";
      }
    });
    localStorage.setItem("transactions", JSON.stringify(AppState.transactions));
  }

  refreshCategoryDropdowns();

  import("./uiManager.js").then((module) => {
    module.showToast('Subcategory "' + subName + '" deleted', "success");
  });

  return true;
}

/**
 * Attach event listeners for subcategory sections
 */
function attachSubcategoryEventListeners(
  subcategoriesSection,
  container,
  modal
) {
  if (!subcategoriesSection) return;

  // Add subcategory button
  const addBtn = subcategoriesSection.querySelector(".add-subcategory-btn");
  if (addBtn) {
    addBtn.addEventListener("click", (e) => {
      const parentName = (e.currentTarget || e.target).getAttribute("data-parent");
      const nameInput = subcategoriesSection.querySelector(".subname-input");
      const colorInput = subcategoriesSection.querySelector(".subcolor-input");

      if (nameInput && colorInput) {
        const name = nameInput.value.trim();
        const color = colorInput.value;

        if (name && addSubcategory(parentName, name, color)) {
          nameInput.value = "";
          colorInput.value = "#e74c3c";

          // Refresh the modal content
          container.innerHTML = buildCategoryManagerHTML();
          attachCategoryManagerEventListeners(container, modal);
        }
      }
    });
  }

  // Edit subcategory buttons
  subcategoriesSection
    .querySelectorAll(".btn-edit-subcategory")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const subcategoryCard = e.target.closest(".subcategory-card");
        const editForm = subcategoryCard.querySelector(
          ".subcategory-edit-form"
        );

        if (editForm) {
          const isVisible = editForm.style.display !== "none";
          editForm.style.display = isVisible ? "none" : "block";
        }
      });
    });

  // Save subcategory buttons
  subcategoriesSection
    .querySelectorAll(".btn-save-subcategory")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const parentName = (e.currentTarget || e.target).getAttribute("data-parent");
        const oldSubName = (e.currentTarget || e.target).getAttribute("data-subcategory");
        const subcategoryCard = e.target.closest(".subcategory-card");
        const nameInput = subcategoryCard.querySelector(".edit-subname-input");
        const colorInput = subcategoryCard.querySelector(
          ".edit-subcolor-input"
        );

        if (nameInput && colorInput) {
          const newSubName = nameInput.value.trim();
          const newSubColor = colorInput.value;

          if (
            newSubName &&
            updateSubcategory(parentName, oldSubName, newSubName, newSubColor)
          ) {
            // Refresh the modal content
            container.innerHTML = buildCategoryManagerHTML();
            attachCategoryManagerEventListeners(container, modal);
          }
        }
      });
    });

  // Cancel subcategory buttons
  subcategoriesSection
    .querySelectorAll(".btn-cancel-subcategory")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const subcategoryCard = e.target.closest(".subcategory-card");
        const editForm = subcategoryCard.querySelector(
          ".subcategory-edit-form"
        );
        if (editForm) {
          editForm.style.display = "none";
        }
      });
    });

  // Delete subcategory buttons
  subcategoriesSection
    .querySelectorAll(".btn-delete-subcategory")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const parentName = (e.currentTarget || e.target).getAttribute("data-parent");
        const subName = (e.currentTarget || e.target).getAttribute("data-subcategory");

        if (confirm('Delete subcategory "' + subName + '"?')) {
          if (deleteSubcategory(parentName, subName)) {
            // Refresh the modal content
            container.innerHTML = buildCategoryManagerHTML();
            attachCategoryManagerEventListeners(container, modal);
          }
        }
      });
    });
}

console.log("Category manager module loaded");
