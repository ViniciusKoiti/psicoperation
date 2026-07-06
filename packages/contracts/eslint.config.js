/**
 * ESLint do @psiops/contracts: preset base do monorepo.
 * gen/ é código gerado (openapi-typescript) — fora do lint; o formato é
 * garantido pelo gerador e pelo teste de drift.
 */
import { base } from "@psiops/config/eslint";

export default [
  {
    name: "@psiops/contracts/ignores",
    ignores: ["gen/**"],
  },
  ...base,
  {
    name: "@psiops/contracts/node-scripts",
    files: ["scripts/**/*.mjs", "*.config.js"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
];
