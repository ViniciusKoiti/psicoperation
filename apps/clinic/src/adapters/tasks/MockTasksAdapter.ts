import type { Task, TaskCreateRequest, TaskUpdateRequest } from "@psiops/contracts";

import type { ListTasksParams } from "./TasksReadAdapter";
import type { TasksAdapter } from "./TasksAdapter";
import { TasksAdapterError } from "./TasksAdapterError";

/**
 * Seed de exemplo determinístico (não é fixture de teste com seed — estado
 * inicial plausível para dev/demo, mesmo espírito de `MockChargesAdapter`).
 * Idêntico ao seed de `MockTasksReadAdapter` (PSI-032), preservado aqui para
 * o bloco "Tarefas do dia" do dashboard continuar demonstrando os mesmos
 * cenários (atrasada, vencendo hoje, futura, concluída) sem depender do
 * relógio real.
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

export interface MockTasksAdapterOptions {
  /** Relógio injetável — determinismo nos testes (`createdAt` gerado). */
  clock?: () => number;
  /** Gerador de identificadores injetável — determinismo nos testes. */
  idGenerator?: () => string;
}

/**
 * Implementação em memória de `TasksAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas fronteiras.
 * Padrão em desenvolvimento e testes. SUBSTITUI `MockTasksReadAdapter`
 * (PSI-032) — ver a nota de reconciliação em `TasksReadAdapter.ts`.
 *
 * `listTasks` não pagina de fato (mesma simplicidade de
 * `MockChargesAdapter.listCharges`).
 */
export class MockTasksAdapter implements TasksAdapter {
  private readonly tasks: Task[];
  private readonly clock: () => number;
  private readonly idGenerator: () => string;

  constructor(seed: readonly Task[] = DEFAULT_SEED, options: MockTasksAdapterOptions = {}) {
    this.tasks = structuredClone(seed) as Task[];
    this.clock = options.clock ?? (() => Date.now());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
  }

  async listTasks(params: ListTasksParams = {}): Promise<Task[]> {
    const filtered = params.pending ? this.tasks.filter((task) => !task.completedAt) : this.tasks;
    return structuredClone(filtered);
  }

  async createTask(payload: TaskCreateRequest): Promise<Task> {
    const task: Task = {
      id: this.idGenerator(),
      title: payload.title,
      createdAt: new Date(this.clock()).toISOString(),
      ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
    };
    this.tasks.push(task);
    return structuredClone(task);
  }

  async updateTask(taskId: string, payload: TaskUpdateRequest): Promise<Task> {
    const index = this.tasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      throw new TasksAdapterError(`Tarefa ${taskId} não encontrada.`, 404);
    }
    const current = this.tasks[index] as Task;

    // `completedAt` segue a semântica do contrato à risca: presente no
    // payload CONCLUI (com o valor informado); ausente REABRE — mesmo que a
    // intenção do chamador fosse só editar título/vencimento (ver a doc de
    // `TasksAdapter.updateTask` sobre ecoar `completedAt` para preservá-lo).
    const updated: Task = {
      ...current,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
    };
    if (payload.completedAt !== undefined) {
      updated.completedAt = payload.completedAt;
    } else {
      delete updated.completedAt;
    }

    this.tasks[index] = updated;
    return structuredClone(updated);
  }
}
