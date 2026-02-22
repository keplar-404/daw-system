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
   - Component specs → use as reference when building custom DAW components

4. **Do not blindly copy design values** — if a design value conflicts with the DAW UX rules (e.g., a spacing value not on the 8px scale), round to the nearest compliant value and note the deviation

5. **Update `src/styles/theme.css`** with any new or updated CSS custom properties derived from the design

6. **Verify no regressions**
   ```bash
   npx next build
   ```
   The build must succeed after any token updates.