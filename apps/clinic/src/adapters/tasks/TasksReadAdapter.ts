import type { Task } from "@psiops/contracts";

/**
 * Parâmetros de `listTasks` — espelham o `query` de
 * `operations["listTasks"]` em `@psiops/contracts` (`page`, `size`,
 * `pending`). Não é um DTO redeclarado: é só o parâmetro do método, mesmo
 * espírito de `ListChargesParams` (`src/adapters/charges/ChargesReadAdapter.ts`).
 */
export interface ListTasksParams {
  /** Índice da página desejada (base 0). Padrão do adapter: `0`. */
  page?: number;
  /** Quantidade de itens por página. Padrão do adapter: uma página larga o bastante para não paginar de fato (ver `HttpTasksReadAdapter`). */
  size?: number;
  /** Quando `true`, retorna só tarefas não concluídas (mapeia para o filtro `pending` do contrato). Sem filtro, retorna todas. */
  pending?: boolean;
}

/**
 * Interface de LEITURA mínima de tarefas administrativas (lembretes de
 * afazer da psicóloga — ex.: "enviar recibo para Marina"), criada por esta
 * tarefa (PSI-032, dashboard) porque a tela completa de tarefas (PSI-038,
 * CRUD) ainda não existe. Cobre exatamente o que o dashboard precisa: listar
 * tarefas, opcionalmente só as pendentes. Mesmo espírito de
 * `AppointmentsReadAdapter` (`src/adapters/appointments/AppointmentsReadAdapter.ts`,
 * PSI-034) e `ChargesReadAdapter` (`src/adapters/charges/ChargesReadAdapter.ts`,
 * PSI-034): uma interface de leitura mínima, criada por uma tarefa que
 * precisa de dados de um domínio cuja tela completa ainda não existe.
 *
 * PROJETADA PARA SER ESTENDIDA PELA PSI-038 — o que esta interface
 * deliberadamente NÃO cobre, e fica para a tela completa de tarefas decidir
 * como adicionar (extensão desta interface, ou uma nova ao lado dela no
 * mesmo módulo `src/adapters/tasks/**`):
 * - criação (`POST /tasks`), edição/conclusão (`PUT /tasks/{taskId}`,
 *   `completedAt` presente conclui, ausente reabre) e remoção
 *   (`DELETE /tasks/{taskId}`) — todas já expostas pelo contrato
 *   (`operations["createTask"|"updateTask"|"deleteTask"]`) mas fora do
 *   escopo deste dashboard, que só lê;
 * - paginação REAL (`HttpTasksReadAdapter` busca só a primeira página, larga
 *   o bastante — mesma ressalva de `HttpChargesReadAdapter`).
 *
 * O filtro "vencimento hoje ou atrasada" e a ordenação para exibição são
 * responsabilidade da camada de apresentação (`selectDueTasks`/`isTaskOverdue`
 * em `src/features/dashboard/dashboard.ts`), não deste adapter — mesmo
 * padrão de `AppointmentsReadAdapter`/`ChargesReadAdapter`.
 *
 * Implementações: `MockTasksReadAdapter` (estado em memória, padrão em
 * desenvolvimento e testes) e `HttpTasksReadAdapter` (tipada pelo contrato).
 * Ponto de composição único (seleção mock/http por variável de ambiente) em
 * `./index.ts`, mesmo padrão dos demais adapters.
 */
export interface TasksReadAdapter {
  /**
   * `GET /tasks`, com filtro opcional `pending` e paginação. Sem tarefas
   * cadastradas (ou nenhuma pendente, quando filtrado) resolve com lista
   * vazia, nunca rejeita.
   */
  listTasks(params?: ListTasksParams): Promise<Task[]>;
}
