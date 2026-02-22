---
description: Run a full project audit covering code quality, design, accessibility, performance, and production readiness
---

Run this before a release or PR merge to catch issues early.

## 1. Code Quality

```bash
# Linting & formatting
npx biome check .

# Type checking
npx tsc --noEmit

# Dependency audit
npm audit --audit-level=high
```

- Zero Biome errors.
- Zero TypeScript errors.
- No high/critical `npm audit` findings.

## 2. Test Coverage

```bash
npx vitest run --coverage
```

- Lines ≥ 85%, Branches ≥ 80%.
- All tests passing.

## 3. Accessibility

```bash
npx playwright test tests/a11y/
```

Or run `axe-core` programmatically on every page. Zero Critical or Serious violations.

Manual checklist:
- [ ] Keyboard navigation works end-to-end
- [ ] All form fields have visible labels
- [ ] Focus is managed correctly in modals/dialogs
- [ ] Color contrast passes (use browser DevTools or Axe extension)

## 4. Performance

```bash
npx lighthouse <URL> --output json --quiet
```

Targets:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

Check bundle size:
```bash
npx next build && npx next analyze   # (or vite-bundle-visualizer)
```

- No single chunk > 250 kB (gzipped).
- Code splitting in place for routes and heavy libraries.

## 5. Design Consistency

- [ ] No hardcoded colors or spacing in component files (`grep -r "color: #" src/components`)
- [ ] All values reference CSS custom properties or Tailwind config tokens
- [ ] Dark mode renders correctly on all pages
- [ ] Responsive layout tested at 375px, 768px, 1280px, 1920px

## 6. Security

- [ ] No secrets in source code (`git grep -i "api_key\|secret\|password" -- '*.ts' '*.tsx'`)
- [ ] `.env` in `.gitignore`
- [ ] All user inputs validated with Zod (or equivalent)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] `npm audit` clean

## 7. Production Readiness

- [ ] Build passes: `npm run build`
- [ ] Environment variables documented in `.env.example`
- [ ] Error boundaries in place for all critical UI sections
- [ ] 404 and 500 error pages implemented
- [ ] Logging / monitoring configured (Sentry or equivalent)
