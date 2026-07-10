import type {
  Appointment,
  AppointmentCreateRequest,
  AppointmentPage,
  AppointmentUpdateRequest,
  AttendanceRecord,
  Problem,
} from "@psiops/contracts";

import type {
  AgendaAdapter,
  CreateAppointmentSeriesInput,
  CreateAppointmentSeriesResult,
  ListAppointmentsRangeParams,
  RescheduleAppointmentInput,
} from "./AgendaAdapter";
import { AGENDA_CONFLICT_MESSAGE, AgendaAdapterError } from "./AgendaAdapterError";
import type { AppointmentHistoryEntry } from "./AppointmentsReadAdapter";
import { createAppointmentSeriesWith } from "./createAppointmentSeries";

/**
 * Tamanho de página usado nas chamadas HTTP desta classe — grande o
 * suficiente para cobrir uma semana/dia de agenda ou o histórico usual de um
 * paciente sem paginar de fato de verdade (mesmo espírito de
 * `HTTP_APPOINTMENTS_READ_PAGE_SIZE`, PSI-034).
 */
export const HTTP_AGENDA_PAGE_SIZE = 200;

export interface HttpAgendaAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
  /** Access token usado nas chamadas autenticadas (mesma ressalva de `HttpPatientsAdapter`). */
  getAccessToken?: () => string | undefined;
}

/**
 * Implementação HTTP de `AgendaAdapter`, tipada contra os contratos gerados
 * em `@psiops/contracts`, usando `/appointments` e `/appointments/{id}`.
 *
 * SUBSTITUI `HttpAppointmentsReadAdapter` (PSI-034) — ver a doc de
 * `AgendaAdapter` para a justificativa da reconciliação.
 *
 * RESSALVAS (herdadas/estendidas da PSI-034, ver open_question do PR):
 *
 * 1. `listAppointmentsByPatient` e `listAppointments` só buscam a PRIMEIRA
 *    página (`page=0`, `size=HTTP_AGENDA_PAGE_SIZE`) — não paginam de
 *    verdade. Para as visões semanal/diária (intervalos curtos) e para o
 *    histórico de um paciente isso cobre o uso normal.
 * 2. `attendance` SEMPRE volta `undefined` em `listAppointmentsByPatient`:
 *    o contrato hoje só expõe `PUT /appointments/{id}/attendance` (escrita,
 *    PSI-036) — não há um `GET` de presença administrativa.
 * 3. Conflito de horário (409): quem decide é a API real (PSI-024). Esta
 *    classe só traduz a resposta HTTP em `AgendaAdapterError` com
 *    `status: 409`, usando o `detail`/`title` do `Problem` devolvido — ver
 *    `AGENDA_CONFLICT_MESSAGE` (`./AgendaAdapterError.ts`) para a
 *    explicação de como isso garante paridade com `MockAgendaAdapter`.
 * 4. `recordAttendance` (PSI-036) chama `PUT /appointments/{id}/attendance`
 *    tipado 1:1 pelo contrato (`AttendanceRecord` → `Appointment`) — sem
 *    tradução adicional. `attendanceCreatedAt`/`attendanceUpdatedAt` de
 *    `AppointmentHistoryEntry` continuam sempre `undefined` aqui pelo mesmo
 *    motivo da ressalva 2: o contrato não expõe leitura de metadado de
 *    presença, então esta classe não tem como reconstruir "quando o
 *    registro foi criado/editado" a partir de um `GET` que não existe.
 *
 * Mesma ressalva de `HttpPatientsAdapter`/`HttpAuthAdapter`: esta tarefa
 * entrega a implementação e sua tipagem, mas não a exercita ponta a ponta
 * contra um backend real (PSI-044), nem é a seleção padrão em todo ambiente
 * (ver `./index.ts`).
 */
export class HttpAgendaAdapter implements AgendaAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: () => string | undefined;

  constructor(options: HttpAgendaAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.getAccessToken = options.getAccessToken ?? (() => undefined);
  }

  async listAppointmentsByPatient(patientId: string): Promise<AppointmentHistoryEntry[]> {
    const page = await this.getAppointmentsPage({ patientId });
    // `attendance` fica sempre ausente — ver ressalva 2 na doc da classe.
    return page.items.map((appointment) => ({ appointment }));
  }

  async listAppointments(params: ListAppointmentsRangeParams): Promise<Appointment[]> {
    const page = await this.getAppointmentsPage({ from: params.from, to: params.to, patientId: params.patientId });
    return page.items;
  }

  async createAppointment(payload: AppointmentCreateRequest): Promise<Appointment> {
    return this.postJson<Appointment>("/appointments", payload);
  }

  async rescheduleAppointment(appointmentId: string, payload: RescheduleAppointmentInput): Promise<Appointment> {
    const body: AppointmentUpdateRequest = { startsAt: payload.startsAt };
    if (payload.durationMinutes !== undefined) {
      body.durationMinutes = payload.durationMinutes;
    }
    return this.putJson<Appointment>(`/appointments/${encodeURIComponent(appointmentId)}`, body);
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const response = await this.fetchFn(`${this.baseUrl}/appointments/${encodeURIComponent(appointmentId)}`, {
      method: "DELETE",
      headers: this.authHeaders(),
    });
    await this.parseResponse<void>(response);
  }

  async createAppointmentSeries(input: CreateAppointmentSeriesInput): Promise<CreateAppointmentSeriesResult> {
    return createAppointmentSeriesWith((payload) => this.createAppointment(payload), input);
  }

  async recordAttendance(appointmentId: string, payload: AttendanceRecord): Promise<Appointment> {
    return this.putJson<Appointment>(`/appointments/${encodeURIComponent(appointmentId)}/attendance`, payload);
  }

  // --- Internos ---

  private async getAppointmentsPage(filters: { from?: string; to?: string; patientId?: string }): Promise<AppointmentPage> {
    const query = new URLSearchParams({ page: "0", size: String(HTTP_AGENDA_PAGE_SIZE) });
    if (filters.patientId) query.set("patientId", filters.patientId);
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);

    const response = await this.fetchFn(`${this.baseUrl}/appointments?${query.toString()}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return this.parseResponse<AppointmentPage>(response);
  }

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
      // Mesmo fallback pt-BR de conflito que `MockAgendaAdapter` usa — só
      // entra em jogo se o 409 real vier sem corpo `Problem` legível (ver
      // doc de `AGENDA_CONFLICT_MESSAGE`).
      const fallback = response.status === 409 ? AGENDA_CONFLICT_MESSAGE : "Não foi possível completar a operação de agenda.";
      throw new AgendaAdapterError(problem?.detail ?? problem?.title ?? fallback, response.status);
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
