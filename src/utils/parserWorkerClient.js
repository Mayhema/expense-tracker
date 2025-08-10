// Try to use a Web Worker for parsing; fall back to main-thread parsing if unavailable.

export function createParserClient() {
  let worker = null;
  if (typeof Worker !== 'undefined') {
    // Construct URL for module worker; may still fail at runtime if URL cannot be resolved, which will be handled by tests
    worker = new Worker(new URL('../workers/parserWorker.js', import.meta.url), { type: 'module' });
  }

  if (!worker) {
    return {
      parseCSV(text) {
        const rows = text.split(/\r?\n/).map((r) => r.split(','));
        return Promise.resolve(rows);
      },
      terminate() {},
      isWorker: false,
    };
  }

  return {
    parseCSV(text) {
      return new Promise((resolve, reject) => {
        const onMessage = (e) => {
          const { ok, data, error } = e.data || {};
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          ok ? resolve(data) : reject(new Error(error));
        };
        const onError = (err) => {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          reject(new Error(String(err?.message || err)));
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.postMessage({ type: 'csv', payload: text });
      });
    },
    terminate() {
      worker.terminate();
    },
    isWorker: true,
  };
}
