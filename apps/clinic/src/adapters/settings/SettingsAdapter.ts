import type {
  MoneyBRL,
  OnboardingCompleteRequest,
  OnboardingStatus,
  ReminderChannel,
  Settings,
  SettingsUpdateRequest,
} from "@psiops/contracts";

/**
 * Chaves dos passos do onboarding, na ordem em que são exibidos no wizard.
 * Cada valor é o `key` de um `OnboardingStep` (contrato) — o próprio schema
 * de `OnboardingStep` já usa `"perfil"` como exemplo, então mantemos esse
 * nome; os demais ("valor-sessao", "horarios", "lembretes") são a hipótese
 * de trabalho desta tarefa (ver `open_questions` do manifesto PSI-031:
 * "o conteúdo exato dos passos... pede validação de produto").
 */
export const ONBOARDING_STEP_KEYS = ["perfil", "valor-sessao", "horarios", "lembretes"] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEP_KEYS)[number];

/** Dia da semana, abreviado (usado nas janelas de atendimento do passo 3). */
export type Weekday = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface OnboardingProfile {
  /** Nome de exibição da psicóloga (usado no app e em comunicações). */
  displayName: string;
  /**
   * Registro no Conselho Regional de Psicologia, formato `"UF/NNNNN"`
   * (ex.: `"06/12345"`). Opcional — sem consulta a base externa do CFP
   * (assumption do manifesto), apenas validação de formato.
   */
  crp?: string;
}

export interface OnboardingTimeWindow {
  /** Horário no formato `"HH:mm"` (24h). */
  start: string;
  end: string;
}

export interface OnboardingSchedule {
  days: Weekday[];
  timeWindows: OnboardingTimeWindow[];
}

export interface OnboardingReminderPreferences {
  /** Canais habilitados. No MVP, apenas `email` está disponível (PSI-038). */
  channels: ReminderChannel[];
  /** Antecedência padrão do lembrete em relação à consulta/vencimento, em horas. */
  leadTimeHours: number;
}

/**
 * Dado bruto persistido por cada passo do onboarding. Mantido localmente
 * porque os schemas atuais de `Settings`/`OnboardingStatus`
 * (`packages/contracts`) ainda não modelam perfil profissional, horários de
 * atendimento nem preferências de lembrete — só mensalidade padrão, dia de
 * vencimento, juros e fuso (ver assumption do manifesto PSI-031: "enquanto
 * os contratos de settings não estiverem [completos] em gen/ts, os tipos do
 * adapter ficam locais ao app"). Quando os contratos incorporarem estes
 * campos, este tipo é substituído por tipos de `@psiops/contracts` sem
 * mudar a assinatura pública do `SettingsAdapter`.
 */
export interface OnboardingStepData {
  perfil?: OnboardingProfile;
  "valor-sessao"?: MoneyBRL;
  horarios?: OnboardingSchedule;
  lembretes?: OnboardingReminderPreferences;
}

/**
 * Interface de acesso às configurações da conta e ao progresso do
 * onboarding (ADR 0006 — frontends desacoplados por adapters).
 *
 * Os quatro primeiros métodos espelham 1:1 os endpoints `/settings` e
 * `/settings/onboarding` do contrato (`Settings`, `SettingsUpdateRequest`,
 * `OnboardingStatus`, `OnboardingCompleteRequest` — nenhum DTO é
 * redefinido) e bastam, sozinhos, para a tela de configurações completa
 * (PSI-039) editar valor padrão de mensalidade/dia de vencimento/juros/fuso
 * fora do onboarding.
 *
 * Os métodos seguintes (`getOnboardingData`/`saveOnboarding*`) são extensões
 * locais que persistem o dado específico de cada passo do wizard — não
 * coberto pelo contrato hoje (ver `OnboardingStepData`) — e marcam o passo
 * correspondente como concluído em `OnboardingStatus`, exatamente como
 * `completeOnboardingStep` faria. "Pular" um passo ou o fluxo inteiro não
 * precisa de método próprio: basta chamar `completeOnboardingStep` (sem
 * salvar dado) para os `stepKey`s pendentes.
 *
 * Implementações:
 * - `MockSettingsAdapter` — estado em memória, padrão em desenvolvimento e
 *   testes.
 * - `HttpSettingsAdapter` — tipada contra os contratos; os quatro métodos
 *   mirrored chamam a API real (sem exercício ponta a ponta nesta tarefa,
 *   igual à `HttpAuthAdapter` da PSI-030); os métodos de extensão local
 *   rejeitam com um erro explícito até os contratos incorporarem estes
 *   campos (ver open_question do PR desta tarefa).
 *
 * O ponto de composição único (seleção mock/http por variável de ambiente)
 * fica em `./index.ts`.
 */
export interface SettingsAdapter {
  /** `GET /settings` */
  getSettings(): Promise<Settings>;

  /** `PUT /settings` */
  updateSettings(payload: SettingsUpdateRequest): Promise<Settings>;

  /** `GET /settings/onboarding` */
  getOnboardingStatus(): Promise<OnboardingStatus>;

  /**
   * `POST /settings/onboarding` — marca `stepKey` como concluído sem
   * associar dado algum. Usado tanto para "pular este passo" quanto,
   * internamente, pelos `saveOnboarding*` após persistirem o dado do passo.
   */
  completeOnboardingStep(payload: OnboardingCompleteRequest): Promise<OnboardingStatus>;

  /** Dados já salvos de cada passo — usado para reabrir o wizard com os campos preenchidos ao retomar. */
  getOnboardingData(): Promise<OnboardingStepData>;

  /** Salva o perfil profissional (passo 1) e marca `"perfil"` como concluído. */
  saveOnboardingProfile(data: OnboardingProfile): Promise<OnboardingStatus>;

  /** Salva o valor padrão de sessão em centavos BRL (passo 2) e marca `"valor-sessao"` como concluído. */
  saveOnboardingSessionFee(feeCents: MoneyBRL): Promise<OnboardingStatus>;

  /** Salva dias/horários de atendimento (passo 3) e marca `"horarios"` como concluído. */
  saveOnboardingSchedule(data: OnboardingSchedule): Promise<OnboardingStatus>;

  /** Salva preferências de lembrete (passo 4) e marca `"lembretes"` como concluído. */
  saveOnboardingReminderPreferences(data: OnboardingReminderPreferences): Promise<OnboardingStatus>;
}
