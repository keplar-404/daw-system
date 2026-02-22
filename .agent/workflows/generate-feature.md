---
description: Scaffold a new DAW feature module from scratch
---

# Workflow: Generate Feature

Use this when creating a new end-to-end feature (e.g., a new panel, a new audio effect, a new MIDI tool).

## Steps

1. **Confirm the feature name and scope**
   - Determine which layer(s) it touches: UI only, store + UI, or full stack (UI + store + engine + worker)
   - Name the feature in `kebab-case` (e.g., `eq-panel`, `clip-looping`, `midi-export`)

2. **Create the feature folder** at `src/features/<feature-name>/`

3. **Create the store** (if feature needs persistent state)
   - File: `src/features/<feature-name>/store.ts`
   - Use Zustand + Immer; export a typed `use<FeatureName>Store` hook
   - Separate UI state (open/closed, selected item) from data state (actual values)

4. **Create engine functions** (if feature touches audio)
   - Add to or extend `src/features/audio/engine.ts`
   - Expose only clean, typed functions — no Tone.js types leak outside this file

5. **Create the UI component(s)**
   - Check shadcn/ui registry first
   - Place in `src/components/daw/` (DAW-specific) or `src/components/common/` (generic)
   - Components receive props — they do not import the store directly unless truly needed at that level

6. **Create Web Worker** (if feature has heavy computation)
   - File: `src/workers/<feature-name>Worker.ts`
   - Communicate via `postMessage` / typed `MessageEvent`

7. **Add TypeScript types**
   - New shared types go in `src/types/<feature-name>.ts`
   - Local types stay colocated in the feature file

8. **Add i18n keys**
   - Add all UI strings to `messages/en.json` under a key matching the feature (e.g., `"eqPanel": { "title": "EQ" }`)
   - Use `useTranslations('eqPanel')` in the component — no hardcoded strings

9. **Add tests** — colocated `.test.ts` / `.test.tsx` files for:
   - Store actions and selectors
   - Component render and interaction
   - Engine function calls (Tone.js mocked)
   - Worker message handling (if applicable)

10. **Verify architecture compliance**
    - No Tone.js imports in UI components
    - No React imports in engine.ts
    - No store mutations outside store action functions
    - Run `npx tsc --noEmit` — must pass with zero errors
    - Run `npx biome check src/features/<feature-name>/` — must pass