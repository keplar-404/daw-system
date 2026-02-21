---
trigger: always_on
---

# Design System Enforcement Rule

All UI must strictly follow the design system defined in:

design-system.txt

No component may introduce:
- Random spacing
- Random colors
- Random border radius
- Inline styles
- Arbitrary Tailwind values
* All pages and layout components should be in `app/` following Next.js conventions.
* Use Shadcn UI components for buttons, toggles, modals, sliders, and input elements only.
* Custom DAW UI elements (timeline, track header, clips) must be built manually for maximum flexibility.
* Components must be reusable and composable.
* Use consistent spacing, padding, and alignment across all UI components.
* All interactive elements should have proper accessibility attributes (aria-label, role, etc.).

All styling must use:
- Design tokens
- Tailwind config values
- shadcn component variants
- Utility classes from design system

If a style is missing:
- Extend the design system first
- Do not hardcode values