const fs = require('fs');
const path = require('path');

describe('sonar-project.properties configuration', () => {
  test('has expected exclusions and ignore rules for 0-problem baseline', () => {
    const file = path.resolve(__dirname, '..', '..', 'sonar-project.properties');
    const text = fs.readFileSync(file, 'utf8');

    // Exclusions: node_modules, dist, .github, .git
    expect(text).toMatch(/sonar\.exclusions=.*node_modules.*dist.*\.github.*\.git/);

    // Ignore console usage and unused vars/params in sources (S106, S1172, S1481)
    expect(text).toMatch(/sonar\.issue\.ignore\.multicriteria=.*/);
    expect(text).toMatch(/multicriteria\.e1\.ruleKey=javascript:S106/);
    expect(text).toMatch(/multicriteria\.e2\.ruleKey=javascript:S1172/);
    expect(text).toMatch(/multicriteria\.e3\.ruleKey=javascript:S1481/);
  });
});
