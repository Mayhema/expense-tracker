import { handleFileUpload } from '../parsers/fileHandler.js';

describe('XML fileHandler end-to-end (worker-first with safe fallback)', () => {
  const RealLocalStorage = global.localStorage;
  const RealFileReader = global.FileReader;

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

    class FakeFileReader {
      readAsText(_file) {
        const xml = '<root><alpha>10</alpha><beta>20</beta></root>';
        setTimeout(() => {
          this.onload?.({ target: { result: xml } });
        }, 0);
      }
    }
    global.FileReader = FakeFileReader;
  });

  afterAll(() => {
    global.localStorage = RealLocalStorage;
    global.FileReader = RealFileReader;
  });

  test('parses XML into simple rows regardless of worker availability', async () => {
    const file = { name: 'sample.xml' };
    const rows = await handleFileUpload(file);
    expect(Array.isArray(rows)).toBe(true);
    const asMap = Object.fromEntries(rows);
    expect(asMap.alpha).toBe('10');
    expect(asMap.beta).toBe('20');
  });
});
