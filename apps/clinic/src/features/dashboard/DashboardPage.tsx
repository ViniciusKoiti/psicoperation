import { Alert, Badge, Button, Card, Group, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { Appointment, Charge, Task } from "@psiops/contracts";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { agendaAdapter as defaultAgendaAdapter, type AgendaAdapter } from "../../adapters/appointments";
import { chargesAdapter as defaultChargesReadAdapter, type ChargesReadAdapter } from "../../adapters/charges";
import { patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { tasksAdapter as defaultTasksReadAdapter, type TasksReadAdapter } from "../../adapters/tasks";
import { EmptyState } from "../../components/EmptyState";
import {
  addDays,
  APPOINTMENT_STATUS_LABEL,
  formatAppointmentTime,
  formatCentsAsBRL,
  formatIsoDateLabel,
  isTaskOverdue,
  selectDueTasks,
  selectOutstandingCharges,
  selectTodayAppointments,
  sumChargeAmounts,
  toIsoDate,
} from "./dashboard";

export interface DashboardPageProps {
  /** Injetável para testes; produção usa o `agendaAdapter` composto em `src/adapters/appointments`. */
  agendaAdapter?: AgendaAdapter;
  /** Injetável para testes; produção usa o `patientsAdapter` composto em `src/adapters/patients`. */
  patientsAdapter?: PatientsAdapter;
  /** Injetável para testes; produção usa o `chargesReadAdapter` composto em `src/adapters/charges`. */
  chargesReadAdapter?: ChargesReadAdapter;
  /** Injetável para testes; produção usa o `tasksReadAdapter` composto em `src/adapters/tasks`. */
  tasksReadAdapter?: TasksReadAdapter;
  /** Relógio injetável — determinismo do "hoje" nos testes (mesmo padrão de `AgendaPage`). */
  today?: () => Date;
}

type LoadState = "loading" | "loaded" | "error";

/**
 * Rota `/` (PSI-032): tela inicial pós-login, a visão do dia da psicóloga em
 * quatro blocos independentes — próximas consultas, pendências financeiras,
 * tarefas do dia e atalhos. Cada bloco de dados busca e trata seu próprio
 * estado de carregamento/erro/vazio, para que uma conta nova (sem
 * pacientes/consultas/cobranças/tarefas) veja um dashboard útil, com
 * mensagens amigáveis e chamadas para ação, em vez de uma tela quebrada —
 * mesmo espírito de `AgendaPage`/`PatientsListPage`.
 *
 * "Hoje" é capturado UMA VEZ na montagem (`referenceDate`, via `useState`
 * com inicializador preguiçoso) em vez de recalculado a cada render — evita
 * que o valor-padrão de `today` (`() => new Date()`, uma nova função a cada
 * render) dispare recargas desnecessárias, e mantém o dashboard estável
 * durante a sessão (mesmo comportamento que a navegação teria, sem UI de
 * navegação aqui).
 *
 * Consultas de hoje: busca uma janela de 3 dias UTC ao redor de hoje
 * (`agendaAdapter.listAppointments`) e filtra pelo dia-calendário LOCAL
 * (`selectTodayAppointments`, `./dashboard.ts`) — a mesma técnica de
 * `fetchSameLocalDayAppointments` em `AgendaPage.tsx`, necessária pelo risco
 * de fuso citado no manifesto (um horário perto da meia-noite pode cair no
 * dia-calendário UTC errado).
 *
 * Pendências financeiras: usa `Charge.status` (decidido pelo domínio/API)
 * diretamente para separar atrasada/pendente — não recalcula a partir de
 * `dueDate` no cliente (ver `selectOutstandingCharges`).
 *
 * Atalhos: "Novo paciente" (`/pacientes/novo`, PSI-033) e "Nova consulta"
 * (`/agenda`, PSI-035) navegam para rotas já implementadas; "Financeiro"
 * navega para `/financeiro`, um placeholder desta tarefa até a PSI-037
 * (permitido pelo manifesto: "rotas podem ser placeholders até as tarefas
 * correspondentes").
 */
export function DashboardPage({
  agendaAdapter = defaultAgendaAdapter,
  patientsAdapter = defaultPatientsAdapter,
  chargesReadAdapter = defaultChargesReadAdapter,
  tasksReadAdapter = defaultTasksReadAdapter,
  today = () => new Date(),
}: DashboardPageProps) {
  const [referenceDate] = useState<Date>(() => today());
  const todayIso = toIsoDate(referenceDate);

  // --- Próximas consultas ---
  const [appointmentsState, setAppointmentsState] = useState<LoadState>("loading");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsReload, setAppointmentsReload] = useState(0);
  const [patientsById, setPatientsById] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    patientsAdapter.listPatients({ status: "ativo", size: 500 }).then(
      (page) => {
        if (!active) return;
        const byId: Record<string, string> = {};
        for (const patient of page.items) byId[patient.id] = patient.name;
        setPatientsById(byId);
      },
      () => {
        // Falha ao carregar nomes não bloqueia o bloco de consultas — os
        // nomes caem no fallback do id (ver `patientLabel`).
      },
    );
    return () => {
      active = false;
    };
  }, [patientsAdapter]);

  useEffect(() => {
    let active = true;
    setAppointmentsState("loading");
    const from = toIsoDate(addDays(referenceDate, -1));
    const to = toIsoDate(addDays(referenceDate, 1));
    agendaAdapter.listAppointments({ from, to }).then(
      (items) => {
        if (!active) return;
        setAppointments(items);
        setAppointmentsState("loaded");
      },
      () => {
        if (!active) return;
        setAppointmentsState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [agendaAdapter, referenceDate, appointmentsReload]);

  const todayAppointments = selectTodayAppointments(appointments, todayIso);

  function patientLabel(patientId: string): string {
    return patientsById[patientId] ?? `Paciente ${patientId}`;
  }

  // --- Pendências financeiras ---
  const [chargesState, setChargesState] = useState<LoadState>("loading");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargesReload, setChargesReload] = useState(0);

  useEffect(() => {
    let active = true;
    setChargesState("loading");
    chargesReadAdapter.listCharges().then(
      (items) => {
        if (!active) return;
        setCharges(items);
        setChargesState("loaded");
      },
      () => {
        if (!active) return;
        setChargesState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [chargesReadAdapter, chargesReload]);

  const outstandingCharges = selectOutstandingCharges(charges);
  const outstandingTotal = sumChargeAmounts(outstandingCharges);

  // --- Tarefas do dia ---
  const [tasksState, setTasksState] = useState<LoadState>("loading");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksReload, setTasksReload] = useState(0);

  useEffect(() => {
    let active = true;
    setTasksState("loading");
    tasksReadAdapter.listTasks({ pending: true }).then(
      (items) => {
        if (!active) return;
        setTasks(items);
        setTasksState("loaded");
      },
      () => {
        if (!active) return;
        setTasksState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [tasksReadAdapter, tasksReload]);

  const dueTasks = selectDueTasks(tasks, todayIso);

  return (
    <Stack gap="xl">
      <Title order={2}>Dashboard</Title>

      <ShortcutsBlock />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <AppointmentsBlock
          state={appointmentsState}
          appointments={todayAppointments}
          patientLabel={patientLabel}
          onRetry={() => setAppointmentsReload((token) => token + 1)}
        />
        <ChargesBlock
          state={chargesState}
          charges={outstandingCharges}
          total={outstandingTotal}
          onRetry={() => setChargesReload((token) => token + 1)}
        />
      </SimpleGrid>

      <TasksBlock
        state={tasksState}
        tasks={dueTasks}
        todayIso={todayIso}
        onRetry={() => setTasksReload((token) => token + 1)}
      />
    </Stack>
  );
}

function ShortcutsBlock() {
  return (
    <Card withBorder padding="md" radius="md" data-testid="dashboard-shortcuts">
      <Stack gap="sm">
        <Title order={3}>Atalhos</Title>
        <Group gap="sm" wrap="wrap">
          <Button component={Link} to="/pacientes/novo">
            Novo paciente
          </Button>
          <Button component={Link} to="/agenda" variant="light">
            Nova consulta
          </Button>
          <Button component={Link} to="/financeiro" variant="light">
            Financeiro
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

interface AppointmentsBlockProps {
  state: LoadState;
  appointments: Appointment[];
  patientLabel: (patientId: string) => string;
  onRetry: () => void;
}

function AppointmentsBlock({ state, appointments, patientLabel, onRetry }: AppointmentsBlockProps) {
  return (
    <Card withBorder padding="md" radius="md" data-testid="dashboard-appointments">
      <Stack gap="sm">
        <Title order={3}>Próximas consultas</Title>

        {state === "loading" && (
          <Stack gap="xs" data-testid="dashboard-appointments-loading">
            <Skeleton height={44} radius="sm" />
            <Skeleton height={44} radius="sm" />
          </Stack>
        )}

        {state === "error" && (
          <Alert color="red" variant="light" data-testid="dashboard-appointments-error">
            <Stack gap="sm">
              <Text size="sm">Não foi possível carregar as consultas de hoje.</Text>
              <Button variant="light" color="red" size="xs" onClick={onRetry} w="fit-content">
                Tentar novamente
              </Button>
            </Stack>
          </Alert>
        )}

        {state === "loaded" && appointments.length === 0 && (
          <EmptyState
            title="Nenhuma consulta hoje"
            description="Consultas agendadas para hoje aparecem aqui, ordenadas por horário."
            action={
              <Button component={Link} to="/agenda" size="xs">
                Agendar consulta
              </Button>
            }
          />
        )}

        {state === "loaded" && appointments.length > 0 && (
          <Stack gap="xs" data-testid="dashboard-appointments-list">
            {appointments.map((appointment) => (
              <Group key={appointment.id} justify="space-between" wrap="wrap" data-testid="dashboard-appointment">
                <Text size="sm" fw={600}>
                  {formatAppointmentTime(appointment.startsAt)} — {patientLabel(appointment.patientId)}
                </Text>
                <Badge size="xs" variant="light">
                  {APPOINTMENT_STATUS_LABEL[appointment.status]}
                </Badge>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

interface ChargesBlockProps {
  state: LoadState;
  charges: Charge[];
  total: number;
  onRetry: () => void;
}

function ChargesBlock({ state, charges, total, onRetry }: ChargesBlockProps) {
  return (
    <Card withBorder padding="md" radius="md" data-testid="dashboard-charges">
      <Stack gap="sm">
        <Title order={3}>Pendências financeiras</Title>

        {state === "loading" && (
          <Stack gap="xs" data-testid="dashboard-charges-loading">
            <Skeleton height={44} radius="sm" />
            <Skeleton height={44} radius="sm" />
          </Stack>
        )}

        {state === "error" && (
          <Alert color="red" variant="light" data-testid="dashboard-charges-error">
            <Stack gap="sm">
              <Text size="sm">Não foi possível carregar as pendências financeiras.</Text>
              <Button variant="light" color="red" size="xs" onClick={onRetry} w="fit-content">
                Tentar novamente
              </Button>
            </Stack>
          </Alert>
        )}

        {state === "loaded" && charges.length === 0 && (
          <EmptyState
            title="Nenhuma pendência financeira"
            description="Mensalidades pendentes ou atrasadas aparecem aqui, com o total em aberto."
            action={
              <Button component={Link} to="/financeiro" variant="light" size="xs">
                Ver financeiro
              </Button>
            }
          />
        )}

        {state === "loaded" && charges.length > 0 && (
          <>
            <Text size="sm" fw={700} data-testid="dashboard-charges-total">
              Total em aberto: {formatCentsAsBRL(total)}
            </Text>
            <Stack gap="xs" data-testid="dashboard-charges-list">
              {charges.map((charge) => (
                <Group key={charge.id} justify="space-between" wrap="wrap" data-testid="dashboard-charge">
                  <Text size="sm">
                    {formatCentsAsBRL(charge.amount)} — vencimento {formatIsoDateLabel(charge.dueDate)}
                  </Text>
                  <Badge size="xs" color={charge.status === "atrasada" ? "red" : "yellow"} variant="light">
                    {charge.status === "atrasada" ? "Atrasada" : "Pendente"}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  );
}

interface TasksBlockProps {
  state: LoadState;
  tasks: Task[];
  todayIso: string;
  onRetry: () => void;
}

function TasksBlock({ state, tasks, todayIso, onRetry }: TasksBlockProps) {
  return (
    <Card withBorder padding="md" radius="md" data-testid="dashboard-tasks">
      <Stack gap="sm">
        <Title order={3}>Tarefas do dia</Title>

        {state === "loading" && (
          <Stack gap="xs" data-testid="dashboard-tasks-loading">
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" />
          </Stack>
        )}

        {state === "error" && (
          <Alert color="red" variant="light" data-testid="dashboard-tasks-error">
            <Stack gap="sm">
              <Text size="sm">Não foi possível carregar as tarefas.</Text>
              <Button variant="light" color="red" size="xs" onClick={onRetry} w="fit-content">
                Tentar novamente
              </Button>
            </Stack>
          </Alert>
        )}

        {state === "loaded" && tasks.length === 0 && (
          <EmptyState
            title="Nenhuma tarefa para hoje"
            description="Tarefas vencendo hoje ou atrasadas aparecem aqui."
          />
        )}

        {state === "loaded" && tasks.length > 0 && (
          <Stack gap="xs" data-testid="dashboard-tasks-list">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task, todayIso);
              return (
                <Group key={task.id} justify="space-between" wrap="wrap" data-testid="dashboard-task">
                  <Text size="sm">{task.title}</Text>
                  <Badge size="xs" color={overdue ? "red" : "yellow"} variant="light">
                    {overdue && task.dueDate ? `Atrasada — ${formatIsoDateLabel(task.dueDate)}` : "Hoje"}
                  </Badge>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
