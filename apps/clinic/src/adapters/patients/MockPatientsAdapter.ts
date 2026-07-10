import type { Patient, PatientCreateRequest, PatientPage, PatientUpdateRequest } from "@psiops/contracts";

import { PatientsAdapterError } from "./PatientsAdapterError";
import type { ListPatientsParams, PatientsAdapter } from "./PatientsAdapter";

/** Tamanho de página padrão quando `ListPatientsParams.size` não é informado. */
export const DEFAULT_PATIENTS_PAGE_SIZE = 10;

/**
 * Dados de exemplo determinísticos (não são fixtures de teste com seed —
 * apenas estado inicial plausível para dev/demo). Valores monetários em
 * centavos (BRL), conforme `MoneyBRL` do contrato. Deliberadamente mais de
 * `DEFAULT_PATIENTS_PAGE_SIZE` pacientes ativos para exercitar paginação real
 * (segunda página) sem precisar de fixtures extras nos testes.
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
    email: "camila.souza@exemplo.com.br",
    monthlyFee: 22000,
    billingDay: 5,
    status: "ativo",
    createdAt: "2026-02-10T12:00:00Z",
  },
  {
    id: "5c4d3e2f-1a0b-4c9d-8e7f-6a5b4c3d2e1f",
    name: "Beatriz Nogueira",
    whatsapp: "+5521987654321",
    monthlyFee: 20000,
    billingDay: 15,
    status: "ativo",
    createdAt: "2026-02-12T12:00:00Z",
  },
  {
    id: "2d1e0f9c-8b7a-4d3c-9e8f-7a6b5c4d3e2f",
    name: "Fernanda Lima",
    email: "fernanda.lima@exemplo.com.br",
    monthlyFee: 24000,
    billingDay: 8,
    status: "ativo",
    createdAt: "2026-02-14T12:00:00Z",
  },
  {
    id: "9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b",
    name: "Juliana Prado",
    whatsapp: "+5531999998888",
    monthlyFee: 18000,
    billingDay: 20,
    status: "ativo",
    createdAt: "2026-02-16T12:00:00Z",
  },
  {
    id: "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
    name: "Larissa Costa",
    monthlyFee: 26000,
    billingDay: 3,
    status: "ativo",
    createdAt: "2026-02-18T12:00:00Z",
  },
  {
    id: "1b2c3d4e-5f60-4172-9384-95a6b7c8d9e0",
    name: "Patrícia Rocha",
    email: "patricia.rocha@exemplo.com.br",
    monthlyFee: 21000,
    billingDay: 25,
    status: "ativo",
    createdAt: "2026-02-20T12:00:00Z",
  },
  {
    id: "2c3d4e5f-6071-4283-a495-a6b7c8d9e0f1",
    name: "Renata Fontes",
    whatsapp: "+5541988887777",
    monthlyFee: 23000,
    billingDay: 12,
    status: "ativo",
    createdAt: "2026-02-22T12:00:00Z",
  },
  {
    id: "3d4e5f60-7182-4394-b5a6-b7c8d9e0f1a2",
    name: "Vanessa Martins",
    monthlyFee: 19000,
    billingDay: 18,
    status: "ativo",
    createdAt: "2026-02-24T12:00:00Z",
  },
  {
    id: "4e5f6071-8293-44a5-c6b7-c8d9e0f1a2b3",
    name: "Débora Andrade",
    email: "debora.andrade@exemplo.com.br",
    monthlyFee: 27000,
    billingDay: 7,
    status: "ativo",
    createdAt: "2026-02-26T12:00:00Z",
  },
  {
    id: "5f607182-93a4-45b6-d7c8-d9e0f1a2b3c4",
    name: "Aline Barbosa",
    whatsapp: "+5551977776666",
    monthlyFee: 20000,
    billingDay: 22,
    status: "ativo",
    createdAt: "2026-02-28T12:00:00Z",
  },
  {
    id: "60718293-a4b5-46c7-e8d9-e0f1a2b3c4d5",
    name: "Simone Cardoso",
    monthlyFee: 22500,
    billingDay: 14,
    status: "ativo",
    createdAt: "2026-03-01T12:00:00Z",
  },
  {
    id: "1a4d7c2e-9f8b-4c3a-b6d5-2e1f0a9b8c7d",
    name: "Helena Ribeiro",
    monthlyFee: 28000,
    billingDay: 20,
    status: "inativo",
    createdAt: "2026-03-15T12:00:00Z",
  },
  {
    id: "718293a4-b5c6-47d8-f9e0-f1a2b3c4d5e6",
    name: "Cristiane Melo",
    monthlyFee: 17000,
    billingDay: 9,
    status: "inativo",
    createdAt: "2026-03-18T12:00:00Z",
  },
];

export interface MockPatientsAdapterOptions {
  /** Relógio injetável — determinismo nos testes (ex.: `createdAt`). */
  clock?: () => number;
  /** Gerador de identificadores injetável — determinismo nos testes. */
  idGenerator?: () => string;
}

/** Remove diacríticos e normaliza caixa — busca por nome insensível a maiúsculas/acentos (assumption do manifesto). */
function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Implementação em memória de `PatientsAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas
 * fronteiras. Padrão em desenvolvimento e testes — NUNCA deve ser usada em
 * build de produção por padrão (o ponto de troca mock → HTTP fica
 * centralizado em `./index.ts`).
 *
 * `listPatients` resolve busca por nome (`search`, insensível a
 * maiúsculas/acentos) e paginação inteiramente em memória, com `status`
 * padrão `"ativo"` quando omitido — a mesma semântica que `HttpPatientsAdapter`
 * deve seguir para `page`/`size`/`status` quando entrar em uso real (ver
 * ressalva sobre `search` em `PatientsAdapter.ts`).
 */
export class MockPatientsAdapter implements PatientsAdapter {
  private patients: Patient[];
  private readonly clock: () => number;
  private readonly idGenerator: () => string;

  constructor(seed: readonly Patient[] = SEED_PATIENTS, options: MockPatientsAdapterOptions = {}) {
    this.patients = structuredClone(seed) as Patient[];
    this.clock = options.clock ?? (() => Date.now());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
  }

  async listPatients(params: ListPatientsParams = {}): Promise<PatientPage> {
    const status = params.status ?? "ativo";
    const page = params.page ?? 0;
    const size = params.size ?? DEFAULT_PATIENTS_PAGE_SIZE;
    const search = params.search ? normalizeForSearch(params.search) : "";

    const filtered = this.patients.filter((patient) => {
      if (patient.status !== status) return false;
      if (search === "") return true;
      return normalizeForSearch(patient.name).includes(search);
    });

    const totalElements = filtered.length;
    const totalPages = size <= 0 ? 0 : Math.ceil(totalElements / size);
    const start = page * size;
    const items = structuredClone(filtered.slice(start, start + size));

    return {
      items,
      meta: { page, size, totalElements, totalPages },
    };
  }

  async getPatient(patientId: string): Promise<Patient> {
    const found = this.patients.find((patient) => patient.id === patientId);
    if (!found) {
      throw new PatientsAdapterError(`Paciente ${patientId} não encontrado.`, 404);
    }
    return structuredClone(found);
  }

  async createPatient(payload: PatientCreateRequest): Promise<Patient> {
    const patient: Patient = {
      id: this.idGenerator(),
      name: payload.name,
      monthlyFee: payload.monthlyFee,
      billingDay: payload.billingDay,
      status: "ativo",
      createdAt: new Date(this.clock()).toISOString(),
      ...(payload.whatsapp ? { whatsapp: payload.whatsapp } : {}),
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
    };
    this.patients.push(patient);
    return structuredClone(patient);
  }

  async updatePatient(patientId: string, payload: PatientUpdateRequest): Promise<Patient> {
    const index = this.patients.findIndex((patient) => patient.id === patientId);
    if (index === -1) {
      throw new PatientsAdapterError(`Paciente ${patientId} não encontrado.`, 404);
    }
    const current = this.patients[index];
    if (!current) {
      throw new PatientsAdapterError(`Paciente ${patientId} não encontrado.`, 404);
    }
    const updated: Patient = { ...current, ...payload };
    this.patients[index] = updated;
    return structuredClone(updated);
  }

  async archivePatient(patientId: string): Promise<Patient> {
    return this.updatePatient(patientId, { status: "inativo" });
  }

  async unarchivePatient(patientId: string): Promise<Patient> {
    return this.updatePatient(patientId, { status: "ativo" });
  }
}
