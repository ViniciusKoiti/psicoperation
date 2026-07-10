import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Appointment, AppointmentCreateRequest, Patient } from "@psiops/contracts";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AGENDA_CONFLICT_MESSAGE,
  type AgendaAdapter,
  AgendaAdapterError,
  MockAgendaAdapter,
} from "../../adapters/appointments";
import { MockPatientsAdapter } from "../../adapters/patients";
import { buildIsoDateTime } from "./agenda";
import { AgendaPage } from "./AgendaPage";

const PATIENT_A_ID = "patient-a";
const PATIENT_B_ID = "patient-b";

// Segunda-feira — usada como "hoje" injetado em todos os testes, para a
// agenda ficar inteiramente determinística (nenhum teste depende do
// relógio real da máquina).
const TODAY = () => new Date(2026, 6, 13);

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
    startsAt: overrides.startsAt ?? "2026-07-13T10:00:00Z",
    durationMinutes: overrides.durationMinutes ?? 50,
    status: overrides.status ?? "agendada",
    createdAt: overrides.createdAt ?? "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

const PATIENTS = [
  patient({ id: PATIENT_A_ID, name: "Marina Alves" }),
  patient({ id: PATIENT_B_ID, name: "Camila Souza" }),
];

function renderAgenda(adapter: AgendaAdapter, patientsAdapter = new MockPatientsAdapter(PATIENTS)) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <AgendaPage adapter={adapter} patientsAdapter={patientsAdapter} today={TODAY} />
    </MantineProvider>,
  );
}

/** Adapter fake mínimo para simular um 409 assíncrono do servidor mesmo quando a checagem client-side (baseada em `listAppointments`) não encontrou nada — ex.: corrida com outra aba. */
function makeAlwaysConflictingAdapter(): AgendaAdapter {
  return {
    listAppointmentsByPatient: async () => [],
    listAppointments: async () => [],
    createAppointment: async () => {
      throw new AgendaAdapterError(AGENDA_CONFLICT_MESSAGE, 409);
    },
    rescheduleAppointment: async () => {
      throw new AgendaAdapterError(AGENDA_CONFLICT_MESSAGE, 409);
    },
    cancelAppointment: async () => {},
    createAppointmentSeries: async () => ({ occurrences: [] }),
    recordAttendance: async () => {
      throw new AgendaAdapterError(AGENDA_CONFLICT_MESSAGE, 409);
    },
  };
}

/**
 * NOTA IMPORTANTE sobre os modais nesta suíte: `data-testid="...-modal"" fica
 * na raiz do `<Modal>` do Mantine, que permanece SEMPRE no DOM (aberto ou
 * fechado) — só o conteúdo (header/body, via `Transition`) monta/desmonta
 * com `opened`. Por isso os testes aguardam um testid/rótulo DE DENTRO do
 * conteúdo (ex.: `new-appointment-form`) para saber que o modal abriu, e
 * verificam a AUSÊNCIA desse conteúdo (não da raiz) para saber que fechou —
 * mesmo padrão que `ArchivePatientModal`/`PatientsListPage.test.tsx` (PSI-033)
 * já usa (`confirm-archive-patient`, não `archive-patient-modal`).
 */
async function fillAndSubmitNewAppointment(options: { patientId: string; date: string; time: string }) {
  fireEvent.click(screen.getByRole("button", { name: "Nova consulta" }));
  const form = await screen.findByTestId("new-appointment-form");

  fireEvent.change(within(form).getByLabelText("Paciente", { exact: false }), { target: { value: options.patientId } });
  fireEvent.change(within(form).getByLabelText("Data", { exact: false }), { target: { value: options.date } });
  fireEvent.change(within(form).getByLabelText("Horário", { exact: false }), { target: { value: options.time } });

  // `within(form)`, não `screen`: a tela de agenda vazia mostra um CTA "Agendar
  // consulta" atrás do modal com o MESMO texto do botão de submissão do
  // formulário — sem escopo, `getByRole` encontraria os dois.
  fireEvent.click(within(form).getByRole("button", { name: "Agendar consulta" }));
}

describe("AgendaPage — visões semanal e diária", () => {
  it("mostra a visão semanal por padrão, com as consultas nos dias certos e destaque para hoje", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "seg", startsAt: "2026-07-13T10:00:00Z", patientId: PATIENT_A_ID }) },
      { appointment: appointment({ id: "qua", startsAt: "2026-07-15T14:00:00Z", patientId: PATIENT_B_ID }) },
    ]);

    renderAgenda(adapter);

    await screen.findByTestId("agenda-week-view");
    const mondayColumn = screen.getByTestId("agenda-day-2026-07-13");
    expect(within(mondayColumn).getByText(/Marina Alves/)).toBeInTheDocument();
    expect(within(mondayColumn).getByText("Hoje")).toBeInTheDocument();

    const wednesdayColumn = screen.getByTestId("agenda-day-2026-07-15");
    expect(within(wednesdayColumn).getByText(/Camila Souza/)).toBeInTheDocument();
  });

  it("alterna para a visão diária, mostrando só as consultas do dia de referência", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "seg", startsAt: "2026-07-13T10:00:00Z", patientId: PATIENT_A_ID }) },
      { appointment: appointment({ id: "qua", startsAt: "2026-07-15T14:00:00Z", patientId: PATIENT_B_ID }) },
    ]);

    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("radio", { name: "Dia" }));

    const dayView = await screen.findByTestId("agenda-day-view");
    expect(within(dayView).getByText(/Marina Alves/)).toBeInTheDocument();
    expect(within(dayView).queryByText(/Camila Souza/)).not.toBeInTheDocument();
  });

  it("mostra o carregamento e depois a agenda", async () => {
    const adapter = new MockAgendaAdapter([]);
    renderAgenda(adapter);

    expect(screen.getByTestId("agenda-loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("agenda-loading")).not.toBeInTheDocument());
  });

  it("mostra estado vazio quando não há consultas no período visível", async () => {
    const adapter = new MockAgendaAdapter([]);
    renderAgenda(adapter);

    expect(await screen.findByText("Nenhuma consulta neste período")).toBeInTheDocument();
  });

  it("navegação entre períodos (Anterior/Hoje/Próxima) recarrega a agenda com o intervalo certo", async () => {
    const adapter = new MockAgendaAdapter([]);
    const listSpy = vi.spyOn(adapter, "listAppointments");
    renderAgenda(adapter);

    await waitFor(() => expect(listSpy).toHaveBeenCalledWith({ from: "2026-07-13", to: "2026-07-19" }));

    fireEvent.click(screen.getByRole("button", { name: "Próximo período" }));
    await waitFor(() => expect(listSpy).toHaveBeenCalledWith({ from: "2026-07-20", to: "2026-07-26" }));

    fireEvent.click(screen.getByRole("button", { name: "Hoje" }));
    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith({ from: "2026-07-13", to: "2026-07-19" }));

    fireEvent.click(screen.getByRole("button", { name: "Período anterior" }));
    await waitFor(() => expect(listSpy).toHaveBeenLastCalledWith({ from: "2026-07-06", to: "2026-07-12" }));
  });
});

describe("AgendaPage — criar consulta", () => {
  it("cria uma consulta avulsa e recarrega a agenda", async () => {
    const adapter = new MockAgendaAdapter([]);
    const createSpy = vi.spyOn(adapter, "createAppointment");
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");

    await fillAndSubmitNewAppointment({ patientId: PATIENT_A_ID, date: "2026-07-16", time: "09:00" });

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(createSpy).toHaveBeenCalledWith({
      patientId: PATIENT_A_ID,
      startsAt: expect.stringContaining("2026-07-16"),
      durationMinutes: 50,
    } satisfies AppointmentCreateRequest);
    await waitFor(() => expect(screen.queryByTestId("new-appointment-form")).not.toBeInTheDocument());
    expect(await screen.findByText(/Marina Alves/)).toBeInTheDocument();
  });

  it("detecta conflito de horário no client ANTES de submeter — não chama o adapter", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "ocupado", patientId: PATIENT_B_ID, startsAt: buildIsoDateTime("2026-07-16", "09:00"), durationMinutes: 50 }) },
    ]);
    const createSpy = vi.spyOn(adapter, "createAppointment");
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    await fillAndSubmitNewAppointment({ patientId: PATIENT_A_ID, date: "2026-07-16", time: "09:00" });

    const error = await screen.findByTestId("new-appointment-error");
    expect(error).toHaveTextContent("Camila Souza");
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("trata o 409 devolvido pelo adapter (ex.: corrida entre abas) com uma mensagem de conflito, não um erro genérico", async () => {
    const adapter = makeAlwaysConflictingAdapter();
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");

    await fillAndSubmitNewAppointment({ patientId: PATIENT_A_ID, date: "2026-07-16", time: "09:00" });

    const error = await screen.findByTestId("new-appointment-error");
    expect(error).toHaveTextContent(AGENDA_CONFLICT_MESSAGE);
  });
});

describe("AgendaPage — série recorrente semanal", () => {
  it("cria todas as ocorrências quando não há conflito e mostra o resumo", async () => {
    const adapter = new MockAgendaAdapter([]);
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");

    fireEvent.click(screen.getByRole("button", { name: "Nova consulta" }));
    await screen.findByTestId("new-appointment-form");
    fireEvent.change(screen.getByLabelText("Paciente", { exact: false }), { target: { value: PATIENT_A_ID } });
    fireEvent.change(screen.getByLabelText("Data", { exact: false }), { target: { value: "2026-07-16" } });
    fireEvent.change(screen.getByLabelText("Horário", { exact: false }), { target: { value: "09:00" } });
    fireEvent.click(screen.getByLabelText("Repetir semanalmente"));
    fireEvent.change(screen.getByLabelText("Número de semanas", { exact: false }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar série" }));

    const summary = await screen.findByTestId("series-result-summary");
    const occurrences = within(summary).getAllByTestId("series-result-occurrence");
    expect(occurrences).toHaveLength(2);
    expect(within(summary).getAllByText("Criada")).toHaveLength(2);
  });

  it("cria as ocorrências livres e reporta as conflitantes, sem abortar a série (conflito parcial)", async () => {
    const adapter = new MockAgendaAdapter([
      // Bloqueia a SEGUNDA ocorrência da série (2026-07-23, uma semana depois de 2026-07-16).
      { appointment: appointment({ id: "ocupado", patientId: PATIENT_B_ID, startsAt: buildIsoDateTime("2026-07-23", "09:00"), durationMinutes: 50 }) },
    ]);
    renderAgenda(adapter);
    // A consulta bloqueante cai numa semana diferente da atual (referência) —
    // a semana visível ao abrir a página está vazia.
    await screen.findByText("Nenhuma consulta neste período");

    fireEvent.click(screen.getByRole("button", { name: "Nova consulta" }));
    await screen.findByTestId("new-appointment-form");
    fireEvent.change(screen.getByLabelText("Paciente", { exact: false }), { target: { value: PATIENT_A_ID } });
    fireEvent.change(screen.getByLabelText("Data", { exact: false }), { target: { value: "2026-07-16" } });
    fireEvent.change(screen.getByLabelText("Horário", { exact: false }), { target: { value: "09:00" } });
    fireEvent.click(screen.getByLabelText("Repetir semanalmente"));
    fireEvent.change(screen.getByLabelText("Número de semanas", { exact: false }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar série" }));

    const summary = await screen.findByTestId("series-result-summary");
    expect(within(summary).getAllByText("Criada")).toHaveLength(1);
    expect(within(summary).getAllByText("Conflito")).toHaveLength(1);
  });
});

describe("AgendaPage — remarcar consulta", () => {
  it("remarca a consulta e recarrega a agenda", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-13T10:00:00Z", durationMinutes: 50 }) },
    ]);
    const rescheduleSpy = vi.spyOn(adapter, "rescheduleAppointment");
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Remarcar" }));
    const modal = await screen.findByTestId("reschedule-appointment-form");
    fireEvent.change(within(modal).getByLabelText("Novo horário", { exact: false }), { target: { value: "15:00" } });
    fireEvent.click(within(modal).getByRole("button", { name: "Remarcar" }));

    await waitFor(() =>
      expect(rescheduleSpy).toHaveBeenCalledWith("apt-1", { startsAt: expect.stringContaining("2026-07-13"), durationMinutes: 50 }),
    );
    await waitFor(() => expect(screen.queryByTestId("reschedule-appointment-form")).not.toBeInTheDocument());
  });

  it("detecta conflito no client ao remarcar, sem chamar o adapter", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-13T10:00:00Z", durationMinutes: 50 }) },
      { appointment: appointment({ id: "apt-2", patientId: PATIENT_B_ID, startsAt: buildIsoDateTime("2026-07-13", "15:00"), durationMinutes: 50 }) },
    ]);
    const rescheduleSpy = vi.spyOn(adapter, "rescheduleAppointment");
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    const mondayColumn = screen.getByTestId("agenda-day-2026-07-13");
    const rows = within(mondayColumn).getAllByTestId("agenda-appointment");
    // A primeira linha (10:00) é a `apt-1`, ordenada por horário.
    fireEvent.click(within(rows[0] as HTMLElement).getByRole("button", { name: "Remarcar" }));

    const modal = await screen.findByTestId("reschedule-appointment-form");
    fireEvent.change(within(modal).getByLabelText("Novo horário", { exact: false }), { target: { value: "15:00" } });
    fireEvent.click(within(modal).getByRole("button", { name: "Remarcar" }));

    const error = await screen.findByTestId("reschedule-appointment-error");
    expect(error).toHaveTextContent("Camila Souza");
    expect(rescheduleSpy).not.toHaveBeenCalled();
  });
});

describe("AgendaPage — registrar desfecho (PSI-036)", () => {
  it("registra presença ('compareceu') com anotação administrativa e atualiza o status para 'realizada'", async () => {
    // Consulta na semana ANTERIOR à de referência (TODAY = 2026-07-13) — já
    // ocorreu, então presença/falta ficam habilitadas no modal.
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-06T10:00:00Z" }) },
    ]);
    const recordSpy = vi.spyOn(adapter, "recordAttendance");
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");
    fireEvent.click(screen.getByRole("button", { name: "Período anterior" }));
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Registrar desfecho" }));
    const form = await screen.findByTestId("attendance-record-form");
    expect(within(form).getByRole("radio", { name: "Compareceu" })).toBeChecked();
    fireEvent.change(within(form).getByLabelText("Anotação administrativa (opcional)", { exact: false }), {
      target: { value: "Pagamento combinado para o dia 10." },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(recordSpy).toHaveBeenCalledWith("apt-1", {
        attendance: "compareceu",
        administrativeNotes: "Pagamento combinado para o dia 10.",
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("attendance-record-form")).not.toBeInTheDocument());
    expect(await screen.findByText("Realizada")).toBeInTheDocument();
  });

  it("registra falta sem anotação (opcional) e atualiza o status para 'realizada'", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-06T10:00:00Z" }) },
    ]);
    const recordSpy = vi.spyOn(adapter, "recordAttendance");
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");
    fireEvent.click(screen.getByRole("button", { name: "Período anterior" }));
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Registrar desfecho" }));
    const form = await screen.findByTestId("attendance-record-form");
    fireEvent.click(within(form).getByRole("radio", { name: "Faltou" }));
    fireEvent.click(within(form).getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(recordSpy).toHaveBeenCalledWith("apt-1", { attendance: "faltou", administrativeNotes: undefined }));
    expect(await screen.findByText("Realizada")).toBeInTheDocument();
  });

  it("consulta futura: presença/falta ficam desabilitadas, só remarcação é permitida", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-20T10:00:00Z" }) },
    ]);
    renderAgenda(adapter);
    await screen.findByText("Nenhuma consulta neste período");
    fireEvent.click(screen.getByRole("button", { name: "Próximo período" }));
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Registrar desfecho" }));
    const form = await screen.findByTestId("attendance-record-form");
    expect(within(form).getByRole("radio", { name: "Compareceu" })).toBeDisabled();
    expect(within(form).getByRole("radio", { name: "Faltou" })).toBeDisabled();
    expect(within(form).getByRole("radio", { name: "Remarcar consulta" })).toBeChecked();
    expect(screen.getByTestId("attendance-future-notice")).toBeInTheDocument();
  });

  it("registrar remarcação conduz ao MESMO fluxo de remarcação da PSI-035, vinculando a anotação", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-13T10:00:00Z", durationMinutes: 50 }) },
    ]);
    const rescheduleSpy = vi.spyOn(adapter, "rescheduleAppointment");
    const recordSpy = vi.spyOn(adapter, "recordAttendance");
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Registrar desfecho" }));
    const attendanceForm = await screen.findByTestId("attendance-record-form");
    fireEvent.click(within(attendanceForm).getByRole("radio", { name: "Remarcar consulta" }));
    fireEvent.change(within(attendanceForm).getByLabelText("Anotação administrativa (opcional)", { exact: false }), {
      target: { value: "Remarcou por viagem de trabalho." },
    });
    fireEvent.click(within(attendanceForm).getByRole("button", { name: "Continuar para remarcação" }));

    // Fecha o modal de registro e abre o MESMO `RescheduleAppointmentModal`/fluxo da PSI-035.
    await waitFor(() => expect(screen.queryByTestId("attendance-record-form")).not.toBeInTheDocument());
    const rescheduleForm = await screen.findByTestId("reschedule-appointment-form");
    fireEvent.change(within(rescheduleForm).getByLabelText("Novo horário", { exact: false }), { target: { value: "15:00" } });
    fireEvent.click(within(rescheduleForm).getByRole("button", { name: "Remarcar" }));

    await waitFor(() =>
      expect(rescheduleSpy).toHaveBeenCalledWith("apt-1", {
        startsAt: expect.stringContaining("2026-07-13"),
        durationMinutes: 50,
      }),
    );
    await waitFor(() =>
      expect(recordSpy).toHaveBeenCalledWith("apt-1", {
        attendance: "remarcada",
        administrativeNotes: "Remarcou por viagem de trabalho.",
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("reschedule-appointment-form")).not.toBeInTheDocument());
    expect(await screen.findByText("Remarcada")).toBeInTheDocument();
  });
});

describe("AgendaPage — cancelar consulta", () => {
  it("pede confirmação antes de cancelar — 'Voltar' não chama o adapter", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-13T10:00:00Z" }) },
    ]);
    const cancelSpy = vi.spyOn(adapter, "cancelAppointment");
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await screen.findByTestId("confirm-cancel-appointment");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    await waitFor(() => expect(screen.queryByTestId("confirm-cancel-appointment")).not.toBeInTheDocument());
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("confirmar cancela a consulta e ela deixa de ter ações (permanece no histórico)", async () => {
    const adapter = new MockAgendaAdapter([
      { appointment: appointment({ id: "apt-1", patientId: PATIENT_A_ID, startsAt: "2026-07-13T10:00:00Z" }) },
    ]);
    renderAgenda(adapter);
    await screen.findByTestId("agenda-week-view");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    const confirmButton = await screen.findByTestId("confirm-cancel-appointment");
    fireEvent.click(confirmButton);

    await waitFor(() => expect(screen.queryByTestId("confirm-cancel-appointment")).not.toBeInTheDocument());
    // A consulta continua visível (histórico preservado), mas sem mais os botões de ação.
    expect(await screen.findByText(/Marina Alves/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remarcar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });
});
