import { HttpTasksReadAdapter } from "./HttpTasksReadAdapter";
import { MockTasksReadAdapter } from "./MockTasksReadAdapter";

export type { ListTasksParams, TasksReadAdapter } from "./TasksReadAdapter";
export { TasksReadAdapterError } from "./TasksReadAdapterError";
export { MockTasksReadAdapter } from "./MockTasksReadAdapter";
export { HTTP_TASKS_READ_PAGE_SIZE, HttpTasksReadAdapter } from "./HttpTasksReadAdapter";

import type { TasksReadAdapter } from "./TasksReadAdapter";

type TasksReadAdapterKind = "mock" | "http";

function readExplicitKind(): TasksReadAdapterKind | undefined {
  const raw = import.meta.env.VITE_TASKS_READ_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `TasksReadAdapter` usar. Único ponto de decisão do app para
 * este adapter — mesmo padrão de `src/adapters/charges/index.ts` (PSI-034) e
 * `src/adapters/appointments/index.ts` (PSI-035):
 *
 * - `VITE_TASKS_READ_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpTasksReadAdapter`; qualquer outro modo (dev/test) usa
 *   `MockTasksReadAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_TASKS_READ_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 */
export function resolveTasksReadAdapterKind(): TasksReadAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createTasksReadAdapter(): TasksReadAdapter {
  const kind = resolveTasksReadAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpTasksReadAdapter({ baseUrl });
  }
  return new MockTasksReadAdapter();
}

/** Instância única do adapter de leitura de tarefas, consumida pelas features. */
export const tasksReadAdapter: TasksReadAdapter = createTasksReadAdapter();
