import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Charge, Patient } from "@psiops/contracts";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { type ChargesAdapter, MockChargesAdapter } from "../../adapters/charges";
import { MockPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { FinancePage, type FinancePageProps } from "./FinancePage";

// "Hoje" fixo em todos os testes — nenhum teste depende do relógio real.
const TODAY = () => new Date(2026, 6, 10); // 10/07/2026

const PATIENT_A_ID = "patient-a";
const PATIENT_B_ID = "patient-b";

function patient(overrides: Partial<Patient>): Patient {
  return {
    id: overrides.id ?? PATIENT_A_ID,
    name: overrides.name ?? "Marina Alves",
    monthlyFee: 25000,
    billingDay: 10,
    status: overrides.status ?? "ativo",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function charge(overrides: Partial<Charge>): Charge {
  return {
    id: overrides.id ?? "charge-1",
    patientId: overrides.patientId ?? PATIENT_A_ID,
    competence: overrides.competence ?? "2026-07",
    amount: overrides.amount ?? 20000,
    dueDate: overrides.dueDate ?? "2026-07-10",
    status: overrides.status ?? "pendente",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

interface RenderOptions {
  chargesAdapter?: ChargesAdapter;
  patientsAdapter?: PatientsAdapter;
  today?: FinancePageProps["today"];
}

function renderFinancePage(options: RenderOptions = {}) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={["/financeiro"]}>
        <FinancePage
          chargesAdapter={options.chargesAdapter ?? new MockChargesAdapter({})}
          patientsAdapter={options.patientsAdapter ?? new MockPatientsAdapter([])}
          today={options.today ?? TODAY}
        />
      </MemoryRouter>
    </MantineProvider>,
  );
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByTestId("finance-loading")).not.toBeInTheDocument();
  });
  await act(async () => {});
}

describe("FinancePage — carregamento e navegação entre meses", () => {
  it("mostra o skeleton de carregamento assim que monta", async () => {
    renderFinancePage();

    expect(screen.getByTestId("finance-loading")).toBeInTheDocument();

    await waitForLoaded();
  });

  it("mostra o mês atual (a partir de `today`) e navega entre meses", async () => {
    renderFinancePage();
    await waitForLoaded();

    expect(screen.getByTestId("finance-month-label")).toHaveTextContent("Julho/2026");

    fireEvent.click(screen.getByTestId("finance-prev-month"));
    expect(screen.getByTestId("finance-month-label")).toHaveTextContent("Junho/2026");

    fireEvent.click(screen.getByTestId("finance-next-month"));
    fireEvent.click(screen.getByTestId("finance-next-month"));
    expect(screen.getByTestId("finance-month-label")).toHaveTextContent("Agosto/2026");

    await waitForLoaded();
  });

  it("mostra estado vazio com ação de gerar quando o mês não tem mensalidades", async () => {
    renderFinancePage();
    await waitForLoaded();

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma mensalidade neste mês")).toBeInTheDocument();
  });

  it("mostra erro com ação de tentar novamente quando a busca falha", async () => {
    const chargesAdapter: ChargesAdapter = Object.assign(new MockChargesAdapter({}), {
      listCharges: () => Promise.reject(new Error("falhou")),
    });

    renderFinancePage({ chargesAdapter });

    const errorAlert = await screen.findByTestId("finance-error");
    expect(within(errorAlert).getByText("Não foi possível carregar as mensalidades deste mês.")).toBeInTheDocument();
  });
});

describe("FinancePage — agrupamento por status e totais", () => {
  it("agrupa mensalidades por status com totais por grupo e total geral formatados em R$", async () => {
    const seed = {
      [PATIENT_A_ID]: [
        charge({ id: "c1", patientId: PATIENT_A_ID, status: "em_dia", amount: 25000, competence: "2026-07" }),
        charge({ id: "c2", patientId: PATIENT_A_ID, status: "atrasada", amount: 18000, competence: "2026-07" }),
      ],
      [PATIENT_B_ID]: [charge({ id: "c3", patientId: PATIENT_B_ID, status: "pendente", amount: 22000, competence: "2026-07" })],
    };
    const chargesAdapter = new MockChargesAdapter(seed);
    const patientsAdapter = new MockPatientsAdapter([
      patient({ id: PATIENT_A_ID, name: "Marina Alves" }),
      patient({ id: PATIENT_B_ID, name: "Camila Souza" }),
    ]);

    renderFinancePage({ chargesAdapter, patientsAdapter });
    await waitForLoaded();

    expect(within(screen.getByTestId("finance-total-em_dia")).getByText("R$ 250,00")).toBeInTheDocument();
    expect(within(screen.getByTestId("finance-total-pendente")).getByText("R$ 220,00")).toBeInTheDocument();
    expect(within(screen.getByTestId("finance-total-atrasada")).getByText("R$ 180,00")).toBeInTheDocument();
    expect(within(screen.getByTestId("finance-total-geral")).getByText("R$ 650,00")).toBeInTheDocument();

    const emDiaGroup = screen.getByTestId("finance-charge-group-em_dia");
    expect(within(emDiaGroup).getByText("Marina Alves")).toBeInTheDocument();

    const pendenteGroup = screen.getByTestId("finance-charge-group-pendente");
    expect(within(pendenteGroup).getByText("Camila Souza")).toBeInTheDocument();
  });
});

describe("FinancePage — gerar mensalidades do mês (idempotente)", () => {
  it("gera mensalidades a partir dos pacientes ativos e mostra o resumo", async () => {
    const chargesAdapter = new MockChargesAdapter({}, { clock: () => TODAY().getTime(), idGenerator: () => "gen-1" });
    const patientsAdapter = new MockPatientsAdapter([patient({ id: PATIENT_A_ID, monthlyFee: 25000, billingDay: 10 })]);

    renderFinancePage({ chargesAdapter, patientsAdapter, today: TODAY });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("finance-generate-button"));

    const summary = await screen.findByTestId("finance-generate-summary");
    expect(summary).toHaveTextContent("1 mensalidade(s) gerada(s).");

    await waitFor(() => {
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("finance-charge-group-pendente")).toBeInTheDocument();
  });

  it("é idempotente: gerar duas vezes seguidas não duplica, e a segunda vez reporta 'já existia'", async () => {
    const chargesAdapter = new MockChargesAdapter({}, { clock: () => TODAY().getTime(), idGenerator: () => "gen-1" });
    const patientsAdapter = new MockPatientsAdapter([patient({ id: PATIENT_A_ID, monthlyFee: 25000, billingDay: 10 })]);

    renderFinancePage({ chargesAdapter, patientsAdapter, today: TODAY });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("finance-generate-button"));
    await screen.findByTestId("finance-generate-summary");

    fireEvent.click(screen.getByTestId("finance-generate-button"));
    const secondSummary = await screen.findByTestId("finance-generate-summary");
    expect(secondSummary).toHaveTextContent("0 mensalidade(s) gerada(s); 1 já existia(m) para este mês (nenhuma duplicada).");

    const rows = screen.getAllByTestId("finance-charge-row");
    expect(rows).toHaveLength(1);
  });
});

describe("FinancePage — marcar como paga e desfazer", () => {
  it("marca uma mensalidade pendente como paga e move o total/grupo imediatamente, com opção de desfazer", async () => {
    const seed = { [PATIENT_A_ID]: [charge({ id: "c1", patientId: PATIENT_A_ID, status: "pendente", amount: 25000 })] };
    const chargesAdapter = new MockChargesAdapter(seed);
    const patientsAdapter = new MockPatientsAdapter([patient({ id: PATIENT_A_ID, name: "Marina Alves" })]);

    renderFinancePage({ chargesAdapter, patientsAdapter });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("finance-mark-paid-c1"));

    const modal = await screen.findByTestId("register-payment-modal");
    fireEvent.click(within(modal).getByTestId("confirm-register-payment"));

    await screen.findByTestId("finance-payment-undo-banner");

    await waitFor(() => {
      const emDiaGroup = screen.getByTestId("finance-charge-group-em_dia");
      expect(within(emDiaGroup).getByText("Marina Alves")).toBeInTheDocument();
    });
    expect(within(screen.getByTestId("finance-total-em_dia")).getByText("R$ 250,00")).toBeInTheDocument();
    expect(within(screen.getByTestId("finance-total-pendente")).getByText("R$ 0,00")).toBeInTheDocument();
    expect(within(screen.getByTestId("finance-charge-group-pendente-total")).getByText("Nenhuma mensalidade")).toBeInTheDocument();
  });

  it("desfazer volta a mensalidade para o status anterior", async () => {
    const seed = { [PATIENT_A_ID]: [charge({ id: "c1", patientId: PATIENT_A_ID, status: "atrasada", amount: 25000 })] };
    const chargesAdapter = new MockChargesAdapter(seed);
    const patientsAdapter = new MockPatientsAdapter([patient({ id: PATIENT_A_ID, name: "Marina Alves" })]);

    renderFinancePage({ chargesAdapter, patientsAdapter });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("finance-mark-paid-c1"));
    const modal = await screen.findByTestId("register-payment-modal");
    fireEvent.click(within(modal).getByTestId("confirm-register-payment"));

    await screen.findByTestId("finance-payment-undo-banner");
    fireEvent.click(screen.getByTestId("finance-undo-payment"));

    await waitFor(() => {
      expect(screen.queryByTestId("finance-payment-undo-banner")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const atrasadaGroup = screen.getByTestId("finance-charge-group-atrasada");
      expect(within(atrasadaGroup).getByText("Marina Alves")).toBeInTheDocument();
    });
    expect(within(screen.getByTestId("finance-total-atrasada")).getByText("R$ 250,00")).toBeInTheDocument();
  });
});

describe("FinancePage — calculadora de juros simples", () => {
  it("exibe a calculadora com o exemplo da landing como valor inicial (paridade)", async () => {
    renderFinancePage();
    await waitForLoaded();

    const calculator = screen.getByTestId("interest-calculator");
    expect(within(calculator).getByTestId("interest-calculator-interest")).toHaveTextContent("R$ 0,47");
    expect(within(calculator).getByTestId("interest-calculator-fine")).toHaveTextContent("R$ 7,00");
    expect(within(calculator).getByTestId("interest-calculator-total")).toHaveTextContent("R$ 357,47");
  });
});
