import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Patient } from "@psiops/contracts";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { MockPatientsAdapter } from "../../adapters/patients";
import { PatientsListPage } from "./PatientsListPage";

function renderPage(adapter: MockPatientsAdapter, searchDebounceMs = 10) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={["/pacientes"]}>
        <PatientsListPage adapter={adapter} searchDebounceMs={searchDebounceMs} />
      </MemoryRouter>
    </MantineProvider>,
  );
}

function patient(overrides: Partial<Patient>): Patient {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Paciente",
    monthlyFee: overrides.monthlyFee ?? 20000,
    billingDay: overrides.billingDay ?? 10,
    status: overrides.status ?? "ativo",
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("PatientsListPage", () => {
  it("mostra o skeleton de carregamento e depois a lista de pacientes ativos", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Marina Alves" })]);
    renderPage(adapter);

    expect(screen.getByTestId("patients-loading")).toBeInTheDocument();

    await screen.findByText("Marina Alves");
    expect(screen.queryByTestId("patients-loading")).not.toBeInTheDocument();
  });

  it("mostra estado vazio quando não há pacientes ativos", async () => {
    const adapter = new MockPatientsAdapter([]);
    renderPage(adapter);

    await screen.findByText("Nenhum paciente cadastrado");
  });

  it("busca por nome (com debounce) filtra a lista via adapter", async () => {
    const adapter = new MockPatientsAdapter([
      patient({ id: "1", name: "Marina Alves" }),
      patient({ id: "2", name: "Camila Souza" }),
    ]);
    const listSpy = vi.spyOn(adapter, "listPatients");
    renderPage(adapter);

    await screen.findByText("Marina Alves");
    expect(screen.getByText("Camila Souza")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar paciente por nome"), { target: { value: "Camila" } });

    // Uma única `waitFor` avaliando as duas condições juntas evita observar um
    // instante intermediário de "carregando" (lista vazia) como se já fosse o
    // resultado final filtrado.
    await waitFor(() => {
      expect(screen.queryByText("Marina Alves")).not.toBeInTheDocument();
      expect(screen.getByText("Camila Souza")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ search: "Camila" }));
    });
  });

  it("mostra estado vazio de busca sem resultados", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Marina Alves" })]);
    renderPage(adapter);

    await screen.findByText("Marina Alves");
    fireEvent.change(screen.getByLabelText("Buscar paciente por nome"), { target: { value: "Zzz" } });

    await screen.findByText("Nenhum paciente encontrado");
  });

  it("pagina os resultados e navega para a próxima página", async () => {
    const seed = Array.from({ length: 12 }, (_, index) =>
      patient({ id: `p-${index}`, name: `Paciente ${String(index).padStart(2, "0")}` }),
    );
    const adapter = new MockPatientsAdapter(seed);
    renderPage(adapter);

    await screen.findByText("Paciente 00");
    expect(screen.queryByText("Paciente 10")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    await screen.findByText("Paciente 10");
    expect(screen.queryByText("Paciente 00")).not.toBeInTheDocument();
  });

  it("mostra erro com ação de tentar novamente, e recarrega ao clicar", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Marina Alves" })]);
    // `vi.spyOn` sem `mockImplementation` chama através para o método original
    // depois que a fila de `mockRejectedValueOnce` se esgota.
    const listSpy = vi.spyOn(adapter, "listPatients").mockRejectedValueOnce(new Error("falha de rede"));

    renderPage(adapter);

    await screen.findByTestId("patients-error");
    expect(listSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await screen.findByText("Marina Alves");
  });

  it("arquivar exige confirmação no modal antes de sumir da lista ativa", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Marina Alves" })]);
    renderPage(adapter);

    await screen.findByText("Marina Alves");
    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));

    const modal = await screen.findByTestId("archive-patient-modal");
    expect(within(modal).getByText(/Marina Alves/)).toBeInTheDocument();

    // Ainda não arquivou: paciente continua na lista de ativos até confirmar.
    expect(await adapter.listPatients()).toMatchObject({ items: [{ name: "Marina Alves", status: "ativo" }] });

    fireEvent.click(screen.getByTestId("confirm-archive-patient"));

    await waitFor(() => {
      expect(screen.queryByText("Marina Alves")).not.toBeInTheDocument();
    });
    await screen.findByText("Nenhum paciente cadastrado");

    const archived = await adapter.listPatients({ status: "inativo" });
    expect(archived.items[0]?.status).toBe("inativo");
  });

  it("cancelar o modal de arquivamento não altera o paciente", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Marina Alves" })]);
    renderPage(adapter);

    await screen.findByText("Marina Alves");
    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await screen.findByTestId("archive-patient-modal");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    // O `Modal` do Mantine mantém um nó-raiz vazio no DOM mesmo fechado; o
    // sinal confiável de "fechado" é o conteúdo (botão de confirmação) sumir.
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-archive-patient")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Marina Alves")).toBeInTheDocument();
    const page = await adapter.listPatients();
    expect(page.items[0]?.status).toBe("ativo");
  });

  it("aba Arquivados mostra pacientes inativos e permite desarquivar", async () => {
    const adapter = new MockPatientsAdapter([patient({ id: "1", name: "Helena Ribeiro", status: "inativo" })]);
    renderPage(adapter);

    await screen.findByText("Nenhum paciente cadastrado");

    // SegmentedControl é um radiogroup de fato (acessibilidade nativa do Mantine).
    fireEvent.click(screen.getByRole("radio", { name: "Arquivados" }));

    await screen.findByText("Helena Ribeiro");
    fireEvent.click(screen.getByRole("button", { name: "Desarquivar" }));

    await waitFor(() => {
      expect(screen.queryByText("Helena Ribeiro")).not.toBeInTheDocument();
    });

    const activePage = await adapter.listPatients();
    expect(activePage.items[0]?.status).toBe("ativo");
  });
});
