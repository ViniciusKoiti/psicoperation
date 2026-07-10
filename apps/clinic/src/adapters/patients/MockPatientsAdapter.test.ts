import type { Patient } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockPatientsAdapter } from "./MockPatientsAdapter";
import { isPatientNotFoundError } from "./PatientsAdapterError";

function seedOf(overrides: Partial<Patient>[]): Patient[] {
  return overrides.map((patch, index) => ({
    id: `seed-${index}`,
    name: `Paciente ${index}`,
    monthlyFee: 10000,
    billingDay: 1,
    status: "ativo",
    createdAt: "2026-01-01T00:00:00Z",
    ...patch,
  }));
}

describe("MockPatientsAdapter", () => {
  describe("listPatients", () => {
    it("lista apenas pacientes ativos por padrão (status omitido)", async () => {
      const adapter = new MockPatientsAdapter();

      const page = await adapter.listPatients();

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.every((patient) => patient.status === "ativo")).toBe(true);
    });

    it("filtra por status quando informado explicitamente", async () => {
      const adapter = new MockPatientsAdapter();

      const page = await adapter.listPatients({ status: "inativo" });

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.every((patient) => patient.status === "inativo")).toBe(true);
    });

    it("pagina os resultados com o tamanho de página padrão", async () => {
      const adapter = new MockPatientsAdapter();

      const firstPage = await adapter.listPatients({ page: 0 });
      const secondPage = await adapter.listPatients({ page: 1 });

      expect(firstPage.meta.page).toBe(0);
      expect(firstPage.items.length).toBe(firstPage.meta.size);
      expect(secondPage.meta.page).toBe(1);
      expect(secondPage.meta.totalElements).toBe(firstPage.meta.totalElements);
      expect(firstPage.items.map((p) => p.id)).not.toEqual(secondPage.items.map((p) => p.id));
    });

    it("respeita o tamanho de página customizado", async () => {
      const adapter = new MockPatientsAdapter();

      const page = await adapter.listPatients({ size: 2 });

      expect(page.items.length).toBe(2);
      expect(page.meta.size).toBe(2);
      expect(page.meta.totalPages).toBeGreaterThan(1);
    });

    it("busca por nome de forma insensível a maiúsculas e acentos", async () => {
      const seed = seedOf([{ name: "José Antônio" }, { name: "Maria Eduarda" }]);
      const adapter = new MockPatientsAdapter(seed);

      const page = await adapter.listPatients({ search: "jose antonio" });

      expect(page.items).toHaveLength(1);
      expect(page.items[0]?.name).toBe("José Antônio");
    });

    it("retorna lista vazia com meta coerente quando a busca não encontra nada", async () => {
      const seed = seedOf([{ name: "Ana" }]);
      const adapter = new MockPatientsAdapter(seed);

      const page = await adapter.listPatients({ search: "paciente-inexistente" });

      expect(page.items).toEqual([]);
      expect(page.meta.totalElements).toBe(0);
      expect(page.meta.totalPages).toBe(0);
    });

    it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
      const seed = seedOf([{ name: "Paciente Teste" }]);
      const adapter = new MockPatientsAdapter(seed);

      const firstRead = await adapter.listPatients();
      firstRead.items[0]!.name = "Nome mutado só na cópia";

      const secondRead = await adapter.listPatients();
      expect(secondRead.items[0]!.name).toBe("Paciente Teste");
    });
  });

  describe("getPatient", () => {
    it("retorna o paciente pelo id", async () => {
      const seed = seedOf([{ name: "Ana" }]);
      const adapter = new MockPatientsAdapter(seed);

      const patient = await adapter.getPatient("seed-0");

      expect(patient.name).toBe("Ana");
    });

    it("rejeita com erro 404 quando o id não existe", async () => {
      const adapter = new MockPatientsAdapter([]);

      await expect(adapter.getPatient("inexistente")).rejects.toSatisfy(isPatientNotFoundError);
    });
  });

  describe("createPatient", () => {
    it("cria o paciente como ativo, com id e createdAt determinísticos quando injetados", async () => {
      const adapter = new MockPatientsAdapter([], { clock: () => Date.parse("2026-05-01T10:00:00Z"), idGenerator: () => "novo-id" });

      const created = await adapter.createPatient({ name: "Nova Paciente", monthlyFee: 15000, billingDay: 12 });

      expect(created).toEqual({
        id: "novo-id",
        name: "Nova Paciente",
        monthlyFee: 15000,
        billingDay: 12,
        status: "ativo",
        createdAt: "2026-05-01T10:00:00.000Z",
      });
    });

    it("inclui campos opcionais só quando informados", async () => {
      const adapter = new MockPatientsAdapter([]);

      const created = await adapter.createPatient({
        name: "Paciente Completa",
        whatsapp: "+5511999998888",
        email: "paciente@exemplo.com.br",
        monthlyFee: 20000,
        billingDay: 5,
        notes: "Prefere contato por e-mail.",
      });

      expect(created.whatsapp).toBe("+5511999998888");
      expect(created.email).toBe("paciente@exemplo.com.br");
      expect(created.notes).toBe("Prefere contato por e-mail.");
    });

    it("o paciente criado aparece na listagem de ativos", async () => {
      const adapter = new MockPatientsAdapter([]);

      await adapter.createPatient({ name: "Paciente Nova", monthlyFee: 10000, billingDay: 1 });
      const page = await adapter.listPatients();

      expect(page.items).toHaveLength(1);
      expect(page.items[0]?.name).toBe("Paciente Nova");
    });
  });

  describe("updatePatient", () => {
    it("atualiza apenas os campos informados", async () => {
      const seed = seedOf([{ name: "Ana", monthlyFee: 10000 }]);
      const adapter = new MockPatientsAdapter(seed);

      const updated = await adapter.updatePatient("seed-0", { monthlyFee: 30000 });

      expect(updated.name).toBe("Ana");
      expect(updated.monthlyFee).toBe(30000);
    });

    it("rejeita com erro 404 quando o id não existe", async () => {
      const adapter = new MockPatientsAdapter([]);

      await expect(adapter.updatePatient("inexistente", { name: "X" })).rejects.toSatisfy(isPatientNotFoundError);
    });
  });

  describe("archivePatient / unarchivePatient", () => {
    it("arquivar move o paciente para status inativo e ele some da listagem ativa", async () => {
      const seed = seedOf([{ name: "Ana" }]);
      const adapter = new MockPatientsAdapter(seed);

      const archived = await adapter.archivePatient("seed-0");
      expect(archived.status).toBe("inativo");

      const activePage = await adapter.listPatients();
      expect(activePage.items).toHaveLength(0);

      const archivedPage = await adapter.listPatients({ status: "inativo" });
      expect(archivedPage.items).toHaveLength(1);
    });

    it("é reversível: desarquivar devolve o paciente à lista ativa", async () => {
      const seed = seedOf([{ name: "Ana" }]);
      const adapter = new MockPatientsAdapter(seed);

      await adapter.archivePatient("seed-0");
      const unarchived = await adapter.unarchivePatient("seed-0");

      expect(unarchived.status).toBe("ativo");
      const activePage = await adapter.listPatients();
      expect(activePage.items).toHaveLength(1);
    });
  });
});
