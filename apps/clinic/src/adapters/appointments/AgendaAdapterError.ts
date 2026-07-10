/**
 * Erro de acesso a dados de agenda/consultas (PSI-035), levantado por
 * `MockAgendaAdapter` e `HttpAgendaAdapter`. Substitui
 * `AppointmentsReadAdapterError` (PSI-034, escopo só-leitura) agora que o
 * adapter cobre todo o ciclo de vida da consulta — ver a reconciliação
 * descrita no PR desta tarefa. Modela o suficiente do RFC 9457 (`Problem`,
 * `@psiops/contracts`) para a camada de features decidir o que fazer sem
 * depender de detalhes de transporte: `status` segue os códigos HTTP
 * documentados no contrato (400/401/404/409/500) — mesmo padrão de
 * `PatientsAdapterError` (`src/adapters/patients/PatientsAdapterError.ts`).
 */
export class AgendaAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AgendaAdapterError";
    this.status = status;
  }
}

/**
 * Mensagem pt-BR de conflito de horário (409), compartilhada pelos dois
 * lados da paridade exigida pelo manifesto:
 *
 * - `MockAgendaAdapter` lança sempre com esta mensagem quando
 *   `findConflictingAppointment` (`./conflict.ts`) encontra sobreposição —
 *   é a "mesma regra" que a API real (PSI-024) aplica no servidor.
 * - `HttpAgendaAdapter` usa o `detail`/`title` do `Problem` devolvido pela
 *   API quando presente (texto autoral do backend); só cai para esta mesma
 *   constante se o corpo do 409 vier vazio/ilegível.
 *
 * Ou seja: a paridade garantida é "mesmo tipo de erro (`AgendaAdapterError`)
 * e mesmo `status` (409) para a mesma condição de negócio" — não
 * necessariamente o mesmo byte a byte de texto, já que o texto do HTTP em
 * uso real vem do servidor. A camada de features nunca precisa inspecionar
 * o texto para decidir o que fazer: usa `isAgendaConflictError`.
 */
export const AGENDA_CONFLICT_MESSAGE =
  "Este horário conflita com outra consulta já agendada. Escolha outro horário ou veja a consulta existente.";

/** `true` quando o erro representa conflito de horário (409, sobreposição). */
export function isAgendaConflictError(error: unknown): error is AgendaAdapterError {
  return error instanceof AgendaAdapterError && error.status === 409;
}

/** `true` quando o erro representa "consulta não encontrada" (404). */
export function isAgendaNotFoundError(error: unknown): error is AgendaAdapterError {
  return error instanceof AgendaAdapterError && error.status === 404;
}
