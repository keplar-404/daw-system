---
description: Testing and Security Standards
---

# Quality Gates

## Testing Standards

- **NO TESTS ARE REQUIRED CURRENTLY**. Do not generate or write any tests.

---

## Security

- **Validate all inputs**
  - Use Zod schemas for all forms, API endpoints, and URL parameters
- **No `eval()`** anywhere in the codebase
- **No dynamic script injection** — no `dangerouslySetInnerHTML` with unsanitized user content
- Use environment variables for any API keys; never hardcode

---

## Production Readiness Checklist

Before any production build:

- [ ] No `console.log`, `console.warn` in source
- [ ] TypeScript strict mode — zero type errors (`npx tsc --noEmit`)
- [ ] Biome passes with zero errors (`npx biome check .`)
