---
trigger: always_on
description: State Management, DnD, i18n & Scalability
---

# State, Data & Scalability Rules

## Zustand — State Management

### Store Structure
- **Global stores** (app-wide concerns) live in `src/store/`
  - `uiStore.ts` — theme, panel open/close, active modal, zoom level
  - `appStore.ts` — playhead position, transport state (playing/stopped/recording), BPM, timeline cursor
- **Feature stores** (feature-specific state) live next to their feature: `src/features/<feature>/store.ts`
  - `features/audio/tracksStore.ts` — track list, track metadata
  - `features/audio/clipsStore.ts` — clip data, positions, lengths

### Rules
- **Never store Tone.js nodes or AudioNodes in Zustand** — stores hold serializable metadata only
- **Never mix UI state and DAW logic state** in the same store
- Use **Immer middleware** for nested state mutations (avoid deep cloning)
- Write **selector functions** for derived data — never compute in components
- All store slices must be typed: `StoreApi<TrackStore>` pattern
- All state mutations must have a comment explaining the purpose of the change

### Selector Pattern
```ts
// ✅ Correct — selective subscription
const trackName = useTracksStore((s) => s.tracks[id]?.name);

// ❌ Wrong — subscribes to entire store, causes excess re-renders
const { tracks } = useTracksStore();
```

### Undo / Redo
- Implement via diff stack — do not deep clone entire project state on every action
- Store deltas (what changed) not full snapshots
- Use `temporal` middleware from `zustand/middleware` for undo/redo

---

## Drag & Drop — dnd-kit

- Use **dnd-kit** exclusively for all drag-and-drop (clips, tracks, samples)
- All DnD logic lives in `src/features/dnd/`
  - `DndContext.tsx` — root context provider
  - `hooks.ts` — `useDraggable`, `useDroppable` wrappers specific to this DAW
- Every draggable item must snap to the timeline grid on drop
- **Performance**: do not cause full DOM re-renders during drag — use CSS transforms only
- Must handle 10,000+ clips without stuttering (use sensor delay + activation constraints)

---

## i18n — next-intl

This project uses **`next-intl`** (not next-i18next — do not use that library).

- **No hardcoded UI strings** in any component — ever
- All text goes through `useTranslations` hook
- Translation files live in `messages/` directory (e.g., `messages/en.json`)
- Key naming: `feature.component.key` — e.g., `transport.playButton.label`
- Support RTL layout — use `dir` attribute on `<html>` and logical CSS properties (`margin-inline-start` not `margin-left`)
- Format numbers and timestamps using the `Intl` API, not manual formatting
- Default locale: `en`

```tsx
// ✅ Correct
const t = useTranslations('transport');
<button aria-label={t('playButton.label')}>{t('playButton.text')}</button>

// ❌ Wrong
<button aria-label="Play">Play</button>
```

---

## Scalability Requirements

The system must handle projects at scale without performance degradation:

| Metric | Target |
|---|---|
| Tracks | 1,000+ |
| Notes / clips | 10,000+ |
| Effects per track | Up to 5 |
| Timeline duration | 1+ hour |
| Frame rate | 60 FPS |

### Data Structure Rules
- Use `Map<string, Track>` (not arrays) for O(1) track/clip lookup by ID
- Maintain sorted arrays only for ordered operations (timeline rendering)
- When sorting is needed, use an indexed sorted structure — avoid re-sorting on every render
- **No deep cloning of large objects** in hot paths — use structural sharing via Immer
- Avoid JSON.stringify/JSON.parse on large project state frequently — serialize only on save
- Lazy-load feature modules with `next/dynamic` — don't load Pixi.js or Tone.js on initial page render
