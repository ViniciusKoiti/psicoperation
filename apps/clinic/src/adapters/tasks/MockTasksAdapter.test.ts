import type { Task } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockTasksAdapter } from "./MockTasksAdapter";
import { TasksAdapterError } from "./TasksAdapterError";

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa de teste",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("MockTasksAdapter — leitura (mantida da PSI-032)", () => {
  it("retorna todas as tarefas quando nenhum filtro é informado", async () => {
    const seed = [task({ id: "t1" }), task({ id: "t2", completedAt: "2026-07-05T10:00:00Z" })];
    const adapter = new MockTasksAdapter(seed);

    const tasks = await adapter.listTasks();

    expect(tasks.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });

  it("filtra só as tarefas não concluídas quando pending: true", async () => {
    const seed = [task({ id: "t1" }), task({ id: "t2", completedAt: "2026-07-05T10:00:00Z" }), task({ id: "t3" })];
    const adapter = new MockTasksAdapter(seed);

    const tasks = await adapter.listTasks({ pending: true });

    expect(tasks.map((t) => t.id).sort()).toEqual(["t1", "t3"]);
  });

  it("retorna lista vazia quando não há tarefas seedadas", async () => {
    const adapter = new MockTasksAdapter([]);

    const tasks = await adapter.listTasks();

    expect(tasks).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = [task({ id: "t1", title: "Original" })];
    const adapter = new MockTasksAdapter(seed);

    const first = await adapter.listTasks();
    first[0]!.title = "Mutado";

    const second = await adapter.listTasks();
    expect(second[0]?.title).toBe("Original");
  });

  it("o seed padrão traz uma tarefa atrasada, uma de hoje, uma futura e uma concluída", async () => {
    const adapter = new MockTasksAdapter();

    const all = await adapter.listTasks();
    expect(all).toHaveLength(4);

    const pending = await adapter.listTasks({ pending: true });
    expect(pending).toHaveLength(3);
    expect(pending.every((t) => !t.completedAt)).toBe(true);
  });
});

describe("MockTasksAdapter — criação rápida (PSI-038)", () => {
  it("cria uma tarefa só com título (sem vencimento)", async () => {
    let idCounter = 0;
    const adapter = new MockTasksAdapter([], {
      clock: () => new Date("2026-07-01T12:00:00Z").getTime(),
      idGenerator: () => `gen-${++idCounter}`,
    });

    const created = await adapter.createTask({ title: "Ligar para Camila" });

    expect(created).toEqual({
      id: "gen-1",
      title: "Ligar para Camila",
      createdAt: "2026-07-01T12:00:00.000Z",
    });

    const all = await adapter.listTasks();
    expect(all).toHaveLength(1);
  });

  it("cria uma tarefa com vencimento opcional", async () => {
    const adapter = new MockTasksAdapter([], { clock: () => new Date("2026-07-01T12:00:00Z").getTime() });

    const created = await adapter.createTask({ title: "Enviar recibo", dueDate: "2026-07-20" });

    expect(created.dueDate).toBe("2026-07-20");
  });
});

describe("MockTasksAdapter — conclusão e reabertura (PSI-038)", () => {
  it("conclui uma tarefa (completedAt presente)", async () => {
    const seed = [task({ id: "t1" })];
    const adapter = new MockTasksAdapter(seed);

    const updated = await adapter.updateTask("t1", { completedAt: "2026-07-05T18:00:00Z" });

    expect(updated.completedAt).toBe("2026-07-05T18:00:00Z");
    const stored = await adapter.listTasks();
    expect(stored[0]?.completedAt).toBe("2026-07-05T18:00:00Z");
  });

  it("reabre uma tarefa concluída (completedAt ausente)", async () => {
    const seed = [task({ id: "t1", completedAt: "2026-07-05T18:00:00Z" })];
    const adapter = new MockTasksAdapter(seed);

    const updated = await adapter.updateTask("t1", {});

    expect(updated.completedAt).toBeUndefined();
  });

  it("edição de título/vencimento sem completedAt no payload reabre a tarefa (semântica do contrato)", async () => {
    const seed = [task({ id: "t1", completedAt: "2026-07-05T18:00:00Z" })];
    const adapter = new MockTasksAdapter(seed);

    const updated = await adapter.updateTask("t1", { title: "Título editado" });

    expect(updated.title).toBe("Título editado");
    expect(updated.completedAt).toBeUndefined();
  });

  it("editar título ecoando o completedAt atual preserva a conclusão (uso recomendado por TasksAdapter.updateTask)", async () => {
    const seed = [task({ id: "t1", completedAt: "2026-07-05T18:00:00Z" })];
    const adapter = new MockTasksAdapter(seed);

    const updated = await adapter.updateTask("t1", { title: "Título editado", completedAt: "2026-07-05T18:00:00Z" });

    expect(updated.title).toBe("Título editado");
    expect(updated.completedAt).toBe("2026-07-05T18:00:00Z");
  });

  it("edita vencimento preservando o título quando não informado", async () => {
    const seed = [task({ id: "t1", title: "Original", dueDate: "2026-07-01" })];
    const adapter = new MockTasksAdapter(seed);

    const updated = await adapter.updateTask("t1", { dueDate: "2026-07-15" });

    expect(updated.title).toBe("Original");
    expect(updated.dueDate).toBe("2026-07-15");
  });

  it("lança 404 ao atualizar tarefa inexistente", async () => {
    const adapter = new MockTasksAdapter([]);

    const rejection = adapter.updateTask("inexistente", { completedAt: "2026-07-05T18:00:00Z" });
    await expect(rejection).rejects.toBeInstanceOf(TasksAdapterError);
    await expect(rejection).rejects.toMatchObject({ status: 404 });
  });
});
