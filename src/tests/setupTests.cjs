// Jest setup: silence noisy logs and provide minimal stubs for browser-only globals

// Silence chart-related logs and general console noise during tests
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Polyfill TextEncoder/TextDecoder for jsdom dependencies
  const { TextEncoder, TextDecoder } = require('util');
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
  }
  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
  }
  // Stub canvas.getContext to avoid jsdom not-implemented errors
  if (typeof HTMLCanvasElement !== 'undefined') {
    const proto = HTMLCanvasElement.prototype;
    if (!proto.getContext || proto.getContext.toString().includes('not implemented')) {
      proto.getContext = function getContext() {
        // Minimal 2D context used by our code
        return {
          clearRect: () => { },
          fillRect: () => { },
          fillText: () => { },
          beginPath: () => { },
          moveTo: () => { },
          lineTo: () => { },
          stroke: () => { },
          // Properties accessed in code
          set fillStyle(v) { this._fillStyle = v; },
          get fillStyle() { return this._fillStyle; },
          set font(v) { this._font = v; },
          get font() { return this._font; },
          set textAlign(v) { this._textAlign = v; },
          get textAlign() { return this._textAlign; },
          set textBaseline(v) { this._textBaseline = v; },
          get textBaseline() { return this._textBaseline; },
        };
      };
    }
  }
  console.log = (...args) => {
    const msg = String(args?.[0] ?? '');
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
    const msg = String(args?.[0] ?? '');
    if (msg.includes('Chart canvas not found')) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const msg = String(args?.[0] ?? '');
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
