---
trigger: always_on
---

# Code Quality Standard

All code must:

- Use TypeScript strict mode
- No any type
- Full type definitions
- JSDoc for every public method
- Named exports only
- File size under 300 lines
- Single responsibility principle

Naming:
- Files: kebab-case
- Components: PascalCase
- Hooks: useX
- Types: PascalCase
- Constants: UPPER_SNAKE_CASE

No default exports (except Next pages/layout).