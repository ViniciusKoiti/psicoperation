import type { Appointment } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { isAgendaConflictError, isAgendaNotFoundError } from "./AgendaAdapterError";
import { MockAgendaAdapter } from "./MockAgendaAdapter";

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "apt-1",
    patientId: overrides.patientId ?? "patient-1",
    startsAt: overrides.startsAt ?? "2026-07-13T14:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "agendada",
    createdAt: overrides.createdAt ?? "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("MockAgendaAdapter — listagem", () => {
  it("listAppointmentsByPatient filtra a lista plana por paciente (mesmo comportamento da PSI-034)", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "a1", patientId: "p1" }) },
      { appointment: appointment({ id: "a2", patientId: "p2" }) },
    ]);

    const entries = await adapter.listAppointmentsByPatient("p1");

    expect(entries.map((e) => e.appointment.id)).toEqual(["a1"]);
  });

  it("listAppointments filtra por intervalo de datas (inclusive) e, opcionalmente, por paciente", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "antes", patientId: "p1", startsAt: "2026-07-05T14:00:00Z" }) },
      { appointment: appointment({ id: "dentro-p1", patientId: "p1", startsAt: "2026-07-13T14:00:00Z" }) },
      { appointment: appointment({ id: "dentro-p2", patientId: "p2", startsAt: "2026-07-14T10:00:00Z" }) },
      { appointment: appointment({ id: "depois", patientId: "p1", startsAt: "2026-07-25T14:00:00Z" }) },
    ]);

    const week = await adapter.listAppointments({ from: "2026-07-13", to: "2026-07-19" });
    expect(week.map((a) => a.id).sort()).toEqual(["dentro-p1", "dentro-p2"]);

    const weekForP1 = await adapter.listAppointments({ from: "2026-07-13", to: "2026-07-19", patientId: "p1" });
    expect(weekForP1.map((a) => a.id)).toEqual(["dentro-p1"]);
  });

  it("estado inicial vazio quando seedado com lista vazia", async () => {
    const adapter = new MockAgendaAdapter([]);
    expect(await adapter.listAppointments({ from: "2026-01-01", to: "2026-12-31" })).toEqual([]);
  });
});

describe("MockAgendaAdapter — criar consulta", () => {
  it("cria a consulta com status 'agendada' quando não há conflito", async () => {
    const adapter = new MockAgendaAdapter([], { clock: () => Date.parse("2026-06-01T12:00:00Z"), idGenerator: () => "novo-id" });

    const created = await adapter.createAppointment({ patientId: "p1", startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 });

    expect(created).toEqual({
      id: "novo-id",
      patientId: "p1",
      startsAt: "2026-07-13T14:00:00Z",
      durationMinutes: 50,
      status: "agendada",
      createdAt: "2026-06-01T12:00:00.000Z",
    });
  });

  it("lança AgendaAdapterError 409 quando o horário conflita com uma consulta ativa existente", async () => {
    const adapter = new MockAgendaAdapter([{ appointment: appointment({ id: "existente", startsAt: "2026-07-13T14:00:00Z" }) }]);

    await expect(
      adapter.createAppointment({ patientId: "p1", startsAt: "2026-07-13T14:20:00Z", durationMinutes: 50 }),
    ).rejects.toSatisfy(isAgendaConflictError);
  });

  it("não conflita com uma consulta cancelada no mesmo horário", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "cancelada", startsAt: "2026-07-13T14:00:00Z", status: "cancelada" }) },
    ]);

    const created = await adapter.createAppointment({ patientId: "p1", startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 });

    expect(created.status).toBe("agendada");
  });
});

describe("MockAgendaAdapter — remarcar consulta", () => {
  it("altera startsAt/durationMinutes preservando id e patientId (o vínculo)", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: "p1", startsAt: "2026-07-13T14:00:00Z" }) },
    ]);

    const updated = await adapter.rescheduleAppointment("apt-1", { startsAt: "2026-07-14T09:00:00Z" });

    expect(updated.id).toBe("apt-1");
    expect(updated.patientId).toBe("p1");
    expect(updated.startsAt).toBe("2026-07-14T09:00:00Z");
    expect(updated.durationMinutes).toBe(50);
  });

  it("lança 409 quando o novo horário conflita com outra consulta ativa", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", startsAt: "2026-07-13T14:00:00Z" }) },
      { appointment: appointment({ id: "apt-2", startsAt: "2026-07-14T10:00:00Z" }) },
    ]);

    await expect(adapter.rescheduleAppointment("apt-1", { startsAt: "2026-07-14T10:20:00Z" })).rejects.toSatisfy(
      isAgendaConflictError,
    );
  });

  it("não conflita consigo mesma ao remarcar para um horário próximo do original", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 }) },
    ]);

    const updated = await adapter.rescheduleAppointment("apt-1", { startsAt: "2026-07-13T14:10:00Z" });

    expect(updated.startsAt).toBe("2026-07-13T14:10:00Z");
  });

  it("lança 404 ao remarcar uma consulta inexistente", async () => {
    const adapter = new MockAgendaAdapter([]);

    await expect(adapter.rescheduleAppointment("inexistente", { startsAt: "2026-07-13T14:00:00Z" })).rejects.toSatisfy(
      isAgendaNotFoundError,
    );
  });
});

describe("MockAgendaAdapter — cancelar consulta", () => {
  it("marca status 'cancelada' sem remover a consulta do histórico", async () => {
    const adapter = new MockAgendaAdapter([{ appointment: appointment({ id: "apt-1", patientId: "p1" }) }]);

    await adapter.cancelAppointment("apt-1");

    const entries = await adapter.listAppointmentsByPatient("p1");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.appointment.status).toBe("cancelada");
  });

  it("libera o horário para uma nova consulta depois de cancelada", async () => {
    const adapter = new MockAgendaAdapter([{ appointment: appointment({ id: "apt-1", startsAt: "2026-07-13T14:00:00Z" }) }]);
    await adapter.cancelAppointment("apt-1");

    const created = await adapter.createAppointment({ patientId: "p2", startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 });

    expect(created.status).toBe("agendada");
  });

  it("lança 404 ao cancelar uma consulta inexistente", async () => {
    const adapter = new MockAgendaAdapter([]);
    await expect(adapter.cancelAppointment("inexistente")).rejects.toSatisfy(isAgendaNotFoundError);
  });
});

describe("MockAgendaAdapter — série recorrente semanal", () => {
  it("cria todas as ocorrências quando não há conflito", async () => {
    const adapter = new MockAgendaAdapter([]);

    const result = await adapter.createAppointmentSeries({
      patientId: "p1",
      startsAt: "2026-07-13T14:00:00Z",
      durationMinutes: 50,
      weeks: 3,
    });

    expect(result.occurrences).toHaveLength(3);
    expect(result.occurrences.every((o) => o.outcome === "created")).toBe(true);
    expect(result.occurrences.map((o) => o.startsAt)).toEqual([
      "2026-07-13T14:00:00.000Z",
      "2026-07-20T14:00:00.000Z",
      "2026-07-27T14:00:00.000Z",
    ]);

    const created = await adapter.listAppointments({ from: "2026-07-01", to: "2026-07-31", patientId: "p1" });
    expect(created).toHaveLength(3);
  });

  it("cria as ocorrências livres e reporta as conflitantes, sem abortar a série (conflito parcial)", async () => {
    const adapter = new MockAgendaAdapter([
      // Já existe uma consulta bloqueando a segunda ocorrência da série (2026-07-20).
      { appointment: appointment({ id: "ocupada", patientId: "outro-paciente", startsAt: "2026-07-20T14:00:00Z" }) },
    ]);

    const result = await adapter.createAppointmentSeries({
      patientId: "p1",
      startsAt: "2026-07-13T14:00:00Z",
      durationMinutes: 50,
      weeks: 3,
    });

    expect(result.occurrences.map((o) => o.outcome)).toEqual(["created", "conflict", "created"]);
    expect(result.occurrences[0]?.appointment).toBeDefined();
    expect(result.occurrences[1]?.appointment).toBeUndefined();

    const createdForP1 = await adapter.listAppointments({ from: "2026-07-01", to: "2026-07-31", patientId: "p1" });
    expect(createdForP1).toHaveLength(2);
  });
});
