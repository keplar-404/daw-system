---
description: Audit a feature or page for performance regressions and bottlenecks
---

# Workflow: Performance Audit

Use this when a part of the DAW feels slow, laggy, or has high memory usage.

## Steps

1. **Identify the problem area** — which feature, component, or interaction is slow?

2. **Check for excessive React re-renders**
   - Add `console.count('ComponentName render')` temporarily while profiling
   - Use React DevTools Profiler (in browser) — record an interaction, look for components with high render counts
   - Common causes:
     - Subscribing to full Zustand store instead of a selector
     - New object/array literals created inline in JSX (`style={{ }}`, `value={[]}`)
     - Missing `React.memo`, `useCallback`, or `useMemo`

3. **Check Tone.js node recreation**
   - In `src/features/audio/engine.ts`, verify that nodes are not being recreated during playback
   - Check for `new Tone.Player()` or `new Tone.Gain()` calls inside event handlers or playback callbacks
   - Verify single `AudioContext` — add a guard log: `console.assert(Tone.getContext() === existingCtx)`

4. **Check memory usage**
   - Open Chrome DevTools → Memory tab → take heap snapshot
   - Look for detached DOM nodes (Pixi sprites not cleaned up) and detached AudioNodes
   - Verify `Player.dispose()` and `node.disconnect()` are called on track removal

5. **Check Web Worker offloading**
   - Tasks that run >16ms on the main thread should be in a worker
   - Profile: DevTools → Performance → look for long tasks (red bars)
   - If waveform generation or audio analysis runs on main thread → move to `waveformWorker.ts`

6. **Check Pixi rendering**
   - Are textures being recreated every frame? → Cache textures in a `Map`, reuse them
   - Is the entire stage being redrawn? → Implement dirty-region checking
   - Object pool: are clip sprites being created/destroyed or pooled and reused?
   - Check: is `requestAnimationFrame` used for the playhead? It must not trigger React re-renders

7. **Check bundle size**
   ```bash
   ANALYZE=true npx next build
   ```
   - Look for large chunks (>100KB gzipped)
   - Verify Tone.js and Pixi.js are lazy-loaded (inside `next/dynamic` with `ssr: false`)
   - Verify no unnecessary lodash imports (use native JS equivalents)

8. **Apply fixes and re-profile**
   - Fix one issue at a time
   - Re-profile after each fix to confirm improvement
   - Document each fix with a comment explaining why it was necessary