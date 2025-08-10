import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('dateUtils core', () => {
  test('detects Excel serial dates in realistic range', async () => {
    const utils = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    expect(utils.isExcelDate(45000)).toBe(true);
    expect(utils.isExcelDate(1)).toBe(false);
    expect(utils.isExcelDate('abc')).toBe(false);
  });

  test('converts Excel date to ISO correctly', async () => {
    const { excelDateToISOString } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    const iso = excelDateToISOString(45000);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('parses multiple date formats to ISO', async () => {
    const { parseToISODate } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    expect(parseToISODate('2024-12-31')).toBe('2024-12-31');
    expect(parseToISODate('31/12/2024')).toBe('2024-12-31');
    expect(parseToISODate('12/31/2024')).toBe('2024-12-31');
    expect(parseToISODate('31.12.2024')).toBe('2024-12-31');
  });

  test('formatDateForDisplay supports US/EU/ISO', async () => {
    const { formatDateForDisplay } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    const iso = '2024-02-03';
    expect(formatDateForDisplay(iso, 'US')).toBe('02/03/2024');
    expect(formatDateForDisplay(iso, 'EU')).toBe('03/02/2024');
    expect(formatDateForDisplay(iso, 'ISO')).toBe('2024-02-03');
  });

  test('validateAndNormalizeDate returns normalized ISO (ambiguous US-MM/DD heuristic)', async () => {
    const { validateAndNormalizeDate } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    const res = validateAndNormalizeDate('03/02/2024');
    expect(res.isValid).toBe(true);
    // Current heuristic: when both parts <= 12, prefer US MM/DD
    expect(res.normalizedDate).toBe('2024-03-02');
  });

  test('validateAndNormalizeDate handles clear EU dd/mm/yyyy when day > 12', async () => {
    const { validateAndNormalizeDate } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    const res = validateAndNormalizeDate('31/01/2024');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDate).toBe('2024-01-31');
  });

  test('isDateColumn detects columns with many dates', async () => {
    const { isDateColumn } = await import(path.join(__dirname, '..', 'utils', 'dateUtils.js'));
    const col = ['2024-01-01', '2024-01-02', '', null, 45001, 'not-a-date'];
    expect(isDateColumn(col)).toBe(true);
  });
});
