const STORAGE_KEY = "fileFormatMappings";

export function saveHeadersAndFormat(signature, headerMapping) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  allMappings[signature] = { mapping: headerMapping, signature };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
}

export function getMappingBySignature(signature) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  return allMappings[signature]?.mapping || null;
}

export function renderMappingList() {
  const table = document.getElementById("mappingTable");
  if (!table) return;

  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  table.innerHTML = "<tr><th>Format Signature</th><th>Mapping</th><th>Actions</th></tr>";

  Object.entries(allMappings).forEach(([sig, entry]) => {
    const row = document.createElement("tr");
    const mapping = Array.isArray(entry.mapping) ? entry.mapping.join(", ") : "Invalid mapping";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.addEventListener("click", () => deleteMapping(sig));

    row.innerHTML = `
      <td>${sig}</td>
      <td>${mapping}</td>
    `;
    const actionsCell = document.createElement("td");
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);

    table.appendChild(row);
  });
}

export function deleteMapping(sig) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if (allMappings[sig]) {
    delete allMappings[sig];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMappings));
    renderMappingList();

    // Call the function to handle associated files
    deleteFormatAndAssociatedFiles(sig);
  }
}

export function updateMappingRow(table, sig, entry) {
  const row = document.querySelector(`[data-sig="${sig}"]`);
  if (row) {
    row.querySelector(".mapping-cell").textContent = entry.mapping.join(", ");
  } else {
    // Add a new row if it doesn't exist
    const newRow = document.createElement("tr");
    newRow.setAttribute("data-sig", sig);
    newRow.innerHTML = `
      <td>${sig}</td>
      <td class="mapping-cell">${entry.mapping.join(", ")}</td>
    `;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "🗑️";
    deleteButton.addEventListener("click", () => deleteMapping(sig));
    const actionsCell = document.createElement("td");
    actionsCell.appendChild(deleteButton);
    newRow.appendChild(actionsCell);

    table.appendChild(newRow);
  }
}

window.deleteMapping = deleteMapping;
