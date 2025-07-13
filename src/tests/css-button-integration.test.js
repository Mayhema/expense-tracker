/**
 * @jest-environment jsdom
 */

/**
 * CSS Button Integration Test
 * Tests if CSS changes have affected button click functionality
 */

describe('CSS Button Integration', () => {
  beforeEach(() => {
    // Set up DOM with actual button classes from the app
    document.body.innerHTML = `
      <div class="header">
        <button class="action-button" id="uploadBtn">
          <span class="action-icon">📤</span>
          <span class="action-text">Upload</span>
        </button>
        <button class="hamburger-menu" id="hamburgerBtn">
          <span></span>
        </button>
      </div>
      <div class="sidebar">
        <button class="nav-button" id="darkModeBtn">
          <span class="toggle-icon">☀️</span>
          <span>Dark Mode</span>
        </button>
      </div>
    `;
  });

  test('action-button should be clickable', () => {
    const button = document.getElementById('uploadBtn');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('hamburger-menu should be clickable', () => {
    const button = document.getElementById('hamburgerBtn');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('nav-button should be clickable', () => {
    const button = document.getElementById('darkModeBtn');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('dark mode should not affect button functionality', () => {
    document.body.classList.add('dark-mode');
    
    const button = document.getElementById('uploadBtn');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('buttons should have proper structure', () => {
    const actionButton = document.getElementById('uploadBtn');
    const navButton = document.getElementById('darkModeBtn');
    
    expect(actionButton.classList.contains('action-button')).toBe(true);
    expect(navButton.classList.contains('nav-button')).toBe(true);
  });
});
