---
trigger: always_on
---

* Use Pixi.js exclusively for rendering the timeline, clips, waveform, and playhead.
* Keep Pixi layers modular and organized in `features/pixi/`.
* Offload heavy calculations to Pixi.js worker threads when possible.
* Maintain separate layers for:
  - Grid background
  - Tracks
  - Clips
  - Selection/hover highlights
  - Playhead
* Do not mix DOM elements and Pixi rendering for DAW workspace.