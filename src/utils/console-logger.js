document.addEventListener('DOMContentLoaded', function () {
  let logContent = '';

  // Save the original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Overwrite console.log
  console.log = function (...args) {
    originalConsoleLog(...args); // Still log to the console
    appendToLog('[LOG]', args);
  };

  // Overwrite console.error
  console.error = function (...args) {
    originalConsoleError(...args);
    appendToLog('[ERROR]', args);
  };

  // Overwrite console.warn
  console.warn = function (...args) {
    originalConsoleWarn(...args);
    appendToLog('[WARN]', args);
  };

  // HTTP request logger
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const startTime = performance.now();
    const url = args[0] instanceof Request ? args[0].url : args[0];

    console.log(`HTTP REQUEST: ${url}`);

    return originalFetch.apply(this, args).then(response => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      console.log(`HTTP RESPONSE: ${url} - ${response.status} in ${duration}ms`);
      return response;
    }).catch(err => {
      console.error(`HTTP ERROR: ${url} - ${err.message}`);
      throw err;
    });
  };

  // If XMLHttpRequest is used
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.addEventListener('load', function () {
      console.log(`XHR: ${method} ${url} - ${this.status}`);
    });
    this.addEventListener('error', function () {
      console.error(`XHR ERROR: ${method} ${url}`);
    });
    originalXHROpen.apply(this, arguments);
  };

  function appendToLog(level, args) {
    const timestamp = new Date().toISOString();
    const message = args.join(' '); // Combine all arguments into a single string
    logContent += `${level} ${timestamp} - ${message}\n`;
  }

  function saveLogs() {
    if (!logContent) {
      alert('No logs to save.');
      return;
    }

    // Generate a unique filename with a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `console-output-${timestamp}.log`;

    // Create a Blob and trigger download
    const blob = new Blob([logContent], { type: 'text/plain' });
    const logContainer = document.createElement('a');
    logContainer.href = URL.createObjectURL(blob);
    logContainer.setAttribute('download', filename);
    logContainer.style.display = 'none';
    document.body.appendChild(logContainer);
    logContainer.click();
    document.body.removeChild(logContainer);

    // Clear the logs after saving
    logContent = '';
    console.log('Logs have been saved and cleared.');
  }

  // Add a button to save the logs
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Logs';
  saveButton.style.position = 'fixed';
  saveButton.style.bottom = '10px';
  saveButton.style.right = '10px';
  saveButton.style.padding = '10px';
  saveButton.style.background = '#007BFF';
  saveButton.style.color = '#fff';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '5px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.zIndex = '9999';
  saveButton.style.display = localStorage.getItem("debugMode") === "true" ? 'block' : 'none';

  saveButton.addEventListener('click', saveLogs);
  document.body.appendChild(saveButton);

  // Show/hide log button based on debug mode
  window.addEventListener('storage', function (e) {
    if (e.key === 'debugMode') {
      saveButton.style.display = e.newValue === "true" ? 'block' : 'none';
    }
  });

  // Export logger functions to global scope for debugging
  window.saveConsoleLogs = saveLogs;
  window.clearConsoleLogs = () => { logContent = ''; };
});
