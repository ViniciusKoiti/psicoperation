import type { Appointment, AttendanceRecord } from "@psiops/contracts";

/**
 * Consulta do histórico de um paciente já combinada com o registro
 * administrativo de presença, quando existir. NÃO é um schema novo do
 * contrato — é só a composição de leitura que a tela de detalhe do
 * paciente (PSI-034) precisa; `appointment` e `attendance` continuam
 * tipados 1:1 pelos DTOs gerados em `@psiops/contracts` (mesmo espírito de
 * `ListPatientsParams` em `src/adapters/patients/PatientsAdapter.ts`: uma
 * composição de parâmetro/retorno, não uma redeclaração de DTO).
 */
export interface AppointmentHistoryEntry {
  appointment: Appointment;
  /**
   * Registro administrativo de presença desta consulta (`PUT
   * /appointments/{id}/attendance`, escrita — PSI-036), quando já foi
   * lançado. `undefined` quando a consulta ainda não teve presença
   * registrada (ex.: consultas futuras, ou passadas ainda não processadas).
   *
   * AUSÊNCIA PROPOSITAL DE DADOS CLÍNICOS: `AttendanceRecord` (contrato) só
   * guarda presença administrativa e uma anotação administrativa livre —
   * nunca diagnóstico, evolução, queixa ou conduta (restrição inviolável,
   * CLAUDE.md).
   */
  attendance?: AttendanceRecord;
}

/**
 * Interface de LEITURA mínima de consultas, criada por esta tarefa
 * (PSI-034) porque a tela completa de agenda (PSI-035) ainda não existe.
 * Cobre exatamente o que o detalhe do paciente precisa: todo o histórico
 * (passado e futuro) de UM paciente, sem paginação. A ordenação "mais
 * recente primeiro" (critério de aceite da PSI-034) é responsabilidade da
 * camada de apresentação (ver `sortAppointmentsDescending` em
 * `src/features/patients/patientDetail.ts`), não deste adapter.
 *
 * PROJETADA PARA SER ESTENDIDA PELA PSI-035 — o que esta interface
 * deliberadamente NÃO cobre, e fica para a tela de agenda decidir como
 * adicionar (extensão desta interface, ou uma nova ao lado dela no mesmo
 * módulo `src/adapters/appointments/**`):
 * - listagem da agenda inteira (todos os pacientes, intervalo de datas,
 *   paginação) — o contrato já expõe `GET /appointments` com esses filtros
 *   (`operations["listAppointments"]`), mas esta interface só usa o filtro
 *   por `patientId`, sem paginar;
 * - criação, remarcação e cancelamento de consulta (`POST /appointments`,
 *   `PUT`/`DELETE /appointments/{id}`);
 * - registro de presença administrativa (`PUT /appointments/{id}/attendance`
 *   — escrita, PSI-036). Esta interface é só LEITURA: no mock, o "registro
 *   administrativo" já vem pronto no seed; no HTTP, hoje NÃO HÁ endpoint de
 *   leitura de presença no contrato (só `PUT`, sem `GET`) — ver a ressalva
 *   detalhada em `HttpAppointmentsReadAdapter` e o open_question do PR desta
 *   tarefa.
 *
 * Implementações: `MockAppointmentsReadAdapter` (estado em memória, padrão
 * em desenvolvimento e testes) e `HttpAppointmentsReadAdapter` (tipada pelo
 * contrato). Ponto de composição único (seleção mock/http por variável de
 * ambiente) em `./index.ts`, mesmo padrão de `src/adapters/patients`.
 */
export interface AppointmentsReadAdapter {
  /**
   * Todo o histórico de consultas de um paciente (passadas e futuras), em
   * qualquer ordem retornada pelo adapter — a ordenação para exibição é
   * resolvida pela camada de apresentação. Paciente sem nenhuma consulta
   * (ou inexistente) resolve com lista vazia, nunca rejeita.
   */
  listAppointmentsByPatient(patientId: string): Promise<AppointmentHistoryEntry[]>;
}
