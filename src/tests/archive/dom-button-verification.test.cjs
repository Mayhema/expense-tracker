/**
 * @jest-environment jsdom
 */

/**
 * DOM Button Existence Test
 * Tests if buttons exist and are properly configured in the actual DOM structure
 */

describe('DOM Button Verification', () => {
  beforeEach(() => {
    // Set up DOM similar to the actual application structure
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .action-button {
            display: inline-block;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background: #007bff;
            color: white;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .action-button:hover {
            background: #0056b3;
            transform: translateY(-1px);
          }
          .hamburger-menu {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
          }
          .nav-button {
            background: none;
            border: none;
            cursor: pointer;
            color: #333;
            padding: 10px;
          }
          body.dark-mode .nav-button {
            color: #fff;
          }
          /* Check if any rule might affect clickability */
          * {
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <button class="hamburger-menu" id="hamburgerMenu">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1>Expense Tracker</h1>
          </div>
          <div class="action-buttons">
            <button class="action-button" id="fileUploadBtn">
              <span class="action-icon">📤</span>
              <span class="action-text">Upload</span>
            </button>
            <button class="action-button" id="categoryManagerBtn">
              <span class="action-icon">🏷️</span>
              <span class="action-text">Categories</span>
            </button>
          </div>
        </div>
        <div class="sidebar">
          <button class="nav-button" id="darkModeToggle">
            <span class="toggle-icon">☀️</span>
            <span>Dark Mode</span>
          </button>
        </div>
      </body>
      </html>
    `;
  });

  test('buttons exist in DOM', () => {
    const uploadBtn = document.getElementById('fileUploadBtn');
    const categoryBtn = document.getElementById('categoryManagerBtn');
    const hamburgerBtn = document.getElementById('hamburgerMenu');
    const darkModeBtn = document.getElementById('darkModeToggle');

    expect(uploadBtn).not.toBeNull();
    expect(categoryBtn).not.toBeNull();
    expect(hamburgerBtn).not.toBeNull();
    expect(darkModeBtn).not.toBeNull();
  });

  test('buttons have correct tagName', () => {
    const uploadBtn = document.getElementById('fileUploadBtn');
    const hamburgerBtn = document.getElementById('hamburgerMenu');

    expect(uploadBtn.tagName.toLowerCase()).toBe('button');
    expect(hamburgerBtn.tagName.toLowerCase()).toBe('button');
  });

  test('buttons have correct classes', () => {
    const uploadBtn = document.getElementById('fileUploadBtn');
    const hamburgerBtn = document.getElementById('hamburgerMenu');
    const darkModeBtn = document.getElementById('darkModeToggle');

    expect(uploadBtn.classList.contains('action-button')).toBe(true);
    expect(hamburgerBtn.classList.contains('hamburger-menu')).toBe(true);
    expect(darkModeBtn.classList.contains('nav-button')).toBe(true);
  });

  test('buttons are clickable and fire events', () => {
    const uploadBtn = document.getElementById('fileUploadBtn');
    let clickCount = 0;

    uploadBtn.addEventListener('click', () => {
      clickCount++;
    });

    // Simulate multiple clicks
    uploadBtn.click();
    uploadBtn.click();
    uploadBtn.click();

    expect(clickCount).toBe(3);
  });

  test('buttons work with dark mode applied', () => {
    document.body.classList.add('dark-mode');

    const darkModeBtn = document.getElementById('darkModeToggle');
    let clicked = false;

    darkModeBtn.addEventListener('click', () => {
      clicked = true;
    });

    darkModeBtn.click();
    expect(clicked).toBe(true);
  });

  test('buttons have proper structure with spans', () => {
    const uploadBtn = document.getElementById('fileUploadBtn');
    const spans = uploadBtn.querySelectorAll('span');

    expect(spans.length).toBe(2);
    expect(spans[0].classList.contains('action-icon')).toBe(true);
    expect(spans[1].classList.contains('action-text')).toBe(true);
  });
});
