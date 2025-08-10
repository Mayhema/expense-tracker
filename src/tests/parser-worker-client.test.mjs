import { createParserClient } from '../utils/parserWorkerClient.js';

describe('parserWorkerClient', () => {
  test('falls back gracefully when Worker is unavailable', async () => {
    const originalWorker = global.Worker;
    // Simulate no Worker support
    // eslint-disable-next-line no-global-assign
    global.Worker = undefined;
    const client = createParserClient();
    const rows = await client.parseCSV('a,b\n1,2');
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    client.terminate();
    // restore
    // eslint-disable-next-line no-global-assign
    global.Worker = originalWorker;
  });
});
