---
description: Scaffold a new feature module from scratch
---

# Workflow: Generate Feature

Use this when creating a new end-to-end feature in the application.

## Steps

1. **Confirm the feature name and scope**
   - Name the feature in `kebab-case` (e.g., `user-profile`, `auth-flow`, `dashboard-metrics`)

2. **Create the feature folder** at `src/features/<feature-name>/`

3. **Create the store** (if feature needs persistent state)
   - File: `src/features/<feature-name>/store/<feature-name>Store.ts`
   - Use Zustand

4. **Create the UI component(s)**
   - Check shadcn/ui registry first
   - Place in `src/features/<feature-name>/components/`
   - Components receive props — they do not import the store directly unless truly needed at that level

5. **Add TypeScript types and Zod schemas**
   - Place inside `src/features/<feature-name>/types/` and `src/features/<feature-name>/schemas/`

6. **Add tests** — colocated `.test.ts` / `.test.tsx` files for:
   - Store actions and selectors
   - Component render and interaction

7. **Verify architecture compliance**
   - No store mutations outside store action functions
   - Run `npx tsc --noEmit` — must pass with zero errors
   - Run `npx biome check src/features/<feature-name>/` — must pass