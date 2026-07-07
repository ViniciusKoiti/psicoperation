/**
 * @psiops/testing — caixa de ferramentas de teste do lado JS/TS do PsiOps.
 *
 * - Builders determinísticos tipados por @psiops/contracts (`buildUser`,
 *   `buildLead`, `createFixtures`, …)
 * - Infra genérica de mock adapters em memória (`InMemoryStore`, ADR 0006)
 * - Padrões de formato dos contratos (`patterns`)
 *
 * Helpers específicos do Vitest ficam no subpath `@psiops/testing/vitest`
 * (mantém este entry point livre de dependência do runner).
 */
export { DEFAULT_SEED, SeededRandom, type Seed } from "./random.js";
export { patterns } from "./patterns.js";
export {
  Fixtures,
  createFixtures,
  buildUser,
  buildUsers,
  buildLead,
  buildLeads,
  buildLeadCreateRequest,
  type BuildOptions,
} from "./builders.js";
export {
  InMemoryStore,
  createInMemoryStore,
  type InMemoryStoreOptions,
  type Resettable,
} from "./adapters.js";
