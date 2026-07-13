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
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      // Experimental React-Compiler diagnostic; advisory for the kiosk runtime's
      // ref-mutation pattern. TODO: re-enable and refactor incrementally.
      "react-hooks/immutability": "off",
      /** Logging goes through `@/lib/dev-log`; see the dashboard config. */
      "no-console": "error",
    },
  },
]);

export default eslintConfig;
