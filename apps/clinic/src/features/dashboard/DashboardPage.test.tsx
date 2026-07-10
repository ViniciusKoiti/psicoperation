import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Appointment, Charge, Patient, Task } from "@psiops/contracts";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { type AgendaAdapter, MockAgendaAdapter } from "../../adapters/appointments";
import { type ChargesReadAdapter, MockChargesReadAdapter } from "../../adapters/charges";
import { MockPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { type TasksReadAdapter, MockTasksReadAdapter } from "../../adapters/tasks";
import { DashboardPage, type DashboardPageProps } from "./DashboardPage";

// "Hoje" fixo injetado em todos os testes — nenhum teste depende do relógio real.
const TODAY = () => new Date(2026, 6, 10);

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

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "apt-1",
    patientId: overrides.patientId ?? PATIENT_A_ID,
    startsAt: overrides.startsAt ?? "2026-07-10T13:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "agendada",
    createdAt: overrides.createdAt ?? "2026-06-01T10:00:00Z",
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

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

const PATIENTS = [patient({ id: PATIENT_A_ID, name: "Marina Alves" }), patient({ id: PATIENT_B_ID, name: "Camila Souza" })];

interface RenderOptions {
  agendaAdapter?: AgendaAdapter;
  patientsAdapter?: PatientsAdapter;
  chargesReadAdapter?: ChargesReadAdapter;
  tasksReadAdapter?: TasksReadAdapter;
  today?: DashboardPageProps["today"];
}

function renderDashboard(options: RenderOptions = {}) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={["/"]}>
        <DashboardPage
          agendaAdapter={options.agendaAdapter ?? new MockAgendaAdapter([])}
          patientsAdapter={options.patientsAdapter ?? new MockPatientsAdapter(PATIENTS)}
          chargesReadAdapter={options.chargesReadAdapter ?? new MockChargesReadAdapter({})}
          tasksReadAdapter={options.tasksReadAdapter ?? new MockTasksReadAdapter([])}
          today={options.today ?? TODAY}
        />
      </MemoryRouter>
    </MantineProvider>,
  );
}

/**
 * Aguarda os três blocos de dados (consultas, pendências financeiras,
 * tarefas) saírem do estado de carregamento — cada bloco busca dados de um
 * adapter independente, então os testes que exercitam um bloco específico
 * ainda deixariam os outros dois (mais a busca de nomes de pacientes, que
 * não tem indicador de carregamento próprio) com um `.then()` pendente se
 * não aguardassem por todos antes de terminar (React alertaria com "not
 * wrapped in act(...)" pela atualização de estado depois do teste já ter
 * retornado). O `act(async () => {})` final esvazia a fila de microtasks
 * pendente (ex.: a busca de nomes de pacientes) dentro de um boundary de
 * `act`, depois que os três blocos com indicador visível já assentaram.
 */
async function waitForBlocksToSettle() {
  await waitFor(() => {
    expect(screen.queryByTestId("dashboard-appointments-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-charges-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-tasks-loading")).not.toBeInTheDocument();
  });
  await act(async () => {});
}

describe("DashboardPage — carregamento", () => {
  it("mostra os skeletons de carregamento dos três blocos de dados assim que monta", async () => {
    renderDashboard();

    expect(screen.getByTestId("dashboard-appointments-loading")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-charges-loading")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-tasks-loading")).toBeInTheDocument();

    // Atalhos não dependem de dados — sempre visíveis, sem skeleton.
    expect(screen.getByTestId("dashboard-shortcuts")).toBeInTheDocument();

    await waitForBlocksToSettle();
  });
});

describe("DashboardPage — próximas consultas", () => {
  it("mostra as consultas de hoje ordenadas por horário, com paciente e status", async () => {
    const agendaAdapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "tarde", startsAt: "2026-07-10T18:00:00Z", patientId: PATIENT_B_ID }) },
      { appointment: appointment({ id: "manha", startsAt: "2026-07-10T13:00:00Z", patientId: PATIENT_A_ID }) },
      // Fora do dia local de referência — não deve aparecer.
      { appointment: appointment({ id: "outro-dia", startsAt: "2026-07-11T13:00:00Z", patientId: PATIENT_A_ID }) },
    ]);

    renderDashboard({ agendaAdapter });

    const list = await screen.findByTestId("dashboard-appointments-list");
    const rows = within(list).getAllByTestId("dashboard-appointment");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText(/Marina Alves/)).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/Camila Souza/)).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Agendada")).toBeInTheDocument();

    await waitForBlocksToSettle();
  });

  it("mostra estado vazio com CTA para agendar quando não há consultas hoje", async () => {
    renderDashboard();

    await screen.findByText("Nenhuma consulta hoje");
    expect(screen.getByRole("link", { name: "Agendar consulta" })).toHaveAttribute("href", "/agenda");

    await waitForBlocksToSettle();
  });
});

describe("DashboardPage — pendências financeiras", () => {
  it("lista mensalidades atrasadas e pendentes com o total em centavos formatado em R$", async () => {
    const chargesReadAdapter = new MockChargesReadAdapter({
      [PATIENT_A_ID]: [
        charge({ id: "atrasada", patientId: PATIENT_A_ID, status: "atrasada", amount: 25000, dueDate: "2026-06-10" }),
        charge({ id: "em-dia", patientId: PATIENT_A_ID, status: "em_dia", amount: 25000 }),
      ],
      [PATIENT_B_ID]: [
        charge({ id: "pendente", patientId: PATIENT_B_ID, status: "pendente", amount: 22000, dueDate: "2026-07-20" }),
      ],
    });

    renderDashboard({ chargesReadAdapter });

    const list = await screen.findByTestId("dashboard-charges-list");
    const rows = within(list).getAllByTestId("dashboard-charge");
    expect(rows).toHaveLength(2);
    // Atrasada primeiro.
    expect(within(rows[0]!).getByText("Atrasada")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Pendente")).toBeInTheDocument();

    expect(screen.getByTestId("dashboard-charges-total")).toHaveTextContent("R$ 470,00");

    await waitForBlocksToSettle();
  });

  it("mostra estado vazio com CTA para o financeiro quando não há pendências", async () => {
    renderDashboard();

    await screen.findByText("Nenhuma pendência financeira");
    expect(screen.getByRole("link", { name: "Ver financeiro" })).toHaveAttribute("href", "/financeiro");

    await waitForBlocksToSettle();
  });
});

describe("DashboardPage — tarefas do dia", () => {
  it("mostra tarefas vencendo hoje e atrasadas, com indicação visual de atraso, excluindo futuras e concluídas", async () => {
    const tasksReadAdapter = new MockTasksReadAdapter([
      task({ id: "atrasada", title: "Enviar recibo", dueDate: "2026-07-05" }),
      task({ id: "hoje", title: "Confirmar consulta", dueDate: "2026-07-10" }),
      task({ id: "futura", title: "Revisar agenda", dueDate: "2026-07-20" }),
      task({ id: "concluida", title: "Já feita", dueDate: "2026-07-01", completedAt: "2026-07-01T10:00:00Z" }),
    ]);

    renderDashboard({ tasksReadAdapter });

    const list = await screen.findByTestId("dashboard-tasks-list");
    const rows = within(list).getAllByTestId("dashboard-task");
    expect(rows).toHaveLength(2);

    expect(within(rows[0]!).getByText("Enviar recibo")).toBeInTheDocument();
    expect(within(rows[0]!).getByText(/Atrasada/)).toBeInTheDocument();

    expect(within(rows[1]!).getByText("Confirmar consulta")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Hoje")).toBeInTheDocument();

    expect(screen.queryByText("Revisar agenda")).not.toBeInTheDocument();
    expect(screen.queryByText("Já feita")).not.toBeInTheDocument();

    await waitForBlocksToSettle();
  });

  it("mostra estado vazio quando não há tarefas para hoje", async () => {
    renderDashboard();

    await screen.findByText("Nenhuma tarefa para hoje");

    await waitForBlocksToSettle();
  });
});

describe("DashboardPage — atalhos", () => {
  it("navegam para novo paciente, nova consulta e financeiro", async () => {
    renderDashboard();

    const shortcuts = screen.getByTestId("dashboard-shortcuts");
    expect(within(shortcuts).getByRole("link", { name: "Novo paciente" })).toHaveAttribute("href", "/pacientes/novo");
    expect(within(shortcuts).getByRole("link", { name: "Nova consulta" })).toHaveAttribute("href", "/agenda");
    expect(within(shortcuts).getByRole("link", { name: "Financeiro" })).toHaveAttribute("href", "/financeiro");

    await waitForBlocksToSettle();
  });
});

describe("DashboardPage — erro com nova tentativa", () => {
  it("mostra erro e permite tentar novamente quando o bloco de consultas falha ao carregar", async () => {
    const failingAgenda: AgendaAdapter = {
      listAppointmentsByPatient: async () => [],
      listAppointments: async () => {
        throw new Error("falhou");
      },
      createAppointment: async () => {
        throw new Error("não usado");
      },
      rescheduleAppointment: async () => {
        throw new Error("não usado");
      },
      cancelAppointment: async () => {},
      createAppointmentSeries: async () => ({ occurrences: [] }),
    };

    renderDashboard({ agendaAdapter: failingAgenda });

    await screen.findByTestId("dashboard-appointments-error");
    expect(screen.getByText("Não foi possível carregar as consultas de hoje.")).toBeInTheDocument();

    await waitForBlocksToSettle();
  });
});
