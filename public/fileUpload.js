// fileUpload.js

export async function handleFileUpload(file) {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (['xml', 'xls', 'xlsx'].includes(fileExtension)) {
    return await parseFile(file, fileExtension);
  } else {
    alert('Unsupported file type. Please upload an XML or Excel file.');
    throw new Error('Unsupported file type.');
  }
}

async function parseFile(file, fileType) {
  const arrayBuffer = await file.arrayBuffer();
  if (fileType === 'xml') {
    return await parseXmlFile(file);
  } else if (['xls', 'xlsx'].includes(fileType)) {
    // XLSX (SheetJS) is loaded via CDN in index.html.
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]],
      { header: 1 }
    );
    return rows.filter(row =>
      row.some(cell => cell !== undefined && cell !== null)
    );
  }
}

async function parseXmlFile(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "application/xml");
  let rowElements = xmlDoc.getElementsByTagName("row");
  if (rowElements.length === 0) {
    rowElements = xmlDoc.getElementsByTagName("Row");
  }
  if (rowElements.length === 0 && xmlDoc.documentElement) {
    rowElements = xmlDoc.documentElement.children;
  }
  const rows = Array.from(rowElements).map(rowElem => {
    const cellElements = rowElem.getElementsByTagName("cell");
    if (cellElements.length > 0) {
      return Array.from(cellElements).map(cell => cell.textContent);
    } else {
      return Array.from(rowElem.children).map(child => child.textContent);
    }
  });
  return rows;
}