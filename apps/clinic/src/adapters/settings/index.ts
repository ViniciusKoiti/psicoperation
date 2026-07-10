import { HttpSettingsAdapter } from "./HttpSettingsAdapter";
import { MockSettingsAdapter } from "./MockSettingsAdapter";

export type {
  OnboardingProfile,
  OnboardingReminderPreferences,
  OnboardingSchedule,
  OnboardingStepData,
  OnboardingStepKey,
  OnboardingTimeWindow,
  SettingsAdapter,
  Weekday,
} from "./SettingsAdapter";
export { ONBOARDING_STEP_KEYS } from "./SettingsAdapter";
export { HttpSettingsAdapter, SettingsAdapterUnsupportedError } from "./HttpSettingsAdapter";
export { MockSettingsAdapter } from "./MockSettingsAdapter";

import type { SettingsAdapter } from "./SettingsAdapter";

type SettingsAdapterKind = "mock" | "http";

function readExplicitKind(): SettingsAdapterKind | undefined {
  const raw = import.meta.env.VITE_SETTINGS_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `SettingsAdapter` usar. Único ponto de decisão do app —
 * nenhum outro módulo deve importar `MockSettingsAdapter`/`HttpSettingsAdapter`
 * diretamente. Mesma regra da PSI-030 (`src/adapters/auth/index.ts`):
 *
 * - `VITE_SETTINGS_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usaria
 *   `HttpSettingsAdapter`; qualquer outro modo (dev/test) usa
 *   `MockSettingsAdapter`.
 *
 * IMPORTANTE: hoje `HttpSettingsAdapter` não implementa os métodos de
 * extensão local (`getOnboardingData`/`saveOnboarding*` — ver
 * `SettingsAdapterUnsupportedError`), pois o contrato ainda não modela
 * perfil profissional, horários de atendimento nem preferências de
 * lembrete. Produção só ativa o mock se alguém setar
 * `VITE_SETTINGS_ADAPTER=mock` explicitamente — mocks nunca são o padrão em
 * produção (ADR 0006) — mas isso deixaria o onboarding sem persistência real
 * em produção até a extensão do contrato (ver open_question do PR PSI-031).
 */
export function resolveSettingsAdapterKind(): SettingsAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createSettingsAdapter(): SettingsAdapter {
  // "Achatado" de propósito (não chama `resolveSettingsAdapterKind`) — ver
  // a explicação em `src/adapters/auth/index.ts` (`createAuthAdapter`,
  // PSI-044): só assim o minificador de produção consegue eliminar
  // `MockSettingsAdapter` do bundle quando não há override.
  const explicitRaw = import.meta.env.VITE_SETTINGS_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpSettingsAdapter({ baseUrl });
  }
  return new MockSettingsAdapter();
}

/** Instância única do adapter de configurações/onboarding, consumida pelas features. */
export const settingsAdapter: SettingsAdapter = createSettingsAdapter();
