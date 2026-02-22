---
description: Scaffold the full DAW project folder structure from scratch
---

# Workflow: Create Project Structure

Before scaffolding, read the existing `package.json`, `tsconfig.json`, `biome.json`, and `next.config.ts` 
to avoid overwriting existing configuration. Import/merge values from these files into any new config files created.

## Steps

1. **Scaffold the `src/` directory tree**

   ```
   src/
   ├── app/
   │   ├── layout.tsx          ← Root layout with Next.js font setup + providers
   │   ├── page.tsx            ← Main entry, lazy-load workspace
   │   └── providers/
   │       └── Providers.tsx   ← Zustand + next-intl + theme providers
   ├── components/
   │   ├── common/             ← Generic UI (buttons, sliders, modals)
   │   ├── layout/             ← Panels, header, sidebar, resize handles
   │   ├── daw/                ← TrackHeader, Clip, TimelineRuler, MixerChannel, PianoRoll, AutomationLane
   │   └── icons/              ← SVG icon components
   ├── features/
   │   ├── audio/              ← engine.ts, tracksStore.ts, clipsStore.ts, effects.ts
   │   ├── dnd/                ← DndContext.tsx, hooks.ts
   │   ├── pixi/               ← canvas.tsx, layers.ts, utils.ts
   │   ├── midi/               ← parser.ts, export.ts
   │   └── workspace/          ← Workspace.tsx, Panels.tsx, Timeline.tsx
   ├── hooks/                  ← useWindowSize.ts, useKeyboardShortcuts.ts, useZoomPan.ts
   ├── lib/                    ← math.ts, audioUtils.ts, logger.ts
   ├── store/                  ← uiStore.ts, appStore.ts
   ├── styles/                 ← globals.css, theme.css
   ├── types/                  ← track.ts, clip.ts, audio.ts, dnd.ts
   └── workers/                ← audioWorker.ts, waveformWorker.ts, renderWorker.ts
   ```

2. **Scaffold `public/`**
   ```
   public/
   ├── icons/
   ├── images/
   └── sounds/
   ```

3. **Scaffold `tests/`**
   ```
   tests/
   ├── unit/
   ├── integration/
   └── e2e/
   ```

4. **Scaffold `messages/`** (i18n)
   ```
   messages/
   └── en.json    ← empty object `{}` to start
   ```

5. **Create `src/app/layout.tsx`**
   - Import Next.js font (e.g., Inter from `next/font/google`)
   - Wrap children in `<Providers>`
   - Set `<html lang="en">`, metadata export with proper title

6. **Create `src/features/audio/engine.ts`**
   - Use `next/dynamic` guard: only initialize Tone.js when `typeof window !== 'undefined'`
   - Export typed functions: `createTrack`, `removeTrack`, `setVolume`, `setPan`, `startPlayback`, `stopPlayback`

7. **Create `src/store/uiStore.ts` and `appStore.ts`**
   - Use Zustand with Immer middleware
   - Type all state and all actions

8. **Verify the scaffold**
   ```bash
   npx tsc --noEmit
   npx biome check .
   ```
   Both must pass before committing.