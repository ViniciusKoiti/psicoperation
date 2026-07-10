import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Appointment, Charge, Patient } from "@psiops/contracts";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { type AgendaAdapter, type AppointmentsReadAdapter, MockAgendaAdapter } from "../../adapters/appointments";
import { MockChargesAdapter } from "../../adapters/charges";
import { MockPatientsAdapter } from "../../adapters/patients";
import { PatientDetailPage } from "./PatientDetailPage";
import { PatientFormPage } from "./PatientFormPage";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "1",
    name: "Marina Alves",
    whatsapp: "+5511998765432",
    email: "marina@exemplo.com.br",
    monthlyFee: 25000,
    billingDay: 10,
    status: "ativo",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "apt-1",
    patientId: overrides.patientId ?? "1",
    startsAt: overrides.startsAt ?? "2026-06-01T14:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "realizada",
    createdAt: overrides.createdAt ?? "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function charge(overrides: Partial<Charge>): Charge {
  return {
    id: overrides.id ?? "charge-1",
    patientId: overrides.patientId ?? "1",
    competence: overrides.competence ?? "2026-06",
    amount: overrides.amount ?? 25000,
    dueDate: overrides.dueDate ?? "2026-06-10",
    status: overrides.status ?? "em_dia",
    createdAt: overrides.createdAt ?? "2026-06-01T09:00:00Z",
    ...overrides,
  };
}

interface RenderOptions {
  patientsAdapter: MockPatientsAdapter;
  appointmentsAdapter?: AppointmentsReadAdapter;
  /**
   * Adapter de ESCRITA de registros administrativos (PSI-036). Nos testes
   * que exercitam registrar/editar desfecho, passar a MESMA instância de
   * `appointmentsAdapter` (um `MockAgendaAdapter`) — em produção as duas
   * props resolvem para a mesma instância (`agendaAdapter`), então
   * escrita e leitura sempre veem o mesmo estado; testes que não passam
   * nada aqui recebem uma instância vazia independente, inofensiva porque
   * não é exercitada.
   */
  agendaAdapter?: AgendaAdapter;
  chargesAdapter?: MockChargesAdapter;
  today?: () => Date;
  path?: string;
}

function renderDetail({
  patientsAdapter,
  appointmentsAdapter = new MockAgendaAdapter([]),
  agendaAdapter = new MockAgendaAdapter([]),
  chargesAdapter = new MockChargesAdapter({}),
  today,
  path = "/pacientes/1",
}: RenderOptions) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/pacientes/:patientId"
            element={
              <PatientDetailPage
                patientsAdapter={patientsAdapter}
                appointmentsAdapter={appointmentsAdapter}
                agendaAdapter={agendaAdapter}
                chargesAdapter={chargesAdapter}
                today={today}
              />
            }
          />
          <Route path="/pacientes/:patientId/editar" element={<PatientFormPage adapter={patientsAdapter} />} />
          <Route path="/pacientes" element={<div data-testid="patients-list-stub">Lista de pacientes</div>} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("PatientDetailPage", () => {
  it("agrega dados cadastrais, histórico de consultas, registros administrativos e situação financeira", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const appointmentsAdapter = new MockAgendaAdapter([
      {
        appointment: appointment({ id: "apt-1", startsAt: "2026-06-01T14:00:00Z", status: "realizada" }),
        attendance: { attendance: "compareceu", recordedAt: "2026-06-01T15:00:00Z" },
      },
      {
        appointment: appointment({ id: "apt-2", startsAt: "2026-06-08T14:00:00Z", status: "realizada" }),
        attendance: { attendance: "faltou", administrativeNotes: "Faltou sem aviso prévio." },
      },
    ]);
    const chargesAdapter = new MockChargesAdapter({ "1": [charge({ id: "c1", status: "em_dia" })] });

    renderDetail({ patientsAdapter, appointmentsAdapter, chargesAdapter });

    // Dados cadastrais
    expect(await screen.findByRole("heading", { name: "Marina Alves" })).toBeInTheDocument();
    const registration = screen.getByTestId("patient-registration-table");
    expect(within(registration).getByText("R$ 250,00")).toBeInTheDocument();
    expect(within(registration).getByText("Dia 10")).toBeInTheDocument();
    expect(within(registration).getByText("+5511998765432")).toBeInTheDocument();

    // Histórico de consultas
    const appointmentsTable = screen.getByTestId("appointments-table");
    expect(within(appointmentsTable).getAllByText("Realizada")).toHaveLength(2);

    // Registros administrativos (somente leitura, sem campo clínico)
    const recordsTable = screen.getByTestId("administrative-records-table");
    expect(within(recordsTable).getByText("Compareceu")).toBeInTheDocument();
    expect(within(recordsTable).getByText("Faltou")).toBeInTheDocument();
    expect(within(recordsTable).getByText("Faltou sem aviso prévio.")).toBeInTheDocument();

    // Situação financeira
    expect(screen.getByTestId("charge-group-em_dia")).toBeInTheDocument();
    expect(screen.getByTestId("charge-group-em_dia-total")).toHaveTextContent("R$ 250,00");
  });

  it("agrupa mensalidades por status (em dia, pendente, atrasada)", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const chargesAdapter = new MockChargesAdapter({
      "1": [
        charge({ id: "c1", status: "em_dia", amount: 10000 }),
        charge({ id: "c2", status: "em_dia", amount: 15000 }),
        charge({ id: "c3", status: "pendente", amount: 20000 }),
        charge({ id: "c4", status: "atrasada", amount: 25000 }),
      ],
    });

    renderDetail({ patientsAdapter, chargesAdapter });

    await screen.findByRole("heading", { name: "Marina Alves" });

    const emDia = screen.getByTestId("charge-group-em_dia");
    expect(within(emDia).getByText("Em dia")).toBeInTheDocument();
    expect(screen.getByTestId("charge-group-em_dia-total")).toHaveTextContent("R$ 250,00"); // soma 10000 + 15000

    const pendente = screen.getByTestId("charge-group-pendente");
    expect(within(pendente).getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByTestId("charge-group-pendente-total")).toHaveTextContent("R$ 200,00");

    const atrasada = screen.getByTestId("charge-group-atrasada");
    expect(within(atrasada).getByText("Atrasada")).toBeInTheDocument();
    expect(screen.getByTestId("charge-group-atrasada-total")).toHaveTextContent("R$ 250,00");
  });

  it("editar cadastro abre o formulário de edição da PSI-033 preenchido", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    renderDetail({ patientsAdapter });

    await screen.findByRole("heading", { name: "Marina Alves" });
    fireEvent.click(screen.getByRole("link", { name: "Editar cadastro" }));

    const nameInput = (await screen.findByLabelText("Nome", { exact: false })) as HTMLInputElement;
    expect(screen.getByTestId("patient-form")).toBeInTheDocument();
    expect(nameInput.value).toBe("Marina Alves");
  });

  it('"voltar para a lista" usa a URL da lista guardada em location.state.back', async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);

    render(
      <MantineProvider theme={psiopsTheme}>
        <MemoryRouter
          initialEntries={[{ pathname: "/pacientes/1", state: { back: "/pacientes?q=Marina&page=1" } }]}
        >
          <Routes>
            <Route path="/pacientes/:patientId" element={<PatientDetailPage patientsAdapter={patientsAdapter} />} />
            <Route path="/pacientes" element={<div data-testid="patients-list-stub">Lista de pacientes</div>} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    await screen.findByRole("heading", { name: "Marina Alves" });
    fireEvent.click(screen.getByRole("link", { name: "Voltar para a lista" }));

    await screen.findByTestId("patients-list-stub");
  });

  it("mostra estados vazios independentes por seção quando não há consultas nem cobranças", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    renderDetail({ patientsAdapter });

    await screen.findByRole("heading", { name: "Marina Alves" });

    expect(await screen.findByText("Nenhuma consulta registrada")).toBeInTheDocument();
    expect(screen.getByText("Nenhum registro administrativo")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma mensalidade lançada")).toBeInTheDocument();
  });

  it("mostra o carregamento de cada seção antes dos dados chegarem", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);

    let resolveAppointments!: (value: Awaited<ReturnType<AppointmentsReadAdapter["listAppointmentsByPatient"]>>) => void;
    const pendingAppointments = new Promise<Awaited<ReturnType<AppointmentsReadAdapter["listAppointmentsByPatient"]>>>(
      (resolve) => {
        resolveAppointments = resolve;
      },
    );
    const appointmentsAdapter: AppointmentsReadAdapter = {
      listAppointmentsByPatient: () => pendingAppointments,
    };

    renderDetail({ patientsAdapter, appointmentsAdapter });

    await screen.findByRole("heading", { name: "Marina Alves" });
    expect(screen.getByTestId("appointments-loading")).toBeInTheDocument();
    expect(screen.getByTestId("administrative-records-loading")).toBeInTheDocument();

    resolveAppointments([]);

    await waitFor(() => {
      expect(screen.queryByTestId("appointments-loading")).not.toBeInTheDocument();
    });
  });

  it('mostra "paciente não encontrado" quando o id da rota não existe', async () => {
    const patientsAdapter = new MockPatientsAdapter([]);
    renderDetail({ patientsAdapter, path: "/pacientes/inexistente" });

    await screen.findByTestId("patient-detail-not-found");
    expect(screen.getByRole("heading", { name: "Paciente não encontrado" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Voltar para a lista" }));
    await screen.findByTestId("patients-list-stub");
  });
});

// "Hoje" injetado nos testes de registro de desfecho abaixo — consultas com
// `startsAt` antes disso contam como "já ocorridas" (presença/falta
// habilitadas); depois, só remarcação (assumption do manifesto PSI-036).
const TODAY = () => new Date("2026-07-09T00:00:00Z");

describe("PatientDetailPage — registrar desfecho (PSI-036)", () => {
  it("registrar desfecho a partir do Histórico de consultas cria o registro e ele aparece imediatamente em Registros administrativos", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const agenda = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", startsAt: "2026-06-01T14:00:00Z", status: "agendada" }) },
    ]);

    renderDetail({ patientsAdapter, appointmentsAdapter: agenda, agendaAdapter: agenda, today: TODAY });
    await screen.findByRole("heading", { name: "Marina Alves" });

    fireEvent.click(screen.getByRole("tab", { name: "Histórico de consultas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Registrar desfecho" }));

    const form = await screen.findByTestId("attendance-record-form");
    fireEvent.change(within(form).getByLabelText("Anotação administrativa (opcional)", { exact: false }), {
      target: { value: "Pagamento combinado para o dia 10." },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(screen.queryByTestId("attendance-record-form")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: "Registros administrativos" }));
    const recordsTable = await screen.findByTestId("administrative-records-table");
    expect(within(recordsTable).getByText("Compareceu")).toBeInTheDocument();
    expect(within(recordsTable).getByText("Pagamento combinado para o dia 10.")).toBeInTheDocument();

    // O status da consulta também foi atualizado (histórico da PSI-034 reflete imediatamente).
    fireEvent.click(screen.getByRole("tab", { name: "Histórico de consultas" }));
    const appointmentsTable = await screen.findByTestId("appointments-table");
    expect(within(appointmentsTable).getByText("Realizada")).toBeInTheDocument();
  });

  it("editar registro existente atualiza presença/anotação sem perder o vínculo com a consulta", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const agenda = new MockAgendaAdapter([
      {
        appointment: appointment({ id: "apt-1", startsAt: "2026-06-01T14:00:00Z", status: "realizada" }),
        attendance: { attendance: "compareceu", recordedAt: "2026-06-01T15:00:00Z" },
      },
    ]);

    renderDetail({ patientsAdapter, appointmentsAdapter: agenda, agendaAdapter: agenda, today: TODAY });
    await screen.findByRole("heading", { name: "Marina Alves" });

    fireEvent.click(screen.getByRole("tab", { name: "Registros administrativos" }));
    fireEvent.click(await screen.findByRole("button", { name: "Editar registro" }));

    const form = await screen.findByTestId("attendance-record-form");
    // Pré-preenchido com o registro existente.
    expect(within(form).getByRole("radio", { name: "Compareceu" })).toBeChecked();
    fireEvent.click(within(form).getByRole("radio", { name: "Faltou" }));
    fireEvent.change(within(form).getByLabelText("Anotação administrativa (opcional)", { exact: false }), {
      target: { value: "Correção: faltou sem aviso." },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(screen.queryByTestId("attendance-record-form")).not.toBeInTheDocument());

    const recordsTable = screen.getByTestId("administrative-records-table");
    expect(await within(recordsTable).findByText("Faltou")).toBeInTheDocument();
    expect(within(recordsTable).getByText("Correção: faltou sem aviso.")).toBeInTheDocument();
    // Continua sendo o registro da MESMA consulta — só uma linha na tabela.
    expect(within(recordsTable).getAllByRole("row")).toHaveLength(2); // cabeçalho + 1 registro
  });

  it("registrar remarcação a partir do histórico do paciente encaminha ao fluxo de remarcação da PSI-035, vinculando a anotação", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const agenda = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", startsAt: "2026-06-01T14:00:00Z", status: "agendada" }) },
    ]);

    renderDetail({ patientsAdapter, appointmentsAdapter: agenda, agendaAdapter: agenda, today: TODAY });
    await screen.findByRole("heading", { name: "Marina Alves" });

    fireEvent.click(screen.getByRole("tab", { name: "Histórico de consultas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Registrar desfecho" }));

    const attendanceForm = await screen.findByTestId("attendance-record-form");
    fireEvent.click(within(attendanceForm).getByRole("radio", { name: "Remarcar consulta" }));
    fireEvent.change(within(attendanceForm).getByLabelText("Anotação administrativa (opcional)", { exact: false }), {
      target: { value: "Remarcou por viagem de trabalho." },
    });
    fireEvent.click(within(attendanceForm).getByRole("button", { name: "Continuar para remarcação" }));

    const rescheduleForm = await screen.findByTestId("reschedule-appointment-form");
    fireEvent.change(within(rescheduleForm).getByLabelText("Nova data", { exact: false }), { target: { value: "2026-06-08" } });
    fireEvent.click(within(rescheduleForm).getByRole("button", { name: "Remarcar" }));

    await waitFor(() => expect(screen.queryByTestId("reschedule-appointment-form")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: "Registros administrativos" }));
    const recordsTable = await screen.findByTestId("administrative-records-table");
    expect(within(recordsTable).getByText("Remarcada")).toBeInTheDocument();
    expect(within(recordsTable).getByText("Remarcou por viagem de trabalho.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Histórico de consultas" }));
    const appointmentsTable = await screen.findByTestId("appointments-table");
    expect(within(appointmentsTable).getByText("Remarcada")).toBeInTheDocument();
  });

  it("o formulário de registro não tem nenhum campo clínico e rotula a anotação como administrativa", async () => {
    const patientsAdapter = new MockPatientsAdapter([patient()]);
    const agenda = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", startsAt: "2026-06-01T14:00:00Z", status: "agendada" }) },
    ]);

    renderDetail({ patientsAdapter, appointmentsAdapter: agenda, agendaAdapter: agenda, today: TODAY });
    await screen.findByRole("heading", { name: "Marina Alves" });

    fireEvent.click(screen.getByRole("tab", { name: "Histórico de consultas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Registrar desfecho" }));

    const form = await screen.findByTestId("attendance-record-form");
    // Rótulo explícito de "administrativa" + texto auxiliar anti-conteúdo-clínico.
    expect(within(form).getByText("Anotação administrativa (opcional)")).toBeInTheDocument();
    expect(
      within(form).getByText(/Não inclua conteúdo clínico, diagnóstico ou evolução do paciente/),
    ).toBeInTheDocument();

    // Nenhum campo/rótulo de natureza clínica.
    for (const clinicalTerm of ["Diagnóstico", "Evolução", "Queixa", "Prontuário", "Conduta clínica", "Hipótese"]) {
      expect(within(form).queryByText(clinicalTerm)).not.toBeInTheDocument();
    }
    // Só há três campos de entrada no formulário: os três radios de desfecho e a anotação.
    expect(within(form).getAllByRole("radio")).toHaveLength(3);
    expect(within(form).getAllByRole("textbox")).toHaveLength(1);
  });
});
