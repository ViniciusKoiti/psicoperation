import type { Appointment, Charge } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import type { AppointmentHistoryEntry } from "../../adapters/appointments";
import {
  formatAppointmentDateTime,
  formatCompetence,
  formatIsoDate,
  groupChargesByStatus,
  hasAttendanceRecord,
  sortAppointmentsDescending,
  sumChargeAmounts,
} from "./patientDetail";

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

function charge(overrides: Partial<Charge>): Charge {
  return {
    id: overrides.id ?? "charge-1",
    patientId: overrides.patientId ?? "patient-1",
    competence: overrides.competence ?? "2026-07",
    amount: overrides.amount ?? 20000,
    dueDate: overrides.dueDate ?? "2026-07-10",
    status: overrides.status ?? "pendente",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("formatAppointmentDateTime", () => {
  it("formata data e hora em pt-BR", () => {
    const { date, time } = formatAppointmentDateTime("2026-07-13T14:30:00Z");
    expect(date).toMatch(/^\d{2}\/\d{2}\/2026$/);
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("formatIsoDate", () => {
  it("formata AAAA-MM-DD como dd/mm/aaaa sem deslocar o dia", () => {
    expect(formatIsoDate("2026-07-10")).toBe("10/07/2026");
    expect(formatIsoDate("2026-01-01")).toBe("01/01/2026");
  });
});

describe("formatCompetence", () => {
  it("formata AAAA-MM como Mês/AAAA em pt-BR", () => {
    expect(formatCompetence("2026-07")).toBe("Julho/2026");
    expect(formatCompetence("2026-01")).toBe("Janeiro/2026");
  });
});

describe("sortAppointmentsDescending", () => {
  it("ordena da consulta mais recente para a mais antiga, incluindo futuras", () => {
    const entries: AppointmentHistoryEntry[] = [
      { appointment: appointment({ id: "past", startsAt: "2026-01-01T10:00:00Z" }) },
      { appointment: appointment({ id: "future", startsAt: "2026-12-01T10:00:00Z" }) },
      { appointment: appointment({ id: "middle", startsAt: "2026-06-01T10:00:00Z" }) },
    ];

    const sorted = sortAppointmentsDescending(entries);

    expect(sorted.map((e) => e.appointment.id)).toEqual(["future", "middle", "past"]);
  });

  it("não muta o array original", () => {
    const entries: AppointmentHistoryEntry[] = [
      { appointment: appointment({ id: "a", startsAt: "2026-01-01T10:00:00Z" }) },
      { appointment: appointment({ id: "b", startsAt: "2026-02-01T10:00:00Z" }) },
    ];
    const original = [...entries];

    sortAppointmentsDescending(entries);

    expect(entries).toEqual(original);
  });
});

describe("hasAttendanceRecord", () => {
  it("distingue consultas com e sem registro administrativo de presença", () => {
    const withAttendance: AppointmentHistoryEntry = {
      appointment: appointment({ id: "a" }),
      attendance: { attendance: "compareceu" },
    };
    const withoutAttendance: AppointmentHistoryEntry = { appointment: appointment({ id: "b" }) };

    expect(hasAttendanceRecord(withAttendance)).toBe(true);
    expect(hasAttendanceRecord(withoutAttendance)).toBe(false);
  });
});

describe("groupChargesByStatus", () => {
  it("agrupa cobranças por status, mantendo os três grupos mesmo vazios", () => {
    const charges = [
      charge({ id: "c1", status: "em_dia" }),
      charge({ id: "c2", status: "atrasada" }),
      charge({ id: "c3", status: "em_dia" }),
    ];

    const groups = groupChargesByStatus(charges);

    expect(groups.em_dia.map((c) => c.id)).toEqual(["c1", "c3"]);
    expect(groups.atrasada.map((c) => c.id)).toEqual(["c2"]);
    expect(groups.pendente).toEqual([]);
  });

  it("retorna os três grupos vazios quando não há cobranças", () => {
    expect(groupChargesByStatus([])).toEqual({ em_dia: [], pendente: [], atrasada: [] });
  });
});

describe("sumChargeAmounts", () => {
  it("soma os valores em centavos", () => {
    expect(sumChargeAmounts([charge({ amount: 20000 }), charge({ amount: 5000 })])).toBe(25000);
  });

  it("soma zero para lista vazia", () => {
    expect(sumChargeAmounts([])).toBe(0);
  });
});
