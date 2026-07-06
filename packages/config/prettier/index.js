/**
 * Configuração Prettier compartilhada do monorepo PsiOps.
 *
 * Consumo típico (package.json do pacote consumidor):
 *
 *   "prettier": "@psiops/config/prettier"
 *
 * Ou, para estender em um prettier.config.js próprio:
 *
 *   import psiops from "@psiops/config/prettier";
 *   export default { ...psiops, printWidth: 80 };
 *
 * @type {import("prettier").Config}
 */
const config = {
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  endOfLine: "lf",
};

export default config;
