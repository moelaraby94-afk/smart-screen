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
  ]),
  {
    rules: {
      // React Compiler / eslint-plugin-react-hooks: flags common data-fetch & reset patterns in effects.
      // These experimental React-Compiler diagnostics are advisory for this
      // codebase's existing patterns. TODO: re-enable and refactor incrementally.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      /**
       * Logging goes through `@/lib/dev-log`, which strips itself in production.
       * A bare `console.*` ships to the browser and can leak state. The few
       * deliberate exceptions carry an inline disable explaining why.
       */
      "no-console": "error",
    },
  },
]);

export default eslintConfig;
