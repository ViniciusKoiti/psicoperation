import type { Task, TaskCreateRequest, TaskUpdateRequest } from "@psiops/contracts";

import type { TasksReadAdapter } from "./TasksReadAdapter";

/**
 * Interface completa de tarefas administrativas (PSI-038): estende
 * `TasksReadAdapter` (leitura, PSI-032) com as operações de escrita da tela
 * completa de tarefas. Ver a nota de reconciliação na doc de
 * `TasksReadAdapter` — mesmo padrão de `ChargesAdapter extends
 * ChargesReadAdapter` (PSI-037) e `AgendaAdapter extends
 * AppointmentsReadAdapter` (PSI-035): não redeclara DTOs — `createTask` e
 * `updateTask` usam `TaskCreateRequest`/`TaskUpdateRequest` do contrato
 * diretamente, sem tipo local intermediário (o payload já é exatamente o
 * que o contrato espera, ao contrário de `ChargeDraft`, que precisou de um
 * tipo local por divergir ligeiramente do corpo do contrato).
 *
 * Implementações: `MockTasksAdapter` (memória, padrão dev/test) e
 * `HttpTasksAdapter` (tipada pelo contrato, sem exercício ponta a ponta
 * nesta tarefa — PSI-044). Ponto de composição único em `./index.ts`.
 */
export interface TasksAdapter extends TasksReadAdapter {
  /** `POST /tasks`: cria uma tarefa (título obrigatório, vencimento opcional). */
  createTask(payload: TaskCreateRequest): Promise<Task>;

  /**
   * `PUT /tasks/{taskId}`: edita título/vencimento e/ou conclui/reabre a
   * tarefa. Semântica de `completedAt` herdada 1:1 do contrato
   * (`TaskUpdateRequest`): presente CONCLUI a tarefa (com aquele instante),
   * ausente REABRE — mesmo quando a chamada só pretende editar
   * título/vencimento de uma tarefa já concluída, o chamador deve ecoar o
   * `completedAt` atual para não reabri-la sem querer (ver
   * `buildEditTaskPayload`, `src/features/tasks/tasks.ts`). Lança
   * `TasksAdapterError` com `status: 404` (`isTaskNotFoundError`) quando a
   * tarefa não existe.
   */
  updateTask(taskId: string, payload: TaskUpdateRequest): Promise<Task>;
}
