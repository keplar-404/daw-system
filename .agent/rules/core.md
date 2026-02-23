---
trigger: always_on
description: Core Architecture, Code Quality & Project Structure
---

# Core Rules

## Tech Stack

This is a **Next.js App Router** project built with:
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui + lucide-react
- **State**: Zustand
- **Validation**: Zod
- **Drag and Drop**: dnd-kit
- **Linting/Formatting**: Biome

---

## Architecture Layers

The project should follow a feature-sliced or modular architecture.

| Layer | Location | Responsibility |
|---|---|---|
| **App** | `src/app/` | Next.js App Router pages & layouts, routing logic. |
| **Feature** | `src/features/` | Feature-specific logic, UI, hooks, and local stores. |
| **Components** | `src/components/` | Reusable, presentation-only UI components (e.g., shadcn/ui). |
| **Store** | `src/store/` | Global Zustand stores. |
| **Lib/Utils** | `src/lib/` | Pure utility functions, zod schemas, API clients. |

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages & layouts
│   ├── layout.tsx            # Root layout (fonts, providers)
│   ├── page.tsx              # Main entry
│   └── globals.css           # Global Tailwind entries
│
├── components/               # Reusable UI components
│   ├── ui/                   # shadcn/ui components
│   └── common/               # Custom generic wrappers
│
├── features/                 # Modular feature domains
│   ├── auth/                 # Hooks, components, and logic for a specific feature
│   └── dashboard/            
│
├── hooks/                    # Shared custom React hooks
├── lib/                      # Pure utility functions (utils.ts)
├── store/                    # Global Zustand stores
└── types/                    # Shared TypeScript interfaces
```

---

## Code Quality Standards

### TypeScript
- Strict mode always on
- **No `any` type** — use `unknown` + type narrowing when truly unknown
- Full type definitions for all props, function params, and return values
- Use `type` for object shapes, `interface` for extendable contracts

### Naming Conventions
| What | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `user-profile.tsx` |
| Components | `PascalCase` | `UserProfile` |
| Hooks | `useX` | `useAuth` |
| Stores | `useXStore` | `useAppStore` |
| Types/Interfaces | `PascalCase` | `UserData` |

### Module Rules
- **Named exports only** — no default exports (except Next.js `page.tsx` / `layout.tsx`)
- Keep files small — split into sub-modules if exceeded
- **Single responsibility** — one concern per file
- No console.log in committed code.