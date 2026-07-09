import type {
  MoneyBRL,
  OnboardingCompleteRequest,
  OnboardingStatus,
  OnboardingStep,
  Settings,
  SettingsUpdateRequest,
} from "@psiops/contracts";

import {
  ONBOARDING_STEP_KEYS,
  type OnboardingProfile,
  type OnboardingReminderPreferences,
  type OnboardingSchedule,
  type OnboardingStepData,
  type SettingsAdapter,
} from "./SettingsAdapter";

export interface MockSettingsAdapterOptions {
  /** Configurações iniciais (mescladas sobre o padrão). */
  settings?: Partial<Settings>;
  /** Relógio injetável — determinismo nos testes (ex.: `onboardingCompletedAt`). */
  clock?: () => number;
}

const DEFAULT_SETTINGS: Settings = {
  timezone: "America/Sao_Paulo",
};

function initialSteps(): OnboardingStep[] {
  return ONBOARDING_STEP_KEYS.map((key) => ({ key, done: false }));
}

/**
 * Implementação em memória de `SettingsAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância. Padrão em desenvolvimento e testes —
 * NUNCA deve ser a seleção padrão em build de produção (ver `./index.ts`).
 *
 * Modela o progresso do onboarding com os quatro passos de
 * `ONBOARDING_STEP_KEYS`: `completed` só vira `true` quando todos os passos
 * estão `done` (concluídos com dado ou pulados) — nesse momento também
 * carimba `settings.onboardingCompletedAt`, espelhando o campo do contrato.
 */
export class MockSettingsAdapter implements SettingsAdapter {
  private settings: Settings;
  private steps: OnboardingStep[] = initialSteps();
  private stepData: OnboardingStepData = {};
  private readonly clock: () => number;

  constructor(options: MockSettingsAdapterOptions = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...options.settings };
    this.clock = options.clock ?? (() => Date.now());
  }

  async getSettings(): Promise<Settings> {
    return structuredClone(this.settings);
  }

  async updateSettings(payload: SettingsUpdateRequest): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...payload,
      updatedAt: new Date(this.clock()).toISOString(),
    };
    return structuredClone(this.settings);
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return this.buildStatus();
  }

  async getOnboardingData(): Promise<OnboardingStepData> {
    return structuredClone(this.stepData);
  }

  async completeOnboardingStep({ stepKey }: OnboardingCompleteRequest): Promise<OnboardingStatus> {
    this.markStepDone(stepKey);
    return this.buildStatus();
  }

  async saveOnboardingProfile(data: OnboardingProfile): Promise<OnboardingStatus> {
    this.stepData.perfil = structuredClone(data);
    return this.completeOnboardingStep({ stepKey: "perfil" });
  }

  async saveOnboardingSessionFee(feeCents: MoneyBRL): Promise<OnboardingStatus> {
    this.stepData["valor-sessao"] = feeCents;
    return this.completeOnboardingStep({ stepKey: "valor-sessao" });
  }

  async saveOnboardingSchedule(data: OnboardingSchedule): Promise<OnboardingStatus> {
    this.stepData.horarios = structuredClone(data);
    return this.completeOnboardingStep({ stepKey: "horarios" });
  }

  async saveOnboardingReminderPreferences(data: OnboardingReminderPreferences): Promise<OnboardingStatus> {
    this.stepData.lembretes = structuredClone(data);
    return this.completeOnboardingStep({ stepKey: "lembretes" });
  }

  // --- Internos ---

  private markStepDone(stepKey: string): void {
    const step = this.steps.find((candidate) => candidate.key === stepKey);
    if (!step) {
      // `stepKey` desconhecido: não modela mais estado — comportamento inócuo
      // (o contrato não define um erro específico para chave inválida).
      return;
    }
    step.done = true;

    const allDone = this.steps.every((candidate) => candidate.done);
    if (allDone && !this.settings.onboardingCompletedAt) {
      this.settings = {
        ...this.settings,
        onboardingCompletedAt: new Date(this.clock()).toISOString(),
      };
    }
  }

  private buildStatus(): OnboardingStatus {
    return {
      completed: this.steps.every((step) => step.done),
      steps: structuredClone(this.steps),
    };
  }
}
