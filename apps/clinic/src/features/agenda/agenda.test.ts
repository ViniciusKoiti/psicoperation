import type { Appointment } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  addDays,
  buildIsoDateTime,
  formatAppointmentTime,
  formatDayHeader,
  groupAppointmentsByDay,
  isSameDay,
  sortAppointmentsByTime,
  startOfWeek,
  toIsoDate,
  toLocalDateInputValue,
  toLocalTimeInputValue,
  weekDays,
  weekdayLabel,
} from "./agenda";

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

describe("startOfWeek", () => {
  it("retorna a segunda-feira da semana, para qualquer dia dentro dela", () => {
    // 2026-07-13 é uma segunda-feira.
    const monday = new Date(2026, 6, 13);
    const wednesday = new Date(2026, 6, 15);
    const sunday = new Date(2026, 6, 19);

    expect(toIsoDate(startOfWeek(monday))).toBe("2026-07-13");
    expect(toIsoDate(startOfWeek(wednesday))).toBe("2026-07-13");
    expect(toIsoDate(startOfWeek(sunday))).toBe("2026-07-13");
  });
});

describe("addDays / weekDays", () => {
  it("soma dias-calendário preservando meia-noite local", () => {
    const start = new Date(2026, 6, 13);
    expect(toIsoDate(addDays(start, 1))).toBe("2026-07-14");
    expect(toIsoDate(addDays(start, 7))).toBe("2026-07-20");
  });

  it("weekDays retorna os 7 dias da semana, começando na segunda", () => {
    const start = new Date(2026, 6, 13);
    const days = weekDays(start).map(toIsoDate);
    expect(days).toEqual([
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18",
      "2026-07-19",
    ]);
  });
});

describe("isSameDay", () => {
  it("compara só o dia-calendário, ignorando hora", () => {
    expect(isSameDay(new Date(2026, 6, 13, 8), new Date(2026, 6, 13, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 13), new Date(2026, 6, 14))).toBe(false);
  });
});

describe("weekdayLabel / formatDayHeader", () => {
  it("rotula segunda-feira corretamente nos dois estilos", () => {
    const monday = new Date(2026, 6, 13);
    expect(weekdayLabel(monday)).toBe("Segunda-feira");
    expect(weekdayLabel(monday, "short")).toBe("Seg");
    expect(formatDayHeader(monday)).toBe("Seg 13/07");
  });
});

describe("sortAppointmentsByTime / groupAppointmentsByDay", () => {
  it("ordena por horário sem mutar a lista original", () => {
    const list = [appointment({ id: "b", startsAt: "2026-07-13T16:00:00Z" }), appointment({ id: "a", startsAt: "2026-07-13T10:00:00Z" })];
    const original = [...list];

    const sorted = sortAppointmentsByTime(list);

    expect(sorted.map((a) => a.id)).toEqual(["a", "b"]);
    expect(list).toEqual(original);
  });

  it("agrupa por dia-calendário local, cada grupo ordenado por horário", () => {
    const appointments = [
      appointment({ id: "dia1-tarde", startsAt: "2026-07-13T16:00:00Z" }),
      appointment({ id: "dia1-manha", startsAt: "2026-07-13T10:00:00Z" }),
      appointment({ id: "dia2", startsAt: "2026-07-14T10:00:00Z" }),
    ];

    const groups = groupAppointmentsByDay(appointments);

    expect([...groups.keys()].sort()).toEqual(["2026-07-13", "2026-07-14"]);
    expect(groups.get("2026-07-13")?.map((a) => a.id)).toEqual(["dia1-manha", "dia1-tarde"]);
    expect(groups.get("2026-07-14")?.map((a) => a.id)).toEqual(["dia2"]);
  });
});

describe("formatAppointmentTime", () => {
  it("formata só o horário em pt-BR", () => {
    expect(formatAppointmentTime("2026-07-13T14:30:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("buildIsoDateTime / toLocalDateInputValue / toLocalTimeInputValue", () => {
  it("faz o round-trip data+hora locais -> IsoDateTime -> data+hora locais, independente do fuso do runtime", () => {
    const iso = buildIsoDateTime("2026-07-13", "14:30");

    expect(toLocalDateInputValue(iso)).toBe("2026-07-13");
    expect(toLocalTimeInputValue(iso)).toBe("14:30");
  });

  it("preserva minutos com zero à esquerda", () => {
    const iso = buildIsoDateTime("2026-01-05", "09:05");

    expect(toLocalTimeInputValue(iso)).toBe("09:05");
  });
});
