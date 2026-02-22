---
description: Generate the full test suite for a feature or component
---

# Workflow: Generate Tests

Use this to write a complete set of tests for a new or existing feature.

## Steps

1. **Identify scope** — determine which files need tests:
   - Store: `src/features/<feature>/store.ts`
   - Component(s): `src/components/daw/<Component>.tsx`
   - Engine functions: `src/features/audio/engine.ts`
   - Worker: `src/workers/<feature>Worker.ts`
   - Utilities: `src/lib/*.ts`

2. **Set up Tone.js mock** (required for any test that imports audio-related code)
   ```ts
   jest.mock('tone', () => ({
     Transport: { start: jest.fn(), stop: jest.fn(), schedule: jest.fn() },
     Player: jest.fn().mockImplementation(() => ({ start: jest.fn(), stop: jest.fn(), dispose: jest.fn() })),
     Gain: jest.fn().mockImplementation(() => ({ connect: jest.fn(), disconnect: jest.fn(), dispose: jest.fn() })),
     // add other mocks as needed
   }));
   ```

3. **Set up Worker mock** (required for any test that posts messages to workers)
   ```ts
   const mockWorker = { postMessage: jest.fn(), onmessage: null, terminate: jest.fn() };
   jest.spyOn(global, 'Worker').mockImplementation(() => mockWorker as unknown as Worker);
   ```

4. **Write store tests**
   - Test each action: call the action → assert resulting state
   - Test selectors: hydrate state → call selector → assert return value
   - Test async actions: use `await act(async () => { ... })`

5. **Write component tests** using React Testing Library
   ```ts
   import { render, screen, userEvent } from '@testing-library/react';
   // Wrap in providers (Zustand, i18n) as needed
   ```
   - Test: renders without crashing
   - Test: displays correct content from props/store
   - Test: user interactions (click, keyboard) trigger correct callbacks or state changes
   - Test: edge cases (empty state, max values, disabled state)

6. **Write engine/integration tests**
   - Test that store action → engine function call is wired correctly
   - Use spies: `jest.spyOn(engine, 'scheduleClip')`
   - Verify Tone.js mock was called with correct arguments

7. **Write worker tests**
   - Simulate `onmessage` with test data
   - Assert `postMessage` was called with correct result
   - Send malformed input — assert no crash, error message returned

8. **Run coverage and fix gaps**
   ```bash
   npx jest --coverage --collectCoverageFrom="src/features/<feature>/**/*.ts"
   ```
   - Achieve ≥ 85% line and branch coverage
   - Add tests for any uncovered error paths or edge cases

9. **Verify no flaky tests**
   - Replace any `setTimeout`/`sleep` with `jest.useFakeTimers()` + `jest.runAllTimers()`
   - Replace any `waitFor(() => ..., { timeout: 5000 })` with proper async event handling