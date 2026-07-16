import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / fixture outputs — not app source
    "test_project_outputs/**",
    "test_project_goldens/**",
  ]),
  {
    rules: {
      // Empty alias interfaces are intentional for branded context types.
      "@typescript-eslint/no-empty-object-type": "off",
      // React Compiler lint rules (eslint-config-next) — warn until effects/refs
      // are migrated; do not block CI on pre-existing patterns.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // Catch CI-only Turbopack misses: direct imports must be declared deps
      // (e.g. @lezer/highlight via CodeMirror transitive alone is not enough).
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/scripts/**",
            "eslint.config.*",
            "next.config.*",
            "postcss.config.*",
          ],
          optionalDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
