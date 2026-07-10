import type { Charge, ChargePage, Problem, RegisterPaymentRequest } from "@psiops/contracts";

import type { ChargeDraft, ChargesAdapter, GenerateMonthlyChargesResult } from "./ChargesAdapter";
import { CHARGE_ALREADY_EXISTS_MESSAGE, CHARGE_ALREADY_PAID_MESSAGE, ChargesAdapterError, isChargeAlreadyExistsError } from "./ChargesAdapterError";
import type { ListChargesParams } from "./ChargesReadAdapter";

/**
 * Tamanho de página usado nas chamadas de listagem — grande o suficiente
 * para cobrir o histórico usual de UM paciente ou a competência de UM mês
 * sem paginar de fato. Herda a mesma ressalva de `HTTP_CHARGES_READ_PAGE_SIZE`
 * (PSI-034): PSI-037/PSI-044 devem revisar isso ao integrar contra um
 * backend real com volume maior.
 */
export const HTTP_CHARGES_PAGE_SIZE = 200;

export interface HttpChargesAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpPatientsAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Erro lançado por `HttpChargesAdapter.undoChargePayment` — o contrato REST
 * hoje não expõe um endpoint para desfazer um pagamento já registrado (só
 * `POST /charges/{id}/payment`, que avança o estado). Mesmo espírito de
 * `SettingsAdapterUnsupportedError` (`src/adapters/settings/HttpSettingsAdapter.ts`,
 * PSI-031): a implementação HTTP completa depende da extensão do contrato
 * (ver open_question do PR desta tarefa); `MockChargesAdapter` sustenta o
 * "desfazer" da tela de financeiro até lá.
 */
export class ChargesAdapterUnsupportedError extends Error {
  constructor(method: string) {
    super(
      `HttpChargesAdapter.${method}: ainda não há endpoint no contrato (packages/contracts) para desfazer um ` +
        "pagamento já registrado — apenas POST /charges/{chargeId}/payment (avança o estado) existe hoje. Ver " +
        "open_question do PR da PSI-037; a implementação HTTP completa depende da extensão do contrato (ex.: " +
        "DELETE /charges/{chargeId}/payment).",
    );
    this.name = "ChargesAdapterUnsupportedError";
  }
}

/**
 * Implementação HTTP de `ChargesAdapter`, tipada contra os contratos
 * gerados em `@psiops/contracts`, usando `GET/POST /charges` e
 * `POST /charges/{chargeId}/payment`. SUBSTITUI `HttpChargesReadAdapter`
 * (PSI-034/032) — ver a nota de reconciliação em `ChargesReadAdapter.ts`.
 *
 * RESSALVAS (herdadas/estendidas da PSI-034/032):
 *
 * 1. `listChargesByPatient`/`listCharges` só buscam a PRIMEIRA página
 *    (`page=0`, `size=HTTP_CHARGES_PAGE_SIZE`) — não paginam de verdade.
 * 2. `generateMonthlyCharges` não tem um endpoint de emissão em lote no
 *    contrato: emite UM `POST /charges` por rascunho, sequencialmente. Um
 *    409 (já existe cobrança para paciente+competência — mesma condição de
 *    idempotência que `MockChargesAdapter` reproduz em memória) marca
 *    aquele rascunho como `skipped` e segue para o próximo; qualquer outro
 *    erro interrompe o restante (ver a doc de `ChargesAdapter.generateMonthlyCharges`).
 * 3. `undoChargePayment` lança `ChargesAdapterUnsupportedError` — ver a doc
 *    da classe acima.
 *
 * Mesma ressalva de `HttpPatientsAdapter`/`HttpAgendaAdapter`: esta tarefa
 * entrega a implementação e sua tipagem, mas não a exercita ponta a ponta
 * contra um backend real (PSI-044), nem é a seleção padrão em todo ambiente
 * (ver `./index.ts`).
 */
export class HttpChargesAdapter implements ChargesAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpChargesAdapterOptions) {
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

  async listChargesByPatient(patientId: string): Promise<Charge[]> {
    const query = new URLSearchParams({ patientId, page: "0", size: String(HTTP_CHARGES_PAGE_SIZE) });
    const page = await this.getJson<ChargePage>(`/charges?${query.toString()}`);
    return page.items;
  }

  async listCharges(params: ListChargesParams = {}): Promise<Charge[]> {
    const query = new URLSearchParams({ page: "0", size: String(HTTP_CHARGES_PAGE_SIZE) });
    if (params.status) query.set("status", params.status);
    if (params.competence) query.set("competence", params.competence);
    const page = await this.getJson<ChargePage>(`/charges?${query.toString()}`);
    return page.items;
  }

  async generateMonthlyCharges(drafts: readonly ChargeDraft[]): Promise<GenerateMonthlyChargesResult> {
    const created: Charge[] = [];
    const skipped: ChargeDraft[] = [];

    for (const draft of drafts) {
      try {
        const charge = await this.postJson<Charge>("/charges", draft, { conflictFallback: CHARGE_ALREADY_EXISTS_MESSAGE });
        created.push(charge);
      } catch (error) {
        if (isChargeAlreadyExistsError(error)) {
          skipped.push(draft);
          continue;
        }
        throw error;
      }
    }

    return { created, skipped };
  }

  async registerChargePayment(chargeId: string, payload: RegisterPaymentRequest): Promise<Charge> {
    return this.postJson<Charge>(`/charges/${encodeURIComponent(chargeId)}/payment`, payload, {
      conflictFallback: CHARGE_ALREADY_PAID_MESSAGE,
    });
  }

  async undoChargePayment(chargeId: string): Promise<Charge> {
    void chargeId;
    throw new ChargesAdapterUnsupportedError("undoChargePayment");
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

  private async postJson<T>(path: string, body: unknown, options: { conflictFallback?: string } = {}): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response, options);
  }

  private async parseResponse<T>(response: Response, options: { conflictFallback?: string } = {}): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      const fallback =
        response.status === 409 ? (options.conflictFallback ?? "Conflito ao processar a cobrança.") : "Não foi possível completar a operação financeira.";
      throw new ChargesAdapterError(problem?.detail ?? problem?.title ?? fallback, response.status);
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
