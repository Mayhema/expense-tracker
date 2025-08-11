import { createParserClient } from '../utils/parserWorkerClient.js';

describe('parser worker xlsx fallback (ESM)', () => {
  test('returns unsupported stub from worker or rejects without worker', async () => {
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
