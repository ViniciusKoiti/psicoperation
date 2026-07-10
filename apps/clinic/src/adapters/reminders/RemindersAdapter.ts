import type { Reminder, ReminderCreateRequest, ReminderStatus } from "@psiops/contracts";

/**
 * Parâmetros de `listReminders` — espelham o `query` de
 * `operations["listReminders"]` em `@psiops/contracts` (`patientId`,
 * `status`), sem paginação exposta ao chamador (mesmo espírito de
 * `ListAppointmentsRangeParams`, `src/adapters/appointments/AgendaAdapter.ts`:
 * o volume de lembretes de uma psicóloga solo não justifica paginação real
 * na tela de lembretes desta tarefa).
 */
export interface ListRemindersParams {
  /** Filtra por paciente vinculado (via consulta ou cobrança). */
  patientId?: string;
  /** Filtra por situação do lembrete. Sem filtro, retorna lembretes de todas as situações. */
  status?: ReminderStatus;
}

/**
 * Interface de lembretes administrativos (PSI-038): lembrete de sessão
 * (vinculado a uma consulta) ou lembrete de pagamento (vinculado a uma
 * cobrança/mensalidade), canal email no MVP (`ReminderChannel`, contrato).
 * A usuária configura antecedência (embutida em `scheduledFor`, calculado
 * pela camada de apresentação — ver `computeScheduledFor`,
 * `src/features/reminders/reminders.ts`) e ativação individual por
 * lembrete; o adapter só registra a INTENÇÃO de envio (`createReminder`) —
 * o disparo real de email é responsabilidade do backend/automação
 * (PSI-029, deadlines Axon), fora do escopo desta tarefa. Nenhum conteúdo
 * clínico: os templates de assunto/corpo são estritamente administrativos
 * (data, horário, valor — ver `buildSessionReminderContent`/
 * `buildPaymentReminderContent`).
 *
 * "Ativação/desativação individual" (critério de aceite do manifesto): um
 * lembrete recém-criado nasce `"agendado"`; desativá-lo cancela o
 * agendamento (`cancelReminder`) — não há reativação (mesmo espírito de
 * "email cancelado não volta", coerente com o mundo real: para reagendar, a
 * usuária cria um novo lembrete). RESSALVA (ver open_question do PR): o
 * contrato REST hoje NÃO expõe um endpoint para cancelar um lembrete já
 * criado (só `GET`/`POST /reminders`) — `MockRemindersAdapter` sustenta o
 * cancelamento em memória (mesmo espírito de
 * `ChargesAdapter.undoChargePayment`, PSI-037);
 * `HttpRemindersAdapter.cancelReminder` lança
 * `RemindersAdapterUnsupportedError` até o contrato ganhar um endpoint
 * equivalente.
 *
 * Implementações: `MockRemindersAdapter` (estado em memória, padrão em
 * desenvolvimento e testes — simula o agendamento e expõe as transições de
 * estado agendado/enviado/falhou/cancelado) e `HttpRemindersAdapter`
 * (tipada pelo contrato). Ponto de composição único (seleção mock/http por
 * variável de ambiente) em `./index.ts`, mesmo padrão dos demais adapters.
 */
export interface RemindersAdapter {
  /** `GET /reminders`, com filtros opcionais de paciente/status. Sem lembretes cadastrados (ou nenhum no filtro) resolve com lista vazia, nunca rejeita. */
  listReminders(params?: ListRemindersParams): Promise<Reminder[]>;

  /**
   * `POST /reminders`: registra a intenção de um lembrete (canal email),
   * vinculado a uma consulta (`appointmentId`) ou a uma cobrança
   * (`chargeId`) — ver `ReminderCreateRequest` (contrato: os vínculos são
   * opcionais e independentes, mas a tela desta tarefa sempre informa
   * exatamente um dos dois). Nasce com `status: "agendado"`.
   */
  createReminder(payload: ReminderCreateRequest): Promise<Reminder>;

  /**
   * Cancela um lembrete `"agendado"` (desativação individual — ver a doc da
   * interface acima). Lança `RemindersAdapterError` com `status: 404`
   * (`isReminderNotFoundError`) se o lembrete não existir, e `status: 409`
   * (`isReminderNotCancellableError`) se ele já não estiver `"agendado"`
   * (já enviado, já falhou, ou já cancelado).
   */
  cancelReminder(reminderId: string): Promise<Reminder>;
}
