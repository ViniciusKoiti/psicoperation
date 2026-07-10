import type { Appointment, AppointmentStatus } from "@psiops/contracts";

/**
 * Helpers puros da agenda (PSI-035): navegação entre semana/dia, formatação
 * pt-BR e agrupamento de consultas por dia. Mantidos fora de `AgendaPage.tsx`
 * para serem testáveis sem montar componentes React — mesmo padrão de
 * `src/features/patients/patientDetail.ts` (PSI-034).
 *
 * Aritmética de calendário (`startOfWeek`/`addDays`/`toIsoDate`) usa os
 * componentes LOCAIS de `Date` (`getDate`/`getMonth`/`getDay`, não os `getUTC*`),
 * de propósito: é o mesmo fuso que `Intl.DateTimeFormat("pt-BR", ...)` usa
 * para EXIBIR o horário de uma consulta (ver `formatAppointmentDateTime` em
 * `src/features/patients/patientDetail.ts`). Se a agrupação por dia usasse
 * UTC enquanto a exibição usa fuso local, uma consulta perto da meia-noite
 * poderia aparecer sob o cabeçalho de um dia diferente do horário mostrado
 * no card — o risco de fuso citado no manifesto. Isso é independente da
 * aritmética de recorrência (`src/adapters/appointments/recurrence.ts`), que
 * soma milissegundos absolutos (7 dias corridos) e não depende de fuso.
 */

export type AgendaViewMode = "semana" | "dia";

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const WEEKDAY_SHORT_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Meia-noite local do mesmo dia-calendário de `date` (zera hora/minuto/segundo). */
function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Soma (ou subtrai, se negativo) `days` dias-calendário a `date`, preservando meia-noite local. */
export function addDays(date: Date, days: number): Date {
  const result = atMidnight(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Início (segunda-feira, meia-noite local) da semana que contém `date`. */
export function startOfWeek(date: Date): Date {
  const weekday = date.getDay(); // 0 (domingo) .. 6 (sábado)
  const diffToMonday = (weekday + 6) % 7; // segunda vira 0
  return addDays(date, -diffToMonday);
}

/** Formata um `Date` local como `IsoDate` (`AAAA-MM-DD`), sem componente de hora. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `true` quando `a` e `b` caem no mesmo dia-calendário local. */
export function isSameDay(a: Date, b: Date): boolean {
  return toIsoDate(a) === toIsoDate(b);
}

/** Rótulo pt-BR do dia da semana (`"long"` ou `"short"`, padrão `"long"`). */
export function weekdayLabel(date: Date, style: "long" | "short" = "long"): string {
  const index = date.getDay();
  return style === "long" ? (WEEKDAY_LABELS[index] ?? "") : (WEEKDAY_SHORT_LABELS[index] ?? "");
}

/** Cabeçalho de coluna da visão semanal: `"Seg 13/07"`. */
export function formatDayHeader(date: Date): string {
  return `${weekdayLabel(date, "short")} ${DAY_MONTH_FORMATTER.format(date)}`;
}

/** Título da visão diária: `"Segunda-feira, 13/07/2026"`. */
export function formatDayTitle(date: Date): string {
  const long = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  return `${weekdayLabel(date)}, ${long}`;
}

/** Os 7 dias (segunda a domingo) da semana que começa em `weekStart`. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

/** Ordena consultas por horário de início, sem mutar a lista original. */
export function sortAppointmentsByTime(appointments: readonly Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Agrupa consultas por dia-calendário LOCAL (`toIsoDate`), cada grupo já
 * ordenado por horário — o formato que a visão semanal (uma coluna por dia)
 * consome diretamente.
 */
export function groupAppointmentsByDay(appointments: readonly Appointment[]): Map<string, Appointment[]> {
  const groups = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    const key = toIsoDate(new Date(appointment.startsAt));
    const list = groups.get(key);
    if (list) {
      list.push(appointment);
    } else {
      groups.set(key, [appointment]);
    }
  }
  for (const [key, list] of groups) {
    groups.set(key, sortAppointmentsByTime(list));
  }
  return groups;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });
const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** Formata só o horário (`HH:mm`) de um `IsoDateTime`, em pt-BR. */
export function formatAppointmentTime(isoDateTime: string): string {
  return TIME_FORMATTER.format(new Date(isoDateTime));
}

/** Formata só a data (`dd/mm/aaaa`) de um `IsoDateTime`, em pt-BR. */
export function formatAppointmentDate(isoDateTime: string): string {
  return DATE_FORMATTER.format(new Date(isoDateTime));
}

/**
 * Formata um `IsoDate` (`AAAA-MM-DD`, sem componente de hora — ex.: os
 * limites de `range.from`/`range.to` desta página) como `dd/mm/aaaa` em
 * pt-BR. Constrói a data a partir dos componentes (ano/mês/dia) em vez de
 * `new Date(isoDate)`: essa segunda forma faz o parser tratar a string como
 * meia-noite UTC, que em fusos negativos (ex.: `America/Sao_Paulo`, UTC-3)
 * cai no dia ANTERIOR ao mostrar em horário local — mesmo cuidado de
 * `formatIsoDate` em `src/features/patients/patientDetail.ts` (PSI-034).
 */
export function formatIsoDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

/** Rótulos pt-BR de `AppointmentStatus`, reaproveitados dos mesmos textos da PSI-034 (`patientDetail.ts`) para não divergir entre agenda e histórico do paciente. */
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
};

/** Duração padrão (minutos) sugerida ao criar uma consulta — mesmo valor do seed de demonstração (`MockAgendaAdapter`). */
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 50;

/**
 * Combina um `IsoDate` (`AAAA-MM-DD`, de um `<input type="date">`) e um
 * horário `HH:mm` (de um `<input type="time">`) — ambos em horário LOCAL,
 * como o navegador os produz — num `IsoDateTime` UTC (`Appointment.startsAt`).
 * `new Date("AAAA-MM-DDTHH:mm:00")` (sem sufixo de fuso) é interpretado pelo
 * motor JS como horário LOCAL, então `.toISOString()` já faz a conversão
 * para UTC corretamente.
 */
export function buildIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

const LOCAL_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Extrai a data local (`AAAA-MM-DD`) de um `IsoDateTime`, para pré-preencher um `<input type="date">`. */
export function toLocalDateInputValue(isoDateTime: string): string {
  return toIsoDate(new Date(isoDateTime));
}

/** Extrai o horário local (`HH:mm`) de um `IsoDateTime`, para pré-preencher um `<input type="time">`. */
export function toLocalTimeInputValue(isoDateTime: string): string {
  const parts = LOCAL_TIME_FORMATTER.formatToParts(new Date(isoDateTime));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
