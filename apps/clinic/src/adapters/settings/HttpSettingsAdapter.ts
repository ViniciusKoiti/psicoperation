import type {
  MoneyBRL,
  OnboardingCompleteRequest,
  OnboardingStatus,
  Problem,
  Settings,
  SettingsUpdateRequest,
} from "@psiops/contracts";

import type {
  OnboardingProfile,
  OnboardingReminderPreferences,
  OnboardingSchedule,
  OnboardingStepData,
  SettingsAdapter,
} from "./SettingsAdapter";

export interface HttpSettingsAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /**
   * Access token usado nas chamadas autenticadas. Nesta tarefa (PSI-031) a
   * integração ponta a ponta com sessão real fica pendente (mesma ressalva
   * da `HttpAuthAdapter` da PSI-030) — normalmente viria de
   * `SessionManager.withAuth`.
   */
  getAccessToken?: () => string | undefined;
}

/** Erro levantado pelos métodos de extensão local ainda sem endpoint no contrato (ver PSI-031). */
export class SettingsAdapterUnsupportedError extends Error {
  constructor(method: string) {
    super(
      `HttpSettingsAdapter.${method}: ainda não há endpoint no contrato (packages/contracts) para os dados de ` +
        "perfil profissional, horários de atendimento ou preferências de lembrete do onboarding — apenas " +
        "`Settings`/`OnboardingStatus` existem hoje. Ver open_question do PR da PSI-031; a implementação HTTP " +
        "completa depende da extensão do contrato de settings.",
    );
    this.name = "SettingsAdapterUnsupportedError";
  }
}

/**
 * Implementação HTTP de `SettingsAdapter`, tipada contra os contratos
 * gerados em `@psiops/contracts` (`gen/ts`), apontando para a API Spring
 * Boot (`/settings`, `/settings/onboarding`).
 *
 * IMPORTANTE (mesma ressalva da `HttpAuthAdapter`, PSI-030): esta tarefa
 * entrega a implementação e sua tipagem para os quatro métodos cobertos
 * pelo contrato, mas NÃO habilita chamadas reais contra um backend em
 * execução nem é a seleção padrão em nenhum ambiente hoje (ver `./index.ts`).
 * O exercício ponta a ponta acontece na PSI-044.
 *
 * Os métodos de extensão local (`getOnboardingData`/`saveOnboarding*`) não
 * têm endpoint correspondente no contrato ainda (ver `SettingsAdapter.ts`) —
 * rejeitam com `SettingsAdapterUnsupportedError` em vez de inventar uma rota
 * não especificada. `MockSettingsAdapter` é quem sustenta o wizard de
 * onboarding até a extensão do contrato.
 */
export class HttpSettingsAdapter implements SettingsAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpSettingsAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    // `globalThis.fetch` sozinho (sem bind) lança "Illegal invocation" em
    // navegadores reais quando chamado como `this.fetchFn(...)` mais abaixo
    // (perde o receiver `window` que o fetch nativo exige) — só não aparecia
    // nos testes existentes porque todos injetam `fetchFn`, nunca exercitando
    // este default contra um `fetch` de verdade (achado ao rodar a suíte E2E
    // contra o navegador real, PSI-044).
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async getSettings(): Promise<Settings> {
    const response = await this.fetchFn(`${this.baseUrl}/settings`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return this.parseResponse<Settings>(response);
  }

  async updateSettings(payload: SettingsUpdateRequest): Promise<Settings> {
    return this.putJson<Settings>("/settings", payload);
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await this.fetchFn(`${this.baseUrl}/settings/onboarding`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return this.parseResponse<OnboardingStatus>(response);
  }

  async completeOnboardingStep(payload: OnboardingCompleteRequest): Promise<OnboardingStatus> {
    const response = await this.fetchFn(`${this.baseUrl}/settings/onboarding`, {
      method: "POST",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this.parseResponse<OnboardingStatus>(response);
  }

  async getOnboardingData(): Promise<OnboardingStepData> {
    throw new SettingsAdapterUnsupportedError("getOnboardingData");
  }

  async saveOnboardingProfile(_data: OnboardingProfile): Promise<OnboardingStatus> {
    throw new SettingsAdapterUnsupportedError("saveOnboardingProfile");
  }

  async saveOnboardingSessionFee(_feeCents: MoneyBRL): Promise<OnboardingStatus> {
    throw new SettingsAdapterUnsupportedError("saveOnboardingSessionFee");
  }

  async saveOnboardingSchedule(_data: OnboardingSchedule): Promise<OnboardingStatus> {
    throw new SettingsAdapterUnsupportedError("saveOnboardingSchedule");
  }

  async saveOnboardingReminderPreferences(_data: OnboardingReminderPreferences): Promise<OnboardingStatus> {
    throw new SettingsAdapterUnsupportedError("saveOnboardingReminderPreferences");
  }

  // --- Internos ---

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async putJson<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new Error(problem?.detail ?? problem?.title ?? "Não foi possível completar a operação de configurações.");
    }
    return (await response.json()) as T;
  }

  private async tryParseProblem(response: Response): Promise<Problem | undefined> {
    try {
      return (await response.json()) as Problem;
    } catch {
      return undefined;
    }
  }
}
