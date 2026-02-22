import "@testing-library/jest-dom";

// ── jsdom polyfills ──────────────────────────────────────────────────────────

/**
 * ResizeObserver polyfill — jsdom doesn't implement this but Radix UI
 * primitives (Slider, etc.) require it via @radix-ui/react-use-size.
 */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
