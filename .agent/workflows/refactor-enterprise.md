---
description: Systematically refactor a feature or module to enterprise-grade standards
---

# Workflow: Enterprise Refactor

Use this to bring an existing file or feature up to full project standards.

## Steps

1. **Read the target file(s)** completely before touching anything

2. **Check TypeScript strictness**
   - Run `npx tsc --noEmit` and capture all errors for the target file(s)
   - Replace every `any` with a proper type or `unknown` + type guard
   - Add explicit return types to all exported functions
   - Add missing `interface` / `type` declarations

3. **Check architecture violations**
   - Does a UI component import from `tone`? → Extract to engine.ts and call via store action
   - Does a component manage Tone nodes in `useState`? → Move to engine.ts
   - Does a store contain Tone nodes or AudioNodes? → Remove; store only serializable metadata
   - Does a worker import React? → Remove; workers are pure TS

4. **Check naming conventions**
   - Files: `kebab-case` — rename if not compliant
   - Components: `PascalCase` — rename export if not compliant
   - Constants: `UPPER_SNAKE_CASE`
   - Hooks: `useX`

5. **Improve modularity**
   - If file is over 300 lines → split into logical sub-modules
   - If function does more than one thing → extract responsibilities into separate functions
   - If a component manages both data fetching and UI rendering → split into container + presentational

6. **Improve performance**
   - Add `React.memo` to components that receive changing parent props
   - Add `useCallback` to handlers, `useMemo` to derived computations
   - Replace full store subscriptions with selective selectors
   - Move inline object/array literals in JSX to `useMemo` or module-level constants

7. **Add/fix JSDoc**
   - Every exported function must have a JSDoc block with `@param`, `@returns`, and `@throws` if applicable
   - Short inline comments for non-obvious logic

8. **Run linting and formatting**
   ```bash
   npx biome check --apply src/path/to/target/
   ```
   - Fix all remaining Biome errors manually that `--apply` can't auto-fix

9. **Verify tests pass**
   ```bash
   npx jest --testPathPattern="<feature>" --coverage
   ```
   - Coverage must be ≥ 85% after refactor
   - Add tests for any newly extracted functions that had no coverage

10. **Final check**
    ```bash
    npx tsc --noEmit
    npx biome check .
    ```
    Both must return zero errors before the refactor is considered complete.