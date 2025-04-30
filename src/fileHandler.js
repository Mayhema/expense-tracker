// Directory: /src/fileHandler.js

import { AppState, saveMergedFiles } from "./appState.js";
import { showToast } from "./uiManager.js";

console.log("XLSX object:", XLSX);

export async function handleFileUpload(file) {
  const fileExtension = file.name.split(".").pop().toLowerCase();

  console.log("Uploading file:", file.name, "File type:", fileExtension);

  if (fileExtension === "xml") {
    return await parseXMLFile(file);
  } else if (fileExtension === "xls" || fileExtension === "xlsx") {
    return await parseExcelFile(file);
  } else {
    throw new Error("Unsupported file format. Please upload an XML or Excel file.");
  }
}

async function parseXMLFile(file) {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    const rows = Array.from(xmlDoc.getElementsByTagName("row")).map(row => {
      return Array.from(row.children).map(cell => cell.textContent.trim());
    });

    console.log("Parsed XML data:", rows);
    if (rows.length === 0 || rows.every(row => row.length === 0)) {
      throw new Error("No valid rows found in the XML file.");
    }
    return rows.filter(row => row.length > 0); // Filter out empty rows
  } catch (error) {
    console.error("Error parsing XML file:", error);
    showToast("Failed to parse XML file. Please check the file format.", "error");
    return [];
  }
}

async function parseExcelFile(file) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Parsed Excel data:", rows);
    return rows;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    showToast("Failed to parse Excel file. Please check the file format.", "error");
    return [];
  }
}

export function addMergedFile(data, headerMapping, fileName, signature, dataRow = 1) {
  console.log("Saving file with signature:", signature);

  if (AppState.mergedFiles.some(f => f.signature === signature)) {
    console.log("File with the same structure already exists:", signature);
    return;
  }

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

export function generateFileSignature(data) {
  const headerRow = JSON.stringify(data[0]);
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(headerRow)).then(hashBuffer => {
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  });
}