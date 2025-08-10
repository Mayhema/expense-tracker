import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('utils core', () => {
  test('getContrastColor returns white for dark colors and black for light', async () => {
    const utils = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    expect(utils.getContrastColor('#000000')).toBe('#FFFFFF');
    expect(utils.getContrastColor('#FFFFFF')).toBe('#000000');
  });

  test('deepClone returns new object without reference', async () => {
    const { deepClone } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  test('parseJSON falls back to default on error', async () => {
    const { parseJSON } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    expect(parseJSON('{bad json}', 42)).toBe(42);
    expect(parseJSON('{"x":1}', null)).toEqual({ x: 1 });
  });

  test('getPrimary/Secondary/Fallback value helpers', async () => {
    const { getPrimaryValue, getSecondaryValue, getFallbackValue } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    expect(getPrimaryValue(null, 'd')).toBe('d');
    expect(getPrimaryValue('v', 'd')).toBe('v');
    expect(getSecondaryValue(undefined, 'd')).toBe('d');
    expect(getSecondaryValue(0, 1)).toBe(0);
    expect(getFallbackValue('x')).toBe('x');
  });

  test('transaction find helpers', async () => {
    const { findTransactionById, findTransactionIndexById } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    const list = [{ id: 'a' }, { id: 'b' }];
    expect(findTransactionById(list, 'b')).toEqual({ id: 'b' });
    expect(findTransactionIndexById(list, 'a')).toBe(0);
  });

  test('debounce executes after wait (smoke)', async () => {
    const { debounce } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    let called = 0;
    const fn = () => { called += 1; };
    const d = debounce(fn, 10);
    d();
    await new Promise((r) => setTimeout(r, 5));
    expect(called).toBe(0);
    await new Promise((r) => setTimeout(r, 15));
    expect(called).toBe(1);
  });

  test('ids are strings and reasonably unique', async () => {
    const { generateId, generateUniqueId } = await import(path.join(__dirname, '..', 'utils', 'utils.js'));
    const id1 = generateId('p_');
    const id2 = generateUniqueId();
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1).not.toBe(id2);
  });
});
