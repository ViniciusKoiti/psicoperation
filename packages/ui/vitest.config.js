/**
 * Vitest do @psiops/ui (preset do monorepo + jsdom para os componentes).
 * Arquivo .js (como em @psiops/config) para ficar fora do `tsc --noEmit`.
 */
import { defineVitestConfig } from "@psiops/config/vitest";

export default defineVitestConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
