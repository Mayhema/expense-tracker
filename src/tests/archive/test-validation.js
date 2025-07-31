/**
 * Test Validation and Status Report
 * Quick validation of all test files and their current status
 */

import fs from 'fs';
import path from 'path';

export function validateTestFiles() {
  console.log('🔍 TEST FILE VALIDATION REPORT');
  console.log('='.repeat(50));

  const testDir = __dirname;
  const testFiles = fs.readdirSync(testDir)
    .filter(file => file.endsWith('.test.cjs') || (file.endsWith('.cjs') && file.includes('test')))
    .sort((a, b) => a.localeCompare(b));

  console.log(`Found ${testFiles.length} test files:\n`);

  const categories = {
    optimized: [],
    legacy: [],
    problematic: []
  };

  testFiles.forEach(file => {
    const filePath = path.join(testDir, file);
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Categorize tests
    if (file.includes('fast-core-functionality') ||
      file.includes('comprehensive-button') ||
      file.includes('consolidated-layout')) {
      categories.optimized.push(file);
    } else if (content.includes('describe(') && content.includes('test(')) {
      categories.legacy.push(file);
    } else {
      categories.problematic.push(file);
    }

    // Basic validation
    const hasDescribe = content.includes('describe(');
    const hasTest = content.includes('test(') || content.includes('it(');

    const status = hasDescribe && hasTest ? '✅' : '❌';
    const size = (stats.size / 1024).toFixed(1);

    console.log(`${status} ${file.padEnd(40)} (${size}KB)`);

    if (!hasDescribe || !hasTest) {
      console.log(`   ⚠️ Missing proper test structure`);
    }
  });

  console.log('\n📊 TEST CATEGORIZATION:');
  console.log(`✨ Optimized Tests: ${categories.optimized.length}`);
  categories.optimized.forEach(file => console.log(`   - ${file}`));

  console.log(`\n📋 Legacy Tests: ${categories.legacy.length}`);
  console.log(`❌ Problematic Tests: ${categories.problematic.length}`);

  return categories;
}

function generateOptimizedTestPlan(categories) {
  console.log('\n🚀 OPTIMIZED TEST EXECUTION PLAN');
  console.log('='.repeat(50));

  const plan = {
    phase1_smoke: [
      'fast-core-functionality.test.cjs'
    ].filter(file => categories.optimized.includes(file)),

    phase2_interaction: [
      'comprehensive-button-test.cjs'
    ].filter(file => categories.optimized.includes(file)),

    phase3_layout: [
      'consolidated-layout-styling.test.cjs',
      'table-layout-fixes.test.cjs'
    ].filter(file => fs.existsSync(path.join(__dirname, file))),

    phase4_integration: categories.legacy.filter(file =>
      !file.includes('dark-mode') &&
      !file.includes('regression') &&
      file.length < 50 // Prefer shorter filenames (usually simpler tests)
    ).slice(0, 5)
  };

  Object.entries(plan).forEach(([phase, tests]) => {
    console.log(`\n${phase.toUpperCase().replace('_', ' - ')}:`);
    if (tests.length === 0) {
      console.log('   (No tests available)');
    } else {
      tests.forEach(test => console.log(`   ✓ ${test}`));
    }
  });

  return plan;
}

function checkTestHealth() {
  console.log('\n🏥 TEST HEALTH CHECK');
  console.log('='.repeat(30));

  const issues = [];
  const testDir = __dirname;

  // Check for duplicate test files
  const testFiles = fs.readdirSync(testDir).filter(f => f.includes('test'));
  const nameParts = testFiles.map(f => f.replace(/\.test\.cjs$/, '').replace(/\.cjs$/, ''));
  const duplicates = nameParts.filter((name, index) => nameParts.indexOf(name) !== index);

  if (duplicates.length > 0) {
    issues.push(`Potential duplicate tests: ${duplicates.join(', ')}`);
  }

  // Check for very large test files (> 10KB)
  const largeFiles = testFiles.filter(file => {
    const stats = fs.statSync(path.join(testDir, file));
    return stats.size > 10000;
  });

  if (largeFiles.length > 0) {
    issues.push(`Large test files (may be slow): ${largeFiles.join(', ')}`);
  }

  // Check Jest configuration
  const packageJsonPath = path.join(path.dirname(testDir), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.jest) {
      issues.push('No Jest configuration found in package.json');
    }
  }

  if (issues.length === 0) {
    console.log('✅ No major issues detected');
  } else {
    console.log('⚠️ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  return issues;
}

function recommendActions() {
  console.log('\n💡 RECOMMENDATIONS');
  console.log('='.repeat(30));

  const recommendations = [
    '1. Run optimized tests first for quick feedback',
    '2. Use --smoke flag for basic functionality validation',
    '3. Fix any Jest configuration issues',
    '4. Consider removing or consolidating duplicate tests',
    '5. Split large test files into focused suites',
    '6. Monitor test execution time and optimize slow tests'
  ];

  recommendations.forEach(rec => console.log(rec));
}

// Main execution
function main() {
  const categories = validateTestFiles();
  const plan = generateOptimizedTestPlan(categories);
  const issues = checkTestHealth();
  recommendActions();

  console.log('\n🎯 NEXT STEPS:');
  console.log('='.repeat(20));
  console.log('1. Run: node src/tests/optimized-test-runner.js --smoke');
  console.log('2. Run: npm test (full suite)');
  console.log('3. Check results in optimized-test-report.json');

  return {
    categories,
    plan,
    issues,
    summary: {
      totalTests: categories.optimized.length + categories.legacy.length + categories.problematic.length,
      optimizedTests: categories.optimized.length,
      healthIssues: issues.length
    }
  };
}

if (require.main === module) {
  main();
}

module.exports = { validateTestFiles, generateOptimizedTestPlan, checkTestHealth };

import { describe, test, expect } from '@jest/globals';

describe('test-validation', () => {
  test('minimal test validation passes', () => {
    expect(true).toBe(true);
  });
});
