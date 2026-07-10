import { Alert, Badge, Button, Card, Checkbox, Group, Skeleton, Stack, Text, TextInput, Title } from "@mantine/core";
import type { Task } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import { tasksAdapter as defaultTasksAdapter, type TasksAdapter } from "../../adapters/tasks";
import { EmptyState } from "../../components/EmptyState";
import { EditTaskModal, type EditTaskSubmit } from "./EditTaskModal";
import {
  buildCompleteTaskPayload,
  buildCreateTaskPayload,
  buildEditTaskPayload,
  buildReopenTaskPayload,
  formatIsoDateLabel,
  isTaskOverdue,
  separateTasksByStatus,
  toIsoDate,
  validateQuickAddTitle,
} from "./tasks";

export interface TasksPageProps {
  /** Injetável para testes; produção usa o `tasksAdapter` composto em `src/adapters/tasks`. */
  tasksAdapter?: TasksAdapter;
  /** Relógio injetável — determinismo do "hoje" (destaque de atraso) e do instante de conclusão nos testes. */
  today?: () => Date;
}

type LoadState = "loading" | "loaded" | "error";

/**
 * Rota `/tarefas` (PSI-038): gestão completa de tarefas administrativas.
 * Criação rápida por campo único (Enter cria), vencimento opcional,
 * conclusão/reabertura com um clique (checkbox) e edição posterior de
 * título/vencimento (`EditTaskModal`). A listagem separa abertas/concluídas
 * e destaca as atrasadas (`separateTasksByStatus`/`isTaskOverdue`,
 * `./tasks.ts`) — mesma fonte de dados (`TasksAdapter`, que ESTENDE
 * `TasksReadAdapter`) que alimenta o bloco "Tarefas do dia" do dashboard
 * (PSI-032), sem divergência de interface.
 *
 * "Hoje" é capturado UMA VEZ na montagem (mesmo padrão de `DashboardPage`/
 * `FinancePage`) para não recalcular o destaque de atraso a cada render.
 */
export function TasksPage({ tasksAdapter = defaultTasksAdapter, today = () => new Date() }: TasksPageProps) {
  const [referenceDate] = useState<Date>(() => today());
  const todayIso = toIsoDate(referenceDate);

  const [state, setState] = useState<LoadState>("loading");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState("loading");
    tasksAdapter.listTasks().then(
      (items) => {
        if (!active) return;
        setTasks(items);
        setState("loaded");
      },
      () => {
        if (!active) return;
        setState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [tasksAdapter, reloadToken]);

  function reload() {
    setReloadToken((token) => token + 1);
  }

  async function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateQuickAddTitle(quickTitle);
    setQuickError(validation);
    if (validation) return;

    setCreating(true);
    try {
      await tasksAdapter.createTask(buildCreateTaskPayload(quickTitle, quickDueDate || undefined));
      setQuickTitle("");
      setQuickDueDate("");
      reload();
    } catch {
      setQuickError("Não foi possível criar a tarefa agora. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(task: Task) {
    setActionError(null);
    setTogglingId(task.id);
    try {
      const payload = task.completedAt ? buildReopenTaskPayload() : buildCompleteTaskPayload(today().toISOString());
      await tasksAdapter.updateTask(task.id, payload);
      reload();
    } catch {
      setActionError("Não foi possível atualizar a tarefa agora. Tente novamente.");
    } finally {
      setTogglingId(null);
    }
  }

  function openEdit(task: Task) {
    setEditError(null);
    setEditTarget(task);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  async function handleEditSubmit(values: EditTaskSubmit) {
    if (!editTarget) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      await tasksAdapter.updateTask(editTarget.id, buildEditTaskPayload(values.title, values.dueDate, editTarget.completedAt));
      setEditTarget(null);
      reload();
    } catch {
      setEditError("Não foi possível salvar a tarefa agora. Tente novamente.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const { open, completed } = separateTasksByStatus(tasks, todayIso);

  return (
    <Stack gap="xl" data-testid="tasks-page">
      <Stack gap={4}>
        <Title order={2}>Tarefas</Title>
        <Text c="dimmed" size="sm">
          Afazeres administrativos do dia a dia — sem conteúdo clínico.
        </Text>
      </Stack>

      <Card withBorder padding="md" radius="md">
        <form onSubmit={(event) => void handleQuickAdd(event)} noValidate data-testid="tasks-quick-add-form">
          <Group align="flex-end" wrap="wrap" gap="sm">
            <TextInput
              label="Nova tarefa"
              description="Digite o título e pressione Enter para criar."
              placeholder="Ex.: Enviar recibo para Marina"
              value={quickTitle}
              error={quickError}
              onChange={(event) => setQuickTitle(event.currentTarget.value)}
              data-testid="tasks-quick-add-input"
              style={{ flex: 1, minWidth: 240 }}
              required
            />
            <TextInput
              label="Vencimento"
              description="Opcional."
              type="date"
              value={quickDueDate}
              onChange={(event) => setQuickDueDate(event.currentTarget.value)}
              data-testid="tasks-quick-add-due-date"
            />
            <Button type="submit" loading={creating} data-testid="tasks-quick-add-submit">
              Adicionar
            </Button>
          </Group>
        </form>
      </Card>

      {actionError && (
        <Alert color="red" variant="light" data-testid="tasks-action-error">
          {actionError}
        </Alert>
      )}

      {state === "loading" && (
        <Stack gap="xs" data-testid="tasks-loading">
          <Skeleton height={36} radius="sm" />
          <Skeleton height={36} radius="sm" />
          <Skeleton height={36} radius="sm" />
        </Stack>
      )}

      {state === "error" && (
        <Alert color="red" variant="light" data-testid="tasks-error">
          <Stack gap="sm">
            <Text size="sm">Não foi possível carregar as tarefas.</Text>
            <Button variant="light" color="red" size="xs" onClick={reload} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {state === "loaded" && tasks.length === 0 && (
        <EmptyState
          title="Nenhuma tarefa cadastrada"
          description="Crie sua primeira tarefa pelo campo acima."
        />
      )}

      {state === "loaded" && tasks.length > 0 && (
        <Stack gap="lg">
          <TaskSection
            title="Abertas"
            emptyMessage="Nenhuma tarefa aberta."
            tasks={open}
            todayIso={todayIso}
            togglingId={togglingId}
            onToggle={handleToggle}
            onEdit={openEdit}
          />
          <TaskSection
            title="Concluídas"
            emptyMessage="Nenhuma tarefa concluída ainda."
            tasks={completed}
            todayIso={todayIso}
            togglingId={togglingId}
            onToggle={handleToggle}
            onEdit={openEdit}
          />
        </Stack>
      )}

      <EditTaskModal
        opened={editTarget !== null}
        task={editTarget}
        onSubmit={handleEditSubmit}
        onClose={closeEdit}
        submitting={editSubmitting}
        formError={editError}
      />
    </Stack>
  );
}

interface TaskSectionProps {
  title: string;
  emptyMessage: string;
  tasks: Task[];
  todayIso: string;
  togglingId: string | null;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
}

function TaskSection({ title, emptyMessage, tasks, todayIso, togglingId, onToggle, onEdit }: TaskSectionProps) {
  const testId = `tasks-section-${title === "Abertas" ? "open" : "completed"}`;
  return (
    <Card withBorder padding="md" radius="md" data-testid={testId}>
      <Stack gap="sm">
        <Title order={3}>
          {title} ({tasks.length})
        </Title>

        {tasks.length === 0 ? (
          <Text c="dimmed" size="sm">
            {emptyMessage}
          </Text>
        ) : (
          <Stack gap="xs">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task, todayIso);
              return (
                <Group key={task.id} justify="space-between" wrap="wrap" data-testid="task-row" data-task-id={task.id}>
                  <Group gap="sm">
                    <Checkbox
                      checked={Boolean(task.completedAt)}
                      disabled={togglingId === task.id}
                      onChange={() => onToggle(task)}
                      aria-label={task.completedAt ? `Reabrir "${task.title}"` : `Concluir "${task.title}"`}
                      data-testid={`task-toggle-${task.id}`}
                    />
                    <Stack gap={0}>
                      <Text size="sm" fw={500} td={task.completedAt ? "line-through" : undefined}>
                        {task.title}
                      </Text>
                      {task.dueDate && (
                        <Text size="xs" c="dimmed">
                          Vencimento: {formatIsoDateLabel(task.dueDate)}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                  <Group gap="xs">
                    {overdue && (
                      <Badge size="xs" color="red" variant="light" data-testid={`task-overdue-${task.id}`}>
                        Atrasada
                      </Badge>
                    )}
                    <Button variant="subtle" size="compact-xs" onClick={() => onEdit(task)} data-testid={`task-edit-${task.id}`}>
                      Editar
                    </Button>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
