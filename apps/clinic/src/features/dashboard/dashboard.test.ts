import type { Appointment, Charge, Task } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  formatAppointmentTime,
  formatCentsAsBRL,
  formatIsoDateLabel,
  isTaskOverdue,
  selectDueTasks,
  selectOutstandingCharges,
  selectTodayAppointments,
  sumChargeAmounts,
  toIsoDate,
} from "./dashboard";

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "apt-1",
    patientId: overrides.patientId ?? "patient-1",
    startsAt: overrides.startsAt ?? "2026-07-10T14:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "agendada",
    createdAt: overrides.createdAt ?? "2026-06-01T10:00:00Z",
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

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("toIsoDate", () => {
  it("formata a data local como AAAA-MM-DD", () => {
    expect(toIsoDate(new Date(2026, 6, 10))).toBe("2026-07-10");
  });
});

describe("selectTodayAppointments", () => {
  it("filtra pelo dia-calendário LOCAL e ordena por horário", () => {
    const appointments = [
      appointment({ id: "tarde", startsAt: "2026-07-10T18:00:00Z" }),
      appointment({ id: "manha", startsAt: "2026-07-10T13:00:00Z" }),
      appointment({ id: "outro-dia", startsAt: "2026-07-11T13:00:00Z" }),
    ];

    const result = selectTodayAppointments(appointments, "2026-07-10");

    expect(result.map((a) => a.id)).toEqual(["manha", "tarde"]);
  });

  it("respeita a fronteira de fuso: um horário perto da meia-noite UTC pode cair no dia-calendário local anterior/seguinte", () => {
    // Em America/Sao_Paulo (UTC-3), 2026-07-10T02:00:00Z é 2026-07-09 23:00
    // local — dia ANTERIOR ao dia-calendário UTC. Este é exatamente o risco
    // de fuso citado no manifesto: usar o componente UTC ingenuamente
    // colocaria esta consulta no dia errado.
    const beforeMidnightLocal = appointment({ id: "quase-meia-noite", startsAt: "2026-07-10T02:00:00Z" });

    const forJul9 = selectTodayAppointments([beforeMidnightLocal], "2026-07-09");
    const forJul10 = selectTodayAppointments([beforeMidnightLocal], "2026-07-10");

    expect(forJul9.map((a) => a.id)).toEqual(["quase-meia-noite"]);
    expect(forJul10).toEqual([]);
  });

  it("retorna lista vazia quando não há consultas no dia", () => {
    expect(selectTodayAppointments([], "2026-07-10")).toEqual([]);
  });
});

describe("selectOutstandingCharges", () => {
  it("mantém só pendente/atrasada, com atrasadas primeiro e depois por vencimento", () => {
    const charges = [
      charge({ id: "em-dia", status: "em_dia" }),
      charge({ id: "pendente-tarde", status: "pendente", dueDate: "2026-07-20" }),
      charge({ id: "atrasada-recente", status: "atrasada", dueDate: "2026-06-15" }),
      charge({ id: "atrasada-antiga", status: "atrasada", dueDate: "2026-04-10" }),
      charge({ id: "pendente-cedo", status: "pendente", dueDate: "2026-07-05" }),
    ];

    const result = selectOutstandingCharges(charges);

    expect(result.map((c) => c.id)).toEqual(["atrasada-antiga", "atrasada-recente", "pendente-cedo", "pendente-tarde"]);
  });

  it("usa Charge.status diretamente, sem recalcular a partir de dueDate", () => {
    // dueDate já passou, mas o status vindo do domínio ainda é "pendente" —
    // a função não deve "corrigir" isso no cliente.
    const stillPending = charge({ id: "c1", status: "pendente", dueDate: "2020-01-01" });

    expect(selectOutstandingCharges([stillPending]).map((c) => c.id)).toEqual(["c1"]);
  });

  it("retorna lista vazia quando não há pendências", () => {
    expect(selectOutstandingCharges([charge({ status: "em_dia" })])).toEqual([]);
  });
});

describe("sumChargeAmounts", () => {
  it("soma os valores em centavos inteiros", () => {
    const total = sumChargeAmounts([charge({ amount: 25000 }), charge({ amount: 22000 })]);
    expect(total).toBe(47000);
    expect(Number.isInteger(total)).toBe(true);
  });

  it("soma zero para lista vazia", () => {
    expect(sumChargeAmounts([])).toBe(0);
  });
});

describe("formatCentsAsBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(formatCentsAsBRL(47000)).toBe("R$ 470,00");
  });
});

describe("formatAppointmentTime", () => {
  it("formata só o horário em pt-BR", () => {
    expect(formatAppointmentTime("2026-07-10T13:00:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("formatIsoDateLabel", () => {
  it("formata AAAA-MM-DD como dd/mm/aaaa sem deslocar por fuso", () => {
    expect(formatIsoDateLabel("2026-07-10")).toBe("10/07/2026");
  });
});

describe("selectDueTasks", () => {
  it("inclui tarefas vencendo hoje ou atrasadas, exclui futuras e concluídas", () => {
    const tasks = [
      task({ id: "atrasada", dueDate: "2026-07-08" }),
      task({ id: "hoje", dueDate: "2026-07-10" }),
      task({ id: "futura", dueDate: "2026-07-15" }),
      task({ id: "concluida", dueDate: "2026-07-05", completedAt: "2026-07-05T10:00:00Z" }),
      task({ id: "sem-vencimento" }),
    ];

    const result = selectDueTasks(tasks, "2026-07-10");

    expect(result.map((t) => t.id)).toEqual(["atrasada", "hoje"]);
  });

  it("ordena as mais atrasadas primeiro", () => {
    const tasks = [
      task({ id: "recente", dueDate: "2026-07-09" }),
      task({ id: "antiga", dueDate: "2026-07-01" }),
    ];

    expect(selectDueTasks(tasks, "2026-07-10").map((t) => t.id)).toEqual(["antiga", "recente"]);
  });

  it("retorna lista vazia quando não há tarefas devidas", () => {
    expect(selectDueTasks([task({ dueDate: "2026-08-01" })], "2026-07-10")).toEqual([]);
  });
});

describe("isTaskOverdue", () => {
  it("é atrasada quando o vencimento é anterior a hoje", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-08" }), "2026-07-10")).toBe(true);
  });

  it("não é atrasada quando o vencimento é hoje", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-10" }), "2026-07-10")).toBe(false);
  });

  it("não é atrasada quando não há vencimento", () => {
    expect(isTaskOverdue(task({}), "2026-07-10")).toBe(false);
  });
});
