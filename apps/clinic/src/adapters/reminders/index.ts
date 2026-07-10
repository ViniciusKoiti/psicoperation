import { HttpRemindersAdapter } from "./HttpRemindersAdapter";
import { MockRemindersAdapter } from "./MockRemindersAdapter";

export type { ListRemindersParams, RemindersAdapter } from "./RemindersAdapter";
export { isReminderNotCancellableError, isReminderNotFoundError, RemindersAdapterError } from "./RemindersAdapterError";
export { MockRemindersAdapter, type MockRemindersAdapterOptions } from "./MockRemindersAdapter";
export { HTTP_REMINDERS_PAGE_SIZE, HttpRemindersAdapter, RemindersAdapterUnsupportedError } from "./HttpRemindersAdapter";

import type { RemindersAdapter } from "./RemindersAdapter";

type RemindersAdapterKind = "mock" | "http";

function readExplicitKind(): RemindersAdapterKind | undefined {
  const raw = import.meta.env.VITE_REMINDERS_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `RemindersAdapter` usar. Único ponto de decisão do app para
 * este adapter — mesmo padrão de `src/adapters/tasks/index.ts` (PSI-038) e
 * `src/adapters/charges/index.ts` (PSI-037):
 *
 * - `VITE_REMINDERS_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpRemindersAdapter`; qualquer outro modo (dev/test) usa
 *   `MockRemindersAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_REMINDERS_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 */
export function resolveRemindersAdapterKind(): RemindersAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createRemindersAdapter(): RemindersAdapter {
  // "Achatado" de propósito (não chama `resolveRemindersAdapterKind`) — ver
  // a explicação em `src/adapters/auth/index.ts` (`createAuthAdapter`,
  // PSI-044): só assim o minificador de produção consegue eliminar
  // `MockRemindersAdapter` do bundle quando não há override.
  const explicitRaw = import.meta.env.VITE_REMINDERS_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpRemindersAdapter({ baseUrl });
  }
  return new MockRemindersAdapter();
}

/** Instância única do adapter de lembretes, consumida pelas features. */
export const remindersAdapter: RemindersAdapter = createRemindersAdapter();
