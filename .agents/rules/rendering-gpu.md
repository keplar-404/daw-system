---
trigger: always_on
---

# Rendering & GPU Rule

Timeline and Piano Roll:

- Must use Pixi.js or Canvas
- No large DOM node rendering
- Object pooling for notes
- Batch rendering via Pixi containers
- Dirty-region redraw only
- Avoid texture recreation
- Use OffscreenCanvas if supported

Target:
60 FPS with 10,000 notes.