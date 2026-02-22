---
trigger: always_on
description: Audio Engine, Pixi.js Rendering & Performance
---

# Audio Engine & Rendering Rules

## Tone.js — Audio Engine

The audio engine is a **singleton** at `src/features/audio/engine.ts`.

### Non-Negotiable Rules
- **One AudioContext** — never create a second one
- **One Tone.Transport** — all scheduling goes through it
- **No Tone.js imports in UI components** — engine is accessed only through store actions or exported engine functions
- **No AudioContext creation in React** — must be triggered by user gesture, handled in engine.ts
- **Pause transport before graph mutations** — then resume safely
- **Never recreate nodes during playback** — preallocate and reuse
- **No setTimeout/setInterval for audio timing** — use `Tone.Transport.schedule` and `Tone.Transport.scheduleRepeat` only

### Node Lifecycle
```
Create node → register in pool → connect → use → disconnect → return to pool → dispose on project close
```

### Engine API Shape (what engine.ts must export)
```ts
createTrack(id: string): void
removeTrack(id: string): void
setVolume(trackId: string, db: number): void
setPan(trackId: string, value: number): void
addEffect(trackId: string, effect: ToneEffect): void
removeEffect(trackId: string, effectId: string): void
scheduleClip(clip: ClipData): void
unscheduleClip(clipId: string): void
startPlayback(): void
stopPlayback(): void
```

### Avoid
- Dynamic graph rebuilds during playback
- Excessive effect instantiation/destruction
- Audio node leaks (always properly disconnect and dispose)
- Any React state updates inside the Tone.js playback tick/callback

---

## Web Workers

Use workers for CPU-heavy operations that would block the main thread:

| Worker | File | Responsibility |
|---|---|---|
| Audio | `src/workers/audioWorker.ts` | Heavy audio analysis, pitch detection, gain analysis |
| Waveform | `src/workers/waveformWorker.ts` | Waveform peak extraction from AudioBuffer |
| Render | `src/workers/renderWorker.ts` | Pre-processing for Pixi rendering (optional) |

- Workers communicate via `postMessage` / `onmessage` — never import Tone.js into workers
- Always terminate workers when their work is done / component unmounts
- Use `OffscreenCanvas` in workers where supported for background rendering

---

## Pixi.js — GPU Rendering

Pixi.js is used **exclusively** for the timeline canvas, piano roll, waveform display, and playhead.
**Never mix DOM elements and Pixi rendering inside the DAW workspace canvas.**

### Layer Structure (mandatory order)
1. Grid background
2. Track lane fills
3. Clips (audio/MIDI blocks)
4. Selection / hover highlight overlays
5. Playhead (top layer, always visible)

### Performance Requirements
- **Target: 60 FPS with 10,000+ notes**
- Object pooling for note sprites — never create and destroy per frame
- Batch rendering via Pixi `Container` groups
- Dirty-region redraws only — do not redraw the entire canvas every frame
- Avoid texture recreation — cache textures, use sprite sheets
- Use `OffscreenCanvas` for background layer pre-composition when supported

### Pixi Module Organization (`src/features/pixi/`)
- `canvas.tsx` — Pixi Application setup, stage init, React bridge
- `layers.ts` — Layer creation and registration for grid, tracks, clips, playhead
- `utils.ts` — Coordinate conversion (time ↔ pixels), camera/zoom/pan math, grid snapping

---

## React Performance (Real-Time UI)

This app must stay responsive with 10,000+ timeline objects:

- `React.memo` on every heavy component (TrackHeader, Clip, MixerChannel)
- `useCallback` for all event handlers passed as props
- `useMemo` for derived values (sorted clip list, visible range calculation)
- **Never connect playback tick to React state** — use `requestAnimationFrame` + direct DOM/canvas mutation for the playhead
- Selective Zustand subscriptions — subscribe only to the slice you need, use selectors
- No large arrays in React component state — keep them in the store
- Virtualize the track list when there are >50 tracks (use a windowing library)
- No state updates inside Tone.js callbacks or `requestAnimationFrame` loops