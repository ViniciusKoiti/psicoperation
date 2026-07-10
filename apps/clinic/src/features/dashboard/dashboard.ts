import type { Appointment, AppointmentStatus, Charge, Task } from "@psiops/contracts";

/**
 * Helpers puros do dashboard (PSI-032): cálculo do dia-calendário local
 * ("hoje"), seleção/ordenação de consultas, pendências financeiras e
 * tarefas para cada bloco, e formatação de dinheiro. Mantidos fora de
 * `DashboardPage.tsx` para serem testáveis sem montar componentes React —
 * mesmo padrão de `src/features/agenda/agenda.ts` (PSI-035) e
 * `src/features/patients/patientDetail.ts` (PSI-034).
 *
 * `toIsoDate`/`addDays` duplicam deliberadamente os homônimos de
 * `src/features/agenda/agenda.ts`: mesma justificativa de
 * `src/features/patients/money.ts` (duplicado por feature, não
 * compartilhado, para não criar acoplamento entre features via refactor
 * fora de escopo desta tarefa).
 */

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

/** Formata um `Date` local como `IsoDate` (`AAAA-MM-DD`), sem componente de hora. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extrai o dia-calendário LOCAL (`AAAA-MM-DD`) de um `IsoDateTime` UTC
 * (`Appointment.startsAt`). Igual a `toLocalDateInputValue` de
 * `src/features/agenda/agenda.ts` — necessário para o mesmo cuidado de fuso
 * documentado lá: uma consulta perto da meia-noite pode cair num
 * dia-calendário UTC diferente do dia-calendário local em que ela aparece
 * para a usuária (risco citado no manifesto desta tarefa).
 */
export function localIsoDate(isoDateTime: string): string {
  return toIsoDate(new Date(isoDateTime));
}

/** Ordena consultas por horário de início, sem mutar a lista original. */
export function sortAppointmentsByTime(appointments: readonly Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Consultas do dia-calendário LOCAL `todayIso` (`AAAA-MM-DD`), ordenadas por
 * horário. `appointments` deve vir de uma busca já alargada (ex.: uma janela
 * de 3 dias UTC ao redor de `todayIso`, mesma técnica de
 * `fetchSameLocalDayAppointments` em `AgendaPage.tsx`) — esta função só
 * filtra pelo dia-calendário local e ordena, não busca dados.
 */
export function selectTodayAppointments(appointments: readonly Appointment[], todayIso: string): Appointment[] {
  const sameDay = appointments.filter((appointment) => localIsoDate(appointment.startsAt) === todayIso);
  return sortAppointmentsByTime(sameDay);
}

/**
 * Cobranças pendentes ou atrasadas, ordenadas com as atrasadas primeiro e,
 * dentro de cada grupo, por vencimento (mais antigas primeiro). Usa
 * `Charge.status` diretamente (decidido pelo domínio/API) — NÃO recalcula
 * atraso a partir de `dueDate` no cliente, para não divergir do servidor.
 */
export function selectOutstandingCharges(charges: readonly Charge[]): Charge[] {
  const outstanding = charges.filter((charge) => charge.status === "atrasada" || charge.status === "pendente");
  return [...outstanding].sort((a, b) => {
    if (a.status !== b.status) return a.status === "atrasada" ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/** Soma, em centavos inteiros, os valores de uma lista de cobranças. */
export function sumChargeAmounts(charges: readonly Charge[]): number {
  return charges.reduce((total, charge) => total + charge.amount, 0);
}

/**
 * Tarefas não concluídas com vencimento hoje ou atrasado, ordenadas por
 * vencimento (mais antigas — mais atrasadas — primeiro). Tarefas sem
 * `dueDate` e tarefas com vencimento futuro ficam fora do dashboard (o
 * dashboard só mostra a visão do dia). `tasks` deve já vir filtrado por
 * `pending: true` do adapter (ver `TasksReadAdapter.listTasks`), mas esta
 * função também tolera tarefas concluídas na entrada (defensivo).
 */
export function selectDueTasks(tasks: readonly Task[], todayIso: string): Task[] {
  const due = tasks.filter((task) => !task.completedAt && task.dueDate !== undefined && task.dueDate <= todayIso);
  return [...due].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}

/** `true` quando o vencimento da tarefa já passou em relação a `todayIso` (indicação visual de atraso). */
export function isTaskOverdue(task: Task, todayIso: string): boolean {
  return task.dueDate !== undefined && task.dueDate < todayIso;
}

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor em centavos (inteiro) como moeda brasileira (ex.: 25000 → "R$ 250,00"). Duplicado por feature — ver docstring do módulo. */
export function formatCentsAsBRL(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

/** Rótulos pt-BR de `AppointmentStatus`. Duplicado de `APPOINTMENT_STATUS_LABEL` (`src/features/agenda/agenda.ts`) — ver docstring do módulo sobre duplicação deliberada por feature. */
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
};

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

/** Formata só o horário (`HH:mm`) de um `IsoDateTime`, em pt-BR. Duplicado de `formatAppointmentTime` (`src/features/agenda/agenda.ts`). */
export function formatAppointmentTime(isoDateTime: string): string {
  return TIME_FORMATTER.format(new Date(isoDateTime));
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * Formata um `IsoDate` (`AAAA-MM-DD`, sem componente de hora — ex.:
 * `Charge.dueDate`, `Task.dueDate`) como `dd/mm/aaaa` em pt-BR. Constrói a
 * data a partir dos componentes (ano/mês/dia) em vez de `new Date(isoDate)`
 * — mesmo cuidado de fuso de `formatIsoDateLabel` (`src/features/agenda/agenda.ts`).
 */
export function formatIsoDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}
