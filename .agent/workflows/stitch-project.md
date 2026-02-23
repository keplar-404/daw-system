---
description: Fetch the board design from the Stitch MCP server
---

# Workflow: Stitch Project

Use this to pull the visual design reference from the Stitch board for this project.

## Steps

1. **Read the project ID** from the environment:
   - Open `.env` (or `.env.local`) and read the value of `STITCH_ID`
   - If `STITCH_ID` is not set, stop and notify the user — this workflow cannot proceed without it

2. **Call the Stitch MCP server** using the project ID to fetch the board design

3. **Extract design tokens** from the fetched design data:
   - Colors → map to CSS custom properties in `src/styles/theme.css`
   - Typography → map to Tailwind config font settings
   - Spacing → verify alignment with 8px grid scale
   - Component specs → use as reference when building custom components
   - Create the stich board on the current project. But make sure just don't copy paste design. Rather create the design but following the project structure effectively.

4. **Do not blindly copy design values** — always follow the project default theme system.

5. **Update `src/styles/theme.css`** if the design system is necessary. But as minimal as possible

7. **Must respect and follow the project theme principle**

8. **Mobile first approach**

9. **Verify no regressions**
   ```bash
   npx next build
   ```
   The build must succeed after any token updates.