import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Patient } from "@psiops/contracts";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockPatientsAdapter } from "../../adapters/patients";
import { PatientFormPage } from "./PatientFormPage";

function renderAt(path: string, adapter: MockPatientsAdapter) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/pacientes/novo" element={<PatientFormPage adapter={adapter} />} />
          <Route path="/pacientes/:patientId/editar" element={<PatientFormPage adapter={adapter} />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "1",
    name: "Marina Alves",
    monthlyFee: 25000,
    billingDay: 10,
    status: "ativo",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("PatientFormPage — cadastro", () => {
  it("valida campos obrigatórios antes de chamar o adapter", async () => {
    const adapter = new MockPatientsAdapter([]);
    renderAt("/pacientes/novo", adapter);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar paciente" }));

    expect(await screen.findByText("Informe o nome do paciente.")).toBeInTheDocument();
    expect((await adapter.listPatients()).items).toHaveLength(0);
  });

  it("cria o paciente com os dados administrativos informados (sem campo clínico)", async () => {
    const adapter = new MockPatientsAdapter([]);
    renderAt("/pacientes/novo", adapter);

    fireEvent.change(screen.getByLabelText("Nome", { exact: false }), { target: { value: "Nova Paciente" } });
    fireEvent.change(screen.getByLabelText("Valor da mensalidade", { exact: false }), { target: { value: "250" } });
    fireEvent.change(screen.getByLabelText("Dia de vencimento", { exact: false }), { target: { value: "12" } });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar paciente" }));

    await waitFor(async () => {
      const page = await adapter.listPatients();
      expect(page.items).toHaveLength(1);
    });

    const page = await adapter.listPatients();
    expect(page.items[0]).toMatchObject({ name: "Nova Paciente", monthlyFee: 25000, billingDay: 12, status: "ativo" });
  });
});

describe("PatientFormPage — edição", () => {
  it("carrega os dados existentes do paciente e permite editar, preservando campos não tocados", async () => {
    const adapter = new MockPatientsAdapter([patient({ monthlyFee: 20000 })]);
    renderAt("/pacientes/1/editar", adapter);

    const nameInput = (await screen.findByLabelText("Nome", { exact: false })) as HTMLInputElement;
    expect(nameInput.value).toBe("Marina Alves");

    fireEvent.change(nameInput, { target: { value: "Marina A. Souza" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(async () => {
      const updated = await adapter.getPatient("1");
      expect(updated.name).toBe("Marina A. Souza");
    });

    const updated = await adapter.getPatient("1");
    expect(updated.monthlyFee).toBe(20000);
  });

  it("mostra erro de carregamento quando o paciente não existe", async () => {
    const adapter = new MockPatientsAdapter([]);
    renderAt("/pacientes/inexistente/editar", adapter);

    await screen.findByTestId("patient-form-load-error");
  });
});
