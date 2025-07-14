#!/usr/bin/env node

/**
 * 🚀 UNIFIED EXPENSE TRACKER TEST RUNNER
 * =====================================
 *
 * This is a comprehensive test runner that automatically discovers and executes
 * all test files in the tests directory. It's designed to grow with the project
 * as new tests are added, providing a single entry point for regression testing.
 *
 * Features:
 * - Automatic test discovery (all .test.js and test-*.js files)
 * - Recursive directory scanning
 * - Real-time progress reporting
 * - Detailed pass/fail statistics
 * - Error collection and reporting
 * - Performance metrics
 * - Supports both Jest-style and custom test formats
 * - HTML report generation
 *
 * Usage:
 * node src/tests/unified-test-runner.js
 *
 * Or with npm script:
 * npm run test:all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test runner configuration
const config = {
  testPaths: [__dirname],
  testPatterns: [
    /\.test\.js$/,
    /^test-.*\.js$/,
    /.*-test\.js$/
  ],
  excludePatterns: [
    /unified-test-runner\.js$/,
    /node_modules/,
    /\.min\.js$/
  ],
  timeoutMs: 30000,
  verbose: true
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
  cyan: '\x1b[36m'
};

/**
 * Recursively find all test files
 */
function findTestFiles(directory = __dirname) {
  const testFiles = [];

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          // Check if file matches test patterns
          const isTestFile = config.testPatterns.some(pattern => pattern.test(item));
          const isExcluded = config.excludePatterns.some(pattern => pattern.test(fullPath));

          if (isTestFile && !isExcluded) {
            testFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(colors.yellow + 'Warning: Could not scan directory ' + dir + ': ' + error.message + colors.reset);
    }
  }

  config.testPaths.forEach(testPath => scanDirectory(testPath));
  return testFiles.sort((a, b) => a.localeCompare(b));
}

/**
 * Run a single test file
 */
async function runTestFile(testFilePath) {
  const startTime = Date.now();
  const fileName = path.basename(testFilePath);

  return new Promise((resolve) => {
    try {
      console.log(colors.blue + '📋 Running: ' + fileName + colors.reset);

      // For Node.js test files, run them directly
      const child = spawn('node', [testFilePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.resolve(__dirname, '../..')  // Set to project root
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          file: fileName,
          path: testFilePath,
          success: code === 0,
          duration,
          stdout,
          stderr,
          exitCode: code
        };

        if (result.success) {
          console.log(colors.green + '✅ ' + fileName + ' (' + duration + 'ms)' + colors.reset);
        } else {
          console.log(colors.red + '❌ ' + fileName + ' (' + duration + 'ms) - Exit code: ' + code + colors.reset);
        }

        resolve(result);
      });

      child.on('error', (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          file: fileName,
          path: testFilePath,
          success: false,
          duration,
          stdout: '',
          stderr: error.message,
          exitCode: -1,
          error: error.message
        };

        console.log(colors.red + '❌ ' + fileName + ' (' + duration + 'ms) - Error: ' + error.message + colors.reset);
        resolve(result);
      });

      // Set timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        console.log(colors.yellow + '⏰ ' + fileName + ' timed out after ' + config.timeoutMs + 'ms' + colors.reset);
      }, config.timeoutMs);

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(colors.red + '❌ ' + fileName + ' - Exception: ' + error.message + colors.reset);
      resolve({
        file: fileName,
        path: testFilePath,
        success: false,
        duration,
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        error: error.message
      });
    }
  });
}

/**
 * Generate detailed test report
 */
function generateReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log('\n' + colors.bright + colors.cyan + '📊 TEST SUMMARY' + colors.reset);
  console.log('='.repeat(50));
  console.log('Total Tests: ' + colors.bright + totalTests + colors.reset);
  console.log('Passed: ' + colors.green + passedTests + colors.reset);
  console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${colors.bright}${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`Total Duration: ${colors.bright}${totalDuration}ms${colors.reset}`);
  console.log(`Average Duration: ${colors.bright}${(totalDuration / totalTests).toFixed(1)}ms${colors.reset}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}${colors.bright}❌ FAILED TESTS:${colors.reset}`);
    results.filter(r => !r.success).forEach(result => {
      console.log(colors.red + '  • ' + result.file + colors.reset);
      if (result.stderr) {
        console.log(`    ${colors.red}Error: ${result.stderr.slice(0, 200)}...${colors.reset}`);
      }
      if (result.error) {
        console.log(`    ${colors.red}Exception: ${result.error}${colors.reset}`);
      }
    });
  }

  // Generate HTML report
  generateHTMLReport(results);

  return failedTests === 0;
}

/**
 * Generate HTML test report
 */
function generateHTMLReport(results) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Tracker Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px; }
        .test-results { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .test-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #e9ecef; }
        .test-item:last-child { border-bottom: none; }
        .test-success { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failure { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-name { font-weight: 500; }
        .test-duration { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Expense Tracker Test Report</h1>
            <p>Comprehensive test results for all discovered test files</p>
        </div>
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${totalTests}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number success">${passedTests}</div>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number failure">${failedTests}</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${((passedTests / totalTests) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalDuration}ms</div>
                    <div class="stat-label">Total Duration</div>
                </div>
            </div>

            <h3>Test Results</h3>
            <div class="test-results">
                ${results.map(result => `
                    <div class="test-item ${result.success ? 'test-success' : 'test-failure'}">
                        <div>
                            <div class="test-name">${result.success ? '✅' : '❌'} ${result.file}</div>
                            ${!result.success && result.stderr ? `<div style="color: #dc3545; font-size: 0.9em; margin-top: 5px;">${result.stderr.slice(0, 100)}...</div>` : ''}
                        </div>
                        <div class="test-duration">${result.duration}ms</div>
                    </div>
                `).join('')}
            </div>

            <div class="timestamp">
                Report generated on ${new Date().toLocaleString()}
            </div>
        </div>
    </div>
</body>
</html>`;

  try {
    const reportPath = path.join(__dirname, 'test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n${colors.cyan}📄 HTML report generated: ${reportPath}${colors.reset}`);
  } catch (error) {
    console.warn(colors.yellow + 'Warning: Could not generate HTML report: ' + error.message + colors.reset);
  }
}

/**
 * Main test runner function
 */
async function runAllTests() {
  console.log(colors.bright + colors.magenta + '🚀 UNIFIED EXPENSE TRACKER TEST RUNNER' + colors.reset);
  console.log('='.repeat(60) + '\n');

  // Discover test files
  const testFiles = findTestFiles();

  if (testFiles.length === 0) {
    console.log(colors.yellow + '⚠️  No test files found matching patterns: ' + config.testPatterns.map(p => p.toString()).join(', ') + colors.reset);
    return false;
  }

  console.log(colors.cyan + '📂 Discovered ' + testFiles.length + ' test files:' + colors.reset);
  testFiles.forEach(file => {
    console.log(`  • ${path.relative(__dirname, file)}`);
  });
  console.log('');

  // Run all tests
  const startTime = Date.now();
  const results = [];

  for (const testFile of testFiles) {
    const result = await runTestFile(testFile);
    results.push(result);
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  console.log(`\n${colors.bright}⏱️  Total execution time: ${totalDuration}ms${colors.reset}`);

  // Generate report
  const allPassed = generateReport(results);

  if (allPassed) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bright}💥 SOME TESTS FAILED!${colors.reset}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(colors.red + '💥 Uncaught Exception: ' + error.message + colors.reset);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(colors.red + '💥 Unhandled Rejection: ' + String(reason) + colors.reset);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error(colors.red + '💥 Test runner failed: ' + error.message + colors.reset);
  console.error(error.stack);
  process.exit(1);
});
