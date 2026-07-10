import type { Charge } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockChargesReadAdapter } from "./MockChargesReadAdapter";

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

describe("MockChargesReadAdapter", () => {
  it("retorna as cobranças do paciente", async () => {
    const seed = { "patient-1": [charge({ id: "c1", status: "em_dia" }), charge({ id: "c2", status: "atrasada" })] };
    const adapter = new MockChargesReadAdapter(seed);

    const charges = await adapter.listChargesByPatient("patient-1");

    expect(charges).toHaveLength(2);
    expect(charges.map((c) => c.status)).toEqual(["em_dia", "atrasada"]);
  });

  it("retorna lista vazia para paciente sem cobranças seedadas", async () => {
    const adapter = new MockChargesReadAdapter({});

    const charges = await adapter.listChargesByPatient("paciente-sem-cobrancas");

    expect(charges).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = { "patient-1": [charge({ id: "c1", amount: 20000 })] };
    const adapter = new MockChargesReadAdapter(seed);

    const first = await adapter.listChargesByPatient("patient-1");
    first[0]!.amount = 999999;

    const second = await adapter.listChargesByPatient("patient-1");
    expect(second[0]?.amount).toBe(20000);
  });

  it("o seed padrão traz os três status para Marina Alves, com valores em centavos", async () => {
    const adapter = new MockChargesReadAdapter();

    const charges = await adapter.listChargesByPatient("3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d");

    expect(charges.map((c) => c.status).sort()).toEqual(["atrasada", "em_dia", "em_dia", "pendente"]);
    expect(charges.every((c) => Number.isInteger(c.amount))).toBe(true);
  });
});
