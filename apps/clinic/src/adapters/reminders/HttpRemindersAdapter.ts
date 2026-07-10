import type { Problem, Reminder, ReminderCreateRequest, ReminderPage } from "@psiops/contracts";

import type { ListRemindersParams, RemindersAdapter } from "./RemindersAdapter";
import { RemindersAdapterError } from "./RemindersAdapterError";

/**
 * Tamanho de página usado na única chamada HTTP feita por `listReminders` —
 * grande o suficiente para cobrir o volume usual de lembretes administrativos
 * de uma psicóloga solo sem paginar de fato (mesma ressalva de
 * `HTTP_TASKS_PAGE_SIZE`/`HTTP_CHARGES_PAGE_SIZE`).
 */
export const HTTP_REMINDERS_PAGE_SIZE = 200;

export interface HttpRemindersAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpTasksAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Erro lançado por `HttpRemindersAdapter.cancelReminder` — o contrato REST
 * hoje não expõe um endpoint para cancelar um lembrete já criado (só
 * `GET`/`POST /reminders`). Mesmo espírito de `ChargesAdapterUnsupportedError`
 * (`src/adapters/charges/HttpChargesAdapter.ts`, PSI-037): a implementação
 * HTTP completa depende da extensão do contrato (ver open_question do PR
 * desta tarefa); `MockRemindersAdapter` sustenta o cancelamento até lá.
 */
export class RemindersAdapterUnsupportedError extends Error {
  constructor(method: string) {
    super(
      `HttpRemindersAdapter.${method}: ainda não há endpoint no contrato (packages/contracts) para cancelar um ` +
        "lembrete já criado — apenas GET/POST /reminders existem hoje. Ver open_question do PR da PSI-038; a " +
        "implementação HTTP completa depende da extensão do contrato (ex.: DELETE /reminders/{reminderId}).",
    );
    this.name = "RemindersAdapterUnsupportedError";
  }
}

/**
 * Implementação HTTP de `RemindersAdapter`, tipada contra os contratos
 * gerados em `@psiops/contracts`, usando `GET/POST /reminders`
 * (`operations["listReminders"|"createReminder"]`).
 *
 * RESSALVAS:
 * 1. `listReminders` só busca a PRIMEIRA página (`page=0`,
 *    `size=HTTP_REMINDERS_PAGE_SIZE`) — não pagina de fato (mesma ressalva
 *    de `HttpTasksAdapter`/`HttpChargesAdapter`).
 * 2. `cancelReminder` lança `RemindersAdapterUnsupportedError` — ver a doc
 *    da classe acima.
 *
 * Mesma ressalva de `HttpTasksAdapter`/`HttpChargesAdapter`: esta tarefa
 * entrega a implementação e sua tipagem, mas não a exercita ponta a ponta
 * contra um backend real (PSI-044), nem é a seleção padrão em todo ambiente
 * (ver `./index.ts`).
 */
export class HttpRemindersAdapter implements RemindersAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpRemindersAdapterOptions) {
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

  async listReminders(params: ListRemindersParams = {}): Promise<Reminder[]> {
    const query = new URLSearchParams({ page: "0", size: String(HTTP_REMINDERS_PAGE_SIZE) });
    if (params.patientId) query.set("patientId", params.patientId);
    if (params.status) query.set("status", params.status);

    const page = await this.getJson<ReminderPage>(`/reminders?${query.toString()}`);
    return page.items;
  }

  async createReminder(payload: ReminderCreateRequest): Promise<Reminder> {
    const response = await this.fetchFn(`${this.baseUrl}/reminders`, {
      method: "POST",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this.parseResponse<Reminder>(response);
  }

  async cancelReminder(reminderId: string): Promise<Reminder> {
    void reminderId;
    throw new RemindersAdapterUnsupportedError("cancelReminder");
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

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new RemindersAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível completar a operação de lembretes.",
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
