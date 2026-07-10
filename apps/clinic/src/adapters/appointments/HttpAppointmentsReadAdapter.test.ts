import { describe, expect, it, vi } from "vitest";

import { AppointmentsReadAdapterError } from "./AppointmentsReadAdapterError";
import { HttpAppointmentsReadAdapter } from "./HttpAppointmentsReadAdapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SAMPLE_APPOINTMENT = {
  id: "apt-1",
  patientId: "patient-1",
  startsAt: "2026-01-01T10:00:00Z",
  durationMinutes: 50,
  status: "realizada" as const,
  createdAt: "2025-12-01T10:00:00Z",
};

describe("HttpAppointmentsReadAdapter", () => {
  it("faz GET /appointments com patientId/page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_APPOINTMENT], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpAppointmentsReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const entries = await adapter.listAppointmentsByPatient("patient-1");

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/appointments?patientId=patient-1&page=0&size=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.appointment.id).toBe("apt-1");
  });

  it("SEMPRE retorna attendance indefinido — o contrato não tem GET de presença", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_APPOINTMENT], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpAppointmentsReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const entries = await adapter.listAppointmentsByPatient("patient-1");

    expect(entries[0]?.attendance).toBeUndefined();
  });

  it("propaga erro com o detail do Problem e status quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ type: "about:blank", title: "Erro", status: 500, detail: "Falha ao listar consultas." }, 500),
      );
    const adapter = new HttpAppointmentsReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listAppointmentsByPatient("patient-1");
    await expect(rejection).rejects.toThrow("Falha ao listar consultas.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(AppointmentsReadAdapterError);
  });
});
