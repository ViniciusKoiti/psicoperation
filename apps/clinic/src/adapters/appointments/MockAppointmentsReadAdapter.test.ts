import type { Appointment } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockAppointmentsReadAdapter } from "./MockAppointmentsReadAdapter";

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "apt-1",
    patientId: overrides.patientId ?? "patient-1",
    startsAt: overrides.startsAt ?? "2026-01-01T10:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "agendada",
    createdAt: overrides.createdAt ?? "2025-12-01T10:00:00Z",
    ...overrides,
  };
}

describe("MockAppointmentsReadAdapter", () => {
  it("retorna o histórico do paciente, incluindo o registro de presença quando houver", async () => {
    const seed = {
      "patient-1": [
        { appointment: appointment({ id: "apt-1" }), attendance: { attendance: "compareceu" as const } },
        { appointment: appointment({ id: "apt-2", status: "cancelada" }) },
      ],
    };
    const adapter = new MockAppointmentsReadAdapter(seed);

    const entries = await adapter.listAppointmentsByPatient("patient-1");

    expect(entries).toHaveLength(2);
    expect(entries[0]?.attendance?.attendance).toBe("compareceu");
    expect(entries[1]?.attendance).toBeUndefined();
  });

  it("retorna lista vazia para paciente sem consultas seedadas", async () => {
    const adapter = new MockAppointmentsReadAdapter({});

    const entries = await adapter.listAppointmentsByPatient("paciente-sem-historico");

    expect(entries).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = { "patient-1": [{ appointment: appointment({ id: "apt-1" }) }] };
    const adapter = new MockAppointmentsReadAdapter(seed);

    const first = await adapter.listAppointmentsByPatient("patient-1");
    first[0]!.appointment.status = "cancelada";

    const second = await adapter.listAppointmentsByPatient("patient-1");
    expect(second[0]?.appointment.status).toBe("agendada");
  });

  it("o seed padrão traz histórico variado para Marina Alves e um volume grande para Camila Souza", async () => {
    const adapter = new MockAppointmentsReadAdapter();

    const marina = await adapter.listAppointmentsByPatient("3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d");
    const camila = await adapter.listAppointmentsByPatient("8b1e6f3a-2c9d-4e7b-a1f5-6d3c2b9a8e7f");

    expect(marina.length).toBeGreaterThan(1);
    expect(marina.some((entry) => entry.appointment.status === "agendada")).toBe(true);
    expect(marina.some((entry) => entry.attendance?.attendance === "faltou")).toBe(true);
    expect(camila.length).toBeGreaterThan(10);
  });
});
