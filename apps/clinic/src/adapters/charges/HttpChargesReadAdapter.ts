import type { ChargePage, Problem } from "@psiops/contracts";

import type { ChargesReadAdapter } from "./ChargesReadAdapter";
import { ChargesReadAdapterError } from "./ChargesReadAdapterError";

/**
 * Tamanho de página usado na única chamada HTTP feita por
 * `listChargesByPatient` — grande o suficiente para cobrir o histórico
 * usual de cobranças de UM paciente sem paginar de fato. PSI-037, ao
 * construir a tela completa de financeiro, deve revisar isso (ver ressalva
 * na classe).
 */
export const HTTP_CHARGES_READ_PAGE_SIZE = 200;

export interface HttpChargesReadAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpPatientsAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `ChargesReadAdapter`, tipada contra os contratos
 * gerados em `@psiops/contracts`, usando `GET /charges` com o filtro
 * `patientId` (`operations["listCharges"]`).
 *
 * RESSALVA (ver open_question do PR PSI-034): só busca a PRIMEIRA página
 * (`page=0`, `size=HTTP_CHARGES_READ_PAGE_SIZE`) — não pagina de fato. Para
 * a tela de detalhe de um paciente isso cobre o uso normal; PSI-037, ao
 * estender esta interface para a tela completa de financeiro, deve decidir
 * se precisa paginar de verdade.
 *
 * Mesma ressalva de `HttpPatientsAdapter`/`HttpAuthAdapter`: esta tarefa
 * entrega a implementação e sua tipagem, mas não a exercita ponta a ponta
 * contra um backend real (PSI-044), nem é a seleção padrão em todo ambiente
 * (ver `./index.ts`).
 */
export class HttpChargesReadAdapter implements ChargesReadAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpChargesReadAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listChargesByPatient(patientId: string) {
    const query = new URLSearchParams({ patientId, page: "0", size: String(HTTP_CHARGES_READ_PAGE_SIZE) });

    const response = await this.fetchFn(`${this.baseUrl}/charges?${query.toString()}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    const page = await this.parseResponse<ChargePage>(response);
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
      throw new ChargesReadAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível carregar as cobranças do paciente.",
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
