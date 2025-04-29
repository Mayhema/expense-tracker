// Utility to show an element by ID
export function showElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Error: Unable to show element with ID "${id}".`);
    return;
  }
  element.style.display = 'block';
}

// Utility to hide an element by ID
export function hideElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Error: Unable to hide element with ID "${id}".`);
    return;
  }
  element.style.display = 'none';
}

// Utility to clear the content of an element by ID
export function clearElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Error: Unable to clear element with ID "${id}".`);
    return;
  }
  element.innerHTML = '';
}

// Dark Mode toggle functionality
export function toggleDarkMode() {
  const body = document.body;
  if (!body) {
    console.error('Error: Body element not found. Unable to toggle Dark Mode.');
    return;
  }
  body.classList.toggle('dark-mode');
}