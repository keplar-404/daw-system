---
trigger: always_on
description: Testing, Security & Production Quality Gates
---

# Quality Gates

## Testing Standards

### Required Test Coverage
Every feature module must have:
- **Unit tests** — pure functions, store actions, utility functions
- **Component tests** — render, interaction, props variation
- **Store tests** — state transitions, selectors, async actions
- **Integration tests** — multi-feature interaction (e.g., drag clip → store update → engine call)
- **Worker tests** — message passing, output correctness
- **Audio engine mock tests** — Tone.js mocked, verify calls to engine functions

### Coverage Requirement
- **Minimum 85% line/branch coverage** per feature module
- Run coverage with: `npx jest --coverage`

### Framework & Tools
- **Jest** + **React Testing Library** — no other test frameworks
- Mock Tone.js: use `jest.mock('tone')` with a factory that returns stub Transport/Player/etc.
- Mock Web Workers: use `jest.fn()` + fake `postMessage`/`onmessage`
- Use `jest.useFakeTimers()` for any time-dependent logic — no real `setTimeout`/`requestAnimationFrame` in tests

### Test File Rules
- Colocate test files: `track-header.tsx` → `track-header.test.tsx`
- Naming: `<filename>.test.ts` or `<filename>.test.tsx`
- Test critical DAW functionality explicitly:
  - Timeline drag → correct beat position
  - Clip resize → correct duration in store
  - Transport play → Tone.Transport.start() called once
  - State updates → UI reflects change

### Test Quality Rules
- No flaky async timing — always `await userEvent.xxx()` and `waitFor()`
- Test error states — what happens when audio fails to load, MIDI is corrupted, etc.
- Test edge cases — empty project, single clip, maximum clip count
- No `setTimeout` or arbitrary `sleep()` inside tests

---

## Security

Even without user authentication, security practices are mandatory:

- **Validate all imported files** before processing
  - Check MIME type matches expected (audio/midi files)
  - Enforce maximum file size limit (configurable, default 100MB)
  - Reject files that fail validation with a user-friendly error
- **No `eval()`** anywhere in the codebase — use Biome lint rule to enforce
- **No dynamic script injection** — no `innerHTML` with user content, no dynamic `<script>` tags
- **No unsafe window globals** — don't expose internal engine or store on `window`
- **Safe MIDI parsing** — parse MIDI in a Worker; handle corrupted/malformed MIDI without crashing
- Prepare the codebase for future auth: use environment variables for any future API keys; never hardcode

---

## Production Readiness Checklist

Before any production build:

- [ ] No `console.log`, `console.warn`, `console.error` in source (only in logger.ts)
- [ ] TypeScript strict mode — zero type errors (`npx tsc --noEmit`)
- [ ] Biome passes with zero errors (`npx biome check .`)
- [ ] All dynamic imports used for heavy modules (Tone.js, Pixi.js loaded lazily)
- [ ] next-intl translations complete — no untranslated keys
- [ ] Accessibility basic compliance — run `axe` or Lighthouse accessibility audit
- [ ] No architecture violations — UI layer has no Tone.js imports
- [ ] No security risks — no eval, no unsafe HTML injection
- [ ] Bundle analysis reviewed (`ANALYZE=true npx next build`)
- [ ] 85%+ test coverage confirmed
