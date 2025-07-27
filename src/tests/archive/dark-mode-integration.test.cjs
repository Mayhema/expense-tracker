/**
 * @jest-environment jsdom
 */

/**
 * Dark Mode Integration Test
 * Tests the complete dark mode functionality in main.css
 */

const fs = require('fs');
const path = require('path');

describe('Dark Mode CSS Integration', () => {
  let mainCssContent;

  beforeAll(() => {
    mainCssContent = fs.readFileSync(path.join(__dirname, '../styles/main.css'), 'utf8');
  });

  describe('Dark Mode Variables and Styles', () => {
    test('main.css contains dark mode CSS variables', () => {
      expect(mainCssContent).toContain('body.dark-mode {');
      expect(mainCssContent).toContain('--bg-primary: #1a1a1a;');
      expect(mainCssContent).toContain('--bg-secondary: #2a2a2a;');
      expect(mainCssContent).toContain('--text-primary: #e0e0e0;');
    });

    test('filters have dark mode override styles', () => {
      expect(mainCssContent).toContain('body.dark-mode .transaction-filters');
      expect(mainCssContent).toContain('body.dark-mode .advanced-filters');
    });
  });

  describe('Advanced Filters Dark Mode (Issue #1)', () => {
    test('has dark mode override styles', () => {
      expect(mainCssContent).toContain('body.dark-mode .transaction-filters');
      expect(mainCssContent).toContain('body.dark-mode .advanced-filters');
    });

    test('uses futuristic dark gradients (not white background)', () => {
      expect(mainCssContent).toContain('linear-gradient(135deg, #0a0a0f');
      expect(mainCssContent).toContain('#1a1a2e');
      expect(mainCssContent).toContain('#16213e');
    });
  });

  describe('Multi-Column Layout (Issue #2)', () => {
    test('implements responsive grid system', () => {
      expect(mainCssContent).toContain('grid-template-columns: repeat(3, 1fr)');
      expect(mainCssContent).toContain('grid-template-columns: repeat(2, 1fr)');
    });

    test('has proper gap spacing for multi-column layout', () => {
      expect(mainCssContent).toContain('gap: 20px');
    });
  });

  describe('Futuristic Styling (Issue #3)', () => {
    test('has cyberpunk visual effects', () => {
      expect(mainCssContent).toContain('backdrop-filter: blur(10px)');
      expect(mainCssContent).toContain('linear-gradient(135deg, #0a0a0f');
      expect(mainCssContent).toContain('border-image: linear-gradient(45deg, #667eea');
    });

    test('has advanced shadow and glow effects', () => {
      expect(mainCssContent).toContain('box-shadow:');
      expect(mainCssContent).toContain('rgba(102, 126, 234');
    });
  });

  describe('Modal Dark Mode (Issue #4)', () => {
    test('has inline style override selectors', () => {
      expect(mainCssContent).toContain('body.dark-mode .modal');
      expect(mainCssContent).toContain('body.dark-mode .modal-content');
      expect(mainCssContent).toContain('body.dark-mode .modal-header');
    });

    test('uses dark mode variables for backgrounds', () => {
      expect(mainCssContent).toContain('background: var(--bg-primary)');
      expect(mainCssContent).toContain('background: var(--bg-secondary)');
    });
  });

  describe('Transaction Summary Dark Mode (Issue #5)', () => {
    test('has dark mode styles for summary elements', () => {
      expect(mainCssContent).toContain('body.dark-mode .transaction-summary');
      expect(mainCssContent).toContain('body.dark-mode .summary-card');
      expect(mainCssContent).toContain('body.dark-mode .summary-item');
    });

    test('uses consistent dark mode variables', () => {
      expect(mainCssContent).toContain('background: var(--bg-secondary)');
      expect(mainCssContent).toContain('color: var(--text-primary)');
    });
  });

  describe('Integration Test Summary', () => {
    test('all critical dark mode styles are present in main.css', () => {
      // This meta-test ensures all dark mode components are defined
      const criticalStyles = [
        'body.dark-mode .transaction-filters',
        'body.dark-mode .advanced-filters',
        'body.dark-mode .modal',
        'body.dark-mode .summary-card',
        'grid-template-columns: repeat(3, 1fr)',
        'backdrop-filter: blur(10px)'
      ];

      criticalStyles.forEach(style => {
        expect(mainCssContent).toContain(style);
      });
    });
  });
});
