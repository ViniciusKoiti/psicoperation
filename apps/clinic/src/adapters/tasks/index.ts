import { HttpTasksAdapter } from "./HttpTasksAdapter";
import { MockTasksAdapter } from "./MockTasksAdapter";

export type { ListTasksParams, TasksReadAdapter } from "./TasksReadAdapter";
export type { TasksAdapter } from "./TasksAdapter";
export { isTaskNotFoundError, TasksAdapterError } from "./TasksAdapterError";
export { MockTasksAdapter, type MockTasksAdapterOptions } from "./MockTasksAdapter";
export { HTTP_TASKS_PAGE_SIZE, HttpTasksAdapter } from "./HttpTasksAdapter";

import type { TasksAdapter } from "./TasksAdapter";

type TasksAdapterKind = "mock" | "http";

function readExplicitKind(): TasksAdapterKind | undefined {
  const raw = import.meta.env.VITE_TASKS_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `TasksAdapter` usar. Único ponto de decisão do app para este
 * adapter — mesmo padrão de `src/adapters/charges/index.ts` (PSI-037):
 *
 * - `VITE_TASKS_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpTasksAdapter`; qualquer outro modo (dev/test) usa `MockTasksAdapter`.
 *
 * Produção só ativa o mock se alguém setar `VITE_TASKS_ADAPTER=mock`
 * explicitamente — nunca por padrão (ADR 0006).
 *
 * Substitui `VITE_TASKS_READ_ADAPTER` (PSI-032): a variável de ambiente muda
 * de nome porque este adapter deixou de ser só-leitura — ver a
 * reconciliação documentada em `TasksReadAdapter.ts` (mesmo padrão de
 * `VITE_CHARGES_ADAPTER`, PSI-037).
 */
export function resolveTasksAdapterKind(): TasksAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createTasksAdapter(): TasksAdapter {
  const kind = resolveTasksAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpTasksAdapter({ baseUrl });
  }
  return new MockTasksAdapter();
}

/**
 * Instância única do adapter de tarefas, consumida pelas features (substitui
 * `tasksReadAdapter` da PSI-032 — `DashboardPage` passou a consumir esta
 * instância através do mesmo tipo `TasksReadAdapter`, sem mudança de
 * contrato para essa tela).
 */
export const tasksAdapter: TasksAdapter = createTasksAdapter();
