---
trigger: always_on
---

# React Optimization Rule

UI must remain responsive with 10,000 timeline objects.

Rules:

- React.memo for heavy components
- useCallback for handlers
- useMemo for derived values
- Selective Zustand subscription
- No state updates inside playback loop
- requestAnimationFrame for playhead
- Virtualize long track lists
- No large arrays in React state

Never connect playback tick to React re-render.