---
description: Generate a single UI component that is accessible, design-system-compliant, and tested
---

## Steps

1. Determine if the component belongs to a feature (`src/features/<f>/components/`) or is shared (`src/components/`).

2. Check whether **shadcn/ui** already provides this component. If it does, extend it — do not duplicate.
   ```bash
   npx shadcn@latest add <component-name>
   ```

3. Create `<ComponentName>.tsx`. Follow these rules:
   - Props: use a named interface `<ComponentName>Props` exported from the file.
   - No hardcoded colors, spacing, or sizes — use CSS custom properties from `tokens.css`.
   - No inline `style={{}}` unless strictly required for dynamic values.
   - Use semantic HTML first; ARIA only as a supplement.

4. Accessibility checklist (required before marking done):
   - [ ] Keyboard navigable
   - [ ] Visible focus ring
   - [ ] Correct ARIA role / label
   - [ ] Works with screen reader (`axe` check)

5. Create `<ComponentName>.test.tsx` using Testing Library:
   - Test render output
   - Test user interactions (`userEvent`)
   - Test accessibility with `@testing-library/jest-dom`
   - Run `axe(container)` and assert no violations

6. Export the component from the nearest `index.ts` barrel.
