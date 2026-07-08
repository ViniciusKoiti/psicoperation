import type { Patient, PatientPage } from "@psiops/contracts";

import type { PatientsAdapter } from "./PatientsAdapter";

/**
 * Dados de exemplo determinísticos (não são fixtures de teste com seed —
 * apenas estado inicial plausível para o placeholder de dashboard). Valores
 * monetários em centavos (BRL), conforme `MoneyBRL` do contrato.
 */
const SEED_PATIENTS: readonly Patient[] = [
  {
    id: "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d",
    name: "Marina Alves",
    whatsapp: "+5511998765432",
    monthlyFee: 25000,
    billingDay: 10,
    status: "ativo",
    createdAt: "2026-01-05T12:00:00Z",
  },
  {
    id: "8b1e6f3a-2c9d-4e7b-a1f5-6d3c2b9a8e7f",
    name: "Camila Souza",
    monthlyFee: 22000,
    billingDay: 5,
    status: "ativo",
    createdAt: "2026-02-10T12:00:00Z",
  },
  {
    id: "1a4d7c2e-9f8b-4c3a-b6d5-2e1f0a9b8c7d",
    name: "Helena Ribeiro",
    monthlyFee: 28000,
    billingDay: 20,
    status: "inativo",
    createdAt: "2026-03-15T12:00:00Z",
  },
];

/**
 * Implementação em memória de `PatientsAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por clonagem estrutural. Padrão em desenvolvimento e
 * testes — NUNCA deve ser usada em build de produção. O ponto de troca
 * mock → HTTP fica centralizado em `./index.ts`.
 */
export class MockPatientsAdapter implements PatientsAdapter {
  private readonly patients: Patient[];

  constructor(seed: readonly Patient[] = SEED_PATIENTS) {
    this.patients = structuredClone(seed) as Patient[];
  }

  async listPatients(): Promise<PatientPage> {
    const items = structuredClone(this.patients);
    return {
      items,
      meta: {
        page: 0,
        size: items.length,
        totalElements: items.length,
        totalPages: items.length === 0 ? 0 : 1,
      },
    };
  }
}
