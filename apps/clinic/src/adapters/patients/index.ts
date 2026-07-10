import { HttpPatientsAdapter } from "./HttpPatientsAdapter";
import { MockPatientsAdapter } from "./MockPatientsAdapter";

export type { ListPatientsParams, PatientsAdapter } from "./PatientsAdapter";
export { isPatientNotFoundError, PatientsAdapterError } from "./PatientsAdapterError";
export { DEFAULT_PATIENTS_PAGE_SIZE, MockPatientsAdapter } from "./MockPatientsAdapter";
export { HttpPatientsAdapter } from "./HttpPatientsAdapter";

import type { PatientsAdapter } from "./PatientsAdapter";

type PatientsAdapterKind = "mock" | "http";

function readExplicitKind(): PatientsAdapterKind | undefined {
  const raw = import.meta.env.VITE_PATIENTS_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `PatientsAdapter` usar. Único ponto de decisão do app — nenhum
 * outro módulo deve importar `MockPatientsAdapter`/`HttpPatientsAdapter`
 * diretamente. Mesmo padrão de `src/adapters/auth/index.ts` (PSI-030) e
 * `src/adapters/settings/index.ts` (PSI-031):
 *
 * - `VITE_PATIENTS_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpPatientsAdapter`; qualquer outro modo (dev/test) usa
 *   `MockPatientsAdapter`.
 *
 * Ou seja, produção só ativa o mock se alguém setar `VITE_PATIENTS_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 */
export function resolvePatientsAdapterKind(): PatientsAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createPatientsAdapter(): PatientsAdapter {
  const kind = resolvePatientsAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpPatientsAdapter({ baseUrl });
  }
  return new MockPatientsAdapter();
}

/** Instância única do adapter de pacientes, consumida pelas features. */
export const patientsAdapter: PatientsAdapter = createPatientsAdapter();
