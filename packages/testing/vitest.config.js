/**
 * Vitest do @psiops/testing (preset do monorepo, ambiente Node).
 * Arquivo .js (como em @psiops/config) para ficar fora do `tsc --noEmit`.
 */
import { defineVitestConfig } from "@psiops/config/vitest";

export default defineVitestConfig();
