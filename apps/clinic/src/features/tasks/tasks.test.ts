import type { Task } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  buildCompleteTaskPayload,
  buildCreateTaskPayload,
  buildEditTaskPayload,
  buildReopenTaskPayload,
  formatIsoDateLabel,
  isTaskOverdue,
  separateTasksByStatus,
  validateQuickAddTitle,
} from "./tasks";

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

const TODAY = "2026-07-10";

describe("isTaskOverdue", () => {
  it("é atrasada quando o vencimento é anterior a hoje e não está concluída", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-08" }), TODAY)).toBe(true);
  });

  it("não é atrasada quando o vencimento é hoje", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-10" }), TODAY)).toBe(false);
  });

  it("não é atrasada quando o vencimento é futuro", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-20" }), TODAY)).toBe(false);
  });

  it("não é atrasada quando não tem vencimento", () => {
    expect(isTaskOverdue(task({}), TODAY)).toBe(false);
  });

  it("uma tarefa concluída nunca é atrasada, mesmo com vencimento no passado", () => {
    expect(isTaskOverdue(task({ dueDate: "2026-07-01", completedAt: "2026-07-02T00:00:00Z" }), TODAY)).toBe(false);
  });
});

describe("separateTasksByStatus", () => {
  it("separa abertas e concluídas", () => {
    const tasks = [
      task({ id: "open-1" }),
      task({ id: "done-1", completedAt: "2026-07-05T00:00:00Z" }),
      task({ id: "open-2" }),
    ];

    const { open, completed } = separateTasksByStatus(tasks, TODAY);

    expect(open.map((t) => t.id).sort()).toEqual(["open-1", "open-2"]);
    expect(completed.map((t) => t.id)).toEqual(["done-1"]);
  });

  it("ordena abertas com as atrasadas primeiro, depois por vencimento (sem vencimento por último)", () => {
    const tasks = [
      task({ id: "no-due" }),
      task({ id: "future", dueDate: "2026-07-20" }),
      task({ id: "overdue-old", dueDate: "2026-07-01" }),
      task({ id: "overdue-new", dueDate: "2026-07-05" }),
      task({ id: "today", dueDate: "2026-07-10" }),
    ];

    const { open } = separateTasksByStatus(tasks, TODAY);

    expect(open.map((t) => t.id)).toEqual(["overdue-old", "overdue-new", "today", "future", "no-due"]);
  });

  it("ordena concluídas com a mais recentemente concluída primeiro", () => {
    const tasks = [
      task({ id: "done-earlier", completedAt: "2026-07-01T00:00:00Z" }),
      task({ id: "done-later", completedAt: "2026-07-08T00:00:00Z" }),
    ];

    const { completed } = separateTasksByStatus(tasks, TODAY);

    expect(completed.map((t) => t.id)).toEqual(["done-later", "done-earlier"]);
  });

  it("lista vazia quando não há tarefas", () => {
    expect(separateTasksByStatus([], TODAY)).toEqual({ open: [], completed: [] });
  });
});

describe("validateQuickAddTitle", () => {
  it("rejeita título vazio", () => {
    expect(validateQuickAddTitle("")).not.toBeNull();
  });

  it("rejeita título só com espaços", () => {
    expect(validateQuickAddTitle("   ")).not.toBeNull();
  });

  it("aceita título válido", () => {
    expect(validateQuickAddTitle("Ligar para Camila")).toBeNull();
  });
});

describe("buildCreateTaskPayload", () => {
  it("apara espaços do título e omite vencimento quando ausente", () => {
    expect(buildCreateTaskPayload("  Ligar para Camila  ")).toEqual({ title: "Ligar para Camila" });
  });

  it("inclui vencimento quando informado", () => {
    expect(buildCreateTaskPayload("Enviar recibo", "2026-07-20")).toEqual({
      title: "Enviar recibo",
      dueDate: "2026-07-20",
    });
  });
});

describe("buildCompleteTaskPayload / buildReopenTaskPayload", () => {
  it("conclusão inclui completedAt", () => {
    expect(buildCompleteTaskPayload("2026-07-10T12:00:00Z")).toEqual({ completedAt: "2026-07-10T12:00:00Z" });
  });

  it("reabertura não inclui completedAt", () => {
    const payload = buildReopenTaskPayload();
    expect(payload).toEqual({});
    expect("completedAt" in payload).toBe(false);
  });
});

describe("buildEditTaskPayload", () => {
  it("ecoa completedAt atual para preservar a conclusão ao editar título/vencimento", () => {
    const payload = buildEditTaskPayload("Novo título", "2026-07-20", "2026-07-05T18:00:00Z");
    expect(payload).toEqual({ title: "Novo título", dueDate: "2026-07-20", completedAt: "2026-07-05T18:00:00Z" });
  });

  it("não inclui completedAt quando a tarefa está aberta (preserva o estado aberto)", () => {
    const payload = buildEditTaskPayload("Novo título", "2026-07-20", undefined);
    expect("completedAt" in payload).toBe(false);
  });
});

describe("formatIsoDateLabel", () => {
  it("formata AAAA-MM-DD como dd/mm/aaaa", () => {
    expect(formatIsoDateLabel("2026-07-10")).toBe("10/07/2026");
  });
});
