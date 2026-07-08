import type { Patient } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockPatientsAdapter } from "./MockPatientsAdapter";

describe("MockPatientsAdapter", () => {
  it("lista os pacientes de exemplo com meta de página coerente", async () => {
    const adapter = new MockPatientsAdapter();

    const page = await adapter.listPatients();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.meta.totalElements).toBe(page.items.length);
    expect(page.meta.page).toBe(0);
  });

  it("aceita uma seed customizada de pacientes", async () => {
    const seed: Patient[] = [
      {
        id: "seed-1",
        name: "Paciente Teste",
        monthlyFee: 10000,
        billingDay: 1,
        status: "ativo",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    const adapter = new MockPatientsAdapter(seed);

    const page = await adapter.listPatients();

    expect(page.items).toEqual(seed);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed: Patient[] = [
      {
        id: "seed-1",
        name: "Paciente Teste",
        monthlyFee: 10000,
        billingDay: 1,
        status: "ativo",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    const adapter = new MockPatientsAdapter(seed);

    const firstRead = await adapter.listPatients();
    firstRead.items[0]!.name = "Nome mutado só na cópia";

    const secondRead = await adapter.listPatients();
    expect(secondRead.items[0]!.name).toBe("Paciente Teste");
  });
});
