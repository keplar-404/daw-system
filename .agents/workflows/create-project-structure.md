---
description: a project structure rule for daw project.
---

Before making the project structure make you remeber the current code base so that after making the project strucutre import necessary files and config from approprate folders and files.


Project folder:

daw-ai/
├─ public/                  # Static assets
│   ├─ icons/
│   ├─ images/
│   ├─ sounds/              # Optional default sound files
│   └─ favicon.ico
├─ src/
│   ├─ app/
│   │   ├─ layout.tsx        # Root layout
│   │   ├─ page.tsx          # Landing / workspace page
│   │   └─ providers/        # Global context providers (Zustand, i18n)
│   │   └─ other necessary folders
│   │
│   ├─ components/           # Reusable UI components
│   │   ├─ common/           # Buttons, toggles, sliders, modals
│   │   ├─ layout/           # Panels, header, footer
│   │   ├─ daw/              # Core DAW UI components
│   │   │   ├─ TrackHeader.tsx
│   │   │   ├─ Clip.tsx
│   │   │   ├─ TimelineRuler.tsx
│   │   │   ├─ MixerChannel.tsx
│   │   │   ├─ PianoRoll.tsx
│   │   │   └─ AutomationLane.tsx
│   │   │   └─ other files
│   │   └─ icons/            # SVG icons
│   │
│   ├─ features/             # Feature-based modules (Zustand + logic)
│   │   ├─ audio/
│   │   │   ├─ engine.ts     # Tone.js engine singleton
│   │   │   ├─ tracksStore.ts # Zustand store for tracks
│   │   │   ├─ clipsStore.ts  # Zustand store for clips
│   │   │   └─ effects.ts     # Effects handling
│   │   │   └─ others
│   │   │
│   │   ├─ dnd/
│   │   │   ├─ DndContext.tsx
│   │   │   └─ hooks.ts       # Custom drag & drop hooks
│   │   │   └─ others
│   │   │
│   │   ├─ pixi/
│   │   │   ├─ canvas.tsx     # Pixi.js stage + renderer
│   │   │   ├─ layers.ts      # Grid, tracks, clips, playhead
│   │   │   └─ utils.ts       # Coordinate conversion, camera logic
│   │   │   └─ others
│   │   │
│   │   └─ workspace/
│   │       ├─ Workspace.tsx  # Main DAW workspace container
│   │       ├─ Panels.tsx     # Left browser, bottom mixer/editor
│   │       └─ Timeline.tsx   # Tracks + clip canvas wrapper
│   │       └─ others
│   │
│   ├─ hooks/                 # Shared custom React hooks
│   │   ├─ useWindowSize.ts
│   │   ├─ useKeyboardShortcuts.ts
│   │   └─ useZoomPan.ts
│   │   └─ others
│   │
│   ├─ lib/                   # Utilities / helpers
│   │   ├─ i18n.ts
│   │   ├─ math.ts             # Time-to-pixels, snapping logic
│   │   ├─ audioUtils.ts
│   │   └─ logger.ts
│   │
│   ├─ store/                 # Global Zustand stores (if outside feature)
│   │   ├─ uiStore.ts          # UI panel state, theme, etc.
│   │   └─ appStore.ts         # App-wide state (playhead, transport)
│   │   └─ others
│   │
│   ├─ styles/
│   │   ├─ globals.css
│   │   └─ theme.css
│   │
│   ├─ workers/
│   │   ├─ audioWorker.ts      # Heavy audio calculations
│   │   ├─ waveformWorker.ts   # Waveform generation
│   │   └─ renderWorker.ts     # Optional Pixi pre-processing
│   │   └─ others
│   │
│   └─ types/                 # TypeScript types & interfaces
│       ├─ track.ts
│       ├─ clip.ts
│       ├─ audio.ts
│       └─ dnd.ts
│       └─ others
│
├─ tests/
│   ├─ unit/                  # Component & logic unit tests
│   ├─ integration/           # DAW feature interactions
│   └─ e2e/                   # End-to-end workspace tests
│   └─ others
│
├─ .env
├─ next.config.js
├─ package.json
├─ tsconfig.json
├─ tailwind.config.js
└─ README.md
└─ others