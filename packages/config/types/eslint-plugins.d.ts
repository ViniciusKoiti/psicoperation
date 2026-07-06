// Stubs de tipos para plugins ESLint que não publicam tipagem própria.
// Escopo mínimo: apenas o que os presets em eslint/index.js consomem.

declare module "eslint-plugin-react" {
  import type { Linter } from "eslint";

  const plugin: {
    configs: {
      flat: {
        recommended: Linter.Config;
        "jsx-runtime": Linter.Config;
      };
    };
  };
  export default plugin;
}

declare module "eslint-plugin-react-hooks" {
  import type { ESLint, Linter } from "eslint";

  const plugin: ESLint.Plugin & {
    configs: {
      recommended: { rules: Linter.RulesRecord };
    };
  };
  export default plugin;
}
