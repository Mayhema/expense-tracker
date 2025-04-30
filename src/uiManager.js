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
  
  export function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
  
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "30px",
      left: "50%",
      transform: "translateX(-50%)",
      background: type === "error" ? "#e74c3c" : "#333",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "6px",
      zIndex: 9999,
      fontSize: "16px",
      opacity: 0.95,
    });
  
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }