// Lightweight CSV utilities shared by main thread and worker

function isBackslashEscapedQuote(row, i, inQuotes) {
  return inQuotes && row[i] === "\\" && row[i + 1] === '"';
}

function isDoubleQuoteEscape(row, i, inQuotes) {
  return inQuotes && row[i] === '"' && row[i + 1] === '"';
}

function isLiteralInnerQuote(next) {
  return next !== undefined && next !== ',' && next !== '\n' && next !== '\r';
}

function handleQuote(row, i, inQuotes, current) {
  // Returns an object with updated { i, inQuotes, current, consumed }
  if (!inQuotes) {
    return { i: i + 1, inQuotes: true, current, consumed: true };
  }
  const next = row[i + 1];
  if (isDoubleQuoteEscape(row, i, inQuotes)) {
    return { i: i + 2, inQuotes: true, current: current + '"', consumed: true };
  }
  if (isLiteralInnerQuote(next)) {
    return { i: i + 1, inQuotes: true, current: current + '"', consumed: true };
  }
  return { i: i + 1, inQuotes: false, current, consumed: true };
}

export function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    const trimmed = current.trim();
    if (trimmed !== "") result.push(trimmed);
    current = "";
  };

  while (i < row.length) {
    const ch = row[i];

    if (isBackslashEscapedQuote(row, i, inQuotes)) {
      current += '"';
      i += 2;
      continue;
    }

    if (ch === '"') {
      const res = handleQuote(row, i, inQuotes, current);
      i = res.i; inQuotes = res.inQuotes; current = res.current;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      pushField();
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  pushField();
  return result;
}

export function parseCSVText(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    const row = parseCSVRow(line);
    if (row.length) rows.push(row);
  }
  return rows;
}
