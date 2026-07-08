/**
 * Vitest do @psiops/landing (preset do monorepo + jsdom para componentes).
 * Arquivo .js (como em @psiops/ui) para ficar fora do `tsc --noEmit`.
 * `esbuild.jsx` é forçado para "automatic" porque o tsconfig do app usa
 * "jsx": "preserve" (exigência do Next), que o Vite não transforma.
 * Os specs de Playwright (e2e/) ficam fora do include.
 */
import { defineVitestConfig } from "@psiops/config/vitest";

export default defineVitestConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
