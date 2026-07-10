import { HttpChargesAdapter } from "./HttpChargesAdapter";
import { MockChargesAdapter } from "./MockChargesAdapter";

export type { ChargeDraft, ChargesAdapter, GenerateMonthlyChargesResult } from "./ChargesAdapter";
export {
  CHARGE_ALREADY_EXISTS_MESSAGE,
  CHARGE_ALREADY_PAID_MESSAGE,
  ChargesAdapterError,
  isChargeAlreadyExistsError,
  isChargeAlreadyPaidError,
  isChargeNotFoundError,
} from "./ChargesAdapterError";
export type { ChargesReadAdapter, ListChargesParams } from "./ChargesReadAdapter";
export { MockChargesAdapter, type MockChargesAdapterOptions } from "./MockChargesAdapter";
export { ChargesAdapterUnsupportedError, HTTP_CHARGES_PAGE_SIZE, HttpChargesAdapter } from "./HttpChargesAdapter";

import type { ChargesAdapter } from "./ChargesAdapter";

type ChargesAdapterKind = "mock" | "http";

function readExplicitKind(): ChargesAdapterKind | undefined {
  const raw = import.meta.env.VITE_CHARGES_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `ChargesAdapter` usar. Único ponto de decisão do app para
 * este adapter — mesmo padrão de `src/adapters/appointments/index.ts` e
 * `src/adapters/patients/index.ts` (PSI-033):
 *
 * - `VITE_CHARGES_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpChargesAdapter`; qualquer outro modo (dev/test) usa
 *   `MockChargesAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_CHARGES_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 *
 * Substitui `VITE_CHARGES_READ_ADAPTER` (PSI-034/032): a variável de
 * ambiente muda de nome porque este adapter deixou de ser só-leitura — ver
 * a reconciliação documentada em `ChargesReadAdapter.ts` (mesmo padrão de
 * `VITE_AGENDA_ADAPTER`, PSI-035).
 */
export function resolveChargesAdapterKind(): ChargesAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createChargesAdapter(): ChargesAdapter {
  // "Achatado" de propósito (não chama `resolveChargesAdapterKind`) — ver a
  // explicação em `src/adapters/auth/index.ts` (`createAuthAdapter`,
  // PSI-044): só assim o minificador de produção consegue eliminar
  // `MockChargesAdapter` do bundle quando não há override.
  const explicitRaw = import.meta.env.VITE_CHARGES_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpChargesAdapter({ baseUrl });
  }
  return new MockChargesAdapter();
}

/**
 * Instância única do adapter de cobranças/mensalidades, consumida pelas
 * features (substitui `chargesReadAdapter` da PSI-034/032 — `DashboardPage`
 * e `PatientDetailPage` passaram a consumir esta instância através do mesmo
 * tipo `ChargesReadAdapter`, sem mudança de contrato para essas telas).
 */
export const chargesAdapter: ChargesAdapter = createChargesAdapter();
