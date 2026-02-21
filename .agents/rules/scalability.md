---
trigger: always_on
---

# Scalability Rule

System must scale to:

- 1000+ tracks
- 10,000+ notes
- 5 effects per track
- 1 hour timeline

Requirements:

- Use Map for O(1) lookup
- Maintain sorted arrays for timeline
- Undo/Redo via diff stack
- Avoid deep cloning large objects
- Avoid full project re-serialization frequently

System must remain smooth at 60fps.