---
trigger: always_on
description: Core Architecture, Code Quality & Project Structure
---

# Core Rules

## Tech Stack

This is a **Next.js App Router** DAW (Digital Audio Workstation) built with:
- **Framework**: Next.js 14+ (App Router)
- **Audio**: Tone.js (engine singleton only) 
- **Rendering**: Pixi.js (timeline, piano roll, waveforms)
- **State**: Zustand + Immer
- **UI**: shadcn/ui + Radix primitives + Tailwind CSS
- **DnD**: dnd-kit
- **i18n**: next-intl
- **Linting/Formatting**: Biome (see biome.json)
- **Testing**: Jest + React Testing Library
- **Workers**: Web Workers (audio processing, waveform, export)

---

## Architecture Layers

The project follows a strict 4-layer architecture. **Never cross layer boundaries.**

| Layer | Location | Responsibility |
|---|---|---|
| **UI** | `src/components/`, `src/app/` | React components, shadcn/ui, layout. No Tone.js, no AudioContext. |
| **Feature** | `src/features/` | Feature-specific logic, Zustand stores, Pixi setup, DnD context |
| **Engine** | `src/features/audio/engine.ts` | Tone.js singleton, AudioContext, Transport. No React imports. |
| **Workers** | `src/workers/` | AI generation, MIDI parsing, waveform, export. Heavy computation only. |

**Data Flow:** UI → Store → Engine. Workers ↔ Store via `postMessage`. No circular dependencies.

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages & layouts
│   ├── layout.tsx            # Root layout (fonts, providers)
│   ├── page.tsx              # Main DAW workspace entry
│   └── providers/            # Global providers (Zustand, i18n, theme)
│
├── components/               # Reusable, presentation-only UI components
│   ├── common/               # Buttons, sliders, toggles, modals, knobs
│   ├── layout/               # Panels, header, sidebar, resizable panes
│   ├── daw/                  # DAW-specific UI (TrackHeader, Clip, TimelineRuler, MixerChannel, PianoRoll, AutomationLane)
│   └── icons/                # SVG icon components
│
├── features/                 # Feature modules (business logic + local state)
│   ├── audio/                # engine.ts, tracksStore.ts, clipsStore.ts, effects.ts
│   ├── dnd/                  # DndContext.tsx, hooks.ts (dnd-kit wrappers)
│   ├── pixi/                 # canvas.tsx, layers.ts, utils.ts
│   ├── midi/                 # MIDI import/export, piano roll data
│   └── workspace/            # Workspace.tsx, Panels.tsx, Timeline.tsx
│
├── hooks/                    # Shared custom React hooks (useWindowSize, useKeyboardShortcuts, useZoomPan)
├── lib/                      # Pure utility functions (math.ts, audioUtils.ts, logger.ts)
├── store/                    # Global Zustand stores (uiStore.ts, appStore.ts)
├── styles/                   # globals.css, theme.css (CSS custom properties)
├── types/                    # Shared TypeScript types (track.ts, clip.ts, audio.ts, dnd.ts)
└── workers/                  # audioWorker.ts, waveformWorker.ts, renderWorker.ts

public/
├── icons/
├── images/
└── sounds/

tests/
├── unit/
├── integration/
└── e2e/
```

---

## Code Quality Standards

### TypeScript
- Strict mode always on — `"strict": true` in tsconfig
- **No `any` type** — use `unknown` + type narrowing when truly unknown
- Full type definitions for all props, function params, and return values
- Use `type` for object shapes, `interface` for extendable contracts

### Naming Conventions
| What | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `track-header.tsx` |
| Components | `PascalCase` | `TrackHeader` |
| Hooks | `useX` | `useZoomPan` |
| Stores | `useXStore` | `useTracksStore` |
| Types/Interfaces | `PascalCase` | `TrackData` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TRACK_COUNT` |
| Utility functions | `camelCase` | `timeToPixels` |

### Module Rules
- **Named exports only** — no default exports (except Next.js `page.tsx` / `layout.tsx`)
- **File size under 300 lines** — split into sub-modules if exceeded
- **Single responsibility** — one concern per file
- **JSDoc on every public/exported function** — include `@param`, `@returns`, `@throws`
- No `console.log`, commented-out code, or test artifacts in committed code
- No inline styles (except genuinely dynamic pixel values from JS)
- No circular imports — use dependency injection or message passing instead
