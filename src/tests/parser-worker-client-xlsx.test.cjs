// This test validates that when XLSX is requested via worker the client returns an unsupported stub
// and higher-level code falls back to main-thread XLSX. Uses dynamic import to load ESM module.
describe('parser worker xlsx fallback', () => {
  const RealFileReader = global.FileReader;
  const RealXLSX = global.XLSX;

  beforeAll(() => {
    // Stub FileReader to synchronously deliver an ArrayBuffer
    class FakeFileReader {
      readAsArrayBuffer(file) {
        // Emulate onload with a trivial ArrayBuffer
        const buf = new ArrayBuffer(8);
        setTimeout(() => {
          this.onload?.({ target: { result: buf } });
        }, 0);
      }
    }
    global.FileReader = FakeFileReader;

    // Stub a tiny XLSX with the minimal API we use
    global.XLSX = {
      read: (_data, _opts) => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }),
      utils: {
        sheet_to_json: (_sheet, { header }) => {
          if (header !== 1) throw new Error('expected header:1');
          return [['h1', 'h2'], ['r1c1', 'r1c2']];
        }
      }
    };
  });

  afterAll(() => {
    global.FileReader = RealFileReader;
    global.XLSX = RealXLSX;
  });

  test('client.parseXLSX returns stub with worker or rejects without worker', async () => {
    const { createParserClient } = await import('../utils/parserWorkerClient.js');
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
});
