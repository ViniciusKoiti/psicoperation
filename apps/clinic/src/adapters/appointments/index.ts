import { getBridgedAccessToken } from "../auth/accessTokenBridge";
import { HttpAgendaAdapter } from "./HttpAgendaAdapter";
import { MockAgendaAdapter } from "./MockAgendaAdapter";

export type { AppointmentHistoryEntry, AppointmentsReadAdapter } from "./AppointmentsReadAdapter";
export type {
  AgendaAdapter,
  AppointmentSeriesOccurrenceOutcome,
  AppointmentSeriesOccurrenceResult,
  CreateAppointmentSeriesInput,
  CreateAppointmentSeriesResult,
  ListAppointmentsRangeParams,
  RescheduleAppointmentInput,
} from "./AgendaAdapter";
export {
  AGENDA_CONFLICT_MESSAGE,
  AgendaAdapterError,
  isAgendaConflictError,
  isAgendaNotFoundError,
} from "./AgendaAdapterError";
export {
  appointmentsOverlap,
  BLOCKING_APPOINTMENT_STATUSES,
  findConflictingAppointment,
  type AppointmentTimeRange,
} from "./conflict";
export { computeWeeklySeriesOccurrences, type WeeklySeriesBounds } from "./recurrence";
export { MockAgendaAdapter } from "./MockAgendaAdapter";
export { HTTP_AGENDA_PAGE_SIZE, HttpAgendaAdapter } from "./HttpAgendaAdapter";

import type { AgendaAdapter } from "./AgendaAdapter";

type AgendaAdapterKind = "mock" | "http";

function readExplicitKind(): AgendaAdapterKind | undefined {
  const raw = import.meta.env.VITE_AGENDA_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `AgendaAdapter` usar. Único ponto de decisão do app para este
 * adapter — mesmo padrão de `src/adapters/patients/index.ts` (PSI-033) e
 * `src/adapters/auth|settings/index.ts` (PSI-030/031):
 *
 * - `VITE_AGENDA_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpAgendaAdapter`; qualquer outro modo (dev/test) usa
 *   `MockAgendaAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_AGENDA_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 *
 * Substitui `VITE_APPOINTMENTS_READ_ADAPTER` (PSI-034): a variável de
 * ambiente muda de nome porque este adapter deixou de ser só-leitura — ver
 * a reconciliação documentada em `AgendaAdapter.ts`.
 */
export function resolveAgendaAdapterKind(): AgendaAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createAgendaAdapter(): AgendaAdapter {
  // "Achatado" de propósito (não chama `resolveAgendaAdapterKind`) — ver a
  // explicação em `src/adapters/auth/index.ts` (`createAuthAdapter`,
  // PSI-044): só assim o minificador de produção consegue eliminar
  // `MockAgendaAdapter` do bundle quando não há override.
  const explicitRaw = import.meta.env.VITE_AGENDA_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    // Mesma ponte de `src/adapters/patients/index.ts` (PSI-044) — ver a doc
    // de `src/adapters/auth/accessTokenBridge.ts`.
    return new HttpAgendaAdapter({ baseUrl, getAccessToken: getBridgedAccessToken });
  }
  return new MockAgendaAdapter();
}

/**
 * Instância única do adapter de agenda/consultas, consumida pelas features
 * (substitui `appointmentsReadAdapter` da PSI-034 — `PatientDetailPage`
 * passou a consumir esta instância através do mesmo tipo
 * `AppointmentsReadAdapter`, sem mudança de contrato para aquela tela).
 */
export const agendaAdapter: AgendaAdapter = createAgendaAdapter();
