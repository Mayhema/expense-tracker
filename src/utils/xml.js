// Lightweight XML utilities shared by main thread and worker fallbacks

function isLeafElement(node) {
  return node && node.nodeType === 1 && node.children && node.children.length === 0;
}

function domToRows(xmlDoc) {
  const rows = [];
  const all = xmlDoc.getElementsByTagName('*');
  for (const el of all) {
    if (isLeafElement(el)) {
      const text = (el.textContent || '').trim();
      if (text) rows.push([el.tagName, text]);
    }
  }
  return rows;
}

function regexXmlToRows(text) {
  // Extremely simple leaf extractor: <tag>value</tag>
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

export function parseXMLTextToRows(text) {
  if (!text || typeof text !== 'string') return [];
  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      return domToRows(xmlDoc);
    }
  } catch (err) {
    // Handle error explicitly: log once for diagnostics, then fall back.
    // eslint-disable-next-line no-console
    console.warn('[xml] DOMParser failed or unavailable; using regex fallback:', err && (err.message || err));
    // Explicit fallback: DOMParser may throw on malformed XML or be undefined in the environment
    // In all such cases, switch to the conservative regex-based leaf extraction.
    return regexXmlToRows(text);
  }
  return regexXmlToRows(text);
}

export default {
  parseXMLTextToRows,
};
