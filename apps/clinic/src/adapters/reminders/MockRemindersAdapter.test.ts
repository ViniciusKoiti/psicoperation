import type { Reminder } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockRemindersAdapter } from "./MockRemindersAdapter";
import { RemindersAdapterError } from "./RemindersAdapterError";

function reminder(overrides: Partial<Reminder>): Reminder {
  return {
    id: overrides.id ?? "reminder-1",
    channel: "email",
    subject: overrides.subject ?? "Lembrete de consulta",
    body: overrides.body ?? "Você tem uma consulta agendada.",
    scheduledFor: overrides.scheduledFor ?? "2026-07-12T14:00:00Z",
    status: overrides.status ?? "agendado",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("MockRemindersAdapter — leitura", () => {
  it("retorna todos os lembretes quando nenhum filtro é informado", async () => {
    const seed = [reminder({ id: "r1" }), reminder({ id: "r2", status: "enviado" })];
    const adapter = new MockRemindersAdapter(seed);

    const reminders = await adapter.listReminders();

    expect(reminders.map((r) => r.id).sort()).toEqual(["r1", "r2"]);
  });

  it("filtra por status", async () => {
    const seed = [reminder({ id: "r1", status: "agendado" }), reminder({ id: "r2", status: "enviado" })];
    const adapter = new MockRemindersAdapter(seed);

    const agendados = await adapter.listReminders({ status: "agendado" });
    expect(agendados.map((r) => r.id)).toEqual(["r1"]);
  });

  it("filtra por paciente vinculado", async () => {
    const seed = [
      reminder({ id: "r1", patientId: "patient-a" }),
      reminder({ id: "r2", patientId: "patient-b" }),
    ];
    const adapter = new MockRemindersAdapter(seed);

    const resultado = await adapter.listReminders({ patientId: "patient-a" });
    expect(resultado.map((r) => r.id)).toEqual(["r1"]);
  });

  it("retorna lista vazia quando não há lembretes seedados", async () => {
    const adapter = new MockRemindersAdapter([]);

    const reminders = await adapter.listReminders();

    expect(reminders).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = [reminder({ id: "r1", subject: "Original" })];
    const adapter = new MockRemindersAdapter(seed);

    const first = await adapter.listReminders();
    first[0]!.subject = "Mutado";

    const second = await adapter.listReminders();
    expect(second[0]?.subject).toBe("Original");
  });

  it("o seed padrão traz um lembrete de sessão agendado e um de pagamento enviado", async () => {
    const adapter = new MockRemindersAdapter();

    const all = await adapter.listReminders();
    expect(all).toHaveLength(2);
    expect(all.some((r) => r.status === "agendado" && r.appointmentId)).toBe(true);
    expect(all.some((r) => r.status === "enviado" && r.chargeId)).toBe(true);
  });
});

describe("MockRemindersAdapter — criação (registra a intenção, PSI-038)", () => {
  it("cria um lembrete de sessão vinculado a uma consulta, nascendo 'agendado'", async () => {
    let idCounter = 0;
    const adapter = new MockRemindersAdapter([], {
      clock: () => new Date("2026-07-01T12:00:00Z").getTime(),
      idGenerator: () => `gen-${++idCounter}`,
    });

    const created = await adapter.createReminder({
      channel: "email",
      subject: "Lembrete de consulta",
      body: "Você tem uma consulta agendada para 13/07/2026 às 14:00.",
      scheduledFor: "2026-07-12T14:00:00Z",
      patientId: "patient-a",
      appointmentId: "appointment-1",
    });

    expect(created).toEqual({
      id: "gen-1",
      channel: "email",
      subject: "Lembrete de consulta",
      body: "Você tem uma consulta agendada para 13/07/2026 às 14:00.",
      scheduledFor: "2026-07-12T14:00:00Z",
      status: "agendado",
      patientId: "patient-a",
      appointmentId: "appointment-1",
      createdAt: "2026-07-01T12:00:00.000Z",
    });

    const all = await adapter.listReminders();
    expect(all).toHaveLength(1);
  });

  it("cria um lembrete de pagamento vinculado a uma cobrança", async () => {
    const adapter = new MockRemindersAdapter([]);

    const created = await adapter.createReminder({
      channel: "email",
      subject: "Lembrete de pagamento",
      body: "Sua mensalidade vence em breve.",
      scheduledFor: "2026-07-09T09:00:00Z",
      patientId: "patient-a",
      chargeId: "charge-1",
    });

    expect(created.chargeId).toBe("charge-1");
    expect(created.appointmentId).toBeUndefined();
  });

  it("nenhum email é de fato enviado: o status nasce sempre 'agendado', nunca 'enviado'", async () => {
    const adapter = new MockRemindersAdapter([]);

    const created = await adapter.createReminder({
      channel: "email",
      subject: "Lembrete de consulta",
      body: "Corpo administrativo.",
      scheduledFor: "2026-07-12T14:00:00Z",
    });

    expect(created.status).toBe("agendado");
    expect(created.sentAt).toBeUndefined();
  });
});

describe("MockRemindersAdapter — ativação/desativação individual (cancelReminder, PSI-038)", () => {
  it("cancela um lembrete agendado", async () => {
    const seed = [reminder({ id: "r1", status: "agendado" })];
    const adapter = new MockRemindersAdapter(seed);

    const cancelled = await adapter.cancelReminder("r1");

    expect(cancelled.status).toBe("cancelado");
    const stored = await adapter.listReminders();
    expect(stored[0]?.status).toBe("cancelado");
  });

  it("lança 404 ao cancelar lembrete inexistente", async () => {
    const adapter = new MockRemindersAdapter([]);

    const rejection = adapter.cancelReminder("inexistente");
    await expect(rejection).rejects.toBeInstanceOf(RemindersAdapterError);
    await expect(rejection).rejects.toMatchObject({ status: 404 });
  });

  it("lança 409 ao tentar cancelar um lembrete que já foi enviado", async () => {
    const seed = [reminder({ id: "r1", status: "enviado" })];
    const adapter = new MockRemindersAdapter(seed);

    const rejection = adapter.cancelReminder("r1");
    await expect(rejection).rejects.toMatchObject({ status: 409 });
  });

  it("lança 409 ao cancelar duas vezes seguidas (já cancelado)", async () => {
    const seed = [reminder({ id: "r1", status: "agendado" })];
    const adapter = new MockRemindersAdapter(seed);

    await adapter.cancelReminder("r1");
    const rejection = adapter.cancelReminder("r1");
    await expect(rejection).rejects.toMatchObject({ status: 409 });
  });
});
