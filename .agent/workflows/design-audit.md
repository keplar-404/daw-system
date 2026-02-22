---
description: Audit the design of a page or component for visual and design system violations
---

# Workflow: Design Audit

Use this to review existing UI for design system compliance.

## Steps

1. **Read the target file(s)** — component or page to audit

2. **Check for token violations**
   - Search for raw hex values: `grep -r "#[0-9a-fA-F]" src/` (should be zero in components)
   - Search for raw `px` font sizes not from the design system
   - Search for `style={{ color:` or `style={{ background:` — flag any that aren't dynamic JS values

3. **Check spacing consistency**
   - All spacing should follow 8px scale (`p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`, etc.)
   - Flag any `p-3`, `p-5`, `p-7` (non-scale values) — replace with nearest scale value

4. **Check glass effect usage**
   - Glass is only allowed on: Panels, floating modals, Transport bar
   - Verify only `backdrop-blur-md`, `bg-white/5`–`bg-white/10`, `border-white/10` are used
   - Flag and remove any `backdrop-blur-xl`, neon glow, or heavy shadow stacking

5. **Check accent color usage**
   - Accent gradient/color should only be on primary action buttons
   - Flag any accent color used for decorative purposes or secondary/tertiary actions

6. **Check shadcn/ui coverage**
   - For every button, input, modal, toggle, select, or slider — verify it uses a shadcn component
   - If a custom version exists that duplicates shadcn functionality → replace it with the shadcn version
   - If a custom component must exist → verify it uses the same CSS variables as shadcn

7. **Check accessibility**
   - Every interactive element has `aria-label` or visible label text
   - Focus states are visible on all interactive elements
   - No information conveyed by color alone

8. **Check responsiveness**
   - Test mobile layout: does the component stack correctly? Does the mixer collapse?
   - Ensure no `overflow` without an explicit `overflow-auto` scroll container

9. **Report findings** — list each violation with:
   - File and line number
   - What the violation is
   - What the correct fix is

10. **Apply fixes** — make corrections and re-verify each point above