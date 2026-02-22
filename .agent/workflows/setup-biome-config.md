---
description: Create or update biome.json to match project code quality standards
---

# Workflow: Setup Biome Config

Use this to initialize or update the Biome linter/formatter configuration.

## Steps

1. **Check if `biome.json` exists** in the project root
   - If it exists: read it first, then merge/update — never delete existing valid config

2. **Apply the canonical project `biome.json` configuration**

   The project uses this exact Biome configuration (update to match if it has drifted):

   ```json
   {
     "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
     "vcs": {
       "enabled": true,
       "clientKind": "git",
       "useIgnoreFile": true
     },
     "files": {
       "ignoreUnknown": true,
       "includes": ["**", "!node_modules", "!.next", "!dist", "!build"]
     },
     "formatter": {
       "enabled": true,
       "indentStyle": "space",
       "indentWidth": 2,
       "lineWidth": 120
     },
     "javascript": {
       "formatter": {
         "quoteStyle": "double",
         "semicolons": "always"
       }
     },
     "linter": {
       "enabled": true,
       "rules": {
         "recommended": true,
         "style": {
           "noDefaultExport": "error"
         },
         "suspicious": {
           "noExplicitAny": "error",
           "noUnknownAtRules": "off"
         }
       },
       "domains": {
         "next": "recommended",
         "react": "recommended"
       }
     },
     "overrides": [
       {
         "includes": [
           "src/app/**/page.tsx",
           "src/app/**/layout.tsx",
           "next.config.ts",
           "tailwind.config.ts",
           "postcss.config.mjs"
         ],
         "linter": {
           "rules": {
             "style": {
               "noDefaultExport": "off"
             }
           }
         }
       }
     ],
     "assist": {
       "actions": {
         "source": {
           "organizeImports": "on"
         }
       }
     }
   }
   ```

3. **Key rules explained** (do not remove these):
   - `noDefaultExport: error` — enforces named exports everywhere (except Next.js pages/layouts via override)
   - `noExplicitAny: error` — enforces strict TypeScript, no `any` type
   - `organizeImports: on` — auto-sorts imports on save
   - `lineWidth: 120` — max line length
   - `quoteStyle: double` — double quotes for JS/TS strings
   - `semicolons: always` — required semicolons

4. **Run Biome to verify config is valid**
   ```bash
   npx biome check .
   ```
   Should return zero errors on a clean codebase.

5. **Auto-fix safe issues**
   ```bash
   npx biome check --apply .
   ```

6. **Add Biome scripts to `package.json`** (if not already present):
   ```json
   "scripts": {
     "lint": "biome check .",
     "lint:fix": "biome check --apply .",
     "format": "biome format --write ."
   }
   ```