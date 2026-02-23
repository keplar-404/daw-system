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
     "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
     "vcs": {
       "enabled": true,
       "clientKind": "git",
       "useIgnoreFile": true
     },
     "formatter": {
       "enabled": true,
       "indentStyle": "space",
       "indentWidth": 2,
       "lineWidth": 80
     },
     "javascript": {
       "formatter": {
         "quoteStyle": "single",
         "semicolons": "always"
       }
     },
     "linter": {
       "enabled": true,
       "rules": {
         "recommended": true
       }
     },
     "organizeImports": {
       "enabled": true
     }
   }
   ```

3. **Key rules explained**:
   - `vcs.useIgnoreFile: true` — Respects your `.gitignore` file
   - `indentWidth: 2` — Industry standard for HTML/JS/CSS spacing
   - `lineWidth: 80` — Prevents very long lines for readability
   - `quoteStyle: single` — Often default for JavaScript ecosystem
   - `semicolons: always` — Standard required semicolons
   - `organizeImports: true` — Keeps imports sorted automatically
   - `linter.rules.recommended: true` — Uses Biome's vetted defaults without excessive strictness

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