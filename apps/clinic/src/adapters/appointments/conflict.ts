import type { Appointment, AppointmentStatus } from "@psiops/contracts";

/**
 * Regra ÚNICA de sobreposição de horário (PSI-035), usada tanto pela
 * validação client-side (antes de submeter criação/remarcação) quanto por
 * `MockAgendaAdapter` (para reproduzir o 409 de conflito da API real, ver
 * `operations["createAppointment"]`/`operations["updateAppointment"]` em
 * `@psiops/contracts`). Centralizar aqui é a mitigação do risco do manifesto:
 * "regra de sobreposição divergente entre client, mock e API real gera
 * comportamento inconsistente na integração".
 *
 * `HttpAgendaAdapter` não usa esta função para DECIDIR o 409 (quem decide é
 * a API real, PSI-024) — mas o mesmo par (`AppointmentTimeRange`,
 * `findConflictingAppointment`) é usado pela camada de features para
 * localizar, na lista já carregada, qual consulta é a conflitante a exibir,
 * tanto no caminho de validação prévia quanto depois de receber um 409.
 */
export interface AppointmentTimeRange {
  startsAt: string;
  durationMinutes: number;
}

/**
 * Status que efetivamente "ocupam" um horário na agenda. Consultas
 * `cancelada` ou `remarcada` liberaram o horário original — não bloqueiam
 * novas consultas no mesmo intervalo (assumption desta tarefa, consistente
 * com o histórico da PSI-034, onde consultas canceladas/remarcadas
 * continuam existindo como registro, mas não como compromisso ativo).
 */
export const BLOCKING_APPOINTMENT_STATUSES: readonly AppointmentStatus[] = ["agendada", "realizada"];

/** `true` quando os dois intervalos `[startsAt, startsAt + durationMinutes)` se sobrepõem. */
export function appointmentsOverlap(a: AppointmentTimeRange, b: AppointmentTimeRange): boolean {
  const aStart = Date.parse(a.startsAt);
  const aEnd = aStart + a.durationMinutes * 60_000;
  const bStart = Date.parse(b.startsAt);
  const bEnd = bStart + b.durationMinutes * 60_000;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Procura, entre `existing`, uma consulta "ativa" (`BLOCKING_APPOINTMENT_STATUSES`)
 * que se sobreponha a `candidate`. `excludeAppointmentId` evita que uma
 * consulta conflite consigo mesma ao remarcar (a própria linha, com seu
 * horário antigo, ainda está em `existing` até a atualização ser aplicada).
 * `undefined` quando não há conflito.
 */
export function findConflictingAppointment(
  candidate: AppointmentTimeRange,
  existing: readonly Appointment[],
  excludeAppointmentId?: string,
): Appointment | undefined {
  return existing.find(
    (appointment) =>
      appointment.id !== excludeAppointmentId &&
      BLOCKING_APPOINTMENT_STATUSES.includes(appointment.status) &&
      appointmentsOverlap(candidate, appointment),
  );
}
