# .agents

AI agent configuration for this project.

## Structure

```
.agents/
  rules/       ← Standing rules the AI must always follow
  workflows/   ← Step-by-step slash commands for common tasks
```

## Rules

| File | Purpose |
|---|---|
| `architecture.md` | 4-layer architecture, feature-first folders, import rules |
| `code-quality.md` | TypeScript strict, naming conventions, file limits, linting |
| `design-system.md` | Design tokens, shadcn/ui usage, dark mode, responsive |
| `accessibility.md` | WCAG AA, keyboard nav, ARIA, semantic HTML |
| `security.md` | Input validation, secrets, no eval, centralized API layer |
| `testing.md` | Coverage targets, test types, co-location, CI requirements |

## Workflows (Slash Commands)

| Command | File | Description |
|---|---|---|
| `/create-project` | `workflows/create-project.md` | Scaffold a new project |
| `/generate-feature` | `workflows/generate-feature.md` | Generate a feature module |
| `/generate-component` | `workflows/generate-component.md` | Generate a UI component |
| `/generate-tests` | `workflows/generate-tests.md` | Generate a test suite |
| `/audit` | `workflows/audit.md` | Full project audit |
