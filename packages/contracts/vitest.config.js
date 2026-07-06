/**
 * Vitest do @psiops/contracts (preset do monorepo + testes de tipo).
 * Arquivo .js (como em @psiops/config) para ficar fora do `tsc --noEmit`:
 * o preset @psiops/config/vitest não publica declarações de tipo.
 */
import { defineVitestConfig } from "@psiops/config/vitest";

export default defineVitestConfig({
  test: {
    // Além dos testes de runtime, roda os testes de tipo (*.test-d.ts) com o
    // tsc — valida que os tipos gerados em gen/ts compilam e se comportam
    // como o contrato exige. O tsconfig dedicado limita o escopo aos testes
    // de tipo + gen/ (o restante é coberto pelo script typecheck).
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.typecheck.json",
    },
  },
});
