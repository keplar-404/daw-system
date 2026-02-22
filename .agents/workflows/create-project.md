---
description: Scaffold a new project following the universal architecture rule
---

## Steps

1. Confirm the project type (Next.js App Router, Vite + React, Node API, etc.) and install dependencies.

// turbo
2. Create the base folder structure:
```
src/
  app/           ← routing (page.tsx, layout.tsx)
  features/      ← feature modules
  components/    ← shared UI
  lib/           ← pure utilities
  store/         ← global state
  api/           ← centralized API client
  styles/        ← tokens.css + globals.css
```

3. Create `src/styles/tokens.css` with CSS custom properties for color, spacing, radius, shadow, and duration tokens.

4. Configure absolute imports (`@/`) in `tsconfig.json` (or `vite.config.ts`):
```json
"paths": { "@/*": ["./src/*"] }
```

5. Install and configure **Biome** for linting + formatting:
```bash
npm install --save-dev @biomejs/biome
npx biome init
```

6. Install and configure **Husky** + **lint-staged**:
```bash
npx husky-init && npm install
```

7. Set up CI (GitHub Actions or equivalent) with jobs: lint, type-check, test, build.

8. Create `.env.example` with all required environment variable keys (no values).

9. Initialize a `README.md` describing the project, stack, and how to run it locally.
