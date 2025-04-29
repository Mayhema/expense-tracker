// Directory: /src/fileHandler.js

import { AppState, saveMergedFiles } from "./appState.js";

export async function handleFileUpload(file) {
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (["xml", "xls", "xlsx"].includes(fileExtension)) {
    return await parseFile(file, fileExtension);
  } else {
    alert("Unsupported file type. Please upload an XML or Excel file.");
    throw new Error("Unsupported file type.");
  }
}

async function parseFile(file, fileType) {
  const arrayBuffer = await file.arrayBuffer();
  if (fileType === "xml") {
    return await parseXmlFile(file);
  } else {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { header: 1 }
    );
    return rows.filter(row => row.some(cell => cell !== undefined && cell !== null));
  }
}

async function parseXmlFile(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "application/xml");
  let rowElements = xmlDoc.getElementsByTagName("row");
  if (rowElements.length === 0) rowElements = xmlDoc.getElementsByTagName("Row");
  if (rowElements.length === 0 && xmlDoc.documentElement) rowElements = xmlDoc.documentElement.children;
  const rows = Array.from(rowElements).map(rowElem => {
    const cells = rowElem.getElementsByTagName("cell");
    return cells.length > 0
      ? Array.from(cells).map(cell => cell.textContent)
      : Array.from(rowElem.children).map(child => child.textContent);
  });
  return rows;
}

export function addMergedFile(data, headerMapping, fileName, signature, dataRow = 1) {
  if (AppState.mergedFiles.some(f => f.signature === signature)) return;
  const merged = {
    fileName,
    headerMapping,
    data,
    headerRow: dataRow,
    dataRow,
    selected: true,
    signature,
  };
  AppState.mergedFiles.push(merged);
  saveMergedFiles();
}