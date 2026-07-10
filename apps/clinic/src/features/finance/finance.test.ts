import type { Charge, Patient } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  buildChargeDraftsForMonth,
  buildDueDate,
  formatCompetence,
  formatGenerateSummary,
  groupChargesByStatus,
  shiftCompetence,
  sumChargeAmounts,
  toCompetence,
} from "./finance";

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

function patient(overrides: Partial<Patient>): Patient {
  return {
    id: overrides.id ?? "patient-1",
    name: overrides.name ?? "Marina Alves",
    monthlyFee: overrides.monthlyFee ?? 25000,
    billingDay: overrides.billingDay ?? 10,
    status: overrides.status ?? "ativo",
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("formatCompetence", () => {
  it("formata AAAA-MM como Mês/AAAA em pt-BR", () => {
    expect(formatCompetence("2026-07")).toBe("Julho/2026");
    expect(formatCompetence("2026-01")).toBe("Janeiro/2026");
    expect(formatCompetence("2026-12")).toBe("Dezembro/2026");
  });
});

describe("toCompetence", () => {
  it("extrai a competência (AAAA-MM) de uma data local", () => {
    expect(toCompetence(new Date(2026, 6, 15))).toBe("2026-07");
    expect(toCompetence(new Date(2026, 0, 1))).toBe("2026-01");
  });
});

describe("shiftCompetence", () => {
  it("avança um mês dentro do mesmo ano", () => {
    expect(shiftCompetence("2026-07", 1)).toBe("2026-08");
  });

  it("volta um mês dentro do mesmo ano", () => {
    expect(shiftCompetence("2026-07", -1)).toBe("2026-06");
  });

  it("cruza o limite de ano para frente (dezembro → janeiro)", () => {
    expect(shiftCompetence("2026-12", 1)).toBe("2027-01");
  });

  it("cruza o limite de ano para trás (janeiro → dezembro)", () => {
    expect(shiftCompetence("2026-01", -1)).toBe("2025-12");
  });

  it("delta zero devolve a mesma competência", () => {
    expect(shiftCompetence("2026-07", 0)).toBe("2026-07");
  });
});

describe("groupChargesByStatus + sumChargeAmounts", () => {
  it("agrupa por status e soma os totais em centavos, sem misturar grupos", () => {
    const charges = [
      charge({ id: "c1", status: "em_dia", amount: 25000 }),
      charge({ id: "c2", status: "pendente", amount: 22000 }),
      charge({ id: "c3", status: "atrasada", amount: 25000 }),
      charge({ id: "c4", status: "atrasada", amount: 18000 }),
    ];

    const groups = groupChargesByStatus(charges);

    expect(groups.em_dia.map((c) => c.id)).toEqual(["c1"]);
    expect(groups.pendente.map((c) => c.id)).toEqual(["c2"]);
    expect(groups.atrasada.map((c) => c.id)).toEqual(["c3", "c4"]);

    expect(sumChargeAmounts(groups.em_dia)).toBe(25000);
    expect(sumChargeAmounts(groups.pendente)).toBe(22000);
    expect(sumChargeAmounts(groups.atrasada)).toBe(43000);

    const total = sumChargeAmounts(charges);
    expect(total).toBe(90000);
  });

  it("mês sem mensalidades: grupos e totais ficam zerados/vazios, sem lançar erro", () => {
    const groups = groupChargesByStatus([]);

    expect(groups).toEqual({ em_dia: [], pendente: [], atrasada: [] });
    expect(sumChargeAmounts([])).toBe(0);
  });
});

describe("buildDueDate", () => {
  it("constrói AAAA-MM-DD a partir da competência e do dia de vencimento do paciente", () => {
    expect(buildDueDate("2026-07", 10)).toBe("2026-07-10");
    expect(buildDueDate("2026-02", 28)).toBe("2026-02-28");
    expect(buildDueDate("2026-01", 5)).toBe("2026-01-05");
  });
});

describe("buildChargeDraftsForMonth", () => {
  it("monta um rascunho por paciente ativo, usando monthlyFee/billingDay do paciente", () => {
    const patients = [
      patient({ id: "p1", monthlyFee: 25000, billingDay: 10 }),
      patient({ id: "p2", monthlyFee: 22000, billingDay: 5 }),
    ];

    const drafts = buildChargeDraftsForMonth(patients, "2026-07");

    expect(drafts).toEqual([
      { patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" },
      { patientId: "p2", competence: "2026-07", amount: 22000, dueDate: "2026-07-05" },
    ]);
  });

  it("sem pacientes ativos, devolve lista vazia", () => {
    expect(buildChargeDraftsForMonth([], "2026-07")).toEqual([]);
  });
});

describe("formatGenerateSummary", () => {
  it("sem cobranças ignoradas, mensagem termina em ponto final", () => {
    expect(formatGenerateSummary({ created: [charge({}), charge({ id: "c2" })], skipped: [] })).toBe(
      "2 mensalidade(s) gerada(s).",
    );
  });

  it("com cobranças ignoradas (idempotência), reporta quantas já existiam", () => {
    const draft = { patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" };
    expect(formatGenerateSummary({ created: [], skipped: [draft] })).toBe(
      "0 mensalidade(s) gerada(s); 1 já existia(m) para este mês (nenhuma duplicada).",
    );
  });
});
