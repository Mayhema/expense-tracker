const fs = require('fs');
const path = require('path');

describe('Regression: Enhanced Category Manager CSS consolidation', () => {
  test('no large inline CSS injection in enhancedCategoryManager.js', () => {
    const filePath = path.join(__dirname, '../ui/enhancedCategoryManager.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Ensure we do not inject a massive CSS string anymore
    const longTemplateLiteralPattern = /style\.textContent\s*=\s*`[\s\S]{2000,}`/;
    expect(longTemplateLiteralPattern.test(content)).toBe(false);

    // Ensure we add only a link tag or minimal marker style
    expect(content).toMatch(/document\.createElement\(['"]link['"]\)|document\.createElement\(['"]style['"]\)/);
    expect(content).toMatch(/enhancedCategoryStyles/);
  });

  test('canonical stylesheet includes category-manager.css', () => {
    const stylesPath = path.join(__dirname, '../../src/styles/styles.css');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    // Accept both single or double quotes to be robust against formatters
    expect(styles).toMatch(/@import\s+["']\.\/category-manager\.css["'];?/);
  });
});
