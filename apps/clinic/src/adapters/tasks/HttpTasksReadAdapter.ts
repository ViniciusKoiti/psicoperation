import type { Problem, Task, TaskPage } from "@psiops/contracts";

import type { ListTasksParams, TasksReadAdapter } from "./TasksReadAdapter";
import { TasksReadAdapterError } from "./TasksReadAdapterError";

/**
 * Tamanho de página usado na única chamada HTTP feita por `listTasks` —
 * grande o suficiente para cobrir o volume usual de tarefas administrativas
 * de uma psicóloga solo sem paginar de fato. PSI-038, ao construir a tela
 * completa de tarefas, deve revisar isso (mesma ressalva de
 * `HTTP_CHARGES_READ_PAGE_SIZE`).
 */
export const HTTP_TASKS_READ_PAGE_SIZE = 200;

export interface HttpTasksReadAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpChargesReadAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `TasksReadAdapter`, tipada contra os contratos
 * gerados em `@psiops/contracts`, usando `GET /tasks`
 * (`operations["listTasks"]`).
 *
 * RESSALVA (mesmo espírito de `HttpChargesReadAdapter`): só busca a PRIMEIRA
 * página (`page=0`, `size=HTTP_TASKS_READ_PAGE_SIZE`) — não pagina de fato.
 * Para o dashboard (PSI-032) isso cobre o uso normal; PSI-038, ao estender
 * esta interface para a tela completa de tarefas, deve decidir se precisa
 * paginar de verdade.
 *
 * Mesma ressalva de `HttpChargesReadAdapter`/`HttpPatientsAdapter`: esta
 * tarefa entrega a implementação e sua tipagem, mas não a exercita ponta a
 * ponta contra um backend real (PSI-044), nem é a seleção padrão em todo
 * ambiente (ver `./index.ts`).
 */
export class HttpTasksReadAdapter implements TasksReadAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpTasksReadAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listTasks(params: ListTasksParams = {}): Promise<Task[]> {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? HTTP_TASKS_READ_PAGE_SIZE),
    });
    if (params.pending !== undefined) query.set("pending", String(params.pending));

    const response = await this.fetchFn(`${this.baseUrl}/tasks?${query.toString()}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    const page = await this.parseResponse<TaskPage>(response);
    return page.items;
  }

  // --- Internos ---

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new TasksReadAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível carregar as tarefas.",
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  private async tryParseProblem(response: Response): Promise<Problem | undefined> {
    try {
      return (await response.json()) as Problem;
    } catch {
      return undefined;
    }
  }
}
