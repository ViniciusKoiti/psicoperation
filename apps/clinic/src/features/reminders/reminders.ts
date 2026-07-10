import type { Reminder, ReminderCreateRequest, ReminderStatus } from "@psiops/contracts";

/**
 * Helpers puros da tela de lembretes (PSI-038): templates administrativos
 * de assunto/corpo (sem qualquer conteúdo clínico ou decisão de saúde —
 * restrição inviolável do CLAUDE.md), cálculo da antecedência
 * (`computeScheduledFor`), rótulos/cores de status e ordenação para
 * exibição. Mantidos fora de `RemindersPage.tsx`/`NewReminderModal.tsx`
 * para serem testáveis sem montar componentes React — mesmo padrão de
 * `src/features/tasks/tasks.ts` e `src/features/finance/finance.ts`.
 */

/** Tipo de vínculo escolhido na criação: lembrete de sessão (consulta) ou de pagamento (cobrança) — critério de aceite do manifesto. */
export type ReminderLinkType = "sessao" | "pagamento";

export const REMINDER_STATUS_LABEL: Record<ReminderStatus, string> = {
  agendado: "Agendado",
  enviado: "Enviado",
  falhou: "Falhou",
  cancelado: "Cancelado",
};

export const REMINDER_STATUS_COLOR: Record<ReminderStatus, string> = {
  agendado: "yellow",
  enviado: "green",
  falhou: "red",
  cancelado: "gray",
};

/**
 * Calcula `scheduledFor` (instante ISO 8601 UTC) subtraindo `leadTimeHours`
 * horas de `referenceInstant` — a antecedência configurável do critério de
 * aceite ("antecedência configurável"). `referenceInstant` é o horário da
 * consulta (`Appointment.startsAt`, já UTC) para lembrete de sessão, ou o
 * instante de referência do vencimento (`chargeReferenceInstant` abaixo)
 * para lembrete de pagamento.
 */
export function computeScheduledFor(referenceInstant: string, leadTimeHours: number): string {
  const referenceMs = new Date(referenceInstant).getTime();
  const scheduledMs = referenceMs - leadTimeHours * 60 * 60 * 1000;
  return new Date(scheduledMs).toISOString();
}

/**
 * Instante de referência (ISO 8601 UTC) de uma cobrança sem componente de
 * hora (`Charge.dueDate`, `AAAA-MM-DD`): meia-noite LOCAL do dia de
 * vencimento — mesmo cuidado de fuso documentado no risco do manifesto
 * ("cálculo de... antecedência de lembrete sensível a fuso horário").
 * `computeScheduledFor` subtrai a antecedência a partir daqui.
 */
export function chargeReferenceInstant(dueDate: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).toISOString();
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Formata um `IsoDateTime` UTC como `dd/mm/aaaa HH:mm` em pt-BR (fuso local do navegador). */
export function formatIsoDateTimeLabel(isoDateTime: string): string {
  return DATE_TIME_FORMATTER.format(new Date(isoDateTime));
}

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor em centavos (inteiro) como moeda brasileira. Duplicado por feature — ver docstring do módulo sobre duplicação deliberada. */
export function formatCentsAsBRL(cents: number): string {
  // Intl usa espaço não separável (U+00A0) entre "R$" e o valor; normalizamos
  // para espaço comum para que o texto do lembrete fique previsível.
  return BRL_FORMATTER.format(cents / 100).replace(/\u00A0/g, " ");
}

/**
 * Template administrativo do lembrete de SESSÃO (consulta): assunto/corpo
 * contêm só data e horário — nenhuma informação clínica (CLAUDE.md).
 */
export function buildSessionReminderContent(startsAt: string): { subject: string; body: string } {
  return {
    subject: "Lembrete de consulta",
    body: `Você tem uma consulta agendada para ${formatIsoDateTimeLabel(startsAt)}.`,
  };
}

/**
 * Template administrativo do lembrete de PAGAMENTO (mensalidade): assunto/
 * corpo contêm competência, valor e vencimento — dado financeiro
 * administrativo, nunca clínico.
 */
export function buildPaymentReminderContent(competence: string, amountCents: number, dueDate: string): { subject: string; body: string } {
  const [year, month] = competence.split("-");
  return {
    subject: "Lembrete de pagamento",
    body: `Sua mensalidade de ${month}/${year} no valor de ${formatCentsAsBRL(amountCents)} vence em ${formatBRDate(dueDate)}.`,
  };
}

const ISO_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function formatBRDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return ISO_DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

/** Monta o payload de criação de um lembrete de SESSÃO (`POST /reminders`). */
export function buildSessionReminderRequest(
  patientId: string,
  appointmentId: string,
  startsAt: string,
  leadTimeHours: number,
): ReminderCreateRequest {
  const { subject, body } = buildSessionReminderContent(startsAt);
  return {
    channel: "email",
    subject,
    body,
    scheduledFor: computeScheduledFor(startsAt, leadTimeHours),
    patientId,
    appointmentId,
  };
}

/** Monta o payload de criação de um lembrete de PAGAMENTO (`POST /reminders`). */
export function buildPaymentReminderRequest(
  patientId: string,
  chargeId: string,
  competence: string,
  amountCents: number,
  dueDate: string,
  leadTimeHours: number,
): ReminderCreateRequest {
  const { subject, body } = buildPaymentReminderContent(competence, amountCents, dueDate);
  return {
    channel: "email",
    subject,
    body,
    scheduledFor: computeScheduledFor(chargeReferenceInstant(dueDate), leadTimeHours),
    patientId,
    chargeId,
  };
}

/** Ordena lembretes por `scheduledFor` (mais próximos primeiro), para a listagem da tela. */
export function sortRemindersByScheduledFor(reminders: readonly Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

/** `true` quando o lembrete pode ser cancelado (ativação/desativação individual — só lembretes ainda "agendado"). */
export function isReminderCancellable(reminder: Reminder): boolean {
  return reminder.status === "agendado";
}
