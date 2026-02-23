---
description: Scaffold the full Next.js project folder structure from scratch
---

# Workflow: Create Project Structure

Before scaffolding, read the existing `package.json`, `tsconfig.json`, `biome.json`, and `next.config.ts` to avoid overwriting existing configuration. 

## Steps

1. **Scaffold the `src/` directory tree**

   ```
   src/
   ├── app/
   │   ├── layout.tsx          ← Root layout with Next.js font setup + providers
   │   ├── page.tsx            ← Main entry
   │   └── globals.css         ← Tailwind imports
   ├── components/
   │   ├── ui/                 ← Shadcn components
   │   └── common/             ← Custom reusable components
   ├── features/
   │   └── core/               ← Example feature module
   ├── hooks/                  ← Custom generic hooks
   ├── lib/                    ← Utility functions, Zod schemas, APIs (e.g. utils.ts)
   ├── store/                  ← Global Zustand stores
   └── types/                  ← Shared TypeScript types
   ```

2. **Scaffold `public/`**
   ```
   public/
   ├── icons/
   └── images/
   ```

3. **Scaffold `tests/`**
   ```
   tests/
   ├── unit/
   ├── integration/
   └── e2e/
   ```

4. **Verify the scaffold**
   ```bash
   npx tsc --noEmit
   npx biome check .
   ```
   Both must pass before committing.