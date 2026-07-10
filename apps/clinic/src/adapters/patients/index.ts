import { getBridgedAccessToken } from "../auth/accessTokenBridge";
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
  // "Achatado" de propósito (não chama `resolvePatientsAdapterKind`) — ver
  // a explicação em `src/adapters/auth/index.ts` (`createAuthAdapter`,
  // PSI-044): só assim o minificador de produção consegue eliminar
  // `MockPatientsAdapter` do bundle quando não há override.
  const explicitRaw = import.meta.env.VITE_PATIENTS_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    // `getAccessToken` lê a ponte de `src/adapters/auth/accessTokenBridge.ts`
    // (PSI-044): reflete o access token do login/registro/renovação mais
    // recente feito através de `authAdapter` (`src/adapters/auth/index.ts`,
    // o mesmo adapter que `SessionProvider` usa) — ver a doc daquele módulo
    // para o porquê desta indireção (evita tocar `src/session/**`, fora do
    // escopo permitido aqui).
    return new HttpPatientsAdapter({ baseUrl, getAccessToken: getBridgedAccessToken });
  }
  return new MockPatientsAdapter();
}

/** Instância única do adapter de pacientes, consumida pelas features. */
export const patientsAdapter: PatientsAdapter = createPatientsAdapter();
