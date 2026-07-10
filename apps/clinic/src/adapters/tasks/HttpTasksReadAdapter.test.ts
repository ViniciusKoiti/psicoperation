import { describe, expect, it, vi } from "vitest";

import { HttpTasksReadAdapter } from "./HttpTasksReadAdapter";
import { TasksReadAdapterError } from "./TasksReadAdapterError";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SAMPLE_TASK = {
  id: "task-1",
  title: "Enviar recibo",
  dueDate: "2026-07-10",
  createdAt: "2026-07-01T09:00:00Z",
};

describe("HttpTasksReadAdapter", () => {
  it("faz GET /tasks com page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_TASK], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpTasksReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

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
    const adapter = new HttpTasksReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

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
    const adapter = new HttpTasksReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listTasks();
    await expect(rejection).rejects.toThrow("Falha ao listar tarefas.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(TasksReadAdapterError);
  });
});
