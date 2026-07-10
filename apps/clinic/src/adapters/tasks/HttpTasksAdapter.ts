import type { Problem, Task, TaskCreateRequest, TaskPage, TaskUpdateRequest } from "@psiops/contracts";

import type { ListTasksParams } from "./TasksReadAdapter";
import type { TasksAdapter } from "./TasksAdapter";
import { TasksAdapterError } from "./TasksAdapterError";

/**
 * Tamanho de página usado na única chamada HTTP feita por `listTasks` —
 * grande o suficiente para cobrir o volume usual de tarefas administrativas
 * de uma psicóloga solo sem paginar de fato (mesma ressalva de
 * `HTTP_CHARGES_PAGE_SIZE`).
 */
export const HTTP_TASKS_PAGE_SIZE = 200;

export interface HttpTasksAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpChargesAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `TasksAdapter`, tipada contra os contratos gerados
 * em `@psiops/contracts`, usando `GET/POST /tasks` e `PUT /tasks/{taskId}`
 * (`operations["listTasks"|"createTask"|"updateTask"]`). SUBSTITUI
 * `HttpTasksReadAdapter` (PSI-032) — ver a nota de reconciliação em
 * `TasksReadAdapter.ts`.
 *
 * RESSALVA (mesmo espírito de `HttpChargesAdapter`): `listTasks` só busca a
 * PRIMEIRA página (`page=0`, `size=HTTP_TASKS_PAGE_SIZE`) — não pagina de
 * fato. Esta tarefa entrega a implementação e sua tipagem, mas não a
 * exercita ponta a ponta contra um backend real (PSI-044), nem é a seleção
 * padrão em todo ambiente (ver `./index.ts`).
 */
export class HttpTasksAdapter implements TasksAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpTasksAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    // `globalThis.fetch` sozinho (sem bind) lança "Illegal invocation" em
    // navegadores reais quando chamado como `this.fetchFn(...)` mais abaixo
    // (perde o receiver `window` que o fetch nativo exige) — só não aparecia
    // nos testes existentes porque todos injetam `fetchFn`, nunca exercitando
    // este default contra um `fetch` de verdade (achado ao rodar a suíte E2E
    // contra o navegador real, PSI-044).
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listTasks(params: ListTasksParams = {}): Promise<Task[]> {
    const query = new URLSearchParams({
      page: String(params.page ?? 0),
      size: String(params.size ?? HTTP_TASKS_PAGE_SIZE),
    });
    if (params.pending !== undefined) query.set("pending", String(params.pending));

    const page = await this.getJson<TaskPage>(`/tasks?${query.toString()}`);
    return page.items;
  }

  async createTask(payload: TaskCreateRequest): Promise<Task> {
    return this.sendJson<Task>("POST", "/tasks", payload);
  }

  async updateTask(taskId: string, payload: TaskUpdateRequest): Promise<Task> {
    return this.sendJson<Task>("PUT", `/tasks/${encodeURIComponent(taskId)}`, payload);
  }

  // --- Internos ---

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, { method: "GET", headers: this.authHeaders() });
    return this.parseResponse<T>(response);
  }

  private async sendJson<T>(method: "POST" | "PUT", path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new TasksAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível completar a operação de tarefas.",
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
