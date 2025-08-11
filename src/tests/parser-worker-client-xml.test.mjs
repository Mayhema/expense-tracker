import { createParserClient } from '../utils/parserWorkerClient.js';

describe('parserWorkerClient XML', () => {
  test('falls back when Worker unavailable', async () => {
    const originalWorker = global.Worker;
    // eslint-disable-next-line no-global-assign
    global.Worker = undefined;
    const client = createParserClient();
    const rows = await client.parseXML('<root><a>1</a><b>2</b></root>');
    expect(rows).toEqual(expect.arrayContaining([
      ['a', '1'],
      ['b', '2']
    ]));
    client.terminate();
    // eslint-disable-next-line no-global-assign
    global.Worker = originalWorker;
  });
});
