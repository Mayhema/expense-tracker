import { descriptionCategoryMap, saveCategoryMappings } from "../ui/categoryMapping.js";
import { showModal } from "./modalManager.js";
import { showToast } from "./uiManager.js";

// Open regex rule editor modal
export function openRegexRuleEditor() {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <label>Regex Pattern:<input id="rulePattern" type="text" placeholder="e.g. ^coffee" /></label>
      <label>Category:<input id="ruleCategory" type="text" placeholder="Category name" /></label>
      <label>Subcategory (opt):<input id="ruleSub" type="text" placeholder="Subcategory" /></label>
      <button id="saveRuleBtn">Save Rule</button>
    </div>
  `;
  const modal = showModal({ title: "Custom Rule Editor", content: container, size: "small" });
  container.querySelector("#saveRuleBtn").addEventListener("click", () => {
    const pat = container.querySelector("#rulePattern").value.trim();
    const cat = container.querySelector("#ruleCategory").value.trim();
    const sub = container.querySelector("#ruleSub").value.trim() || null;
    try {
      new RegExp(pat);
      if (!pat || !cat) {
        showToast("Both pattern and category required", "error");
        return; // Exit the function instead of throwing
      }

      descriptionCategoryMap.map[pat] = sub ? `${cat}:${sub}` : cat;
      saveCategoryMappings();
      showToast("Rule saved", "success");
      modal.close();
    } catch (e) {
      console.error("Error creating regex pattern:", e);
      showToast("Invalid pattern or missing fields", "error");
    }
  });
}
