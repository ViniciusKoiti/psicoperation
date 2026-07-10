import { HttpChargesReadAdapter } from "./HttpChargesReadAdapter";
import { MockChargesReadAdapter } from "./MockChargesReadAdapter";

export type { ChargesReadAdapter, ListChargesParams } from "./ChargesReadAdapter";
export { ChargesReadAdapterError } from "./ChargesReadAdapterError";
export { MockChargesReadAdapter } from "./MockChargesReadAdapter";
export { HTTP_CHARGES_READ_PAGE_SIZE, HttpChargesReadAdapter } from "./HttpChargesReadAdapter";

import type { ChargesReadAdapter } from "./ChargesReadAdapter";

type ChargesReadAdapterKind = "mock" | "http";

function readExplicitKind(): ChargesReadAdapterKind | undefined {
  const raw = import.meta.env.VITE_CHARGES_READ_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `ChargesReadAdapter` usar. Único ponto de decisão do app
 * para este adapter — mesmo padrão de `src/adapters/appointments/index.ts`
 * e `src/adapters/patients/index.ts` (PSI-033):
 *
 * - `VITE_CHARGES_READ_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpChargesReadAdapter`; qualquer outro modo (dev/test) usa
 *   `MockChargesReadAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_CHARGES_READ_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 */
export function resolveChargesReadAdapterKind(): ChargesReadAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createChargesReadAdapter(): ChargesReadAdapter {
  const kind = resolveChargesReadAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpChargesReadAdapter({ baseUrl });
  }
  return new MockChargesReadAdapter();
}

/** Instância única do adapter de leitura de cobranças, consumida pelas features. */
export const chargesReadAdapter: ChargesReadAdapter = createChargesReadAdapter();
