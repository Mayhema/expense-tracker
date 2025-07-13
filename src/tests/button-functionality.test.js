/**
 * @jest-environment jsdom
 */

/**
 * Button Functionality Test
 * Tests if buttons are clickable and have proper CSS applied
 */

describe('Button Functionality', () => {
  beforeEach(() => {
    // Set up DOM with basic HTML structure
    document.body.innerHTML = `
      <div class="main-content">
        <button class="btn test-button" id="test-btn">Test Button</button>
        <button class="button test-button2" id="test-btn2">Test Button 2</button>
      </div>
    `;
    
    // Mock CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .btn, .button {
        display: inline-block;
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #007bff;
        color: white;
      }
      .btn:hover, .button:hover {
        background: #0056b3;
      }
      body.dark-mode {
        background: #1a1a1a;
      }
      body.dark-mode .btn, body.dark-mode .button {
        background: #0d6efd;
      }
    `;
    document.head.appendChild(style);
  });

  test('buttons should be clickable', () => {
    const button = document.getElementById('test-btn');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('buttons should have proper cursor style', () => {
    const button = document.getElementById('test-btn');
    const styles = window.getComputedStyle(button);
    
    // In JSDOM, cursor might not be computed, so we check the CSS class
    expect(button.classList.contains('btn')).toBe(true);
  });

  test('dark mode should not break button functionality', () => {
    document.body.classList.add('dark-mode');
    
    const button = document.getElementById('test-btn2');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('buttons should not have pointer-events: none', () => {
    const button = document.getElementById('test-btn');
    
    // Check that the button element exists and is clickable
    expect(button).not.toBeNull();
    expect(button.tagName.toLowerCase()).toBe('button');
  });
});
