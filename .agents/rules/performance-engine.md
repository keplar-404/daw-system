---
trigger: always_on
---

# Audio Engine Performance Rule

This is a real-time system.

MANDATORY:

- Single AudioContext
- Single Tone.Transport
- Never recreate nodes during playback
- Preallocate nodes when possible
- Use Tone scheduling only
- Never use setTimeout for timing
- Pause transport before graph mutations
- Resume safely
* Offload CPU-heavy tasks (audio analysis, waveform generation) to Web Workers.
* Use requestAnimationFrame for rendering loops.
* Virtualize track lanes for large projects (>10,000 clips).
* Minimize unnecessary React re-renders.
* Keep Pixi.js rendering GPU-accelerated.
* Use memoization and caching where possible.
* Optimize Zustand selectors for performance.

Avoid:
- Dynamic graph rebuilds
- Excessive effect instantiation
- Audio node leaks