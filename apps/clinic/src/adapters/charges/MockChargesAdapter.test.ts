import type { Charge } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import type { ChargeDraft } from "./ChargesAdapter";
import { ChargesAdapterError } from "./ChargesAdapterError";
import { MockChargesAdapter } from "./MockChargesAdapter";

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

describe("MockChargesAdapter — leitura (mantida da PSI-034/032)", () => {
  it("retorna as cobranças do paciente", async () => {
    const seed = { "patient-1": [charge({ id: "c1", status: "em_dia" }), charge({ id: "c2", status: "atrasada" })] };
    const adapter = new MockChargesAdapter(seed);

    const charges = await adapter.listChargesByPatient("patient-1");

    expect(charges).toHaveLength(2);
    expect(charges.map((c) => c.status)).toEqual(["em_dia", "atrasada"]);
  });

  it("retorna lista vazia para paciente sem cobranças seedadas", async () => {
    const adapter = new MockChargesAdapter({});

    const charges = await adapter.listChargesByPatient("paciente-sem-cobrancas");

    expect(charges).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = { "patient-1": [charge({ id: "c1", amount: 20000 })] };
    const adapter = new MockChargesAdapter(seed);

    const first = await adapter.listChargesByPatient("patient-1");
    first[0]!.amount = 999999;

    const second = await adapter.listChargesByPatient("patient-1");
    expect(second[0]?.amount).toBe(20000);
  });

  it("o seed padrão traz os três status para Marina Alves, com valores em centavos", async () => {
    const adapter = new MockChargesAdapter();

    const charges = await adapter.listChargesByPatient("3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d");

    expect(charges.map((c) => c.status).sort()).toEqual(["atrasada", "em_dia", "em_dia", "pendente"]);
    expect(charges.every((c) => Number.isInteger(c.amount))).toBe(true);
  });

  it("listCharges sem filtro retorna as cobranças de todos os pacientes", async () => {
    const seed = {
      "patient-1": [charge({ id: "c1", patientId: "patient-1", status: "em_dia" })],
      "patient-2": [charge({ id: "c2", patientId: "patient-2", status: "atrasada" })],
    };
    const adapter = new MockChargesAdapter(seed);

    const charges = await adapter.listCharges();

    expect(charges.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  });

  it("listCharges filtra por status entre pacientes", async () => {
    const seed = {
      "patient-1": [
        charge({ id: "c1", patientId: "patient-1", status: "pendente" }),
        charge({ id: "c2", patientId: "patient-1", status: "em_dia" }),
      ],
      "patient-2": [charge({ id: "c3", patientId: "patient-2", status: "atrasada" })],
    };
    const adapter = new MockChargesAdapter(seed);

    const pendentes = await adapter.listCharges({ status: "pendente" });
    expect(pendentes.map((c) => c.id)).toEqual(["c1"]);

    const atrasadas = await adapter.listCharges({ status: "atrasada" });
    expect(atrasadas.map((c) => c.id)).toEqual(["c3"]);
  });

  it("listCharges filtra por competência entre pacientes (extensão PSI-037)", async () => {
    const seed = {
      "patient-1": [
        charge({ id: "c1", patientId: "patient-1", competence: "2026-06" }),
        charge({ id: "c2", patientId: "patient-1", competence: "2026-07" }),
      ],
      "patient-2": [charge({ id: "c3", patientId: "patient-2", competence: "2026-07" })],
    };
    const adapter = new MockChargesAdapter(seed);

    const july = await adapter.listCharges({ competence: "2026-07" });
    expect(july.map((c) => c.id).sort()).toEqual(["c2", "c3"]);
  });

  it("listCharges combina status e competência", async () => {
    const seed = {
      "patient-1": [
        charge({ id: "c1", patientId: "patient-1", competence: "2026-07", status: "pendente" }),
        charge({ id: "c2", patientId: "patient-1", competence: "2026-07", status: "em_dia" }),
        charge({ id: "c3", patientId: "patient-1", competence: "2026-06", status: "pendente" }),
      ],
    };
    const adapter = new MockChargesAdapter(seed);

    const result = await adapter.listCharges({ competence: "2026-07", status: "pendente" });
    expect(result.map((c) => c.id)).toEqual(["c1"]);
  });
});

describe("MockChargesAdapter — geração idempotente do mês (PSI-037)", () => {
  it("gera uma cobrança por rascunho quando nenhuma existia ainda", async () => {
    let idCounter = 0;
    const adapter = new MockChargesAdapter(
      {},
      { clock: () => new Date("2026-07-01T12:00:00").getTime(), idGenerator: () => `gen-${++idCounter}` },
    );
    const drafts: ChargeDraft[] = [
      { patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" },
      { patientId: "p2", competence: "2026-07", amount: 22000, dueDate: "2026-07-05" },
    ];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created).toHaveLength(2);
    expect(result.skipped).toEqual([]);
    expect(result.created.map((c) => c.patientId).sort()).toEqual(["p1", "p2"]);

    const p1Charges = await adapter.listChargesByPatient("p1");
    expect(p1Charges).toHaveLength(1);
  });

  it("é idempotente: não duplica mensalidade já gerada para o mesmo paciente+competência", async () => {
    const seed = { p1: [charge({ id: "existing", patientId: "p1", competence: "2026-07" })] };
    const adapter = new MockChargesAdapter(seed, { clock: () => new Date("2026-07-01").getTime() });
    const drafts: ChargeDraft[] = [{ patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" }];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual(drafts);

    const p1Charges = await adapter.listChargesByPatient("p1");
    expect(p1Charges).toHaveLength(1);
    expect(p1Charges[0]?.id).toBe("existing");
  });

  it("processa uma segunda chamada com o mesmo mês sem duplicar (chamar duas vezes seguidas)", async () => {
    const adapter = new MockChargesAdapter({}, { clock: () => new Date("2026-07-01").getTime() });
    const drafts: ChargeDraft[] = [{ patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" }];

    const first = await adapter.generateMonthlyCharges(drafts);
    const second = await adapter.generateMonthlyCharges(drafts);

    expect(first.created).toHaveLength(1);
    expect(second.created).toHaveLength(0);
    expect(second.skipped).toHaveLength(1);

    const p1Charges = await adapter.listChargesByPatient("p1");
    expect(p1Charges).toHaveLength(1);
  });

  it("mistura criados e ignorados no mesmo lote (idempotência parcial)", async () => {
    const seed = { p1: [charge({ id: "existing", patientId: "p1", competence: "2026-07" })] };
    const adapter = new MockChargesAdapter(seed, { clock: () => new Date("2026-07-01").getTime() });
    const drafts: ChargeDraft[] = [
      { patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" },
      { patientId: "p2", competence: "2026-07", amount: 22000, dueDate: "2026-07-05" },
    ];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created.map((c) => c.patientId)).toEqual(["p2"]);
    expect(result.skipped.map((d) => d.patientId)).toEqual(["p1"]);
  });

  it("mensalidade gerada com vencimento futuro nasce 'pendente'", async () => {
    const adapter = new MockChargesAdapter({}, { clock: () => new Date(2026, 6, 1).getTime() });
    const drafts: ChargeDraft[] = [{ patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" }];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created[0]?.status).toBe("pendente");
  });

  it("mensalidade gerada já vencida (vencimento no passado) nasce 'atrasada'", async () => {
    const adapter = new MockChargesAdapter({}, { clock: () => new Date(2026, 6, 20).getTime() });
    const drafts: ChargeDraft[] = [{ patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" }];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created[0]?.status).toBe("atrasada");
  });

  it("mensalidade gerada no PRÓPRIO dia do vencimento ainda é 'pendente' (só atrasa no dia seguinte)", async () => {
    const adapter = new MockChargesAdapter({}, { clock: () => new Date(2026, 6, 10).getTime() });
    const drafts: ChargeDraft[] = [{ patientId: "p1", competence: "2026-07", amount: 25000, dueDate: "2026-07-10" }];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created[0]?.status).toBe("pendente");
  });

  it("preserva os juros do rascunho quando informados", async () => {
    const adapter = new MockChargesAdapter({}, { clock: () => new Date(2026, 6, 1).getTime() });
    const drafts: ChargeDraft[] = [
      {
        patientId: "p1",
        competence: "2026-07",
        amount: 25000,
        dueDate: "2026-07-10",
        interest: { monthlyRatePercent: 1, finePercent: 2 },
      },
    ];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(result.created[0]?.interest).toEqual({ monthlyRatePercent: 1, finePercent: 2 });
  });
});

describe("MockChargesAdapter — marcar como paga + desfazer (PSI-037)", () => {
  it("registra o pagamento, atualiza status para em_dia", async () => {
    const seed = { p1: [charge({ id: "c1", patientId: "p1", status: "pendente" })] };
    const adapter = new MockChargesAdapter(seed);

    const updated = await adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });

    expect(updated.status).toBe("em_dia");
    expect(updated.payment).toEqual({ paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });

    const stored = await adapter.listChargesByPatient("p1");
    expect(stored[0]?.status).toBe("em_dia");
  });

  it("lança 404 ao tentar pagar cobrança inexistente", async () => {
    const adapter = new MockChargesAdapter({});

    await expect(
      adapter.registerChargePayment("inexistente", { paidAmount: 100, paidAt: "2026-07-05T12:00:00Z", method: "pix" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("lança 409 ao tentar pagar uma cobrança já paga", async () => {
    const seed = {
      p1: [charge({ id: "c1", patientId: "p1", status: "em_dia", payment: { paidAmount: 20000, paidAt: "2026-07-01T00:00:00Z", method: "pix" } })],
    };
    const adapter = new MockChargesAdapter(seed);

    const rejection = adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    await expect(rejection).rejects.toBeInstanceOf(ChargesAdapterError);
    await expect(rejection).rejects.toMatchObject({ status: 409 });
  });

  it("desfazer restaura exatamente o status e o pagamento anteriores", async () => {
    const seed = { p1: [charge({ id: "c1", patientId: "p1", status: "atrasada" })] };
    const adapter = new MockChargesAdapter(seed);

    await adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    const undone = await adapter.undoChargePayment("c1");

    expect(undone.status).toBe("atrasada");
    expect(undone.payment).toBeUndefined();

    const stored = await adapter.listChargesByPatient("p1");
    expect(stored[0]?.status).toBe("atrasada");
    expect(stored[0]?.payment).toBeUndefined();
  });

  it("lança 404 ao desfazer quando não há pagamento registrado para desfazer", async () => {
    const seed = { p1: [charge({ id: "c1", patientId: "p1", status: "pendente" })] };
    const adapter = new MockChargesAdapter(seed);

    await expect(adapter.undoChargePayment("c1")).rejects.toMatchObject({ status: 404 });
  });

  it("desfazer duas vezes seguidas na segunda vez lança 404 (log de undo é consumido)", async () => {
    const seed = { p1: [charge({ id: "c1", patientId: "p1", status: "pendente" })] };
    const adapter = new MockChargesAdapter(seed);

    await adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    await adapter.undoChargePayment("c1");

    await expect(adapter.undoChargePayment("c1")).rejects.toMatchObject({ status: 404 });
  });

  it("pagar novamente após desfazer funciona normalmente", async () => {
    const seed = { p1: [charge({ id: "c1", patientId: "p1", status: "pendente" })] };
    const adapter = new MockChargesAdapter(seed);

    await adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    await adapter.undoChargePayment("c1");
    const paidAgain = await adapter.registerChargePayment("c1", { paidAmount: 20000, paidAt: "2026-07-06T12:00:00Z", method: "dinheiro" });

    expect(paidAgain.status).toBe("em_dia");
    expect(paidAgain.payment?.method).toBe("dinheiro");
  });
});
