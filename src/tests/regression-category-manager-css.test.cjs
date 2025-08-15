const fs = require('fs');
const path = require('path');

describe('Regression: Category Manager CSS and script hygiene', () => {
  test('no large inline CSS injection in categoryManagerModal.js', () => {
    const filePath = path.join(__dirname, '../ui/categoryManagerModal.js');
    const content = fs.readFileSync(filePath, 'utf8');

    const longTemplateLiteralPattern = /style\.textContent\s*=\s*`[\s\S]{2000,}`/;
    expect(longTemplateLiteralPattern.test(content)).toBe(false);

    // Ensure we add only a link tag or minimal marker style
    expect(content).toMatch(/document\.createElement\(['"]link['"]\)|document\.createElement\(['"]style['"]\)/);
    // Marker id used by the neutral Category Manager
    expect(content).toMatch(/categoryManagerStyles/);
  });

  test('canonical stylesheet includes category-manager.css', () => {
    const stylesPath = path.join(__dirname, '../../src/styles/styles.css');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    expect(styles).toMatch(/@import\s+["']\.\/category-manager\.css["'];?/);
  });
});
