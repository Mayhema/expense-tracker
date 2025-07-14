#!/usr/bin/env node

/**
 * 🚀 AUTOMATED EXPENSE TRACKER TEST RUNNER
 * ========================================
 *
 * This is an automatic test runner that runs all tests in the src/tests directory
 * without any manual intervention. It provides comprehensive regression testing
 * that grows with the project.
 *
 * Features:
 * - Zero manual intervention required
 * - Automatic test discovery
 * - Comprehensive error reporting
 * - HTML and JSON report generation
 * - Exit codes for CI/CD integration
 * - Performance metrics
 * - Real-time progress display
 *
 * Usage:
 * node src/tests/automated-test-runner.js
 *
 * Exit codes:
 * 0 - All tests passed
 * 1 - Some tests failed
 * 2 - Test runner error
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  testDir: __dirname,
  testPatterns: [
    /\.test\.js$/,
    /^test-.*\.js$/,
    /.*-test\.js$/
  ],
  excludePatterns: [
    /automated-test-runner\.js$/,
    /unified-test-runner\.js$/,
    /comprehensive-test-runner\.js$/,
    /node_modules/,
    /\.min\.js$/,
    // Exclude Jest-based tests that need Jest to run
    /categoryManager\.test\.js$/,
    /utils\.test\.js$/,
    /test-filter-improvements\.js$/,
    /test-enhanced-filter-ui\.js$/,
    /advancedFilters\.test\.js$/
  ],
  timeoutMs: 30000,
  maxConcurrency: 5,
  generateReports: true,
  silentMode: false
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: null,
  endTime: null,
  duration: 0,
  details: []
};

/**
 * Discover all test files in the test directory
 */
function discoverTestFiles() {
  const testFiles = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
          // Check if file matches test patterns
          const matchesPattern = CONFIG.testPatterns.some(pattern => pattern.test(item.name));
          const isExcluded = CONFIG.excludePatterns.some(pattern => pattern.test(item.name));

          if (matchesPattern && !isExcluded) {
            testFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      if (!CONFIG.silentMode) {
        console.warn(colors.yellow + 'Warning: Could not scan directory ' + dir + ': ' + error.message + colors.reset);
      }
    }
  }

  scanDirectory(CONFIG.testDir);
  return testFiles;
}

/**
 * Run a single test file
 */
function runTestFile(filePath) {
  return new Promise((resolve) => {
    const fileName = path.basename(filePath);
    const startTime = Date.now();

    if (!CONFIG.silentMode) {
      console.log(colors.blue + '📋 Running: ' + fileName + colors.reset);
    }

    const child = spawn('node', [filePath], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd() // Use the current working directory (project root)
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set up timeout
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, CONFIG.timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      const result = {
        file: fileName,
        path: filePath,
        duration,
        code,
        stdout,
        stderr,
        passed: code === 0 && !timedOut,
        timedOut,
        error: null
      };

      if (result.passed) {
        testResults.passed++;
        if (!CONFIG.silentMode) {
          console.log(colors.green + '✅ ' + fileName + ' (' + duration + 'ms)' + colors.reset);
        }
      } else {
        testResults.failed++;
        if (timedOut) {
          result.error = 'Test timed out after ' + CONFIG.timeoutMs + 'ms';
          if (!CONFIG.silentMode) {
            console.log(colors.yellow + '⏰ ' + fileName + ' timed out after ' + CONFIG.timeoutMs + 'ms' + colors.reset);
          }
        } else {
          result.error = 'Exit code: ' + code;
          if (!CONFIG.silentMode) {
            console.log(colors.red + '❌ ' + fileName + ' (' + duration + 'ms) - Exit code: ' + code + colors.reset);
          }
        }
        testResults.errors.push(result);
      }

      testResults.details.push(result);
      resolve(result);
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      const result = {
        file: fileName,
        path: filePath,
        duration,
        code: -1,
        stdout: '',
        stderr: error.message,
        passed: false,
        timedOut: false,
        error: error.message
      };

      testResults.failed++;
      testResults.errors.push(result);
      testResults.details.push(result);

      if (!CONFIG.silentMode) {
        console.log(colors.red + '❌ ' + fileName + ' - Exception: ' + error.message + colors.reset);
      }

      resolve(result);
    });
  });
}

/**
 * Run all tests with controlled concurrency
 */
async function runAllTests(testFiles) {
  const results = [];

  for (let i = 0; i < testFiles.length; i += CONFIG.maxConcurrency) {
    const batch = testFiles.slice(i, i + CONFIG.maxConcurrency);
    const batchResults = await Promise.all(batch.map(runTestFile));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate HTML report
 */
function generateHTMLReport() {
  if (!CONFIG.generateReports) return;

  const reportPath = path.join(CONFIG.testDir, 'automated-test-report.html');
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Automated Test Report - Expense Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 6px; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .total { color: #007bff; }
        .test-list { margin-top: 20px; }
        .test-item { margin: 10px 0; padding: 15px; border-left: 4px solid #ddd; background: #f8f9fa; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .test-error { color: #dc3545; margin-top: 5px; font-family: monospace; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Automated Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value total">${testResults.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value passed">${testResults.passed}</div>
                <div>Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value failed">${testResults.failed}</div>
                <div>Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${successRate}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        <div class="test-list">
            <h2>Test Results</h2>
            ${testResults.details.map(result => `
                <div class="test-item ${result.passed ? 'passed' : 'failed'}">
                    <div class="test-name">${result.passed ? '✅' : '❌'} ${result.file}</div>
                    <div class="test-duration">Duration: ${result.duration}ms</div>
                    ${result.error ? `<div class="test-error">Error: ${result.error}</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Total execution time: ${testResults.duration}ms</p>
            <p>Generated by Automated Test Runner</p>
        </div>
    </div>
</body>
</html>
  `;

  try {
    fs.writeFileSync(reportPath, html);
    if (!CONFIG.silentMode) {
      console.log(colors.cyan + '📄 HTML report generated: ' + reportPath + colors.reset);
    }
  } catch (error) {
    if (!CONFIG.silentMode) {
      console.warn(colors.yellow + 'Warning: Could not generate HTML report: ' + error.message + colors.reset);
    }
  }
}

/**
 * Generate JSON report
 */
function generateJSONReport() {
  if (!CONFIG.generateReports) return;

  const reportPath = path.join(CONFIG.testDir, 'automated-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1),
      duration: testResults.duration
    },
    tests: testResults.details
  };

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    if (!CONFIG.silentMode) {
      console.log(colors.cyan + '📄 JSON report generated: ' + reportPath + colors.reset);
    }
  } catch (error) {
    if (!CONFIG.silentMode) {
      console.warn(colors.yellow + 'Warning: Could not generate JSON report: ' + error.message + colors.reset);
    }
  }
}

/**
 * Print summary
 */
function printSummary() {
  if (CONFIG.silentMode) return;

  console.log('\n' + colors.bright + colors.cyan + '📊 AUTOMATED TEST SUMMARY' + colors.reset);
  console.log('='.repeat(50));
  console.log('Total Tests: ' + colors.bright + testResults.total + colors.reset);
  console.log('Passed: ' + colors.green + testResults.passed + colors.reset);
  console.log('Failed: ' + colors.red + testResults.failed + colors.reset);
  console.log('Success Rate: ' + colors.bright + ((testResults.passed / testResults.total) * 100).toFixed(1) + '%' + colors.reset);
  console.log('Duration: ' + colors.bright + testResults.duration + 'ms' + colors.reset);

  if (testResults.failed > 0) {
    console.log('\n' + colors.red + '❌ FAILED TESTS:' + colors.reset);
    testResults.errors.forEach(result => {
      console.log(colors.red + '  • ' + result.file + ' - ' + result.error + colors.reset);
    });
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Initialize
    testResults.startTime = Date.now();

    if (!CONFIG.silentMode) {
      console.log(colors.bright + colors.magenta + '🚀 AUTOMATED EXPENSE TRACKER TEST RUNNER' + colors.reset);
      console.log('='.repeat(60) + '\n');
    }

    // Discover test files
    const testFiles = discoverTestFiles();
    testResults.total = testFiles.length;

    if (testFiles.length === 0) {
      console.log(colors.yellow + '⚠️  No test files found matching patterns' + colors.reset);
      process.exit(0);
    }

    if (!CONFIG.silentMode) {
      console.log(colors.cyan + '📂 Discovered ' + testFiles.length + ' test files' + colors.reset);
      console.log('Running tests with max concurrency: ' + CONFIG.maxConcurrency + '\n');
    }

    // Run all tests
    await runAllTests(testFiles);

    // Calculate duration
    testResults.endTime = Date.now();
    testResults.duration = testResults.endTime - testResults.startTime;

    // Generate reports
    generateHTMLReport();
    generateJSONReport();

    // Print summary
    printSummary();

    // Exit with appropriate code
    if (testResults.failed > 0) {
      if (!CONFIG.silentMode) {
        console.log('\n' + colors.red + '💥 SOME TESTS FAILED!' + colors.reset);
      }
      process.exit(1);
    } else {
      if (!CONFIG.silentMode) {
        console.log('\n' + colors.green + '🎉 ALL TESTS PASSED!' + colors.reset);
      }
      process.exit(0);
    }

  } catch (error) {
    console.error(colors.red + '💥 Test runner failed: ' + error.message + colors.reset);
    process.exit(2);
  }
}

// Handle process events
process.on('uncaughtException', (error) => {
  console.error(colors.red + '💥 Uncaught Exception: ' + error.message + colors.reset);
  process.exit(2);
});

process.on('unhandledRejection', (reason) => {
  console.error(colors.red + '💥 Unhandled Rejection: ' + String(reason) + colors.reset);
  process.exit(2);
});

// Run the test runner
main();
