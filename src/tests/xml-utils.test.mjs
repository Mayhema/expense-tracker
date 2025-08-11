import { parseXMLTextToRows } from '../utils/xml.js';

describe('xml utils', () => {
  test('parses simple leaf elements into rows', () => {
    const xml = `<?xml version="1.0"?><root><a>1</a><b> 2 </b><c><d>nested</d></c></root>`;
    const rows = parseXMLTextToRows(xml);
    // Should include a, b and d leafs
    const tags = rows.map(r => r[0]);
    expect(tags).toEqual(expect.arrayContaining(['a', 'b', 'd']));
    const vals = Object.fromEntries(rows);
    expect(vals.a).toBe('1');
    expect(vals.b).toBe('2');
    expect(vals.d).toBe('nested');
  });

  test('regex fallback works without DOMParser', () => {
    const original = global.DOMParser;
    // eslint-disable-next-line no-global-assign
    global.DOMParser = undefined;
    const xml = `<root><x>alpha</x><y>beta</y></root>`;
    const rows = parseXMLTextToRows(xml);
    expect(rows).toEqual(expect.arrayContaining([
      ['x', 'alpha'],
      ['y', 'beta']
    ]));
    // restore
    // eslint-disable-next-line no-global-assign
    global.DOMParser = original;
  });
});
