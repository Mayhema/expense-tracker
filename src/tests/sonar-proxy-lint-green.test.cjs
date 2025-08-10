/**
 * Sonar proxy test: ensures our lint green-gate is clean.
 * This does not run Sonar itself, but it guards our “0 problems” baseline
 * by failing if ESLint reports errors (warnings allowed).
 */

const { execSync } = require('node:child_process');

describe('sonar proxy lint green', () => {
  test('eslint reports 0 errors', () => {
    // Run eslint with stylish output and capture status
    let output = '';
    try {
      output = execSync('npm run lint', { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    } catch (e) {
      // If eslint exits non-zero, include its output for debugging
      const combined = `${e.stdout?.toString() || ''}\n${e.stderr?.toString() || ''}`;
      throw new Error(`ESLint reported errors. Output:\n${combined}`);
    }
    // Minimal assertion: command succeeded, so 0 errors by eslint rules
    expect(output).toContain('warning'); // warnings are acceptable
  });
});
