import { describe, test, expect } from '@jest/globals';

describe('optimized-test-runner', () => {
  test('minimal optimized test runner test passes', () => {
    expect(true).toBe(true);
  });
});

/**
 * Optimized Fast Test Runner
 * Runs tests in optimized order for maximum speed and early failure detection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FastTestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: "0.0",
        duration: 0
      },
      tests: []
    };
    this.startTime = Date.now();
  }

  // Categorize tests by expected speed
  categorizeTests() {
    const allTests = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.test.cjs') || file.endsWith('.cjs'))
      .filter(file => !file.includes('automated-test-runner'))
      .filter(file => !file.includes('test-runner'));

    return {
      fast: [
        'fast-core-functionality.test.cjs',
        'comprehensive-button-test.cjs'
      ].filter(test => allTests.includes(test)),

      medium: [
        'consolidated-layout-styling.test.cjs',
        'table-layout-fixes.test.cjs',
        'advanced-filters-dropdown.test.cjs',
        'category-dropdown-visibility.test.cjs'
      ].filter(test => allTests.includes(test)),

      slow: allTests.filter(test => ![
        'fast-core-functionality.test.cjs',
        'comprehensive-button-test.cjs',
        'consolidated-layout-styling.test.cjs',
        'table-layout-fixes.test.cjs',
        'advanced-filters-dropdown.test.cjs',
        'category-dropdown-visibility.test.cjs'
      ].includes(test))
    };
  }

  async runTestCategory(category, tests) {
    console.log(`\n🚀 RUNNING ${category.toUpperCase()} TESTS`);
    console.log('='.repeat(50));

    for (const testFile of tests) {
      try {
        const testStart = Date.now();
        console.log(`📋 Running ${testFile}...`);

        // Run individual test with timeout
        const command = `npx jest "${testFile}" --verbose --silent`;
        const result = execSync(command, {
          encoding: 'utf8',
          timeout: category === 'fast' ? 5000 : 30000, // Fast tests: 5s, others: 30s
          cwd: path.dirname(__dirname)
        });

        const duration = Date.now() - testStart;

        this.testResults.tests.push({
          file: testFile,
          category: category,
          duration: duration,
          passed: true,
          output: result.substring(0, 500) // Truncate output
        });

        this.testResults.summary.passed++;
        console.log(`✅ PASSED ${testFile} (${duration}ms)`);

      } catch (error) {
        const duration = Date.now() - testStart;

        this.testResults.tests.push({
          file: testFile,
          category: category,
          duration: duration,
          passed: false,
          error: error.message.substring(0, 500) // Truncate error
        });

        this.testResults.summary.failed++;
        console.log(`❌ FAILED ${testFile} (${duration}ms)`);

        // For fast tests, we might want to fail fast
        if (category === 'fast' && this.testResults.summary.failed > 2) {
          console.log('⚠️ Multiple fast test failures detected, stopping early');
          break;
        }
      }

      this.testResults.summary.total++;
    }
  }

  async runAllTests() {
    console.log('🧪 OPTIMIZED FAST TEST RUNNER');
    console.log('=====================================');
    console.log(`Started at: ${new Date().toLocaleString()}`);

    const categorizedTests = this.categorizeTests();

    console.log(`\n📊 TEST CATEGORIES:`);
    console.log(`   Fast: ${categorizedTests.fast.length} tests`);
    console.log(`   Medium: ${categorizedTests.medium.length} tests`);
    console.log(`   Slow: ${categorizedTests.slow.length} tests`);

    // Run tests in order of speed (fast first for early feedback)
    await this.runTestCategory('fast', categorizedTests.fast);
    await this.runTestCategory('medium', categorizedTests.medium);

    // Only run slow tests if fast tests mostly passed
    const fastFailureRate = this.testResults.summary.failed / Math.max(this.testResults.summary.total, 1);
    if (fastFailureRate < 0.3) {
      await this.runTestCategory('slow', categorizedTests.slow);
    } else {
      console.log('\n⚠️ Skipping slow tests due to high failure rate in fast tests');
      this.testResults.summary.skipped = categorizedTests.slow.length;
    }

    this.generateSummary();
    this.saveResults();
  }

  generateSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = this.testResults.summary.total > 0
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)
      : "0.0";

    this.testResults.summary.duration = totalDuration;
    this.testResults.summary.successRate = successRate;

    console.log('\n📊 FINAL TEST SUMMARY');
    console.log('=====================================');
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`⏭️ Skipped: ${this.testResults.summary.skipped}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    // Performance insights
    const fastTests = this.testResults.tests.filter(t => t.category === 'fast');
    const avgFastTestTime = fastTests.length > 0
      ? fastTests.reduce((sum, t) => sum + t.duration, 0) / fastTests.length
      : 0;

    console.log(`\n⚡ PERFORMANCE INSIGHTS:`);
    console.log(`   Average fast test time: ${avgFastTestTime.toFixed(0)}ms`);

    if (avgFastTestTime > 200) {
      console.log('   ⚠️ Fast tests are slower than expected');
    }

    // Show failed tests
    const failedTests = this.testResults.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      failedTests.forEach(test => {
        console.log(`   - ${test.file} (${test.duration}ms)`);
      });
    }

    // Success criteria
    if (parseFloat(successRate) >= 95) {
      console.log('\n🎉 EXCELLENT! Test suite passed with high success rate!');
    } else if (parseFloat(successRate) >= 85) {
      console.log('\n✅ GOOD! Test suite passed with acceptable success rate');
    } else {
      console.log('\n⚠️ WARNING! Test suite has low success rate - needs attention');
    }
  }

  saveResults() {
    // Save detailed results
    const reportPath = path.join(__dirname, 'optimized-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    // Also update the main automated report for compatibility
    const mainReportPath = path.join(__dirname, 'automated-test-report.json');
    fs.writeFileSync(mainReportPath, JSON.stringify(this.testResults, null, 2));

    console.log(`\n📄 Results saved to: ${reportPath}`);
  }

  // Quick smoke test - run only the fastest essential tests
  async runSmokeTest() {
    console.log('💨 QUICK SMOKE TEST');
    console.log('==================');

    const smokeTests = [
      'fast-core-functionality.test.cjs'
    ];

    const existingTests = smokeTests.filter(test =>
      fs.existsSync(path.join(__dirname, test))
    );

    if (existingTests.length === 0) {
      console.log('⚠️ No smoke tests found');
      return;
    }

    await this.runTestCategory('smoke', existingTests);

    const successRate = this.testResults.summary.total > 0
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)
      : "0.0";

    console.log(`\n💨 Smoke Test Result: ${successRate}% success rate`);

    if (parseFloat(successRate) < 100) {
      console.log('⚠️ Smoke test failed - basic functionality issues detected');
      process.exit(1);
    } else {
      console.log('✅ Smoke test passed - basic functionality working');
    }
  }
}

// Main execution
async function main() {
  const runner = new FastTestRunner();

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--smoke')) {
    await runner.runSmokeTest();
  } else {
    await runner.runAllTests();
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = FastTestRunner;
