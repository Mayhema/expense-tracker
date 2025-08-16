/**
 * Category Manager Test Suite
 * Validates functionality and integration of the default Category Manager
 */

// Set up Node.js globals for JSDOM compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const TEST_CONFIG = {
  testName: 'Category Manager Validation',
  verbose: true,
  timeout: 10000
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function addTestResult(testName, passed, message = '') {
  testResults.total++;
  if (passed) testResults.passed++; else testResults.failed++;
  testResults.details.push({ test: testName, passed, message });
  if (TEST_CONFIG.verbose) console.log(`${passed ? '✅' : '❌'} ${testName}${message ? ': ' + message : ''}`);
}

async function setupTestEnvironment() {
  const candidates = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../../index.html'),
    path.join(__dirname, '../../src/index.html')
  ];
  const existing = candidates.find(p => fs.existsSync(p));
  if (!existing) throw new Error('index.html not found for test environment');
  let indexContent = fs.readFileSync(existing, 'utf8');
  indexContent = indexContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});
  virtualConsole.on('jsdomError', () => {});

  const dom = new JSDOM(indexContent, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'outside-only',
    virtualConsole
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;

  return dom;
}

async function testCategoryButtons() {
  try {
    let hasSidebarBtn = !!document.getElementById('editCategoriesSidebarBtn');
    let hasHeaderBtn = !!document.getElementById('categoryManagerBtn');

    // Fallback: if not present in DOM (e.g., custom jsdom doc), verify presence in HTML file
    if (!hasSidebarBtn && !hasHeaderBtn) {
      const candidates = [
        path.join(__dirname, '../index.html'),
        path.join(__dirname, '../../src/index.html'),
        path.join(__dirname, '../../index.html')
      ];
      const htmlPath = candidates.find(p => fs.existsSync(p));
      if (htmlPath) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        hasSidebarBtn = htmlContent.includes('id="editCategoriesSidebarBtn"');
        hasHeaderBtn = htmlContent.includes('id="categoryManagerBtn"');
      }
    }

    addTestResult('Category Manager button exists (sidebar or header)', hasSidebarBtn || hasHeaderBtn,
      `Sidebar: ${hasSidebarBtn ? '✓' : '✗'}, Header: ${hasHeaderBtn ? '✓' : '✗'}`);
  } catch (e) {
    addTestResult('Category Manager buttons check', false, e.message);
  }
}

async function testCategoryModule() {
  try {
    const modulePath = path.join(__dirname, '../../src/ui/categoryManagerModal.js');
    const moduleExists = fs.existsSync(modulePath);
    addTestResult('Category Manager Module Exists', moduleExists, moduleExists ? 'Found categoryManagerModal.js' : 'Missing');

    if (moduleExists) {
      const content = fs.readFileSync(modulePath, 'utf8');
      const features = [
        ['show', 'export async function showCategoryManagerModal'],
        ['search', 'handleSearch'],
        ['filter', 'handleFilter'],
        ['bulk', 'toggleBulkOperations'],
        ['import/export', 'showImportExportModal'],
        ['DnD', 'initializeDragAndDrop']
      ];
      const results = features.map(([label, token]) => [label, content.includes(token)]);
      const hasAll = results.every(([, ok]) => ok);
      const msg = results.map(([label, ok]) => `${label}: ${ok ? '✓' : '✗'}`).join(', ');
      addTestResult('Category Manager Core/Features', hasAll, msg);
    }
  } catch (e) {
    addTestResult('Category Manager Module', false, e.message);
  }
}

async function testCssImport() {
  try {
    const stylesPath = path.join(__dirname, '../../src/styles/styles.css');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    const hasImport = styles.includes('category-manager.css');
    addTestResult('Category Manager CSS Import', hasImport, hasImport ? 'Imported in styles.css' : 'Missing import');
  } catch (e) {
    addTestResult('Category Manager CSS Import', false, e.message);
  }
}

async function testSidebarIntegration() {
  try {
    const sidebarPath = path.join(__dirname, '../../src/ui/sidebarManager.js');
    const content = fs.readFileSync(sidebarPath, 'utf8');
    const usesUnifiedHandler = content.includes('handleCategoryManagerClick');
    addTestResult('Sidebar integrates Category Manager', usesUnifiedHandler,
      `Unified: ${usesUnifiedHandler ? '✓' : '✗'}`);
  } catch (e) {
    addTestResult('Sidebar Integration', false, e.message);
  }
}

function summarizeResults() {
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(30));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.total}`);
  const rate = testResults.total ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  console.log(`📈 Success Rate: ${rate}%`);
  const success = testResults.failed === 0;
  console.log(`\n🎯 Overall Result: ${success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  return success;
}

async function runCategoryManagerTests() {
  console.log(`\n🧪 ${TEST_CONFIG.testName}`);
  console.log('='.repeat(50));

  try {
    await setupTestEnvironment();
    await testCategoryButtons();
    await testCategoryModule();
    await testCssImport();
    await testSidebarIntegration();
  } catch (e) {
    console.error('❌ Test setup failed:', e.message);
    addTestResult('Test setup', false, e.message);
  }

  return summarizeResults();
}

if (require.main === module) {
  runCategoryManagerTests().catch(err => {
    console.error('❌ Test execution failed:', err);
  });
}

module.exports = { runCategoryManagerTests, TEST_CONFIG };

if (typeof describe !== 'undefined') {
  describe('Category Manager', () => {
    test('runs all category manager tests', async () => {
      const success = await runCategoryManagerTests();
      expect(success).toBe(true);
    }, 30000);
  });
}
