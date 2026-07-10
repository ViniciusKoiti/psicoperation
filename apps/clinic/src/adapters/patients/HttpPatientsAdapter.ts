import type { Patient, PatientCreateRequest, PatientPage, PatientUpdateRequest, Problem } from "@psiops/contracts";

import type { ListPatientsParams, PatientsAdapter } from "./PatientsAdapter";
import { PatientsAdapterError } from "./PatientsAdapterError";

export interface HttpPatientsAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /**
   * Access token usado nas chamadas autenticadas. Nesta tarefa (PSI-033) a
   * integração ponta a ponta com sessão real fica pendente (mesma ressalva
   * da `HttpAuthAdapter`/`HttpSettingsAdapter`, PSI-030/PSI-031) — normalmente
   * viria de `SessionManager.withAuth`.
   */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `PatientsAdapter`, tipada contra os contratos gerados
 * em `@psiops/contracts` (`gen/ts`), apontando para a API Spring Boot
 * (`/patients`, `/patients/{patientId}`).
 *
 * IMPORTANTE (mesma ressalva de `HttpAuthAdapter`/`HttpSettingsAdapter`): esta
 * tarefa entrega a implementação e sua tipagem, mas NÃO habilita chamadas
 * reais contra um backend em execução nem é a seleção padrão em todo
 * ambiente hoje (ver `./index.ts`). O exercício ponta a ponta acontece na
 * PSI-044.
 *
 * `listPatients` só envia `page`/`size`/`status` na query string — os únicos
 * parâmetros que `operations["listPatients"]` (contrato) expõe hoje.
 * `params.search`, se informado, é IGNORADO na chamada HTTP: o contrato de
 * `GET /patients` não tem parâmetro de busca por nome (ver `PatientsAdapter.ts`
 * e o open_question do PR desta tarefa). Isso é uma divergência conhecida
 * entre `MockPatientsAdapter` (filtra em memória) e este adapter enquanto o
 * contrato não for estendido.
 *
 * `archivePatient`/`unarchivePatient` chamam `PUT /patients/{patientId}` com
 * `status: "inativo"`/`"ativo"` (via `updatePatient`) — não usam
 * `DELETE /patients/{patientId}` (ver justificativa em `PatientsAdapter.ts`).
 */
export class HttpPatientsAdapter implements PatientsAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpPatientsAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listPatients(params: ListPatientsParams = {}): Promise<PatientPage> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.size !== undefined) query.set("size", String(params.size));
    if (params.status !== undefined) query.set("status", params.status);
    // `params.search` não é enviado — ver aviso na doc da classe.

    const queryString = query.toString();
    const response = await this.fetchFn(`${this.baseUrl}/patients${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return this.parseResponse<PatientPage>(response);
  }

  async getPatient(patientId: string): Promise<Patient> {
    const response = await this.fetchFn(`${this.baseUrl}/patients/${encodeURIComponent(patientId)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return this.parseResponse<Patient>(response);
  }

  async createPatient(payload: PatientCreateRequest): Promise<Patient> {
    return this.postJson<Patient>("/patients", payload);
  }

  async updatePatient(patientId: string, payload: PatientUpdateRequest): Promise<Patient> {
    return this.putJson<Patient>(`/patients/${encodeURIComponent(patientId)}`, payload);
  }

  async archivePatient(patientId: string): Promise<Patient> {
    return this.updatePatient(patientId, { status: "inativo" });
  }

  async unarchivePatient(patientId: string): Promise<Patient> {
    return this.updatePatient(patientId, { status: "ativo" });
  }

  // --- Internos ---

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response);
  }

  private async putJson<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { ...this.authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new PatientsAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível completar a operação de pacientes.",
        response.status,
      );
    }
    if (response.status === 204) {
      return undefined as T;
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
