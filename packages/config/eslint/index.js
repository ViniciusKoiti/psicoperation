/**
 * Presets ESLint (flat config, ESLint 9+) do monorepo PsiOps.
 *
 * Consumo típico (eslint.config.js do pacote consumidor):
 *
 *   import { base } from "@psiops/config/eslint";
 *   export default [...base];
 *
 * Para apps React:
 *
 *   import { react } from "@psiops/config/eslint";
 *   export default [...react];
 *
 * Os presets são arrays composáveis: o consumidor pode acrescentar
 * blocos próprios depois do spread para sobrescrever/estender regras.
 */
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/** Ignores padrão de artefatos gerados (aplicados globalmente). */
const ignores = {
  name: "@psiops/config/ignores",
  ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.next/**", "**/out/**"],
};

/**
 * Preset base: JavaScript + TypeScript, sem regras de framework.
 * eslint-config-prettier vem por último para desativar regras
 * conflitantes com o Prettier.
 *
 * @type {import("typescript-eslint").ConfigArray}
 */
export const base = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: "@psiops/config/base",
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  eslintConfigPrettier,
);

/**
 * Preset React: base + eslint-plugin-react (JSX runtime automático)
 * + regras de hooks.
 *
 * @type {import("typescript-eslint").ConfigArray}
 */
export const react = tseslint.config(
  ...base,
  {
    ...reactPlugin.configs.flat.recommended,
    name: "@psiops/config/react",
  },
  reactPlugin.configs.flat["jsx-runtime"],
  {
    name: "@psiops/config/react-hooks",
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    name: "@psiops/config/react-settings",
    settings: { react: { version: "detect" } },
  },
  eslintConfigPrettier,
);

export default base;
