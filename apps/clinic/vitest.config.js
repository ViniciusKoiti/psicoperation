/**
 * Vitest do @psiops/clinic (preset do monorepo + jsdom para os componentes).
 * Arquivo .js (como em @psiops/ui e @psiops/landing) para ficar fora do
 * `tsc --noEmit` do app.
 */
import { defineVitestConfig } from "@psiops/config/vitest";

export default defineVitestConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
