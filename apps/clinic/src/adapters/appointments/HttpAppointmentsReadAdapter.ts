import type { AppointmentPage, Problem } from "@psiops/contracts";

import type { AppointmentHistoryEntry, AppointmentsReadAdapter } from "./AppointmentsReadAdapter";
import { AppointmentsReadAdapterError } from "./AppointmentsReadAdapterError";

/**
 * Tamanho de página usado na única chamada HTTP feita por
 * `listAppointmentsByPatient` — grande o suficiente para cobrir o histórico
 * usual de UM paciente sem paginar de fato. PSI-035, ao construir a tela
 * completa de agenda, deve revisar isso (ver ressalva na classe).
 */
export const HTTP_APPOINTMENTS_READ_PAGE_SIZE = 200;

export interface HttpAppointmentsReadAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpPatientsAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `AppointmentsReadAdapter`, tipada contra os
 * contratos gerados em `@psiops/contracts`, usando `GET /appointments` com o
 * filtro `patientId` (`operations["listAppointments"]`).
 *
 * DUAS RESSALVAS IMPORTANTES (ver open_question do PR PSI-034):
 *
 * 1. Só busca a PRIMEIRA página (`page=0`, `size=HTTP_APPOINTMENTS_READ_PAGE_SIZE`)
 *    — não pagina de fato. Para a tela de detalhe de um paciente isso cobre
 *    o uso normal; PSI-035, ao estender esta interface para a agenda
 *    completa, deve decidir se precisa paginar de verdade.
 *
 * 2. `attendance` SEMPRE volta `undefined` aqui: o contrato hoje só expõe
 *    `PUT /appointments/{id}/attendance` (escrita, PSI-036) — não há um
 *    `GET` de presença administrativa. Enquanto isso não existir,
 *    `HttpAppointmentsReadAdapter` não tem como preencher `attendance` a
 *    partir da API real; `MockAppointmentsReadAdapter` (dev/test) já traz o
 *    registro no seed, então essa divergência só aparece ao trocar para
 *    HTTP — mesmo espírito da ressalva sobre `search` em
 *    `src/adapters/patients/HttpPatientsAdapter.ts`.
 *
 * Mesma ressalva de `HttpPatientsAdapter`/`HttpAuthAdapter`: esta tarefa
 * entrega a implementação e sua tipagem, mas não a exercita ponta a ponta
 * contra um backend real (PSI-044), nem é a seleção padrão em todo ambiente
 * (ver `./index.ts`).
 */
export class HttpAppointmentsReadAdapter implements AppointmentsReadAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpAppointmentsReadAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listAppointmentsByPatient(patientId: string): Promise<AppointmentHistoryEntry[]> {
    const query = new URLSearchParams({
      patientId,
      page: "0",
      size: String(HTTP_APPOINTMENTS_READ_PAGE_SIZE),
    });

    const response = await this.fetchFn(`${this.baseUrl}/appointments?${query.toString()}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    const page = await this.parseResponse<AppointmentPage>(response);
    // `attendance` fica sempre ausente — ver ressalva 2 na doc da classe.
    return page.items.map((appointment) => ({ appointment }));
  }

  // --- Internos ---

  private authHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new AppointmentsReadAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível carregar as consultas do paciente.",
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
