# daw-ai

AI-powered digital audio workstation — compose, produce, and master in the browser.

## Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| Linting | [Biome](https://biomejs.dev) |
| Icons | [Lucide](https://lucide.dev) |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Install dependencies

```bash
npm install
```

### Copy environment variables

```bash
cp .env.example .env.local
```

Fill in any required values in `.env.local`.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (hot reload) |
| `npm run build` | Build the production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Auto-format all files with Biome |

## Project Structure

```
src/
  app/           ← Next.js App Router (pages, layouts, routes)
  features/      ← Feature-first modules (components, hooks, store, services, types)
  components/    ← Shared UI components
  lib/           ← Pure utility functions
  store/         ← Global state
  api/           ← Centralized API client (never call fetch directly from components)
  styles/        ← tokens.css (design tokens) + globals.css
```

## Architecture

This project enforces a **4-layer architecture**. See [`.agents/rules/architecture.md`](.agents/rules/architecture.md) for details.

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Commit (Husky runs lint-staged automatically on commit)
3. Open a PR — CI will run lint, type-check, and build

## License

MIT
