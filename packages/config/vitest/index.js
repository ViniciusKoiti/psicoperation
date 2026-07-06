/**
 * Preset Vitest compartilhado do monorepo PsiOps.
 *
 * Consumo típico (vitest.config.js do pacote consumidor):
 *
 *   import { defineVitestConfig } from "@psiops/config/vitest";
 *   export default defineVitestConfig();
 *
 * Com overrides (merge profundo via mergeConfig do Vitest):
 *
 *   export default defineVitestConfig({
 *     test: { environment: "jsdom" },
 *   });
 *
 * O objeto `vitestPreset` também é exportado para quem preferir
 * compor manualmente com defineConfig/mergeConfig.
 */
import { defineConfig, mergeConfig } from "vitest/config";

/**
 * Defaults sensatos: ambiente Node, globals habilitados e cobertura V8
 * (relatórios text/html/lcov em ./coverage, alinhado ao outputs do turbo.json).
 * A execução com cobertura exige @vitest/coverage-v8 no consumidor.
 *
 * @type {import("vitest/config").ViteUserConfig}
 */
export const vitestPreset = {
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      exclude: ["**/node_modules/**", "**/dist/**", "**/*.config.*", "**/coverage/**"],
    },
  },
};

/**
 * Cria uma configuração Vitest a partir do preset, aplicando overrides
 * do consumidor por cima (merge profundo).
 *
 * @param {import("vitest/config").ViteUserConfig} [overrides]
 * @returns {import("vitest/config").ViteUserConfig}
 */
export function defineVitestConfig(overrides = {}) {
  return mergeConfig(defineConfig(vitestPreset), defineConfig(overrides));
}

export default vitestPreset;
