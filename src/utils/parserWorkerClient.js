// Try to use a Web Worker for parsing; fall back to main-thread parsing if unavailable.

import { parseCSVText } from './csv.js';
import { parseXMLTextToRows } from './xml.js';

export function createParserClient() {
  let worker = null;
  if (typeof Worker !== 'undefined') {
    // Construct URL for module worker; may still fail at runtime if URL cannot be resolved, which will be handled by tests
    worker = new Worker(new URL('../workers/parserWorker.js', import.meta.url), { type: 'module' });
  }

  if (!worker) {
    return {
      parseCSV(text) { return Promise.resolve(parseCSVText(text)); },
      parseXML(text) { return Promise.resolve(parseXMLTextToRows(text)); },
      // Excel parsing is not supported without a worker; caller should fallback to main-thread XLSX
      parseXLSX(/* arrayBuffer */) { return Promise.reject(new Error('xlsx not supported without worker')); },
      terminate() { },
      isWorker: false,
    };
  }

  function send(type, payload) {
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
      worker.postMessage({ type, payload });
    });
  }

  return {
    parseCSV(text) { return send('csv', text); },
    parseXML(text) { return send('xml', text); },
    parseXLSX(arrayBuffer) { return send('xlsx', arrayBuffer); },
    terminate() {
      worker.terminate();
    },
    isWorker: true,
  };
}
