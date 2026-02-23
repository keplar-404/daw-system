# Accessibility

All interfaces must meet **WCAG 2.1 Level AA** at minimum.

## Color & Contrast

- Text: ≥ **4.5:1** contrast ratio against its background.
- Large text (≥18pt or 14pt bold): ≥ **3:1**.
- UI controls and focus indicators: ≥ **3:1**.
- Never use color alone to convey meaning — pair with an icon or label.

## Keyboard Navigation

- Every interactive element must be focusable and operable via keyboard alone.
- Logical tab order follows visual reading order.
- No keyboard traps (modalss must be escapable via `Escape`).
- Visible focus ring required on all focusable elements — never `outline: none` without a replacement.

## Semantic HTML

- Use the correct element: `<button>` for actions, `<a>` for navigation, `<input>` for data entry.
- Use ARIA roles and attributes only when native HTML is insufficient.
- One `<h1>` per page. Heading levels are sequential (no skipping from h1 to h3).
- Use `<main>`, `<nav>`, `<aside>`, `<footer>` landmarks.

## ARIA

- All icons that convey meaning need `aria-label` or accompanying visually-hidden text.
- Decorative images: `alt=""`. Meaningful images: descriptive `alt` text.
- Use `aria-live` regions for dynamic content updates (toasts, counters, status messages).
- Use `aria-expanded`, `aria-selected`, `aria-checked`, `aria-disabled` for component state.

## Forms

- Every input has a visible `<label>` (or `aria-label`).
- Validation errors reference the input via `aria-describedby`.
- Required fields marked with `aria-required="true"` and a visible indicator.
