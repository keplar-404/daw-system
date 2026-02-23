---
trigger: always_on
description: UI, Design System, Components, Accessibility & Layout
---

# UI Rules

## Design System

We use **Tailwind CSS** and **shadcn/ui** for the design system.

### Colors and Styling
- Use Tailwind CSS utility classes for styling.
- Use CSS custom properties defined in your global CSS for semantic colors (e.g., `bg-primary`, `text-muted-foreground`).
- Never use inline styles unless computing dynamic layout pixel coordinates.
- Maintain consistent spacing, primarily using Tailwind's 4-point spacing scale (e.g., `p-4`, `gap-2`).

### shadcn/ui Usage
- Install shadcn/ui components when needed via the CLI or manual addition instead of building them from scratch.
- Use the `cn` utility from `src/lib/utils.ts` (clsx + tailwind-merge) to combine classes gracefully.
- Avoid modifying the base shadcn/ui components heavily; instead, create wrapper components.

---

## Component Rules

### Structure
- Presentational logic should be separated from business logic.
- Keep components focused and small.
- Extract complex custom hooks if the component's internal logic grows too large.

### Icons
- Use `lucide-react` for all icons ensuring consistency in stroke width and style.

### Responsive Layout
- Use Tailwind's `sm:`, `md:`, `lg:`, `xl:` prefixes to create a mobile-first responsive design.
- The UI should work seamlessly from mobile screens up to wide desktops.

---

## Accessibility
- All interactive elements must be keyboard-focusable.
- Use `aria-` labels for screen readers when visual labels are omitted.
- Follow WCAG contrast guidelines for text.
- Refer to `accessibility.md` for extended rules.
