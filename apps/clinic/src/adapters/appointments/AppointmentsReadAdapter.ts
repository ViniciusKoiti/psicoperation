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
  /**
   * Instante ISO 8601 em que este registro administrativo foi CRIADO pela
   * primeira vez — preservado em edições subsequentes (critério de aceite
   * da PSI-036: "edição preserva o timestamp de criação"). Metadado de
   * COMPOSIÇÃO local, não parte do contrato: `AttendanceRecord` não modela
   * criação/atualização separadamente, só `recordedAt`. Rastreado apenas
   * por `MockAgendaAdapter` (estado em memória); `HttpAgendaAdapter` não
   * tem como preenchê-lo — o contrato não expõe leitura de metadado de
   * presença (mesma ressalva 2 de `HttpAgendaAdapter`) — então vem sempre
   * `undefined` nesse caso. Ressalva aceita e documentada: esta tarefa não
   * exercita HTTP ponta a ponta (PSI-044).
   */
  attendanceCreatedAt?: string;
  /**
   * Instante ISO 8601 da última edição do registro administrativo (igual a
   * `attendanceCreatedAt` na criação, atualizado a cada edição). Mesma
   * ressalva de rastreio de `attendanceCreatedAt` acima.
   */
  attendanceUpdatedAt?: string;
}

/**
 * Interface de LEITURA mínima de consultas, criada pela PSI-034 porque a
 * tela completa de agenda (PSI-035) ainda não existia. Cobre exatamente o
 * que o detalhe do paciente precisa: todo o histórico (passado e futuro) de
 * UM paciente, sem paginação. A ordenação "mais recente primeiro" (critério
 * de aceite da PSI-034) é responsabilidade da camada de apresentação (ver
 * `sortAppointmentsDescending` em `src/features/patients/patientDetail.ts`),
 * não deste adapter.
 *
 * ESTENDIDA PELA PSI-035 (ver `AgendaAdapter`, neste mesmo módulo): a agenda
 * completa (listagem por intervalo de datas entre pacientes, criação,
 * remarcação, cancelamento e série recorrente) virou uma interface própria
 * que ESTENDE esta aqui, em vez de coexistir com ela — `MockAgendaAdapter` e
 * `HttpAgendaAdapter` (PSI-035) substituíram
 * `MockAppointmentsReadAdapter`/`HttpAppointmentsReadAdapter` (PSI-034) como
 * única implementação de dados de consultas do app; esta interface
 * (`AppointmentsReadAdapter`) continua existindo e sendo exportada porque é
 * exatamente o subconjunto que `PatientDetailPage` (PSI-034) consome — só a
 * instância por trás dela mudou (`agendaAdapter`, PSI-035, em vez de
 * `appointmentsReadAdapter`, PSI-034).
 *
 * Presença administrativa em ESCRITA (`PUT /appointments/{id}/attendance`)
 * é PSI-036: ver `AgendaAdapter.recordAttendance`, que estende esta
 * interface com o método de escrita em vez de duplicar `AppointmentsReadAdapter`
 * — a leitura (`attendance` em `AppointmentHistoryEntry`) continua daqui, só
 * a escrita é nova. No mock, o "registro administrativo" já vem pronto no
 * seed OU é lançado por `recordAttendance`; no HTTP, hoje NÃO HÁ endpoint de
 * leitura de presença no contrato (só `PUT`, sem `GET`) — ver a ressalva
 * detalhada em `HttpAgendaAdapter` e o open_question do PR da PSI-034.
 *
 * Implementações: `MockAgendaAdapter` (estado em memória, padrão em
 * desenvolvimento e testes) e `HttpAgendaAdapter` (tipada pelo contrato).
 * Ponto de composição único (seleção mock/http por variável de ambiente) em
 * `./index.ts`, mesmo padrão de `src/adapters/patients`.
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
