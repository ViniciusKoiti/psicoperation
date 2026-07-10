/**
 * Erro de acesso a dados de tarefas, levantado por `MockTasksAdapter` e
 * `HttpTasksAdapter`. SUBSTITUI `TasksReadAdapterError` (PSI-032, escopo
 * só-leitura) agora que o adapter cobre criação, edição, conclusão e
 * reabertura (PSI-038) — mesma reconciliação de `ChargesAdapterError`
 * (PSI-037) sobre `ChargesReadAdapterError`. Modela o suficiente do
 * RFC 9457 (`Problem`, `@psiops/contracts`) para a camada de features
 * decidir o que fazer sem depender de detalhes de transporte.
 */
export class TasksAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TasksAdapterError";
    this.status = status;
  }
}

/** `true` quando o erro representa "tarefa não encontrada" (404). */
export function isTaskNotFoundError(error: unknown): error is TasksAdapterError {
  return error instanceof TasksAdapterError && error.status === 404;
}
