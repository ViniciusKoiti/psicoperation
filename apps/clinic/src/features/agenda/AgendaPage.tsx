import { Alert, Badge, Button, Group, Paper, SegmentedControl, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { Appointment } from "@psiops/contracts";
import { useEffect, useMemo, useState } from "react";

import {
  agendaAdapter as defaultAgendaAdapter,
  type AgendaAdapter,
  type CreateAppointmentSeriesInput,
  type CreateAppointmentSeriesResult,
  findConflictingAppointment,
  isAgendaConflictError,
} from "../../adapters/appointments";
import { patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { EmptyState } from "../../components/EmptyState";
import {
  addDays,
  APPOINTMENT_STATUS_LABEL,
  type AgendaViewMode,
  formatAppointmentDate,
  formatAppointmentTime,
  formatDayHeader,
  formatDayTitle,
  formatIsoDateLabel,
  groupAppointmentsByDay,
  isSameDay,
  startOfWeek,
  toIsoDate,
  toLocalDateInputValue,
  weekDays,
} from "./agenda";
import { CancelAppointmentModal } from "./CancelAppointmentModal";
import { type NewAppointmentSubmit, NewAppointmentModal, type PatientOption } from "./NewAppointmentModal";
import { RescheduleAppointmentModal, type RescheduleAppointmentValues } from "./RescheduleAppointmentModal";

export interface AgendaPageProps {
  /** Injetável para testes; produção usa o `agendaAdapter` composto em `src/adapters/appointments`. */
  adapter?: AgendaAdapter;
  /** Injetável para testes; produção usa o `patientsAdapter` composto em `src/adapters/patients`. */
  patientsAdapter?: PatientsAdapter;
  /** Relógio injetável — determinismo no atalho "hoje" e no destaque do dia atual nos testes. */
  today?: () => Date;
}

type LoadState = "loading" | "loaded" | "error";

/**
 * Rota `/agenda` (PSI-035): visões semanal e diária de consultas, com
 * navegação entre períodos, atalho "hoje", criação (avulsa ou em série
 * semanal simples), remarcação e cancelamento — todas via `AgendaAdapter`
 * (`src/adapters/appointments`, que absorveu o `AppointmentsReadAdapter` da
 * PSI-034, ver a doc de `AgendaAdapter.ts`).
 *
 * Conflito de horário: antes de qualquer criação/remarcação, esta página
 * busca uma janela de 3 dias UTC ao redor do dia-alvo
 * (`fetchSameLocalDayAppointments`) e filtra pelo dia-calendário LOCAL —
 * larga o bastante para cobrir o deslocamento entre o particionamento em
 * UTC do adapter e a exibição em fuso local (ver a doc de `agenda.ts`) — e
 * roda `findConflictingAppointment` (a MESMA regra usada por
 * `MockAgendaAdapter` para decidir o 409) antes de chamar
 * `createAppointment`/`rescheduleAppointment`. Se mesmo assim o adapter
 * devolver 409 (ex.: outra aba criou uma consulta concorrente entre a
 * validação e o submit), o catch trata `isAgendaConflictError` e tenta
 * localizar a consulta conflitante de novo para exibir os mesmos detalhes —
 * client-side e pós-409 caem no mesmo código de exibição.
 */
export function AgendaPage({
  adapter = defaultAgendaAdapter,
  patientsAdapter = defaultPatientsAdapter,
  today = () => new Date(),
}: AgendaPageProps) {
  const [viewMode, setViewMode] = useState<AgendaViewMode>("semana");
  const [referenceDate, setReferenceDate] = useState<Date>(() => startOfDay(today()));

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [patientsById, setPatientsById] = useState<Record<string, string>>({});
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [seriesResult, setSeriesResult] = useState<CreateAppointmentSeriesResult | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (viewMode === "dia") {
      const iso = toIsoDate(referenceDate);
      return { from: iso, to: iso };
    }
    const start = startOfWeek(referenceDate);
    return { from: toIsoDate(start), to: toIsoDate(addDays(start, 6)) };
  }, [viewMode, referenceDate]);

  useEffect(() => {
    let active = true;
    Promise.all([
      patientsAdapter.listPatients({ status: "ativo", size: 500 }),
      patientsAdapter.listPatients({ status: "inativo", size: 500 }),
    ]).then(
      ([activePage, inactivePage]) => {
        if (!active) return;
        const byId: Record<string, string> = {};
        for (const p of [...activePage.items, ...inactivePage.items]) byId[p.id] = p.name;
        setPatientsById(byId);
        setPatientOptions(activePage.items.map((p) => ({ value: p.id, label: p.name })));
      },
      () => {
        // Falha ao carregar pacientes não bloqueia a agenda — nomes caem no
        // fallback do id (ver `patientLabel`); só a seleção no formulário de
        // criação fica vazia.
      },
    );
    return () => {
      active = false;
    };
  }, [patientsAdapter]);

  useEffect(() => {
    let active = true;
    setLoadState("loading");
    adapter.listAppointments(range).then(
      (items) => {
        if (!active) return;
        setAppointments(items);
        setLoadState("loaded");
      },
      () => {
        if (!active) return;
        setLoadState("error");
      },
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `range` é recomputado por `useMemo`; comparar from/to evita reload em toda renderização.
  }, [adapter, range.from, range.to, reloadToken]);

  function patientLabel(patientId: string): string {
    return patientsById[patientId] ?? `Paciente ${patientId}`;
  }

  function describeConflict(conflict: Appointment): string {
    return `Este horário conflita com a consulta de ${patientLabel(conflict.patientId)} em ${formatAppointmentDate(
      conflict.startsAt,
    )} às ${formatAppointmentTime(conflict.startsAt)}.`;
  }

  /**
   * Busca as consultas do dia-calendário LOCAL de `dateIso` (`AAAA-MM-DD`)
   * para checagem de conflito — ver a ressalva de fuso na doc da página.
   */
  async function fetchSameLocalDayAppointments(dateIso: string): Promise<Appointment[]> {
    const targetMidnightLocal = new Date(`${dateIso}T00:00:00`);
    const from = toIsoDate(addDays(targetMidnightLocal, -1));
    const to = toIsoDate(addDays(targetMidnightLocal, 1));
    const wide = await adapter.listAppointments({ from, to });
    return wide.filter((appointment) => toLocalDateInputValue(appointment.startsAt) === dateIso);
  }

  function reloadAppointments() {
    setReloadToken((token) => token + 1);
  }

  function goToday() {
    setReferenceDate(startOfDay(today()));
  }

  function goPrev() {
    setReferenceDate((current) => addDays(current, viewMode === "dia" ? -1 : -7));
  }

  function goNext() {
    setReferenceDate((current) => addDays(current, viewMode === "dia" ? 1 : 7));
  }

  function openNewAppointmentModal() {
    setCreateError(null);
    setSeriesResult(null);
    setNewModalOpen(true);
  }

  function closeNewAppointmentModal() {
    setNewModalOpen(false);
    setCreateError(null);
    setSeriesResult(null);
  }

  async function handleCreateSubmit(values: NewAppointmentSubmit) {
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      if (values.kind === "single") {
        const { patientId, startsAt, durationMinutes } = values.payload;
        const dateIso = toLocalDateInputValue(startsAt);
        const sameDay = await fetchSameLocalDayAppointments(dateIso);
        const conflict = findConflictingAppointment({ startsAt, durationMinutes }, sameDay);
        if (conflict) {
          setCreateError(describeConflict(conflict));
          return;
        }
        await adapter.createAppointment({ patientId, startsAt, durationMinutes });
        setNewModalOpen(false);
        reloadAppointments();
        return;
      }

      const input: CreateAppointmentSeriesInput =
        values.weeks !== undefined
          ? { patientId: values.patientId, startsAt: values.startsAt, durationMinutes: values.durationMinutes, weeks: values.weeks }
          : {
              patientId: values.patientId,
              startsAt: values.startsAt,
              durationMinutes: values.durationMinutes,
              until: values.until as string,
            };
      const result = await adapter.createAppointmentSeries(input);
      setSeriesResult(result);
      reloadAppointments();
    } catch (error) {
      const { startsAt, durationMinutes } = values.kind === "single" ? values.payload : values;
      setCreateError(await describeSubmitError(error, startsAt, durationMinutes));
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function describeSubmitError(error: unknown, startsAt: string, durationMinutes: number): Promise<string> {
    if (isAgendaConflictError(error)) {
      try {
        const dateIso = toLocalDateInputValue(startsAt);
        const sameDay = await fetchSameLocalDayAppointments(dateIso);
        const conflict = findConflictingAppointment({ startsAt, durationMinutes }, sameDay);
        if (conflict) return describeConflict(conflict);
      } catch {
        // Se a re-busca falhar, cai para a mensagem do próprio erro abaixo.
      }
      return error.message;
    }
    return "Não foi possível salvar a consulta agora. Tente novamente.";
  }

  function openRescheduleModal(appointment: Appointment) {
    setRescheduleError(null);
    setRescheduleTarget(appointment);
  }

  async function handleRescheduleSubmit(values: RescheduleAppointmentValues) {
    if (!rescheduleTarget) return;
    setRescheduleError(null);
    setRescheduleSubmitting(true);
    try {
      const dateIso = toLocalDateInputValue(values.startsAt);
      const sameDay = await fetchSameLocalDayAppointments(dateIso);
      const conflict = findConflictingAppointment(values, sameDay, rescheduleTarget.id);
      if (conflict) {
        setRescheduleError(describeConflict(conflict));
        return;
      }
      await adapter.rescheduleAppointment(rescheduleTarget.id, values);
      setRescheduleTarget(null);
      reloadAppointments();
    } catch (error) {
      setRescheduleError(await describeSubmitError(error, values.startsAt, values.durationMinutes));
    } finally {
      setRescheduleSubmitting(false);
    }
  }

  function openCancelModal(appointment: Appointment) {
    setCancelError(null);
    setCancelTarget(appointment);
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      await adapter.cancelAppointment(cancelTarget.id);
      setCancelTarget(null);
      reloadAppointments();
    } catch {
      setCancelError("Não foi possível cancelar a consulta agora. Tente novamente.");
    } finally {
      setCancelSubmitting(false);
    }
  }

  const periodLabel =
    viewMode === "dia" ? formatDayTitle(referenceDate) : `${formatIsoDateLabel(range.from)} – ${formatIsoDateLabel(range.to)}`;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2}>Agenda</Title>
          <Text c="dimmed" size="sm">
            Consultas agendadas, com visão semanal e diária.
          </Text>
        </Stack>
        <Button onClick={openNewAppointmentModal}>Nova consulta</Button>
      </Group>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value === "dia" ? "dia" : "semana")}
          data={[
            { value: "semana", label: "Semana" },
            { value: "dia", label: "Dia" },
          ]}
        />
        <Group gap="xs">
          <Button variant="default" size="xs" onClick={goPrev} aria-label="Período anterior">
            ‹ Anterior
          </Button>
          <Button variant="default" size="xs" onClick={goToday}>
            Hoje
          </Button>
          <Button variant="default" size="xs" onClick={goNext} aria-label="Próximo período">
            Próxima ›
          </Button>
        </Group>
      </Group>

      <Text fw={600} data-testid="agenda-period-label">
        {periodLabel}
      </Text>

      {loadState === "loading" && (
        <Stack gap="xs" data-testid="agenda-loading">
          <Skeleton height={80} radius="sm" />
          <Skeleton height={80} radius="sm" />
        </Stack>
      )}

      {loadState === "error" && (
        <Alert color="red" variant="light" data-testid="agenda-error">
          <Stack gap="sm">
            <Text size="sm">Não foi possível carregar a agenda.</Text>
            <Button variant="light" color="red" onClick={reloadAppointments} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {loadState === "loaded" && appointments.length === 0 && (
        <EmptyState
          title="Nenhuma consulta neste período"
          description="Consultas agendadas para os dias visíveis aparecerão aqui."
          action={<Button onClick={openNewAppointmentModal}>Agendar consulta</Button>}
        />
      )}

      {loadState === "loaded" && appointments.length > 0 && viewMode === "semana" && (
        <WeekView
          weekStart={startOfWeek(referenceDate)}
          appointments={appointments}
          today={today()}
          patientLabel={patientLabel}
          onReschedule={openRescheduleModal}
          onCancel={openCancelModal}
        />
      )}

      {loadState === "loaded" && appointments.length > 0 && viewMode === "dia" && (
        <DayView
          appointments={appointments}
          patientLabel={patientLabel}
          onReschedule={openRescheduleModal}
          onCancel={openCancelModal}
        />
      )}

      <NewAppointmentModal
        opened={newModalOpen}
        initialDate={toIsoDate(referenceDate)}
        patients={patientOptions}
        onSubmit={handleCreateSubmit}
        onClose={closeNewAppointmentModal}
        submitting={createSubmitting}
        formError={createError}
        seriesResult={seriesResult}
        onCloseSeriesResult={closeNewAppointmentModal}
      />

      <RescheduleAppointmentModal
        opened={rescheduleTarget !== null}
        appointment={rescheduleTarget}
        patientName={rescheduleTarget ? patientLabel(rescheduleTarget.patientId) : undefined}
        onSubmit={handleRescheduleSubmit}
        onClose={() => setRescheduleTarget(null)}
        submitting={rescheduleSubmitting}
        formError={rescheduleError}
      />

      <CancelAppointmentModal
        opened={cancelTarget !== null}
        patientName={cancelTarget ? patientLabel(cancelTarget.patientId) : ""}
        dateTimeLabel={
          cancelTarget ? `${formatAppointmentDate(cancelTarget.startsAt)} às ${formatAppointmentTime(cancelTarget.startsAt)}` : ""
        }
        onConfirm={() => void handleCancelConfirm()}
        onCancel={() => setCancelTarget(null)}
        submitting={cancelSubmitting}
        formError={cancelError}
      />
    </Stack>
  );
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

interface AppointmentActionsProps {
  appointment: Appointment;
  patientLabel: (patientId: string) => string;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

function AppointmentRow({ appointment, patientLabel, onReschedule, onCancel }: AppointmentActionsProps) {
  const canManage = appointment.status === "agendada";
  return (
    <Paper withBorder p="xs" radius="sm" data-testid="agenda-appointment">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            {formatAppointmentTime(appointment.startsAt)} — {patientLabel(appointment.patientId)}
          </Text>
          <Badge size="xs" variant="light" w="fit-content">
            {APPOINTMENT_STATUS_LABEL[appointment.status]}
          </Badge>
        </Stack>
        {canManage && (
          <Group gap={4}>
            <Button variant="subtle" size="compact-xs" onClick={() => onReschedule(appointment)}>
              Remarcar
            </Button>
            <Button variant="subtle" color="red" size="compact-xs" onClick={() => onCancel(appointment)}>
              Cancelar
            </Button>
          </Group>
        )}
      </Group>
    </Paper>
  );
}

interface WeekViewProps {
  weekStart: Date;
  appointments: readonly Appointment[];
  today: Date;
  patientLabel: (patientId: string) => string;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

function WeekView({ weekStart, appointments, today, patientLabel, onReschedule, onCancel }: WeekViewProps) {
  const groups = groupAppointmentsByDay(appointments);
  const days = weekDays(weekStart);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4, lg: 7 }} spacing="sm" data-testid="agenda-week-view">
      {days.map((day) => {
        const key = toIsoDate(day);
        const dayAppointments = groups.get(key) ?? [];
        return (
          <Paper key={key} withBorder p="sm" radius="md" data-testid={`agenda-day-${key}`}>
            <Group gap={4} mb="xs">
              <Text fw={600} size="sm">
                {formatDayHeader(day)}
              </Text>
              {isSameDay(day, today) && (
                <Badge size="xs" color="primary">
                  Hoje
                </Badge>
              )}
            </Group>
            {dayAppointments.length === 0 ? (
              <Text size="xs" c="dimmed">
                Sem consultas
              </Text>
            ) : (
              <Stack gap="xs">
                {dayAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    patientLabel={patientLabel}
                    onReschedule={onReschedule}
                    onCancel={onCancel}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}

interface DayViewProps {
  appointments: readonly Appointment[];
  patientLabel: (patientId: string) => string;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
}

function DayView({ appointments, patientLabel, onReschedule, onCancel }: DayViewProps) {
  const sorted = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <Stack gap="xs" data-testid="agenda-day-view">
      {sorted.map((appointment) => (
        <AppointmentRow
          key={appointment.id}
          appointment={appointment}
          patientLabel={patientLabel}
          onReschedule={onReschedule}
          onCancel={onCancel}
        />
      ))}
    </Stack>
  );
}
