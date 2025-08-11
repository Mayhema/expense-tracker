import { createParserClient } from '../utils/parserWorkerClient.js';
import { handleFileUpload } from '../parsers/fileHandler.js';

/**
 * This test ensures that:
 * - client.parseXLSX returns an unsupported stub from worker
 * - fileHandler falls back to main-thread XLSX and produces a 2D array
 */
describe('Excel worker fallback end-to-end', () => {
  const RealFileReader = global.FileReader;
  const RealXLSX = global.XLSX;
  const RealLocalStorage = global.localStorage;

  beforeAll(() => {
    // Enable worker usage via localStorage flag
    const store = new Map();
    global.localStorage = {
      getItem: (k) => store.get(k),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    localStorage.setItem('useWorkerParsing', '1');

    // Stub FileReader to feed an ArrayBuffer
    class FakeFileReader {
      readAsArrayBuffer(_file) {
        const buf = new ArrayBuffer(8);
        setTimeout(() => {
          this.onload?.({ target: { result: buf } });
        }, 0);
      }
    }
    global.FileReader = FakeFileReader;

    // Minimal XLSX stub used by fileHandler fallback
    global.XLSX = {
      read: (_data, _opts) => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }),
      utils: {
        sheet_to_json: (_sheet, { header }) => {
          if (header !== 1) throw new Error('expected header:1');
          return [['A', 'B'], ['1', '2']];
        },
      },
    };
  });

  afterAll(() => {
    global.FileReader = RealFileReader;
    global.XLSX = RealXLSX;
    global.localStorage = RealLocalStorage;
  });

  test('client.parseXLSX behavior matches environment (unsupported stub or rejection)', async () => {
    const client = createParserClient();
    if (client.isWorker) {
      const res = await client.parseXLSX(new ArrayBuffer(4));
      expect(res && typeof res).toBe('object');
      expect(res.unsupported).toBe('xlsx');
    } else {
      await expect(client.parseXLSX(new ArrayBuffer(4))).rejects.toThrow(/xlsx not supported/i);
    }
    client.terminate?.();
  });

  test('handleFileUpload falls back to main-thread XLSX for .xlsx', async () => {
    const fakeFile = { name: 'sheet.xlsx' };
    // fileHandler will use our FakeFileReader to produce ArrayBuffer
    const rows = await handleFileUpload(fakeFile);
    expect(Array.isArray(rows)).toBe(true);
    expect(Array.isArray(rows[0])).toBe(true);
    expect(rows[0]).toEqual(['A', 'B']);
    expect(rows[1]).toEqual(['1', '2']);
  });
});
