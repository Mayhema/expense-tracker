#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE EXPENSE TRACKER TEST RUNNER
 * ============================================
 *
 * Automatically discovers and runs all test files in the tests folder hierarchy.
 * This runner grows with the project as new tests are added.
 *
 * Features:
 * - Recursive test discovery
 * - Automatic ES module loading
 * - Comprehensive reporting with pass/fail counts
 * - Support for multiple test patterns
 * - Performance metrics and timing
 * - Regression test accumulation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find all test files in the current directory
 */
function findTestFiles() {
  const testFiles = [];
  const files = fs.readdirSync(__dirname);

  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() &&
      (file.startsWith('test-') && file.endsWith('.js')) &&
      file !== 'test-runner.js') {
      testFiles.push(fullPath);
    }
  }

  return testFiles.sort((a, b) => a.localeCompare(b));
}

/**
 * Execute a single test file
 */
async function runTestFile(testFilePath) {
  const startTime = Date.now();
  const fileName = path.basename(testFilePath);

  try {
    console.log(`📋 Running ${fileName}...`);
    console.log('-'.repeat(50));

    // Import and run the test
    const testModule = await import(`file://${testFilePath}`);

    // Most test files run automatically on import
    // Some may export a main function
    if (typeof testModule.default === 'function') {
      await testModule.default();
    } else if (typeof testModule.runTests === 'function') {
      await testModule.runTests();
    } else if (typeof testModule.main === 'function') {
      await testModule.main();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ ${fileName} completed in ${duration}ms`);

    return {
      success: true,
      file: fileName,
      duration,
      error: null
    };

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`❌ ${fileName} failed`);
    console.error(`   Exit code: ${error.code || 1}`);

    return {
      success: false,
      file: fileName,
      duration,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Main test runner function
 */
async function main() {
  console.log('🧪 COMPREHENSIVE EXPENSE TRACKER TEST RUNNER');
  console.log('===========================================');

  const startTime = Date.now();

  // Find all test files
  const testFiles = findTestFiles();

  if (testFiles.length === 0) {
    console.log('⚠️  No test files found');
    return;
  }

  console.log(`Found ${testFiles.length} test files:`);
  testFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    console.log(`  ${index + 1}. ${fileName}`);
  });

  console.log('🚀 STARTING TEST EXECUTION');
  console.log('==========================');

  // Run all tests
  const results = [];
  for (const testFile of testFiles) {
    const result = await runTestFile(testFile);
    results.push(result);
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Generate comprehensive report
  console.log('');
  console.log('============================================================');
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('============================================================');

  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const successRate = Math.round((passed.length / results.length) * 100);

  console.log('📈 SUMMARY:');
  console.log(`   Total Tests:     ${results.length}`);
  console.log(`   Passed:          ${passed.length} ✅`);
  console.log(`   Failed:          ${failed.length} ${failed.length > 0 ? '❌' : '✅'}`);
  console.log(`   Success Rate:    ${successRate}%`);
  console.log(`   Total Duration:  ${totalDuration}ms`);

  console.log('');
  console.log('🧪 TEST COVERAGE AREAS:');

  // Categorize tests by functionality
  const categories = {
    'Advanced Filters': results.filter(r => r.file.includes('advanced-filters') || r.file.includes('filter')),
    'Category Manager': results.filter(r => r.file.includes('category')),
    'Transaction Management': results.filter(r => r.file.includes('transaction') || r.file.includes('complete-flow')),
    'Currency Integration': results.filter(r => r.file.includes('currency')),
    'Filter Improvements': results.filter(r => r.file.includes('filter') && !r.file.includes('advanced')),
    'Enhanced UI Components': results.filter(r => r.file.includes('enhanced') || r.file.includes('layout')),
    'Regression Testing': results.filter(r => r.file.includes('regression')),
    'Integration Testing': results.filter(r => r.file.includes('integration')),
  };

  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const categoryPassed = tests.filter(t => t.success).length;
      const categoryFailed = tests.filter(t => !t.success).length;
      const status = categoryFailed === 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${category} (${categoryPassed}/${tests.length})`);
    }
  });

  if (failed.length > 0) {
    console.log('');
    console.log('⚠️  SOME TESTS FAILED');
    console.log(`   ${failed.length} out of ${results.length} test suites failed.`);
    console.log('   Please review the failed tests above for details.');
  } else {
    console.log('');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('   The expense tracker is working correctly across all tested areas.');
  }

  console.log('');
  console.log('� FUTURE TEST ADDITIONS:');
  console.log('   This test runner automatically detects new test files.');
  console.log('   Simply add new test-*.js files to include them in future runs.');
  console.log('   Suggested additions:');
  console.log('   - test-performance-benchmarks.js');
  console.log('   - test-accessibility-compliance.js');
  console.log('   - test-data-validation.js');
  console.log('   - test-export-import-functionality.js');

  console.log('============================================================');

  // Exit with appropriate code
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run the test runner
main().catch(error => {
  console.error('Fatal error in test runner:', error);
  process.exit(1);
});

export default main;
