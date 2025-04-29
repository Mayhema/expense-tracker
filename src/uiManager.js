// Directory: /src/uiManager.js

export function showElement(id) {
    const el = document.getElementById(id);
    if (!el) return console.error(`Element #${id} not found.`);
    el.style.display = 'block';
  }
  
  export function hideElement(id) {
    const el = document.getElementById(id);
    if (!el) return console.error(`Element #${id} not found.`);
    el.style.display = 'none';
  }
  
  export function clearElement(id) {
    const el = document.getElementById(id);
    if (!el) return console.error(`Element #${id} not found.`);
    el.innerHTML = '';
  }
  
  export function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
  }
  
  export function showToast(message, duration = 3000) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#333",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: 1000,
    });
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), duration);
  }