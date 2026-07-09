import type {
  OnboardingProfile,
  OnboardingReminderPreferences,
  OnboardingSchedule,
  Weekday,
} from "../../adapters/settings";

/**
 * Validação client-side dos quatro passos do onboarding (acceptance
 * criteria: "cada passo valida seus campos antes de avançar; CRP é
 * opcional e, quando preenchido, tem formato validado"). Não há endpoint
 * de validação — as regras são só o suficiente para orientar a psicóloga
 * antes de salvar via `SettingsAdapter`.
 */

// Formato "UF/NNNNN" do registro no Conselho Regional de Psicologia (ex.:
// "06/12345"): dois dígitos de região + de 4 a 6 dígitos de número. Só
// validação de formato — sem consulta a base externa do CFP (assumption
// do manifesto PSI-031).
const CRP_PATTERN = /^\d{2}\/\d{4,6}$/;

export type ProfileFormErrors = Partial<Record<keyof OnboardingProfile, string>>;

export function validateProfileStep(values: OnboardingProfile): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (!values.displayName.trim()) {
    errors.displayName = "Informe o nome de exibição.";
  }

  const crp = values.crp?.trim();
  if (crp && !CRP_PATTERN.test(crp)) {
    errors.crp = "Use o formato UF/número (ex.: 06/12345).";
  }

  return errors;
}

export interface SessionFeeFormErrors {
  sessionFee?: string;
}

/** `feeCents` é o valor já convertido para centavos (inteiro BRL). */
export function validateSessionFeeStep(feeCents: number | undefined): SessionFeeFormErrors {
  if (feeCents === undefined || Number.isNaN(feeCents)) {
    return { sessionFee: "Informe o valor padrão da sessão." };
  }
  if (!Number.isInteger(feeCents) || feeCents <= 0) {
    return { sessionFee: "Informe um valor maior que zero." };
  }
  return {};
}

export interface ScheduleFormErrors {
  days?: string;
  timeWindows?: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateScheduleStep(values: OnboardingSchedule): ScheduleFormErrors {
  const errors: ScheduleFormErrors = {};

  if (values.days.length === 0) {
    errors.days = "Selecione ao menos um dia de atendimento.";
  }

  if (values.timeWindows.length === 0) {
    errors.timeWindows = "Informe ao menos uma janela de horário.";
  } else {
    const invalid = values.timeWindows.some((window) => {
      if (!TIME_PATTERN.test(window.start) || !TIME_PATTERN.test(window.end)) return true;
      return window.start >= window.end;
    });
    if (invalid) {
      errors.timeWindows = "Cada janela precisa de um horário de início anterior ao de término.";
    }
  }

  return errors;
}

export interface ReminderPreferencesFormErrors {
  channels?: string;
  leadTimeHours?: string;
}

export function validateReminderPreferencesStep(values: OnboardingReminderPreferences): ReminderPreferencesFormErrors {
  const errors: ReminderPreferencesFormErrors = {};

  if (values.channels.length === 0) {
    errors.channels = "Selecione ao menos um canal de lembrete.";
  }

  if (!Number.isFinite(values.leadTimeHours) || values.leadTimeHours <= 0) {
    errors.leadTimeHours = "Informe uma antecedência maior que zero (em horas).";
  }

  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}

export const WEEKDAY_OPTIONS: readonly { value: Weekday; label: string }[] = [
  { value: "seg", label: "Segunda" },
  { value: "ter", label: "Terça" },
  { value: "qua", label: "Quarta" },
  { value: "qui", label: "Quinta" },
  { value: "sex", label: "Sexta" },
  { value: "sab", label: "Sábado" },
  { value: "dom", label: "Domingo" },
];
