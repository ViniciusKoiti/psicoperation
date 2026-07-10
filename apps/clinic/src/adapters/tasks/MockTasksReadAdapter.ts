import type { Task } from "@psiops/contracts";

import type { ListTasksParams, TasksReadAdapter } from "./TasksReadAdapter";

/**
 * Seed de exemplo determinístico (não é fixture de teste com seed — estado
 * inicial plausível para dev/demo, mesmo espírito de `MockChargesReadAdapter`).
 * Datas de vencimento espalhadas ao redor de "hoje" (mesma âncora de
 * calendário 2026-07 usada pelos demais seeds — `MockAgendaAdapter`,
 * `MockChargesReadAdapter`): uma tarefa atrasada, uma vencendo hoje, uma
 * futura (fora da janela do dashboard) e uma já concluída (fora da janela
 * por estar concluída) — cobre os cenários que o bloco "Tarefas do dia" do
 * dashboard (PSI-032) precisa demonstrar sem depender do relógio real.
 */
const DEFAULT_SEED: readonly Task[] = [
  {
    id: "t1a1a1a1-0001-4a6b-8c9d-0e1f2a3b4c5d",
    title: "Enviar recibo de julho para Marina Alves",
    dueDate: "2026-07-08",
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "t1a1a1a1-0002-4a6b-8c9d-0e1f2a3b4c5d",
    title: "Confirmar presença da consulta de hoje com Camila Souza",
    dueDate: "2026-07-10",
    createdAt: "2026-07-09T09:00:00Z",
  },
  {
    id: "t1a1a1a1-0003-4a6b-8c9d-0e1f2a3b4c5d",
    title: "Revisar agenda da próxima semana",
    dueDate: "2026-07-15",
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "t1a1a1a1-0004-4a6b-8c9d-0e1f2a3b4c5d",
    title: "Emitir cobrança de junho para Beatriz Nogueira",
    dueDate: "2026-06-05",
    completedAt: "2026-06-05T18:00:00Z",
    createdAt: "2026-06-01T09:00:00Z",
  },
];

/**
 * Implementação em memória de `TasksReadAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas fronteiras.
 * Padrão em desenvolvimento e testes — NUNCA deve ser usada em build de
 * produção por padrão (o ponto de troca mock → HTTP fica centralizado em
 * `./index.ts`).
 *
 * `listTasks` não pagina de fato (mesma simplicidade de
 * `MockChargesReadAdapter.listCharges`: `page`/`size` são aceitos na
 * assinatura para o call site ficar idêntico ao trocar para
 * `HttpTasksReadAdapter`, mas ignorados aqui) — o volume de tarefas
 * administrativas de uma psicóloga solo não justifica paginação real no
 * mock.
 */
export class MockTasksReadAdapter implements TasksReadAdapter {
  private readonly tasks: Task[];

  constructor(seed: readonly Task[] = DEFAULT_SEED) {
    this.tasks = structuredClone(seed) as Task[];
  }

  async listTasks(params: ListTasksParams = {}): Promise<Task[]> {
    const filtered = params.pending ? this.tasks.filter((task) => !task.completedAt) : this.tasks;
    return structuredClone(filtered);
  }
}
