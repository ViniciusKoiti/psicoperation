import type { AppointmentStatus, AttendanceRecord, AttendanceStatus, Charge, ChargeStatus } from "@psiops/contracts";

import type { AppointmentHistoryEntry } from "../../adapters/appointments";

/**
 * Helpers puros da tela de detalhe do paciente (PSI-034): rótulos pt-BR,
 * formatação de data/hora/competência e agrupamento/ordenação de
 * consultas/cobranças. Mantidos fora de `PatientDetailPage.tsx` para serem
 * testáveis sem montar componentes React.
 */

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  compareceu: "Compareceu",
  faltou: "Faltou",
  remarcada: "Remarcada",
};

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasada: "Atrasada",
};

/** Ordem de exibição das seções de situação financeira (critério de aceite do manifesto). */
export const CHARGE_STATUS_ORDER: readonly ChargeStatus[] = ["em_dia", "pendente", "atrasada"];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

/** Formata um `IsoDateTime` como `{ date: "dd/mm/aaaa", time: "hh:mm" }` em pt-BR. */
export function formatAppointmentDateTime(isoDateTime: string): { date: string; time: string } {
  const parsed = new Date(isoDateTime);
  return { date: DATE_FORMATTER.format(parsed), time: TIME_FORMATTER.format(parsed) };
}

/**
 * Formata um `IsoDate` (`AAAA-MM-DD`, sem componente de hora) como
 * `dd/mm/aaaa` em pt-BR. Constrói a data a partir dos componentes (ano/mês/
 * dia) em vez de `new Date(isoDate)` para não sofrer o deslocamento de um
 * dia que o parse UTC de "AAAA-MM-DD" causaria em fusos horários negativos.
 */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

/** Formata uma `Competence` (`AAAA-MM`) como "Mês/AAAA" em pt-BR (ex.: "2026-07" → "Julho/2026"). */
export function formatCompetence(competence: string): string {
  const [year, month] = competence.split("-");
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? month;
  return `${monthName}/${year}`;
}

/** Ordena o histórico de consultas da mais recente para a mais antiga (critério de aceite do manifesto). */
export function sortAppointmentsDescending(entries: readonly AppointmentHistoryEntry[]): AppointmentHistoryEntry[] {
  return [...entries].sort((a, b) => b.appointment.startsAt.localeCompare(a.appointment.startsAt));
}

/** Entrada do histórico com registro administrativo de presença já lançado (type guard para a seção de registros). */
export type AppointmentHistoryEntryWithAttendance = AppointmentHistoryEntry & { attendance: AttendanceRecord };

/** `true` quando a consulta já teve presença administrativa registrada (`PUT /appointments/{id}/attendance`, PSI-036). */
export function hasAttendanceRecord(entry: AppointmentHistoryEntry): entry is AppointmentHistoryEntryWithAttendance {
  return entry.attendance !== undefined;
}

/** Agrupa cobranças por `ChargeStatus` (em_dia/pendente/atrasada) — critério de aceite do manifesto. */
export function groupChargesByStatus(charges: readonly Charge[]): Record<ChargeStatus, Charge[]> {
  const groups: Record<ChargeStatus, Charge[]> = { em_dia: [], pendente: [], atrasada: [] };
  for (const charge of charges) {
    groups[charge.status].push(charge);
  }
  return groups;
}

/** Soma os valores (centavos BRL inteiros) de um grupo de cobranças. */
export function sumChargeAmounts(charges: readonly Charge[]): number {
  return charges.reduce((total, charge) => total + charge.amount, 0);
}
