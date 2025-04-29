const STORAGE_KEY = "fileFormatMappings";

export function saveHeadersAndFormat(signature, headerMapping) {
  const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  // Store with signature for later matching
  const entry = { mapping: headerMapping, signature };
  allMappings[signature] = entry;

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

  table.innerHTML = "<tr><th>Signature</th><th>Mapping</th></tr>";
  Object.entries(allMappings).forEach(([sig, entry]) => {
    const row = `<tr><td>${sig}</td><td>${entry.mapping.join(", ")}</td></tr>`;
    table.innerHTML += row;
  });
}
