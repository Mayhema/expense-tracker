/*
  Lightweight parser worker: receives { type, payload } and returns { ok, data|error }.
  Supports 'csv' and 'xml'. Falls back to simple logic to keep worker minimal.
*/

function parseCsvText(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    if (!line) continue;
    rows.push(line.split(','));
  }
  return rows;
}

function parseXmlText(text) {
  // Minimal: extract simple <tag>val</tag> pairs
  const rows = [];
  const re = /<([A-Za-z_][A-Za-z0-9_\-:.]*)[^>]*>([^<]+)<\/\1>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tag = m[1];
    const val = (m[2] || '').trim();
    if (val) rows.push([tag, val]);
  }
  return rows;
}

function parseXlsxArrayBuffer(_ab) {
  // Worker-safe minimal stub: we cannot import XLSX here without bundling.
  // Return a recognizable shape so the caller can decide to fallback or proceed.
  // We'll return an error-like tuple that prompts main-thread fallback in client code.
  return { unsupported: 'xlsx' };
}

self.onmessage = async (e) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'csv') {
      postMessage({ ok: true, data: parseCsvText(payload) });
      return;
    }
    if (type === 'xml') {
      postMessage({ ok: true, data: parseXmlText(payload) });
      return;
    }
    if (type === 'xlsx') {
      // Return a stub indicating unsupported in worker until a bundler provides XLSX here.
      postMessage({ ok: true, data: parseXlsxArrayBuffer(payload) });
      return;
    }
    postMessage({ ok: false, error: `Unsupported type: ${type}` });
  } catch (err) {
    postMessage({ ok: false, error: String(err?.message || err) });
  }
};
