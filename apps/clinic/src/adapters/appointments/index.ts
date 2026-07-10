import { HttpAppointmentsReadAdapter } from "./HttpAppointmentsReadAdapter";
import { MockAppointmentsReadAdapter } from "./MockAppointmentsReadAdapter";

export type { AppointmentHistoryEntry, AppointmentsReadAdapter } from "./AppointmentsReadAdapter";
export { AppointmentsReadAdapterError } from "./AppointmentsReadAdapterError";
export { MockAppointmentsReadAdapter } from "./MockAppointmentsReadAdapter";
export { HTTP_APPOINTMENTS_READ_PAGE_SIZE, HttpAppointmentsReadAdapter } from "./HttpAppointmentsReadAdapter";

import type { AppointmentsReadAdapter } from "./AppointmentsReadAdapter";

type AppointmentsReadAdapterKind = "mock" | "http";

function readExplicitKind(): AppointmentsReadAdapterKind | undefined {
  const raw = import.meta.env.VITE_APPOINTMENTS_READ_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `AppointmentsReadAdapter` usar. Único ponto de decisão do
 * app para este adapter — mesmo padrão de `src/adapters/patients/index.ts`
 * (PSI-033) e `src/adapters/auth|settings/index.ts` (PSI-030/031):
 *
 * - `VITE_APPOINTMENTS_READ_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpAppointmentsReadAdapter`; qualquer outro modo (dev/test) usa
 *   `MockAppointmentsReadAdapter`.
 *
 * Produção só ativa o mock se alguém setar
 * `VITE_APPOINTMENTS_READ_ADAPTER=mock` explicitamente — nunca por padrão
 * (ADR 0006).
 */
export function resolveAppointmentsReadAdapterKind(): AppointmentsReadAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createAppointmentsReadAdapter(): AppointmentsReadAdapter {
  const kind = resolveAppointmentsReadAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpAppointmentsReadAdapter({ baseUrl });
  }
  return new MockAppointmentsReadAdapter();
}

/** Instância única do adapter de leitura de consultas, consumida pelas features. */
export const appointmentsReadAdapter: AppointmentsReadAdapter = createAppointmentsReadAdapter();
