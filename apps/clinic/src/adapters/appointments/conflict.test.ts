import type { Appointment } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { appointmentsOverlap, findConflictingAppointment } from "./conflict";

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

describe("appointmentsOverlap", () => {
  it("detecta sobreposição parcial (início de uma dentro da outra)", () => {
    const a = { startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 };
    const b = { startsAt: "2026-07-13T14:30:00Z", durationMinutes: 50 };
    expect(appointmentsOverlap(a, b)).toBe(true);
  });

  it("detecta uma consulta totalmente contida na outra", () => {
    const a = { startsAt: "2026-07-13T14:00:00Z", durationMinutes: 120 };
    const b = { startsAt: "2026-07-13T14:30:00Z", durationMinutes: 30 };
    expect(appointmentsOverlap(a, b)).toBe(true);
  });

  it("não considera conflito quando uma termina exatamente onde a outra começa", () => {
    const a = { startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 };
    const b = { startsAt: "2026-07-13T14:50:00Z", durationMinutes: 50 };
    expect(appointmentsOverlap(a, b)).toBe(false);
  });

  it("não considera conflito quando os intervalos não se tocam", () => {
    const a = { startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 };
    const b = { startsAt: "2026-07-13T16:00:00Z", durationMinutes: 50 };
    expect(appointmentsOverlap(a, b)).toBe(false);
  });
});

describe("findConflictingAppointment", () => {
  it("encontra a consulta ativa que se sobrepõe ao candidato", () => {
    const existing = [appointment({ id: "existente", startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 })];

    const conflict = findConflictingAppointment({ startsAt: "2026-07-13T14:20:00Z", durationMinutes: 50 }, existing);

    expect(conflict?.id).toBe("existente");
  });

  it("ignora consultas canceladas ou remarcadas (não bloqueiam o horário)", () => {
    const existing = [
      appointment({ id: "cancelada", startsAt: "2026-07-13T14:00:00Z", status: "cancelada" }),
      appointment({ id: "remarcada", startsAt: "2026-07-13T14:00:00Z", status: "remarcada" }),
    ];

    const conflict = findConflictingAppointment({ startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 }, existing);

    expect(conflict).toBeUndefined();
  });

  it("considera consultas 'realizada' como bloqueantes (histórico ainda ocupa o horário)", () => {
    const existing = [appointment({ id: "realizada", startsAt: "2026-07-13T14:00:00Z", status: "realizada" })];

    const conflict = findConflictingAppointment({ startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 }, existing);

    expect(conflict?.id).toBe("realizada");
  });

  it("exclui a própria consulta ao remarcar (excludeAppointmentId)", () => {
    const existing = [appointment({ id: "apt-1", startsAt: "2026-07-13T14:00:00Z" })];

    const conflict = findConflictingAppointment(
      { startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 },
      existing,
      "apt-1",
    );

    expect(conflict).toBeUndefined();
  });

  it("retorna undefined quando não há sobreposição com nenhuma consulta existente", () => {
    const existing = [appointment({ id: "apt-1", startsAt: "2026-07-13T10:00:00Z" })];

    const conflict = findConflictingAppointment({ startsAt: "2026-07-13T14:00:00Z", durationMinutes: 50 }, existing);

    expect(conflict).toBeUndefined();
  });
});
