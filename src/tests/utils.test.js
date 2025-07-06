// Sample unit test file - add Jest or another test framework to use this

import { parseToDateString, isExcelDate } from '../utils/utils.js';

describe('Utils Module', () => {
  describe('isExcelDate', () => {
    test('should identify Excel date numbers', () => {
      expect(isExcelDate(44927)).toBe(true);  // 2023-01-01
      expect(isExcelDate(45000)).toBe(true);
      expect(isExcelDate(36525)).toBe(true);  // 2000-01-01
    });

    test('should reject non-Excel dates', () => {
      expect(isExcelDate(12345)).toBe(false); // Too low
      expect(isExcelDate(55000)).toBe(false); // Too high
      expect(isExcelDate("2023-01-01")).toBe(false); // String
      expect(isExcelDate(null)).toBe(false);
    });
  });

  describe('parseToDateString', () => {
    test('should parse Excel dates', () => {
      expect(parseToDateString(44927)).toBe("2023-01-01");
    });

    test('should handle ISO string dates', () => {
      expect(parseToDateString("2023-01-01")).toBe("2023-01-01");
    });

    test('should convert DD/MM/YYYY formats', () => {
      expect(parseToDateString("31/12/2023")).toBe("2023-12-31");
    });

    test('should handle null and undefined', () => {
      expect(parseToDateString(null)).toBeNull();
      expect(parseToDateString(undefined)).toBeNull();
    });
  });
});
