document.addEventListener('DOMContentLoaded', function () {
  // Initialize console logging with proper JSON structure
  let logContent = [];

  // Create save button
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Logs';
  saveButton.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    padding: 10px 15px;
    background: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 9999;
    font-size: 12px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;

  // Show/hide based on debug mode
  function updateButtonVisibility() {
    const isDebugMode = localStorage.getItem("debugMode") === "true";
    saveButton.style.display = isDebugMode ? 'block' : 'none';
  }

  updateButtonVisibility();
  document.body.appendChild(saveButton);

  // Listen for debug mode changes
  window.addEventListener('storage', function (e) {
    if (e.key === 'debugMode') {
      updateButtonVisibility();
    }
  });

  // FIXED: Save logs as proper JSON file
  function saveLogs() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]; // Clean timestamp
      const filename = `console-logs-${timestamp}.json`;

      // Create comprehensive JSON log structure
      const logData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          totalLogs: logContent.length
        },
        appState: {
          transactions: window.AppState?.transactions?.length || 0,
          mergedFiles: window.AppState?.mergedFiles?.length || 0,
          categories: Object.keys(window.AppState?.categories || {}).length,
          currentFile: window.AppState?.currentFileName || null
        },
        localStorage: {
          transactions: localStorage.getItem('transactions') ? 'present' : 'missing',
          mergedFiles: localStorage.getItem('mergedFiles') ? 'present' : 'missing',
          debugMode: localStorage.getItem('debugMode'),
          darkMode: localStorage.getItem('darkMode')
        },
        logs: logContent.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp).toISOString() // Ensure proper ISO format
        }))
      };

      // CRITICAL FIX: Create and download JSON file properly
      const jsonString = JSON.stringify(logData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ CRITICAL: Successfully saved ${logContent.length} log entries to ${filename}`);

      // Optional: Clear logs after saving
      if (confirm('Clear logs after saving?')) {
        logContent = [];
        console.log('📝 Console logs cleared');
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR: Error saving logs:', error);
      alert('Error saving logs: ' + error.message);
    }
  }

  // Attach save function to button
  saveButton.addEventListener('click', saveLogs);

  // Export to global scope
  window.saveConsoleLogs = saveLogs;
  window.clearConsoleLogs = () => {
    logContent = [];
    console.log('📝 Console logs cleared manually');
  };

  // Enhanced log capture with proper JSON serialization
  function appendToLog(type, args) {
    const timestamp = new Date().toISOString();

    // Convert arguments to serializable format
    const serializedArgs = args.map(arg => {
      if (arg === null) return null;
      if (arg === undefined) return '[undefined]';

      if (typeof arg === 'object') {
        try {
          // Handle special objects
          if (arg instanceof Error) {
            return {
              type: 'Error',
              name: arg.name,
              message: arg.message,
              stack: arg.stack
            };
          }

          if (arg instanceof Date) {
            return {
              type: 'Date',
              value: arg.toISOString()
            };
          }

          // Try to serialize object
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          console.warn('Failed to serialize object:', e.message);
          return `[Object: ${Object.prototype.toString.call(arg)}]`;
        }
      }

      return arg;
    });

    // Create log entry
    const logEntry = {
      timestamp,
      type: type.toUpperCase(),
      message: args.map(arg =>
        typeof arg === 'object' && arg !== null ?
          JSON.stringify(arg, null, 2) :
          String(arg)
      ).join(' '),
      args: serializedArgs,
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100) // Truncate for space
    };

    logContent.push(logEntry);

    // Keep only last 1000 entries to prevent memory issues
    if (logContent.length > 1000) {
      logContent = logContent.slice(-1000);
    }
  }

  // Override console methods
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  console.log = function (...args) {
    appendToLog('log', args);
    originalMethods.log.apply(console, args);
  };

  console.error = function (...args) {
    appendToLog('error', args);
    originalMethods.error.apply(console, args);
  };

  console.warn = function (...args) {
    appendToLog('warn', args);
    originalMethods.warn.apply(console, args);
  };

  console.info = function (...args) {
    appendToLog('info', args);
    originalMethods.info.apply(console, args);
  };

  // HTTP request logger
  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (...args) {
      const url = args[0] instanceof Request ? args[0].url : args[0];
      const startTime = performance.now();

      console.log(`🌐 HTTP REQUEST: ${url}`);

      return originalFetch.apply(this, args).then(response => {
        const duration = Math.round(performance.now() - startTime);
        console.log(`✅ HTTP RESPONSE: ${response.status} ${url} (${duration}ms)`);
        return response;
      }).catch(err => {
        const duration = Math.round(performance.now() - startTime);
        console.error(`❌ HTTP ERROR: ${url} (${duration}ms)`, err);
        throw err;
      });
    };
  }

  console.log('📝 Console logger initialized with JSON export support');
});
