import { isDuplicateFile, generateFileSignature } from '../parsers/fileHandler.js';

// Minimal mock of AppState used indirectly by isDuplicateFile via fileHandler
import { AppState } from '../core/appState.js';

describe('duplicate file detection', () => {
  test('detects duplicate by exact file name', () => {
    AppState.mergedFiles = [
      { fileName: 'bank.csv', signature: 'sig_a' },
      { fileName: 'credit.xlsx', signature: 'sig_b' },
    ];
    const dup = isDuplicateFile('bank.csv', 'whatever');
    expect(dup?.fileName).toBe('bank.csv');
  });

  test('detects duplicate by signature when names differ', () => {
    const data = [['date', 'amount'], ['2025-01-01', '10']];
    const sig = generateFileSignature('x.csv', data);
    AppState.mergedFiles = [
      { fileName: 'prev.csv', signature: sig },
    ];
    const dup = isDuplicateFile('new.csv', sig);
    expect(dup?.fileName).toBe('prev.csv');
  });
});
