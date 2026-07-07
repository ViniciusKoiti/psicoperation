/**
 * ESLint do @psiops/ui: preset React do monorepo.
 * css/tokens.css e tokens.json são gerados — fora do lint (não são JS).
 */
import { react } from "@psiops/config/eslint";

export default [
  ...react,
  {
    name: "@psiops/ui/node-scripts",
    files: ["scripts/**/*.mjs", "*.config.js"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
];
