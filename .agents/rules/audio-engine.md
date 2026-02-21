---
trigger: always_on
---

* The Tone.js engine must be encapsulated in `features/audio/engine.ts`.
* Do not directly manipulate audio nodes in UI components.
* All audio state should be managed through Zustand stores.
* Provide modular functions for:
  - Track creation
  - Clip playback
  - Volume and pan control
  - Effects processing
* Keep audio engine performance optimized; offload heavy processing to Web Workers if needed or use pixi js for gpu usages.