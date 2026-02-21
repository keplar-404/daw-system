---
trigger: always_on
description: DAW Architecture Rule
---

# DAW Architecture Rule

This project follows strict layered architecture.

Layer 1 — UI Layer
- React components (App Router)
- shadcn UI components
- No Tone.js imports
- No AudioContext creation
- No business logic

Layer 2 — Audio Engine Layer (/src/audio)
- All Tone.js logic
- Single AudioContext
- Single Transport
- Node pooling
- No React imports

Layer 3 — State Layer (/src/store)
- Zustand only
- Stores metadata only
- Never store Tone nodes
- No heavy logic

Layer 4 — Worker Layer (/src/workers)
- AI generation
- MIDI parsing
- File decoding
- Export conversion
- Heavy computation only

Communication:
- UI → Store → Engine
- Worker ↔ Store via message passing
- No circular dependencies

* All features must follow modular architecture.
* Components, stores, and utilities must have clear, descriptive names.
* Avoid inline styles except for dynamic styles.
* Use centralized theme / design tokens for spacing, colors, and typography.
* Keep commit-ready code clean: no console.log, commented-out code, or test artifacts.
* Ensure code is scalable and maintainable for future features.