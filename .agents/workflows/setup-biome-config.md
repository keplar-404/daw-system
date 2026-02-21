---
description: 
---

# Workflow: setup-biome-config

Goal: Create or update the `biome.json` configuration for the project to enforce industry-standard code quality.

Steps:

1. Check if `biome.json` exists in the project root.
2. If it does not exist, create a new `biome.json`.
3. Configure `biome.json` with the following rules for TypeScript / JavaScript:
   * Enforce consistent indentation: 2 spaces
   * Enforce semicolons at the end of statements
   * Use double quotes for strings
   * Require explicit return types for functions
   * Require JSDoc-style comments for all exported functions/classes
   * Enforce alphabetical imports
   * No unused variables or imports
   * Enforce consistent spacing in object literals and arrays
   * Enforce max line length: 120 characters
   * Enforce single empty line at the end of files
   * Use strict type checking and consistent type aliases
4. Merge with any existing settings in `biome.json` without removing existing necessary configs.
5. Save the updated `biome.json` to the project root.
6. Add a comment in the JSON describing it is **generated/maintained by Antigravity workflow**.

Example structure for `biome.json`:

```json
{
  "indent": 2,
  "semi": true,
  "quotes": "double",
  "maxLineLength": 120,
  "requireJsDoc": true,
  "sortImports": true,
  "noUnusedVars": true,
  "strict": true
}