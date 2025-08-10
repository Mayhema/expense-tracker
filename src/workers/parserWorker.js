/*
  Lightweight parser worker: receives { type, payload } and returns { ok, data|error }.
  This is a scaffold; real parsing still happens in main thread if worker is unavailable.
*/

self.onmessage = async (e) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'csv') {
      const text = payload;
      const rows = text.split(/\r?\n/).map((r) => r.split(','));
      postMessage({ ok: true, data: rows });
    } else {
      postMessage({ ok: false, error: `Unsupported type: ${type}` });
    }
  } catch (err) {
    postMessage({ ok: false, error: String(err?.message || err) });
  }
};
