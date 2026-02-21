---
trigger: always_on
---

* Use Zustand for all global and feature-level state.
* Do not mix UI state and DAW logic state in the same store.
* Each feature should have its own store file, e.g., `features/<feature>/store.ts`.
* Use selectors and immer patterns for performance and immutability.
* All state changes must be documented with comments explaining purpose.