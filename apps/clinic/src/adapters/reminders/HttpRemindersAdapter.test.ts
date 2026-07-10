import { describe, expect, it, vi } from "vitest";

import { HttpRemindersAdapter, RemindersAdapterUnsupportedError } from "./HttpRemindersAdapter";
import { RemindersAdapterError } from "./RemindersAdapterError";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SAMPLE_REMINDER = {
  id: "reminder-1",
  channel: "email" as const,
  subject: "Lembrete de consulta",
  body: "Você tem uma consulta agendada.",
  scheduledFor: "2026-07-12T14:00:00Z",
  status: "agendado" as const,
  createdAt: "2026-07-01T09:00:00Z",
};

describe("HttpRemindersAdapter — leitura", () => {
  it("faz GET /reminders com page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_REMINDER], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpRemindersAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const reminders = await adapter.listReminders();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/reminders?page=0&size=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(reminders).toHaveLength(1);
  });

  it("inclui patientId e status na query string quando informados", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], meta: { page: 0, size: 200, totalElements: 0, totalPages: 0 } }));
    const adapter = new HttpRemindersAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.listReminders({ patientId: "patient-a", status: "agendado" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/reminders?page=0&size=200&patientId=patient-a&status=agendado",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propaga erro com o detail do Problem e status quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ type: "about:blank", title: "Erro", status: 500, detail: "Falha ao listar lembretes." }, 500),
      );
    const adapter = new HttpRemindersAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listReminders();
    await expect(rejection).rejects.toThrow("Falha ao listar lembretes.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(RemindersAdapterError);
  });
});

describe("HttpRemindersAdapter — criação (PSI-038)", () => {
  it("cria um lembrete via POST /reminders", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_REMINDER, 201));
    const adapter = new HttpRemindersAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const payload = {
      channel: "email" as const,
      subject: "Lembrete de consulta",
      body: "Você tem uma consulta agendada.",
      scheduledFor: "2026-07-12T14:00:00Z",
      appointmentId: "appointment-1",
    };
    const created = await adapter.createReminder(payload);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/reminders",
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
    expect(created.subject).toBe("Lembrete de consulta");
  });
});

describe("HttpRemindersAdapter — cancelamento não suportado pelo contrato (PSI-038)", () => {
  it("cancelReminder lança RemindersAdapterUnsupportedError sem fazer chamada de rede", async () => {
    const fetchFn = vi.fn();
    const adapter = new HttpRemindersAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.cancelReminder("reminder-1")).rejects.toBeInstanceOf(RemindersAdapterUnsupportedError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("HttpRemindersAdapter vs MockRemindersAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", async () => {
    const { MockRemindersAdapter } = await import("./MockRemindersAdapter");
    expect(new MockRemindersAdapter()).not.toBeInstanceOf(HttpRemindersAdapter);
    expect(new HttpRemindersAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockRemindersAdapter);
  });
});
