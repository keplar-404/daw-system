---
trigger: always_on
---

# Testing Standard

Every feature must include:

- Unit tests
- Store tests
- Component tests
- Integration tests
- Worker tests
- Audio engine mock tests
* All new features must have unit tests and integration tests.
* Use Jest and React Testing Library.
* Test critical DAW functionality: timeline drag, clip resize, audio playback, state updates.
* Test Pixi.js layers where possible using snapshot tests or canvas mocks.
* Name test files consistently: `test_<feature>.ts` or `<feature>.test.ts`.
* Coverage must include edge cases and error handling.

Rules:

- 85% minimum coverage
- No flaky async timing
- Mock Tone.js
- Test error states
- Test edge cases

Test files colocated:
file.ts → file.test.ts