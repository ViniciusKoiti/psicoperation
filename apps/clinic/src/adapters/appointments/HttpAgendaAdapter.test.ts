import { describe, expect, it, vi } from "vitest";

import { isAgendaConflictError } from "./AgendaAdapterError";
import { HttpAgendaAdapter } from "./HttpAgendaAdapter";

/**
 * Testes unitários com `fetch` substituído por um stub — NÃO é um teste de
 * integração contra um backend real (ver aviso em `HttpAgendaAdapter.ts`).
 * O objetivo é garantir que a tipagem e o mapeamento request/response estão
 * corretos, incluindo a tradução do 409 de conflito; o exercício ponta a
 * ponta acontece na PSI-044.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SAMPLE_APPOINTMENT = {
  id: "c1a1a1a1-0001-4a6b-8c9d-0e1f2a3b4c5d",
  patientId: "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d",
  startsAt: "2026-07-13T14:00:00Z",
  durationMinutes: 50,
  status: "agendada" as const,
  createdAt: "2026-06-01T12:00:00Z",
};

describe("HttpAgendaAdapter — listagem", () => {
  it("listAppointments faz GET /appointments com from/to/patientId na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [SAMPLE_APPOINTMENT], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const items = await adapter.listAppointments({ from: "2026-07-13", to: "2026-07-19", patientId: SAMPLE_APPOINTMENT.patientId });

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/appointments?page=0&size=200&patientId=${SAMPLE_APPOINTMENT.patientId}&from=2026-07-13&to=2026-07-19`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(items).toHaveLength(1);
  });

  it("listAppointmentsByPatient faz GET /appointments?patientId=... e deixa attendance ausente", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [SAMPLE_APPOINTMENT], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const entries = await adapter.listAppointmentsByPatient(SAMPLE_APPOINTMENT.patientId);

    expect(entries).toEqual([{ appointment: SAMPLE_APPOINTMENT }]);
  });
});

describe("HttpAgendaAdapter — criar/remarcar/cancelar", () => {
  it("createAppointment faz POST /appointments com o payload", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_APPOINTMENT, 201));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const payload = { patientId: SAMPLE_APPOINTMENT.patientId, startsAt: SAMPLE_APPOINTMENT.startsAt, durationMinutes: 50 };
    const created = await adapter.createAppointment(payload);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/appointments",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
    expect(created.id).toBe(SAMPLE_APPOINTMENT.id);
  });

  it("createAppointment traduz o 409 de conflito em AgendaAdapterError tipado", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          type: "about:blank",
          title: "Conflito",
          status: 409,
          detail: "Conflito de horário: já existe uma consulta que se sobrepõe ao intervalo solicitado.",
        },
        409,
      ),
    );
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.createAppointment({
      patientId: SAMPLE_APPOINTMENT.patientId,
      startsAt: SAMPLE_APPOINTMENT.startsAt,
      durationMinutes: 50,
    });

    await expect(rejection).rejects.toThrow("Conflito de horário: já existe uma consulta que se sobrepõe ao intervalo solicitado.");
    await expect(rejection.catch((e) => e)).resolves.toSatisfy(isAgendaConflictError);
  });

  it("createAppointment cai para a mensagem pt-BR padrão quando o 409 vem sem corpo Problem legível", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("", { status: 409 }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.createAppointment({
      patientId: SAMPLE_APPOINTMENT.patientId,
      startsAt: SAMPLE_APPOINTMENT.startsAt,
      durationMinutes: 50,
    });

    await expect(rejection).rejects.toThrow("Este horário conflita com outra consulta já agendada");
    await expect(rejection.catch((e) => e)).resolves.toSatisfy(isAgendaConflictError);
  });

  it("rescheduleAppointment faz PUT /appointments/{id} só com startsAt quando durationMinutes é omitido", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_APPOINTMENT, startsAt: "2026-07-14T09:00:00Z" }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const updated = await adapter.rescheduleAppointment(SAMPLE_APPOINTMENT.id, { startsAt: "2026-07-14T09:00:00Z" });

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/appointments/${SAMPLE_APPOINTMENT.id}`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ startsAt: "2026-07-14T09:00:00Z" }) }),
    );
    expect(updated.startsAt).toBe("2026-07-14T09:00:00Z");
  });

  it("cancelAppointment faz DELETE /appointments/{id} e resolve sem corpo (204)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.cancelAppointment(SAMPLE_APPOINTMENT.id)).resolves.toBeUndefined();
    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/appointments/${SAMPLE_APPOINTMENT.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("HttpAgendaAdapter — registrar desfecho (PSI-036)", () => {
  it("recordAttendance faz PUT /appointments/{id}/attendance com o AttendanceRecord e devolve a consulta atualizada", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_APPOINTMENT, status: "remarcada" }));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const payload = { attendance: "remarcada" as const, administrativeNotes: "Remarcou por viagem." };
    const updated = await adapter.recordAttendance(SAMPLE_APPOINTMENT.id, payload);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/appointments/${SAMPLE_APPOINTMENT.id}/attendance`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) }),
    );
    expect(updated.status).toBe("remarcada");
  });
});

describe("HttpAgendaAdapter — série recorrente semanal", () => {
  it("createAppointmentSeries chama createAppointment uma vez por ocorrência e reporta conflitos parciais", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...SAMPLE_APPOINTMENT, startsAt: "2026-07-13T14:00:00Z" }, 201))
      .mockResolvedValueOnce(jsonResponse({ type: "about:blank", title: "Conflito", status: 409, detail: "Conflito." }, 409))
      .mockResolvedValueOnce(jsonResponse({ ...SAMPLE_APPOINTMENT, startsAt: "2026-07-27T14:00:00Z" }, 201));
    const adapter = new HttpAgendaAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const result = await adapter.createAppointmentSeries({
      patientId: SAMPLE_APPOINTMENT.patientId,
      startsAt: "2026-07-13T14:00:00Z",
      durationMinutes: 50,
      weeks: 3,
    });

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result.occurrences.map((o) => o.outcome)).toEqual(["created", "conflict", "created"]);
  });
});
