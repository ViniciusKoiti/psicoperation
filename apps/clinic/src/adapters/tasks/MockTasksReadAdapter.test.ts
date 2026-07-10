import type { Task } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { MockTasksReadAdapter } from "./MockTasksReadAdapter";

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa de teste",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("MockTasksReadAdapter", () => {
  it("retorna todas as tarefas quando nenhum filtro é informado", async () => {
    const seed = [task({ id: "t1" }), task({ id: "t2", completedAt: "2026-07-05T10:00:00Z" })];
    const adapter = new MockTasksReadAdapter(seed);

    const tasks = await adapter.listTasks();

    expect(tasks.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });

  it("filtra só as tarefas não concluídas quando pending: true", async () => {
    const seed = [
      task({ id: "t1" }),
      task({ id: "t2", completedAt: "2026-07-05T10:00:00Z" }),
      task({ id: "t3" }),
    ];
    const adapter = new MockTasksReadAdapter(seed);

    const tasks = await adapter.listTasks({ pending: true });

    expect(tasks.map((t) => t.id).sort()).toEqual(["t1", "t3"]);
  });

  it("retorna lista vazia quando não há tarefas seedadas", async () => {
    const adapter = new MockTasksReadAdapter([]);

    const tasks = await adapter.listTasks();

    expect(tasks).toEqual([]);
  });

  it("não vaza mutações externas para o estado interno (clonagem estrutural)", async () => {
    const seed = [task({ id: "t1", title: "Original" })];
    const adapter = new MockTasksReadAdapter(seed);

    const first = await adapter.listTasks();
    first[0]!.title = "Mutado";

    const second = await adapter.listTasks();
    expect(second[0]?.title).toBe("Original");
  });

  it("o seed padrão traz uma tarefa atrasada, uma de hoje, uma futura e uma concluída", async () => {
    const adapter = new MockTasksReadAdapter();

    const all = await adapter.listTasks();
    expect(all).toHaveLength(4);

    const pending = await adapter.listTasks({ pending: true });
    expect(pending).toHaveLength(3);
    expect(pending.every((t) => !t.completedAt)).toBe(true);
  });
});
