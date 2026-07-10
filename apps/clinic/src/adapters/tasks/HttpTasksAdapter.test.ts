import { describe, expect, it, vi } from "vitest";

import { HttpTasksAdapter } from "./HttpTasksAdapter";
import { TasksAdapterError } from "./TasksAdapterError";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SAMPLE_TASK = {
  id: "task-1",
  title: "Enviar recibo",
  dueDate: "2026-07-10",
  createdAt: "2026-07-01T09:00:00Z",
};

describe("HttpTasksAdapter — leitura (mantida da PSI-032)", () => {
  it("faz GET /tasks com page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_TASK], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const tasks = await adapter.listTasks();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/tasks?page=0&size=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe("Enviar recibo");
  });

  it("inclui pending na query string quando informado", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], meta: { page: 0, size: 200, totalElements: 0, totalPages: 0 } }));
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.listTasks({ pending: true });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/tasks?page=0&size=200&pending=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("propaga erro com o detail do Problem e status quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ type: "about:blank", title: "Erro", status: 500, detail: "Falha ao listar tarefas." }, 500),
      );
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listTasks();
    await expect(rejection).rejects.toThrow("Falha ao listar tarefas.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(TasksAdapterError);
  });
});

describe("HttpTasksAdapter — criação/edição (PSI-038)", () => {
  it("cria uma tarefa via POST /tasks", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_TASK, 201));
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const created = await adapter.createTask({ title: "Enviar recibo", dueDate: "2026-07-10" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/tasks",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ title: "Enviar recibo", dueDate: "2026-07-10" }) }),
    );
    expect(created.title).toBe("Enviar recibo");
  });

  it("atualiza uma tarefa via PUT /tasks/{taskId}", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_TASK, completedAt: "2026-07-05T18:00:00Z" }));
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const updated = await adapter.updateTask("task-1", { completedAt: "2026-07-05T18:00:00Z" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/tasks/task-1",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ completedAt: "2026-07-05T18:00:00Z" }) }),
    );
    expect(updated.completedAt).toBe("2026-07-05T18:00:00Z");
  });

  it("propaga 404 ao atualizar tarefa inexistente", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ type: "about:blank", title: "Não encontrada", status: 404 }, 404));
    const adapter = new HttpTasksAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.updateTask("inexistente", {});
    await expect(rejection).rejects.toBeInstanceOf(TasksAdapterError);
    await expect(rejection).rejects.toMatchObject({ status: 404 });
  });
});

describe("HttpTasksAdapter vs MockTasksAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", async () => {
    const { MockTasksAdapter } = await import("./MockTasksAdapter");
    expect(new MockTasksAdapter()).not.toBeInstanceOf(HttpTasksAdapter);
    expect(new HttpTasksAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockTasksAdapter);
  });
});
