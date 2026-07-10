/**
 * Erro de acesso a dados de tarefas (leitura), levantado por
 * `HttpTasksReadAdapter`. Modela o suficiente do RFC 9457 (`Problem`, ver
 * `@psiops/contracts`) para a camada de features decidir o que fazer sem
 * depender de detalhes de transporte — mesmo padrão de `ChargesReadAdapterError`
 * (`src/adapters/charges/ChargesReadAdapterError.ts`, PSI-034).
 */
export class TasksReadAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TasksReadAdapterError";
    this.status = status;
  }
}
