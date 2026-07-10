import type { Appointment, AppointmentCreateRequest, AttendanceRecord } from "@psiops/contracts";

import type { AppointmentsReadAdapter } from "./AppointmentsReadAdapter";
import type { WeeklySeriesBounds } from "./recurrence";

/**
 * Parâmetros de listagem por intervalo de datas — espelham os filtros de
 * `operations["listAppointments"]` (`from`/`to`/`patientId`) em
 * `@psiops/contracts`. Sem paginação exposta ao chamador: as visões semanal
 * e diária desta tarefa sempre cobrem um intervalo curto (um dia ou uma
 * semana), então uma única página grande o bastante (ver
 * `HTTP_AGENDA_PAGE_SIZE` em `HttpAgendaAdapter`) é suficiente — mesmo
 * espírito da ressalva 1 de `HttpAppointmentsReadAdapter` (PSI-034).
 */
export interface ListAppointmentsRangeParams {
  /** Início do intervalo (inclusive), `IsoDate` (`AAAA-MM-DD`). */
  from: string;
  /** Fim do intervalo (inclusive), `IsoDate` (`AAAA-MM-DD`). */
  to: string;
  /** Filtra por paciente (opcional). */
  patientId?: string;
}

/**
 * Payload de remarcação: novo horário e, opcionalmente, nova duração.
 * Preserva o vínculo com o paciente e o identificador da consulta (mesma
 * linha, via `PUT /appointments/{id}`) — é isso que "remarcar preservando o
 * vínculo" (critério de aceite do manifesto) significa: a consulta continua
 * sendo a mesma entidade, só muda quando ela acontece.
 */
export interface RescheduleAppointmentInput {
  startsAt: string;
  durationMinutes?: number;
}

/**
 * Payload de criação de uma série semanal simples (critério de aceite do
 * manifesto): primeira ocorrência + duração + critério de parada
 * (`WeeklySeriesBounds`, de `./recurrence.ts`). Deliberadamente NÃO usa o
 * campo opcional `recurrence` (`WeeklyRecurrence`) de
 * `AppointmentCreateRequest` — ver a justificativa em
 * `createAppointmentSeries.ts`: cada ocorrência é submetida como uma
 * consulta avulsa independente, para que o conflito de cada uma seja
 * detectado e reportado isoladamente (não dá para saber, a partir de uma
 * única resposta de `POST /appointments`, quais ocorrências futuras de uma
 * regra de recorrência enviada ao servidor conflitariam).
 */
export type CreateAppointmentSeriesInput = {
  patientId: string;
  /** Primeira ocorrência da série. */
  startsAt: string;
  durationMinutes: number;
} & WeeklySeriesBounds;

export type AppointmentSeriesOccurrenceOutcome = "created" | "conflict";

export interface AppointmentSeriesOccurrenceResult {
  startsAt: string;
  outcome: AppointmentSeriesOccurrenceOutcome;
  /** Presente quando `outcome === "created"`. */
  appointment?: Appointment;
}

export interface CreateAppointmentSeriesResult {
  occurrences: AppointmentSeriesOccurrenceResult[];
}

/**
 * Interface completa de agenda (PSI-035): listar por intervalo de datas,
 * criar, remarcar, cancelar e criar uma série semanal simples.
 *
 * RECONCILIAÇÃO COM A PSI-034: esta interface ESTENDE
 * `AppointmentsReadAdapter` (a interface de leitura por paciente criada pela
 * PSI-034 para a tela de detalhe do paciente) em vez de coexistir com ela.
 * `MockAgendaAdapter`/`HttpAgendaAdapter` SUBSTITUEM
 * `MockAppointmentsReadAdapter`/`HttpAppointmentsReadAdapter` como única
 * implementação de dados de consultas do app — dois adapters concorrentes
 * mantendo estado (mock) ou lendo a mesma API (http) de formas
 * potencialmente divergentes era exatamente o risco que a PSI-034 já
 * antecipava na doc de `AppointmentsReadAdapter` ("PROJETADA PARA SER
 * ESTENDIDA PELA PSI-035"). `PatientDetailPage` (PSI-034) passa a consumir
 * `agendaAdapter` (`./index.ts`) através do mesmo tipo `AppointmentsReadAdapter`
 * — nenhuma mudança de contrato para aquela tela, só a troca de instância.
 *
 * Implementações: `MockAgendaAdapter` (estado em memória, padrão em
 * desenvolvimento e testes) e `HttpAgendaAdapter` (tipada pelo contrato,
 * sem exercício ponta a ponta nesta tarefa — PSI-044). Ponto de composição
 * único em `./index.ts`.
 */
export interface AgendaAdapter extends AppointmentsReadAdapter {
  /** `GET /appointments` filtrado por intervalo de datas (e, opcionalmente, paciente). */
  listAppointments(params: ListAppointmentsRangeParams): Promise<Appointment[]>;

  /**
   * `POST /appointments`. Lança `AgendaAdapterError` com `status: 409`
   * (`isAgendaConflictError`) quando o horário se sobrepõe a outra consulta
   * ativa — a mesma condição que a validação client-side deveria ter
   * detectado antes de chamar este método; ver `findConflictingAppointment`
   * (`./conflict.ts`).
   */
  createAppointment(payload: AppointmentCreateRequest): Promise<Appointment>;

  /** `PUT /appointments/{id}` só com horário/duração. Mesmo 409 de conflito que `createAppointment`. */
  rescheduleAppointment(appointmentId: string, payload: RescheduleAppointmentInput): Promise<Appointment>;

  /** `DELETE /appointments/{id}` — cancela (a consulta permanece no histórico com `status: "cancelada"`, nunca é removida). Confirmação é responsabilidade da UI. */
  cancelAppointment(appointmentId: string): Promise<void>;

  /**
   * Materializa uma série semanal simples em consultas individuais (ver
   * `CreateAppointmentSeriesInput`). Conflito parcial: ocorrências livres são
   * criadas; ocorrências conflitantes voltam com `outcome: "conflict"` no
   * resultado, sem abortar as demais (assumption do manifesto). Qualquer
   * erro que não seja conflito de horário (rede, 500) propaga e interrompe
   * a série.
   */
  createAppointmentSeries(input: CreateAppointmentSeriesInput): Promise<CreateAppointmentSeriesResult>;

  /**
   * `PUT /appointments/{id}/attendance` (PSI-036): registra o desfecho
   * ADMINISTRATIVO de uma consulta — presença (`compareceu`), falta
   * (`faltou`) ou remarcação (`remarcada`) — mais uma anotação
   * administrativa curta opcional (`AttendanceRecord.administrativeNotes`,
   * NUNCA conteúdo clínico — restrição inviolável, CLAUDE.md). Chamar de
   * novo para a MESMA consulta EDITA o registro existente (mesmo endpoint
   * idempotente do contrato); `MockAgendaAdapter` preserva o timestamp de
   * criação e marca o de atualização nesse caso (ver
   * `AppointmentHistoryEntry.attendanceCreatedAt`/`attendanceUpdatedAt`).
   *
   * Reconciliação do enum de status (risco antecipado pelo manifesto):
   * `AppointmentStatus` (contrato) não tem um valor "faltou" — só
   * `agendada | realizada | cancelada | remarcada`. Presença OU falta
   * atualizam `Appointment.status` para `"realizada"` (o horário ocorreu,
   * independente do comparecimento; a presença/falta em si vive só em
   * `AttendanceRecord.attendance`) — convenção já usada pelo seed de
   * `MockAgendaAdapter` desde a PSI-034/035. Remarcação atualiza o status
   * para `"remarcada"`.
   *
   * Devolve a consulta atualizada — é o retorno do contrato
   * (`Appointment`, não `AttendanceRecord`). Lança `AgendaAdapterError` com
   * `status: 404` quando a consulta não existe (`isAgendaNotFoundError`).
   */
  recordAttendance(appointmentId: string, payload: AttendanceRecord): Promise<Appointment>;
}
