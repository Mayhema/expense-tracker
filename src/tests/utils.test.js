// Node-compatible test file for utils module

import { parseToDateString, isExcelDate } from '../utils/utils.js';

let testsPassed = 0;
let testsFailed = 0;

function test(name, testFn) {
  try {
    testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null but got ${actual}`);
      }
    }
  };
}

console.log('Running Utils Module Tests...');

// Test isExcelDate function
test('isExcelDate should identify Excel date numbers', () => {
  expect(isExcelDate(44927)).toBe(true);  // 2023-01-01
  expect(isExcelDate(45000)).toBe(true);
  expect(isExcelDate(36525)).toBe(true);  // 2000-01-01
});

test('isExcelDate should reject non-Excel dates', () => {
  expect(isExcelDate(12345)).toBe(false); // Too low
  expect(isExcelDate(100001)).toBe(false); // Too high
  expect(isExcelDate("2023-01-01")).toBe(false); // String
  expect(isExcelDate(null)).toBe(false);
});

// Test parseToDateString function
test('parseToDateString should parse Excel dates', () => {
  expect(parseToDateString(44927)).toBe("2023-01-01");
});

test('parseToDateString should handle ISO string dates', () => {
  expect(parseToDateString("2023-01-01")).toBe("2023-01-01");
});

test('parseToDateString should convert DD/MM/YYYY formats', () => {
  expect(parseToDateString("31/12/2023")).toBe("2023-12-31");
});

test('parseToDateString should handle null and undefined', () => {
  expect(parseToDateString(null)).toBeNull();
  expect(parseToDateString(undefined)).toBeNull();
});

console.log(`\nTest Results: ${testsPassed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
