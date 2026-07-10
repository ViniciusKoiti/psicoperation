import { Alert, Badge, Button, Center, Group, Loader, Skeleton, Stack, Table, Tabs, Text, Title } from "@mantine/core";
import type { Appointment, Charge, ChargeStatus, Patient } from "@psiops/contracts";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  agendaAdapter as defaultAgendaAdapter,
  type AgendaAdapter,
  type AppointmentHistoryEntry,
  type AppointmentsReadAdapter,
  isAgendaConflictError,
} from "../../adapters/appointments";
import { chargesAdapter as defaultChargesAdapter, type ChargesReadAdapter } from "../../adapters/charges";
import { isPatientNotFoundError, patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { EmptyState } from "../../components/EmptyState";
import { type AttendanceRecordSubmitValues, AttendanceRecordModal } from "../agenda/AttendanceRecordModal";
import { RescheduleAppointmentModal, type RescheduleAppointmentValues } from "../agenda/RescheduleAppointmentModal";
import { formatCentsAsBRL } from "./money";
import {
  APPOINTMENT_STATUS_LABEL,
  ATTENDANCE_STATUS_LABEL,
  CHARGE_STATUS_LABEL,
  CHARGE_STATUS_ORDER,
  formatAppointmentDateTime,
  formatCompetence,
  formatIsoDate,
  groupChargesByStatus,
  hasAttendanceRecord,
  sortAppointmentsDescending,
  sumChargeAmounts,
} from "./patientDetail";

export interface PatientDetailPageProps {
  /** Injetáveis para testes; produção usa os adapters compostos em `src/adapters/**`. */
  patientsAdapter?: PatientsAdapter;
  appointmentsAdapter?: AppointmentsReadAdapter;
  /**
   * Adapter de ESCRITA de registros administrativos (PSI-036):
   * `recordAttendance` (presença/falta/remarcação) e `rescheduleAppointment`
   * (reaproveitando o mesmo fluxo de remarcação da PSI-035 quando o desfecho
   * registrado é "remarcada"). Prop SEPARADA de `appointmentsAdapter` de
   * propósito — não estreita o tipo já usado por essa leitura (mantém
   * `AppointmentsReadAdapter`, compatível com testes/fakes só-leitura
   * existentes da PSI-034) — mas em produção as duas resolvem para a MESMA
   * instância (`agendaAdapter`, `src/adapters/appointments`), então
   * escrita e leitura sempre veem o mesmo estado.
   */
  agendaAdapter?: AgendaAdapter;
  chargesAdapter?: ChargesReadAdapter;
  /** Relógio injetável — determinismo ao decidir se uma consulta já ocorreu (presença/falta habilitadas) nos testes. */
  today?: () => Date;
}

type PatientLoadState = "loading" | "loaded" | "not-found" | "error";
type SectionState<T> = { status: "loading" } | { status: "loaded"; data: T } | { status: "error" };

interface LocationBackState {
  back?: string;
}

/**
 * Rota `/pacientes/:patientId` (PSI-034): detalhe do paciente acessado a
 * partir da lista (PSI-033), consolidando em abas Mantine (tematizadas pelos
 * tokens `@psiops/ui`, ver `psiopsTheme`):
 *
 * - Dados cadastrais: as mesmas informações administrativas do
 *   `PatientsAdapter`, com um botão que leva à edição reutilizando
 *   `PatientForm`/`PatientFormPage` da PSI-033 (`/pacientes/:id/editar`) —
 *   nenhum formulário é recriado aqui;
 * - Histórico de consultas: `AppointmentsReadAdapter.listAppointmentsByPatient`,
 *   ordenado da mais recente para a mais antiga (`sortAppointmentsDescending`).
 *   Desde a PSI-035, quem implementa essa leitura em produção é o
 *   `AgendaAdapter` (agenda completa) — a instância padrão injetada aqui é
 *   `agendaAdapter`, mas o tipo do prop continua `AppointmentsReadAdapter`
 *   (o subconjunto que esta tela realmente usa), sem nenhuma mudança nesta
 *   página;
 * - Registros administrativos: mesma fonte de consultas, filtrada para as
 *   que já têm `attendance` lançado (`hasAttendanceRecord`). Desde a
 *   PSI-036, deixou de ser somente leitura: cada linha do "Histórico de
 *   consultas" sem registro ganha "Registrar desfecho", e cada linha de
 *   "Registros administrativos" ganha "Editar registro" — os dois abrem o
 *   MESMO `AttendanceRecordModal` da agenda (PSI-035/036,
 *   `src/features/agenda`), sem formulário duplicado. Presença/falta chama
 *   `AgendaAdapter.recordAttendance`; remarcação encaminha ao MESMO
 *   `RescheduleAppointmentModal`/fluxo da PSI-035, vinculando a anotação
 *   depois de confirmado o novo horário (mesma orquestração de
 *   `AgendaPage`). Qualquer registro criado/editado recarrega o histórico
 *   (`reloadAppointments`) para refletir imediatamente na tela;
 * - Situação financeira: `ChargesReadAdapter.listChargesByPatient`, agrupada
 *   por `ChargeStatus` (`groupChargesByStatus`), valores sempre formatados
 *   a partir de centavos inteiros (`formatCentsAsBRL`).
 *
 * As três fontes carregam em paralelo, cada uma com seu próprio estado de
 * carregamento/erro/vazio — uma falha em consultas ou cobranças não bloqueia
 * as demais seções. `patientId` inexistente (`PatientsAdapterError` 404, ver
 * `isPatientNotFoundError`) mostra a tela de "não encontrado" com retorno à
 * lista.
 *
 * "Voltar para a lista" preserva busca/página: a lista (`PatientsListPage`)
 * guarda esse estado na própria URL e passa a URL atual como
 * `location.state.back` ao navegar para cá; sem esse estado (ex.: acesso
 * direto pela URL do detalhe), o padrão é `/pacientes` sem filtros.
 */
export function PatientDetailPage({
  patientsAdapter = defaultPatientsAdapter,
  appointmentsAdapter = defaultAgendaAdapter,
  agendaAdapter = defaultAgendaAdapter,
  chargesAdapter = defaultChargesAdapter,
  today = () => new Date(),
}: PatientDetailPageProps) {
  const { patientId } = useParams<{ patientId: string }>();
  const location = useLocation();
  const backTo = (location.state as LocationBackState | null)?.back ?? "/pacientes";

  const [patientState, setPatientState] = useState<PatientLoadState>("loading");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentsState, setAppointmentsState] = useState<SectionState<AppointmentHistoryEntry[]>>({
    status: "loading",
  });
  const [appointmentsReloadToken, setAppointmentsReloadToken] = useState(0);
  const [chargesState, setChargesState] = useState<SectionState<Charge[]>>({ status: "loading" });

  // Registro de desfecho (PSI-036): consulta-alvo do modal de registro
  // (`AttendanceRecordModal`, compartilhado com a agenda) e da remarcação
  // (`RescheduleAppointmentModal`, mesmo componente da PSI-035) — mesma
  // orquestração de `AgendaPage.tsx`.
  const [attendanceTarget, setAttendanceTarget] = useState<AppointmentHistoryEntry | null>(null);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [pendingAttendanceNote, setPendingAttendanceNote] = useState<string | undefined>(undefined);

  function reloadAppointments() {
    setAppointmentsReloadToken((token) => token + 1);
  }

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    setPatientState("loading");
    patientsAdapter.getPatient(patientId).then(
      (result) => {
        if (!active) return;
        setPatient(result);
        setPatientState("loaded");
      },
      (error: unknown) => {
        if (!active) return;
        setPatientState(isPatientNotFoundError(error) ? "not-found" : "error");
      },
    );
    return () => {
      active = false;
    };
  }, [patientsAdapter, patientId]);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    setAppointmentsState({ status: "loading" });
    appointmentsAdapter.listAppointmentsByPatient(patientId).then(
      (entries) => {
        if (!active) return;
        setAppointmentsState({ status: "loaded", data: sortAppointmentsDescending(entries) });
      },
      () => {
        if (!active) return;
        setAppointmentsState({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [appointmentsAdapter, patientId, appointmentsReloadToken]);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    setChargesState({ status: "loading" });
    chargesAdapter.listChargesByPatient(patientId).then(
      (charges) => {
        if (!active) return;
        setChargesState({ status: "loaded", data: charges });
      },
      () => {
        if (!active) return;
        setChargesState({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [chargesAdapter, patientId]);

  function openAttendanceModal(entry: AppointmentHistoryEntry) {
    setAttendanceError(null);
    setAttendanceTarget(entry);
  }

  async function handleAttendanceSubmit(values: AttendanceRecordSubmitValues) {
    if (!attendanceTarget) return;
    const appointmentId = attendanceTarget.appointment.id;

    if (values.kind === "reschedule") {
      // "Registrar remarcação conduz ao fluxo de remarcação da PSI-035,
      // mantendo o vínculo da anotação" (critério de aceite): fecha este
      // modal e abre o MESMO `RescheduleAppointmentModal` da PSI-035,
      // guardando a anotação para vincular depois que a remarcação for
      // confirmada (ver `handleRescheduleSubmit`) — mesma orquestração de
      // `AgendaPage.tsx`.
      setAttendanceTarget(null);
      setPendingAttendanceNote(values.administrativeNotes);
      setRescheduleError(null);
      setRescheduleTarget(attendanceTarget.appointment);
      return;
    }

    setAttendanceError(null);
    setAttendanceSubmitting(true);
    try {
      await agendaAdapter.recordAttendance(appointmentId, {
        attendance: values.attendance,
        ...(values.administrativeNotes ? { administrativeNotes: values.administrativeNotes } : {}),
      });
      setAttendanceTarget(null);
      reloadAppointments();
    } catch {
      setAttendanceError("Não foi possível registrar o desfecho agora. Tente novamente.");
    } finally {
      setAttendanceSubmitting(false);
    }
  }

  async function handleRescheduleSubmit(values: RescheduleAppointmentValues) {
    if (!rescheduleTarget) return;
    setRescheduleError(null);
    setRescheduleSubmitting(true);
    try {
      await agendaAdapter.rescheduleAppointment(rescheduleTarget.id, values);
      // Vincula a anotação administrativa ao registro de "remarcada" só
      // DEPOIS que o novo horário é confirmado — nunca antes, para não
      // gravar presença de uma remarcação que falhou (ex.: conflito).
      await agendaAdapter.recordAttendance(rescheduleTarget.id, {
        attendance: "remarcada",
        ...(pendingAttendanceNote ? { administrativeNotes: pendingAttendanceNote } : {}),
      });
      setRescheduleTarget(null);
      setPendingAttendanceNote(undefined);
      reloadAppointments();
    } catch (error) {
      setRescheduleError(
        isAgendaConflictError(error)
          ? error.message
          : "Não foi possível remarcar a consulta agora. Tente novamente.",
      );
    } finally {
      setRescheduleSubmitting(false);
    }
  }

  if (!patientId || patientState === "not-found") {
    return (
      <Stack gap="md" data-testid="patient-detail-not-found">
        <Title order={2}>Paciente não encontrado</Title>
        <Text c="dimmed" size="sm">
          Não encontramos esse paciente — o link pode estar incorreto, ou ele pode ter sido removido.
        </Text>
        <Button component={Link} to="/pacientes" variant="default" w="fit-content">
          Voltar para a lista
        </Button>
      </Stack>
    );
  }

  if (patientState === "error") {
    return (
      <Alert color="red" variant="light" data-testid="patient-detail-error">
        Não foi possível carregar os dados deste paciente.
      </Alert>
    );
  }

  if (patientState === "loading" || patient === null) {
    return (
      <Center mih={200}>
        <Loader data-testid="patient-detail-loading" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={4}>
          <Title order={2}>{patient.name}</Title>
          <Text c="dimmed" size="sm">
            Detalhe do paciente
          </Text>
        </Stack>
        <Group gap="xs">
          <Button component={Link} to={backTo} variant="default">
            Voltar para a lista
          </Button>
          <Button component={Link} to={`/pacientes/${patient.id}/editar`}>
            Editar cadastro
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="cadastro">
        <Tabs.List>
          <Tabs.Tab value="cadastro">Dados cadastrais</Tabs.Tab>
          <Tabs.Tab value="consultas">Histórico de consultas</Tabs.Tab>
          <Tabs.Tab value="registros">Registros administrativos</Tabs.Tab>
          <Tabs.Tab value="financeiro">Situação financeira</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cadastro" pt="md">
          <RegistrationSection patient={patient} />
        </Tabs.Panel>
        <Tabs.Panel value="consultas" pt="md">
          <AppointmentsHistorySection state={appointmentsState} onRecordAttendance={openAttendanceModal} />
        </Tabs.Panel>
        <Tabs.Panel value="registros" pt="md">
          <AdministrativeRecordsSection state={appointmentsState} onEditAttendance={openAttendanceModal} />
        </Tabs.Panel>
        <Tabs.Panel value="financeiro" pt="md">
          <FinancialSection state={chargesState} />
        </Tabs.Panel>
      </Tabs>

      <AttendanceRecordModal
        opened={attendanceTarget !== null}
        appointment={attendanceTarget?.appointment ?? null}
        patientName={patient.name}
        existingRecord={attendanceTarget?.attendance}
        allowPresence={attendanceTarget ? Date.parse(attendanceTarget.appointment.startsAt) <= today().getTime() : false}
        onSubmit={handleAttendanceSubmit}
        onClose={() => setAttendanceTarget(null)}
        submitting={attendanceSubmitting}
        formError={attendanceError}
      />

      <RescheduleAppointmentModal
        opened={rescheduleTarget !== null}
        appointment={rescheduleTarget}
        patientName={patient.name}
        onSubmit={handleRescheduleSubmit}
        onClose={() => {
          setRescheduleTarget(null);
          setPendingAttendanceNote(undefined);
        }}
        submitting={rescheduleSubmitting}
        formError={rescheduleError}
      />
    </Stack>
  );
}

function RegistrationSection({ patient }: { patient: Patient }) {
  return (
    <Table withRowBorders={false} data-testid="patient-registration-table">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th>Nome</Table.Th>
          <Table.Td>{patient.name}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>WhatsApp</Table.Th>
          <Table.Td>{patient.whatsapp ?? "—"}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>E-mail</Table.Th>
          <Table.Td>{patient.email ?? "—"}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Mensalidade</Table.Th>
          <Table.Td>{formatCentsAsBRL(patient.monthlyFee)}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Dia de vencimento</Table.Th>
          <Table.Td>Dia {patient.billingDay}</Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Situação cadastral</Table.Th>
          <Table.Td>
            <Badge variant="light" color={patient.status === "ativo" ? "primary" : "neutral"}>
              {patient.status === "ativo" ? "Ativo" : "Arquivado"}
            </Badge>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th>Anotações administrativas</Table.Th>
          <Table.Td>{patient.notes ?? "—"}</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}

interface AppointmentsHistorySectionProps {
  state: SectionState<AppointmentHistoryEntry[]>;
  /** Abre `AttendanceRecordModal` para registrar o desfecho desta consulta (PSI-036). */
  onRecordAttendance: (entry: AppointmentHistoryEntry) => void;
}

function AppointmentsHistorySection({ state, onRecordAttendance }: AppointmentsHistorySectionProps) {
  if (state.status === "loading") {
    return (
      <Stack gap="xs" data-testid="appointments-loading">
        <Skeleton height={32} radius="sm" />
        <Skeleton height={32} radius="sm" />
      </Stack>
    );
  }

  if (state.status === "error") {
    return (
      <Alert color="red" variant="light" data-testid="appointments-error">
        Não foi possível carregar o histórico de consultas.
      </Alert>
    );
  }

  if (state.data.length === 0) {
    return (
      <EmptyState
        title="Nenhuma consulta registrada"
        description="Consultas agendadas para este paciente aparecerão aqui."
      />
    );
  }

  return (
    <Table data-testid="appointments-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Data</Table.Th>
          <Table.Th>Horário</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {state.data.map((entry) => {
          const { appointment } = entry;
          const { date, time } = formatAppointmentDateTime(appointment.startsAt);
          // "Registrar desfecho" fica disponível para consultas ainda sem
          // registro administrativo lançado e que não foram canceladas
          // (uma consulta cancelada nunca ocorreu — nada a registrar).
          const canRecordAttendance = !hasAttendanceRecord(entry) && appointment.status !== "cancelada";
          return (
            <Table.Tr key={appointment.id}>
              <Table.Td>{date}</Table.Td>
              <Table.Td>{time}</Table.Td>
              <Table.Td>
                <Badge variant="light">{APPOINTMENT_STATUS_LABEL[appointment.status]}</Badge>
              </Table.Td>
              <Table.Td>
                {canRecordAttendance && (
                  <Button variant="subtle" size="compact-xs" onClick={() => onRecordAttendance(entry)}>
                    Registrar desfecho
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

interface AdministrativeRecordsSectionProps {
  state: SectionState<AppointmentHistoryEntry[]>;
  /** Abre `AttendanceRecordModal` pré-preenchido para editar o registro desta consulta (PSI-036). */
  onEditAttendance: (entry: AppointmentHistoryEntry) => void;
}

/**
 * Registros administrativos: mesma fonte de `AppointmentsHistorySection`
 * (`AppointmentsReadAdapter.listAppointmentsByPatient`), filtrada para as
 * consultas que já têm presença administrativa lançada
 * (`hasAttendanceRecord`). Desde a PSI-036, cada linha ganha "Editar
 * registro", abrindo `AttendanceRecordModal` pré-preenchido — a criação
 * acontece em `AppointmentsHistorySection`. NENHUM campo clínico: apenas
 * presença (compareceu/faltou/remarcada) e a anotação administrativa livre
 * do contrato (`AttendanceRecord`).
 */
function AdministrativeRecordsSection({ state, onEditAttendance }: AdministrativeRecordsSectionProps) {
  if (state.status === "loading") {
    return (
      <Stack gap="xs" data-testid="administrative-records-loading">
        <Skeleton height={32} radius="sm" />
        <Skeleton height={32} radius="sm" />
      </Stack>
    );
  }

  if (state.status === "error") {
    return (
      <Alert color="red" variant="light" data-testid="administrative-records-error">
        Não foi possível carregar os registros administrativos.
      </Alert>
    );
  }

  const records = state.data.filter(hasAttendanceRecord);

  if (records.length === 0) {
    return (
      <EmptyState
        title="Nenhum registro administrativo"
        description="Registros de presença administrativa das consultas (compareceu, faltou, remarcada) aparecerão aqui."
      />
    );
  }

  return (
    <Table data-testid="administrative-records-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Consulta</Table.Th>
          <Table.Th>Presença</Table.Th>
          <Table.Th>Anotação administrativa</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {records.map((entry) => {
          const { appointment, attendance } = entry;
          const { date, time } = formatAppointmentDateTime(appointment.startsAt);
          return (
            <Table.Tr key={appointment.id}>
              <Table.Td>
                {date} às {time}
              </Table.Td>
              <Table.Td>
                <Badge variant="light">{ATTENDANCE_STATUS_LABEL[attendance.attendance]}</Badge>
              </Table.Td>
              <Table.Td>{attendance.administrativeNotes ?? "—"}</Table.Td>
              <Table.Td>
                <Button variant="subtle" size="compact-xs" onClick={() => onEditAttendance(entry)}>
                  Editar registro
                </Button>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

function FinancialSection({ state }: { state: SectionState<Charge[]> }) {
  if (state.status === "loading") {
    return (
      <Stack gap="xs" data-testid="charges-loading">
        <Skeleton height={32} radius="sm" />
        <Skeleton height={32} radius="sm" />
      </Stack>
    );
  }

  if (state.status === "error") {
    return (
      <Alert color="red" variant="light" data-testid="charges-error">
        Não foi possível carregar a situação financeira.
      </Alert>
    );
  }

  if (state.data.length === 0) {
    return (
      <EmptyState
        title="Nenhuma mensalidade lançada"
        description="Mensalidades emitidas para este paciente aparecerão aqui, agrupadas por situação."
      />
    );
  }

  const groups = groupChargesByStatus(state.data);

  return (
    <Stack gap="lg" data-testid="charges-groups">
      {CHARGE_STATUS_ORDER.map((status) => (
        <ChargeStatusGroup key={status} status={status} charges={groups[status]} />
      ))}
    </Stack>
  );
}

function ChargeStatusGroup({ status, charges }: { status: ChargeStatus; charges: Charge[] }) {
  return (
    <Stack gap="xs" data-testid={`charge-group-${status}`}>
      <Group justify="space-between">
        <Text fw={600}>{CHARGE_STATUS_LABEL[status]}</Text>
        <Text c="dimmed" size="sm" data-testid={`charge-group-${status}-total`}>
          {charges.length === 0 ? "Nenhuma mensalidade" : formatCentsAsBRL(sumChargeAmounts(charges))}
        </Text>
      </Group>
      {charges.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nenhuma mensalidade nesta situação.
        </Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Competência</Table.Th>
              <Table.Th>Vencimento</Table.Th>
              <Table.Th>Valor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.map((charge) => (
              <Table.Tr key={charge.id}>
                <Table.Td>{formatCompetence(charge.competence)}</Table.Td>
                <Table.Td>{formatIsoDate(charge.dueDate)}</Table.Td>
                <Table.Td>{formatCentsAsBRL(charge.amount)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
