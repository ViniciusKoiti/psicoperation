import type { Charge, ChargeStatus, RegisterPaymentRequest } from "@psiops/contracts";

import type { ChargeDraft, ChargesAdapter, GenerateMonthlyChargesResult } from "./ChargesAdapter";
import { ChargesAdapterError } from "./ChargesAdapterError";
import type { ListChargesParams } from "./ChargesReadAdapter";

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
 * agrupamento financeiro; Camila Souza tem uma cobrança pendente. Pacientes
 * sem chave aqui (ex.: Beatriz Nogueira) resolvem com lista vazia — cenário
 * de estado vazio por seção.
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

export interface MockChargesAdapterOptions {
  /** Relógio injetável — determinismo nos testes (`createdAt` gerado e status inicial de mensalidades geradas). */
  clock?: () => number;
  /** Gerador de identificadores injetável — determinismo nos testes. */
  idGenerator?: () => string;
}

/** Meia-noite local do dia de `date` como `AAAA-MM-DD`, sem componente de hora — mesma técnica de `toIsoDate` (`src/features/dashboard/dashboard.ts`), duplicada aqui porque adapters não importam de features. */
function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Status inicial de uma mensalidade recém-gerada, dado seu vencimento e
 * "hoje" (assumption do manifesto: "mensalidade vencida e não paga torna-se
 * 'atrasada' no dia seguinte ao vencimento, no fuso do navegador" — ou seja,
 * `atrasada` só a partir do dia SEGUINTE, nunca no próprio dia do
 * vencimento). Charges já existentes NUNCA têm seu `status` recalculado por
 * este helper — só é usado no momento da criação (`generateMonthlyCharges`),
 * o mock agindo como "servidor" que decide o status inicial; depois disso,
 * `status` é sempre o valor armazenado (mesma regra de não recomputar a
 * partir de `dueDate` no cliente que `selectOutstandingCharges`,
 * `src/features/dashboard/dashboard.ts`, já documenta).
 */
function computeInitialStatus(dueDate: string, todayIso: string): ChargeStatus {
  return todayIso > dueDate ? "atrasada" : "pendente";
}

/**
 * Implementação em memória de `ChargesAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas fronteiras.
 * Padrão em desenvolvimento e testes. SUBSTITUI `MockChargesReadAdapter`
 * (PSI-034/032) — ver a nota de reconciliação em `ChargesReadAdapter.ts`.
 */
export class MockChargesAdapter implements ChargesAdapter {
  private readonly chargesByPatient: Record<string, Charge[]>;
  private readonly clock: () => number;
  private readonly idGenerator: () => string;
  // Snapshot de UM pagamento desfazível por cobrança (o mais recente
  // registrado nesta sessão do adapter) — ver a ressalva de
  // `undoChargePayment` em `ChargesAdapter.ts`.
  private readonly paymentUndoLog: Map<string, Charge> = new Map();

  constructor(seed: Readonly<Record<string, readonly Charge[]>> = SEED, options: MockChargesAdapterOptions = {}) {
    this.chargesByPatient = structuredClone(seed) as Record<string, Charge[]>;
    this.clock = options.clock ?? (() => Date.now());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
  }

  async listChargesByPatient(patientId: string): Promise<Charge[]> {
    const charges = this.chargesByPatient[patientId] ?? [];
    return structuredClone(charges);
  }

  async listCharges(params: ListChargesParams = {}): Promise<Charge[]> {
    const all = Object.values(this.chargesByPatient).flat();
    const filtered = all.filter((charge) => {
      if (params.status && charge.status !== params.status) return false;
      if (params.competence && charge.competence !== params.competence) return false;
      return true;
    });
    return structuredClone(filtered);
  }

  async generateMonthlyCharges(drafts: readonly ChargeDraft[]): Promise<GenerateMonthlyChargesResult> {
    const todayIso = toLocalIsoDate(new Date(this.clock()));
    const created: Charge[] = [];
    const skipped: ChargeDraft[] = [];

    for (const draft of drafts) {
      const existing = (this.chargesByPatient[draft.patientId] ?? []).find(
        (charge) => charge.competence === draft.competence,
      );
      if (existing) {
        skipped.push(draft);
        continue;
      }

      const charge: Charge = {
        id: this.idGenerator(),
        patientId: draft.patientId,
        competence: draft.competence,
        amount: draft.amount,
        dueDate: draft.dueDate,
        status: computeInitialStatus(draft.dueDate, todayIso),
        createdAt: new Date(this.clock()).toISOString(),
        ...(draft.interest ? { interest: draft.interest } : {}),
      };

      const list = this.chargesByPatient[draft.patientId];
      if (list) {
        list.push(charge);
      } else {
        this.chargesByPatient[draft.patientId] = [charge];
      }
      created.push(structuredClone(charge));
    }

    return { created, skipped: structuredClone(skipped) };
  }

  async registerChargePayment(chargeId: string, payload: RegisterPaymentRequest): Promise<Charge> {
    const ref = this.findChargeRef(chargeId);
    if (!ref) {
      throw new ChargesAdapterError(`Cobrança ${chargeId} não encontrada.`, 404);
    }
    const { list, index } = ref;
    const current = list[index] as Charge;
    if (current.payment) {
      throw new ChargesAdapterError("Esta mensalidade já está paga.", 409);
    }

    // Snapshot ANTES da mutação — é o que `undoChargePayment` restaura.
    this.paymentUndoLog.set(chargeId, structuredClone(current));

    const updated: Charge = {
      ...current,
      status: "em_dia",
      payment: {
        paidAmount: payload.paidAmount,
        paidAt: payload.paidAt,
        method: payload.method,
        ...(payload.note ? { note: payload.note } : {}),
      },
    };
    list[index] = updated;
    return structuredClone(updated);
  }

  async undoChargePayment(chargeId: string): Promise<Charge> {
    const snapshot = this.paymentUndoLog.get(chargeId);
    if (!snapshot) {
      throw new ChargesAdapterError(`Nenhum pagamento para desfazer na cobrança ${chargeId}.`, 404);
    }
    const ref = this.findChargeRef(chargeId);
    if (!ref) {
      throw new ChargesAdapterError(`Cobrança ${chargeId} não encontrada.`, 404);
    }
    ref.list[ref.index] = structuredClone(snapshot);
    this.paymentUndoLog.delete(chargeId);
    return structuredClone(snapshot);
  }

  // --- Internos ---

  private findChargeRef(chargeId: string): { list: Charge[]; index: number } | undefined {
    for (const list of Object.values(this.chargesByPatient)) {
      const index = list.findIndex((charge) => charge.id === chargeId);
      if (index !== -1) return { list, index };
    }
    return undefined;
  }
}
