// Jest setup: silence noisy logs and provide minimal stubs for browser-only globals

// Silence chart-related logs and general console noise during tests
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.log = (...args) => {
    const msg = args && args[0] ? String(args[0]) : '';
    if (
      msg.includes('Creating income/expense chart') ||
      msg.includes('Creating expense category chart') ||
      msg.includes('Creating timeline chart') ||
      msg.includes('Updating charts with current data') ||
      msg.includes('Chart canvas not found')
    ) {
      return; // mute
    }
    originalLog.apply(console, args);
  };

  console.warn = (...args) => {
    const msg = args && args[0] ? String(args[0]) : '';
    if (msg.includes('Chart canvas not found')) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const msg = args && args[0] ? String(args[0]) : '';
    if (
      msg.includes('Chart.js is not loaded') ||
      msg.includes('Error creating') ||
      msg.includes('Could not load link') ||
      msg.includes('Encoding not recognized')
    ) {
      return; // mute noisy jsdom resource errors
    }
    originalError.apply(console, args);
  };

  // Provide a minimal Chart stub so chart modules don't throw
  if (typeof global.Chart === 'undefined') {
    global.Chart = function Chart(ctx, cfg) {
      this.ctx = ctx;
      this.config = cfg || {};
      this.destroy = () => { };
      this.update = () => { };
    };
  }

  // Stub requestAnimationFrame for tests
  if (typeof global.requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
});

afterAll(() => {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
});
