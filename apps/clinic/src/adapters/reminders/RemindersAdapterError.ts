/**
 * Erro de acesso a dados de lembretes, levantado por `MockRemindersAdapter`
 * e `HttpRemindersAdapter`. Modela o suficiente do RFC 9457 (`Problem`,
 * `@psiops/contracts`) para a camada de features decidir o que fazer sem
 * depender de detalhes de transporte — mesmo padrão de `TasksAdapterError`/
 * `ChargesAdapterError`.
 */
export class RemindersAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RemindersAdapterError";
    this.status = status;
  }
}

/** `true` quando o erro representa "lembrete não encontrado" (404). */
export function isReminderNotFoundError(error: unknown): error is RemindersAdapterError {
  return error instanceof RemindersAdapterError && error.status === 404;
}

/** `true` quando o erro representa "lembrete não está mais agendado, não pode ser cancelado" (409). */
export function isReminderNotCancellableError(error: unknown): error is RemindersAdapterError {
  return error instanceof RemindersAdapterError && error.status === 409;
}
