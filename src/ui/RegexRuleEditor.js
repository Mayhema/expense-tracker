import {
  descriptionCategoryMap,
  saveCategoryMappings,
} from "../ui/categoryMapping.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";
import { AppState } from "../core/appState.js";

// Open regex rule editor modal
export function openRegexRuleEditor() {
  // First close any existing modals to prevent double modals
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  });

  // Make sure mappings are initialized
  const categoryMappings = descriptionCategoryMap.init().map;

  const container = document.createElement("div");

  // Show existing rules with a scrollable container and better styling
  container.innerHTML = `
    <style>
      .regex-rules-container {
        margin-bottom: 20px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 4px;
      }
      .regex-rule-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #eee;
        align-items: center;
      }
      .regex-rule-row:last-child {
        border-bottom: none;
      }
      .regex-rule-row:hover {
        background-color: #f8f8f8;
      }
      .regex-pattern {
        font-family: monospace;
        flex: 2;
        padding-right: 10px;
      }
      .regex-category {
        flex: 1;
        padding-right: 10px;
      }
      .regex-actions {
        flex: 0 0 60px;
        text-align: right;
      }
      .dark-mode .regex-rule-row:hover {
        background-color: #333;
      }
      .rule-form {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
      }
      .dark-mode .rule-form {
        background: #333;
      }
      .form-row {
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
      }
      .form-row label {
        margin-bottom: 5px;
        font-weight: bold;
      }
      .form-row input, .form-row select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-height: 38px; /* Ensure a decent minimum height for select */
        height: auto; /* Allow select to grow if content is larger, though usually not for select */
      }
      #ruleCategory { /* Specific styling for the category dropdown */
        /* height: auto; /* Default is usually fine, but ensure it's not constrained */
        /* padding: 8px; /* Already set by .form-row select */
      }
      .button-row {
        display: flex;
        justify-content: flex-end;
        margin-top: 15px;
      }
    </style>

    <div class="rule-form">
      <h3>Add New Rule</h3>
      <div class="form-row">
        <label for="rulePattern">Regex Pattern:</label>
        <input id="rulePattern" type="text" placeholder="e.g. ^coffee|starbucks" />
      </div>
      <div class="form-row">
        <label for="ruleCategory">Category:</label>
        <select id="ruleCategory" class="category-select">
          <option value="">Select a category</option>
          ${Object.keys(AppState.categories || {})
            .sort((a, b) => a.localeCompare(b))
            .map((cat) => `<option value="${cat}">${cat}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-row" id="ruleSubcategoryContainer">
        <label for="ruleSub">Subcategory (optional):</label>
        <input id="ruleSub" type="text" placeholder="Subcategory name (optional)" />
      </div>
      <div class="button-row">
        <button id="saveRuleBtn" class="button primary-btn">Save Rule</button>
      </div>
    </div>

    <h3>Existing Rules</h3>
    <p>These patterns will automatically categorize matching transactions.</p>

    <div class="regex-rules-container">
      ${
        Object.entries(categoryMappings)
          .filter(
            ([pattern]) =>
              pattern.startsWith("^") ||
              pattern.endsWith("$") ||
              pattern.includes("*")
          )
          .map(
            ([pattern, category]) => `
        <div class="regex-rule-row" data-pattern="${pattern}">
          <div class="regex-pattern" title="${pattern}">${pattern}</div>
          <div class="regex-category">${category}</div>
          <div class="regex-actions">
            <button class="delete-rule-btn icon-btn" data-pattern="${pattern}" title="Delete Rule">🗑️</button>
          </div>
        </div>
      `
          )
          .join("") || '<div class="regex-rule-row">No regex rules found</div>'
      }
    </div>
  `;

  // Show the modal with a custom width
  const modal = showModal({
    title: "Automatic Category Rules", // Changed title
    content: container,
    size: "medium",
    width: 600,
  });

  // Add event listener for the save button
  container.querySelector("#saveRuleBtn").addEventListener("click", () => {
    const pat = container.querySelector("#rulePattern").value.trim();
    const cat = container.querySelector("#ruleCategory").value.trim();
    const sub = container.querySelector("#ruleSub").value.trim() || null;

    try {
      if (!pat || !cat) {
        showToast("Both pattern and category are required", "error");
        return;
      }

      // Test if the pattern is valid
      new RegExp(pat);

      // Save the rule
      descriptionCategoryMap.map[pat] = sub ? `${cat}:${sub}` : cat;
      saveCategoryMappings();

      showToast("Rule saved", "success");
      modal.close();

      // Re-open the editor to refresh the list
      setTimeout(openRegexRuleEditor, 100);
    } catch (e) {
      console.error("Error creating regex pattern:", e);
      showToast("Invalid regex pattern", "error");
    }
  });

  // Add event listeners to delete buttons
  container.querySelectorAll(".delete-rule-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pattern = btn.getAttribute("data-pattern");
      if (pattern && confirm(`Delete rule "${pattern}"?`)) {
        delete descriptionCategoryMap.map[pattern];
        saveCategoryMappings();
        showToast("Rule deleted", "success");

        // Remove the row from UI
        const rowToRemove = btn.closest(".regex-rule-row");
        if (rowToRemove) {
          rowToRemove.remove();
        }
        // If no rules left, show message
        if (container.querySelectorAll(".regex-rule-row").length === 0) {
          container.querySelector(".regex-rules-container").innerHTML =
            '<div class="regex-rule-row">No regex rules found</div>';
        }
      }
    });
  });

  return modal;
}

// Update category select when a category is selected
export function updateSubcategorySelect() {
  const categorySelect = document.getElementById("ruleCategory");
  const subcategoryContainer = document.getElementById(
    "ruleSubcategoryContainer"
  );

  if (!categorySelect || !subcategoryContainer) return;

  const selectedCategory = categorySelect.value;
  if (!selectedCategory) {
    subcategoryContainer.innerHTML =
      '<input id="ruleSub" type="text" placeholder="Subcategory (optional)" disabled />';
    return;
  }

  const category = AppState.categories[selectedCategory];
  if (category && typeof category === "object" && category.subcategories) {
    // Generate subcategory dropdown
    subcategoryContainer.innerHTML = `
      <select id="ruleSub">
        <option value="">No subcategory</option>
        ${Object.keys(category.subcategories)
          .sort((a, b) => a.localeCompare(b))
          .map((sub) => `<option value="${sub}">${sub}</option>`)
          .join("")}
      </select>
    `;
  } else {
    subcategoryContainer.innerHTML =
      '<input id="ruleSub" type="text" placeholder="Subcategory (optional)" />';
  }
}
