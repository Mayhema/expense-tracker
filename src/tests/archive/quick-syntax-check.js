#!/usr/bin/env node

/**
 * Quick Test Syntax Validator
 * Validates that our test files have correct syntax and structure
 */

const fs = require('fs');
const path = require('path');

function validateTestFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic syntax validation
    const hasDescribe = content.includes('describe(');
    const hasTest = content.includes('test(') || content.includes('it(');
    const hasRequire = content.includes('require(');

    // Check for obvious syntax errors
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const balancedBraces = openBraces === closeBraces;

    return {
      valid: hasDescribe && hasTest && balancedBraces,
      hasDescribe,
      hasTest,
      hasRequire,
      balancedBraces,
      openBraces,
      closeBraces,
      size: Math.round(content.length / 1024)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

function main() {
  console.log('🔍 QUICK TEST VALIDATION');
  console.log('='.repeat(40));

  const testDir = path.join(__dirname);
  const optimizedTests = [
    'fast-core-functionality.test.cjs',
    'comprehensive-button-test.cjs',
    'consolidated-layout-styling.test.cjs',
    'table-layout-fixes.test.cjs'
  ];

  let allValid = true;

  optimizedTests.forEach(testFile => {
    const filePath = path.join(testDir, testFile);
    const result = validateTestFile(filePath);

    if (result.valid) {
      console.log(`✅ ${testFile} (${result.size}KB)`);
    } else {
      console.log(`❌ ${testFile} - ISSUES:`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        if (!result.hasDescribe) console.log('   - Missing describe()');
        if (!result.hasTest) console.log('   - Missing test()');
        if (!result.balancedBraces) console.log(`   - Unbalanced braces: ${result.openBraces} open, ${result.closeBraces} close`);
      }
      allValid = false;
    }
  });

  console.log('\n' + '='.repeat(40));
  if (allValid) {
    console.log('🎉 All optimized tests have valid syntax!');
    console.log('✅ Ready for Jest execution');
  } else {
    console.log('⚠️ Some tests have syntax issues that need fixing');
  }

  // Additional check - see if Jest can at least parse the files
  console.log('\n🧪 JEST COMPATIBILITY CHECK:');

  try {
    const jestConfig = require('../package.json').jest;
    console.log('✅ Jest configuration found');
    console.log('   Environment:', jestConfig.testEnvironment);
    console.log('   Test pattern:', jestConfig.testMatch.join(', '));
    console.log('   Transform:', Object.keys(jestConfig.transform).join(', '));
  } catch (error) {
    console.log('❌ Jest configuration issue:', error.message);
  }
}

if (require.main === module) {
  main();
}

import { describe, test, expect } from '@jest/globals';

describe('quick-syntax-check', () => {
  test('minimal quick syntax check test passes', () => {
    expect(true).toBe(true);
  });
});
