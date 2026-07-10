import type { Charge } from "@psiops/contracts";

import type { ChargesReadAdapter } from "./ChargesReadAdapter";

// IDs compartilhados com o seed de `MockPatientsAdapter`
// (src/adapters/patients/MockPatientsAdapter.ts) só para o mock de
// desenvolvimento ficar coerente — não há acoplamento de código entre os
// dois mocks.
const MARINA_ALVES_ID = "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d";
const CAMILA_SOUZA_ID = "8b1e6f3a-2c9d-4e7b-a1f5-6d3c2b9a8e7f";

/**
 * Seed de exemplo determinístico (não é fixture de teste com seed — estado
 * inicial plausível para dev/demo, no mesmo espírito de
 * `MockPatientsAdapter`). Valores em centavos (BRL), conforme `MoneyBRL` do
 * contrato. Marina Alves tem mensalidades nos três status (`em_dia`,
 * `pendente`, `atrasada`, esta com juros simples) para exercitar o
 * agrupamento financeiro da tela de detalhe; Camila Souza tem uma cobrança
 * pendente. Pacientes sem chave aqui (ex.: Beatriz Nogueira) resolvem com
 * lista vazia — cenário de estado vazio por seção.
 */
const SEED: Readonly<Record<string, readonly Charge[]>> = {
  [MARINA_ALVES_ID]: [
    {
      id: "d1a1a1a1-0001-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      competence: "2026-04",
      amount: 25000,
      dueDate: "2026-04-10",
      status: "atrasada",
      interest: { monthlyRatePercent: 1, finePercent: 2 },
      createdAt: "2026-04-01T09:00:00Z",
    },
    {
      id: "d1a1a1a1-0002-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      competence: "2026-05",
      amount: 25000,
      dueDate: "2026-05-10",
      status: "em_dia",
      payment: { paidAmount: 25000, paidAt: "2026-05-09T18:00:00Z", method: "pix" },
      createdAt: "2026-05-01T09:00:00Z",
    },
    {
      id: "d1a1a1a1-0003-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      competence: "2026-06",
      amount: 25000,
      dueDate: "2026-06-10",
      status: "em_dia",
      payment: { paidAmount: 25000, paidAt: "2026-06-08T18:00:00Z", method: "pix" },
      createdAt: "2026-06-01T09:00:00Z",
    },
    {
      id: "d1a1a1a1-0004-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      competence: "2026-07",
      amount: 25000,
      dueDate: "2026-07-10",
      status: "pendente",
      createdAt: "2026-07-01T09:00:00Z",
    },
  ],
  [CAMILA_SOUZA_ID]: [
    {
      id: "d2a2a2a2-0001-4e7b-a1f5-6d3c2b9a8e7f",
      patientId: CAMILA_SOUZA_ID,
      competence: "2026-07",
      amount: 22000,
      dueDate: "2026-07-05",
      status: "pendente",
      createdAt: "2026-07-01T09:00:00Z",
    },
  ],
};

/**
 * Implementação em memória de `ChargesReadAdapter` (ADR 0006): sem rede,
 * sem banco, estado isolado por instância, clonagem estrutural nas
 * fronteiras. Padrão em desenvolvimento e testes.
 */
export class MockChargesReadAdapter implements ChargesReadAdapter {
  private readonly chargesByPatient: Record<string, Charge[]>;

  constructor(seed: Readonly<Record<string, readonly Charge[]>> = SEED) {
    this.chargesByPatient = structuredClone(seed) as Record<string, Charge[]>;
  }

  async listChargesByPatient(patientId: string): Promise<Charge[]> {
    const charges = this.chargesByPatient[patientId] ?? [];
    return structuredClone(charges);
  }
}
