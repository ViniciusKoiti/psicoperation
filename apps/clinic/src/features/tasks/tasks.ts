import type { Task, TaskCreateRequest, TaskUpdateRequest } from "@psiops/contracts";

/**
 * Helpers puros da tela completa de tarefas (PSI-038): separação
 * abertas/concluídas, destaque de atraso, validação da criação rápida e
 * montagem dos payloads de escrita (`TaskCreateRequest`/`TaskUpdateRequest`,
 * `@psiops/contracts`). Mantidos fora de `TasksPage.tsx` para serem
 * testáveis sem montar componentes React — mesmo padrão de
 * `src/features/dashboard/dashboard.ts` e `src/features/finance/finance.ts`.
 *
 * `toIsoDate`/`formatIsoDateLabel` duplicam deliberadamente os homônimos de
 * outras features (dashboard, finance, agenda): mesma justificativa
 * documentada nesses módulos — duplicado por feature, não compartilhado,
 * para não criar acoplamento entre features via refactor fora de escopo
 * desta tarefa.
 */

/** Formata um `Date` local como `IsoDate` (`AAAA-MM-DD`), sem componente de hora. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** Formata um `IsoDate` (`AAAA-MM-DD`) como `dd/mm/aaaa` em pt-BR, construindo a partir dos componentes (evita o deslocamento de fuso do `new Date(isoDate)` direto). */
export function formatIsoDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

/** `true` quando o vencimento da tarefa já passou em relação a `todayIso` (destaque visual de atraso — critério de aceite do manifesto). Tarefas sem vencimento ou já concluídas nunca são consideradas atrasadas. */
export function isTaskOverdue(task: Task, todayIso: string): boolean {
  return !task.completedAt && task.dueDate !== undefined && task.dueDate < todayIso;
}

export interface SeparatedTasks {
  /** Tarefas não concluídas, atrasadas primeiro (mais antigas primeiro), depois as demais por vencimento (sem vencimento por último). */
  open: Task[];
  /** Tarefas concluídas, mais recentemente concluídas primeiro. */
  completed: Task[];
}

/**
 * Separa tarefas em abertas/concluídas (critério de aceite: "listagem
 * separa abertas e concluídas"), cada grupo já ordenado para exibição:
 * abertas com as atrasadas no topo (mais antigas primeiro), depois as
 * demais por vencimento (sem vencimento por último); concluídas com a mais
 * recentemente concluída primeiro.
 */
export function separateTasksByStatus(tasks: readonly Task[], todayIso: string): SeparatedTasks {
  const open: Task[] = [];
  const completed: Task[] = [];
  for (const task of tasks) {
    if (task.completedAt) completed.push(task);
    else open.push(task);
  }

  open.sort((a, b) => {
    const overdueA = isTaskOverdue(a, todayIso);
    const overdueB = isTaskOverdue(b, todayIso);
    if (overdueA !== overdueB) return overdueA ? -1 : 1;
    if (a.dueDate === undefined && b.dueDate === undefined) return 0;
    if (a.dueDate === undefined) return 1;
    if (b.dueDate === undefined) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  completed.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return { open, completed };
}

/** Valida o título da criação rápida (campo único, obrigatório, sem espaços nas pontas). `null` quando válido. */
export function validateQuickAddTitle(rawTitle: string): string | null {
  return rawTitle.trim().length === 0 ? "Informe um título para a tarefa." : null;
}

/** Monta o payload de criação rápida (`POST /tasks`): título obrigatório (aparado), vencimento opcional. */
export function buildCreateTaskPayload(rawTitle: string, dueDate?: string): TaskCreateRequest {
  return {
    title: rawTitle.trim(),
    ...(dueDate ? { dueDate } : {}),
  };
}

/** Monta o payload de conclusão (`completedAt` presente conclui — ver `TasksAdapter.updateTask`). */
export function buildCompleteTaskPayload(nowIso: string): TaskUpdateRequest {
  return { completedAt: nowIso };
}

/** Monta o payload de reabertura (`completedAt` ausente reabre — ver `TasksAdapter.updateTask`). */
export function buildReopenTaskPayload(): TaskUpdateRequest {
  return {};
}

/**
 * Monta o payload de edição de título/vencimento, ECOANDO o `completedAt`
 * atual da tarefa (`currentCompletedAt`) para não reabri-la sem querer — a
 * semântica do contrato é "completedAt ausente reabre", então uma edição de
 * título numa tarefa já concluída precisa reafirmar o `completedAt` para
 * preservar a conclusão (ver a doc de `TasksAdapter.updateTask`).
 */
export function buildEditTaskPayload(title: string, dueDate: string | undefined, currentCompletedAt: string | undefined): TaskUpdateRequest {
  return {
    title: title.trim(),
    ...(dueDate ? { dueDate } : {}),
    ...(currentCompletedAt ? { completedAt: currentCompletedAt } : {}),
  };
}
