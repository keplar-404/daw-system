---
trigger: always_on
---

* Use dnd-kit for all clip and track drag-and-drop functionality.
* Keep drag-and-drop logic isolated in `features/dnd/`.
* Provide clear hooks or wrapper components for draggable and droppable elements.
* All draggable items must snap to the timeline grid.
* Ensure performance with 10k+ items; do not cause full DOM re-renders during drag.