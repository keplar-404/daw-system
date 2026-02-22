---
description: Verify the project is ready for a production deployment
---

# Workflow: Production Readiness Check

Run this checklist before every production build.

## Steps

### Code Quality
1. **TypeScript — zero errors**
   ```bash
   npx tsc --noEmit
   ```
   Must return no errors.

2. **Biome — zero errors**
   ```bash
   npx biome check .
   ```
   Must return no errors. Auto-fix safe issues first: `npx biome check --apply .`

3. **No leftover console statements** in source files:
   ```bash
   npx biome check . --rule=noConsole
   ```
   Only `src/lib/logger.ts` is allowed to use console methods.

### Architecture
4. **No architecture violations** — spot check these imports:
   ```bash
   # Tone.js must NOT appear in components or app/ 
   grep -r "from 'tone'" src/components/ src/app/
   # Should return nothing
   
   # React must NOT appear in engine.ts
   grep "from 'react'" src/features/audio/engine.ts
   # Should return nothing
   ```

### Testing
5. **All tests pass**
   ```bash
   npx jest --passWithNoTests
   ```

6. **Coverage at or above 85%**
   ```bash
   npx jest --coverage
   ```
   Check the summary table — no module should be below 85% line coverage.

### Bundle & Performance
7. **Build succeeds**
   ```bash
   npx next build
   ```
   Must complete without errors.

8. **Bundle size check**
   ```bash
   ANALYZE=true npx next build
   ```
   - No single JS chunk above 500KB gzipped
   - Tone.js and Pixi.js must show as lazy/dynamic chunks (not in main bundle)

### Functionality
9. **i18n — no missing translation keys**
   - Verify `messages/en.json` has all keys referenced by `useTranslations()` in the codebase
   - If next-intl strict mode is on, a missing key causes a build error — confirm no missing keys

10. **Security spot check**
    - No `eval(` in codebase: `grep -r "eval(" src/` — must return nothing
    - No hardcoded secrets or API keys: `grep -r "sk-\|API_KEY=" src/` — must return nothing

11. **Accessibility basic check**
    - Run Lighthouse accessibility audit on the main workspace page
    - Minimum score: 80

### Final
12. **Check `.env.example` is up to date** — all environment variables used in the code must be documented in `.env.example`