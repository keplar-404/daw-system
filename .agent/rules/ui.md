---
trigger: always_on
description: UI, Design System, Components, Accessibility & Layout
---

# UI Rules

## Design System

All UI must use the design tokens defined in `src/styles/theme.css` and the Tailwind config. **Never hardcode colors, spacing, border-radius, or font sizes.**

### Colors
- Use CSS custom properties: `var(--color-surface)`, `var(--color-accent)`, etc.
- Accent gradient only for primary CTA actions — never overuse
- Never use raw Tailwind colors (e.g., `bg-blue-500`) — only design token aliases

### Spacing Scale
- Base unit: **8px** — all spacing must be a multiple of 8px
- Use Tailwind spacing utilities that map to the 8px scale
- No inconsistent padding; match surrounding context

### Typography
- Font family set in `layout.tsx` via Next.js font optimization
- Font size, weight, and line-height from design tokens only

### Glassmorphism (Controlled Use)
Allowed only for: Panels, floating modals, Transport bar.

```
Allowed:   backdrop-blur-md, bg-white/5 to bg-white/10, border-white/10, subtle gradient overlays
Forbidden: heavy blur stacking, neon shadows, glow effects, overlapping blur layers
```

---

## Component Rules

### shadcn/ui Usage
- Use shadcn/ui components for: Button, Toggle, Slider, Modal/Dialog, Input, Select, Tabs, Tooltip
- **Check shadcn registry first** before building a custom component
- If a component isn't in shadcn, build it manually but **match the shadcn design language** — use the same CSS variables so global theme changes cascade automatically

### Custom DAW Components
- Timeline, TrackHeader, Clip, Piano Roll, MixerChannel, AutomationLane — **built manually**, not with shadcn
- These live in `src/components/daw/`
- Must be reusable, isolated, receive props (not global state directly)
- Avoid direct engine calls inside components — use store actions instead
- Memoize with `React.memo` if the component is heavy or re-renders frequently

### Component Structure Pattern
```tsx
// 1. Imports (external libraries → internal modules → types)
// 2. Types/interfaces for this component's props
// 3. Constants local to this component
// 4. The component function (named export, PascalCase)
// 5. Sub-components or helpers (if small enough to colocate)
```

---

## Accessibility

All interactive elements must be accessible:

- Every interactive element has `aria-label` or visible text label
- Keyboard navigation required — no mouse-only interactions
- Focus states visible (use `:focus-visible` ring)
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Sliders and knobs controllable via arrow keys
- Don't rely on color alone to convey information

---

## DAW UX Priorities

This is a **professional production tool** — not a marketing site. UX must prioritize:

- **Speed** — actions feel instantaneous
- **Precision** — sliders, nudge, snap all feel tight
- **Clarity** — low visual noise, clear hierarchy
- **Workflow efficiency** — common actions on keyboard shortcuts

**Rules:**
- No decorative animations or transitions during playback
- Transport (play/stop/BPM) always visible, always accessible
- Timeline is the primary focus — never obscure it
- All controls must respond immediately (no debounce on primary actions)

---

## Responsive Layout

Breakpoints and layout behavior:

| Breakpoint | Layout |
|---|---|
| Mobile | Vertical stacked; Mixer/Inspector in slide-up drawers; horizontal scroll timeline |
| Tablet | Two-column; collapsible mixer |
| Desktop | Full DAW: Timeline + Tracks + Mixer all visible |

- Never break grid alignment
- Never overflow the viewport without explicit scroll container
- Touch interactions must work on tablet (pointer-coarse support)

---

## Visual Consistency Checklist

Before committing UI changes, verify:
- [ ] No new hardcoded hex values, px values, or font-size values
- [ ] No new inline styles (except dynamic pixel positions)
- [ ] Consistent 8px spacing throughout
- [ ] Glass effects only in permitted locations
- [ ] Accent color not overused
- [ ] Component passes keyboard navigation test
