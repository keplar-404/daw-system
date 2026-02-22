---
description: Create a new reusable UI component
---

# Workflow: Generate UI Component

Use this when adding a new button, control, panel, or DAW-specific visual element.

## Steps

1. **Check shadcn/ui registry first**
   - Visit https://ui.shadcn.com/docs/components or run `npx shadcn@latest add <component>`
   - If the component exists in shadcn, use it — do not recreate it

2. **If not in shadcn — build a custom component**
   - Place in `src/components/daw/` for DAW-specific elements, or `src/components/common/` for generic UI
   - Name file in `kebab-case.tsx`, export component in `PascalCase`
   - The component must use the same CSS variables as shadcn (`--background`, `--foreground`, `--primary`, `--ring`, etc.) so it responds to global theme changes automatically

3. **Props interface**
   - Define a named `interface <ComponentName>Props` at the top of the file
   - Everything configurable must be a prop — no hardcoded values inside the component

4. **Styling rules**
   - Use only design tokens and Tailwind config values
   - Never hardcode hex colors, px sizes outside of dynamic JS values
   - Add `dark:` variants if the component has background/text colors

5. **Accessibility**
   - Add `aria-label` or `aria-labelledby` to every interactive element
   - Ensure keyboard operability (Tab focus, Enter/Space activation, arrow key support for sliders)
   - Add `:focus-visible` ring styling

6. **Memoization**
   - Wrap with `React.memo` if the component will re-render as part of a long list (tracks, clips)
   - Use `useCallback` for any handler props passed down

7. **Add a component test** at `<component-name>.test.tsx`:
   - Test: renders without crashing
   - Test: prop variations render correctly
   - Test: user interaction fires the correct callback
   - Test: keyboard navigation works

8. **Verify visual consistency**
   - No inline styles added (except dynamic pixel positions)
   - Spacing follows 8px scale
   - Works on mobile and desktop breakpoints