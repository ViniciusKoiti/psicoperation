import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import type { Task } from "@psiops/contracts";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockTasksAdapter, type TasksAdapter } from "../../adapters/tasks";
import { TasksPage, type TasksPageProps } from "./TasksPage";

// "Hoje" fixo em todos os testes — nenhum teste depende do relógio real.
const TODAY = () => new Date(2026, 6, 10); // 10/07/2026

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Tarefa de teste",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

interface RenderOptions {
  tasksAdapter?: TasksAdapter;
  today?: TasksPageProps["today"];
}

function renderTasksPage(options: RenderOptions = {}) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={["/tarefas"]}>
        <TasksPage tasksAdapter={options.tasksAdapter ?? new MockTasksAdapter([])} today={options.today ?? TODAY} />
      </MemoryRouter>
    </MantineProvider>,
  );
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByTestId("tasks-loading")).not.toBeInTheDocument();
  });
  await act(async () => {});
}

describe("TasksPage — carregamento e estados vazio/erro", () => {
  it("mostra o skeleton de carregamento assim que monta", async () => {
    renderTasksPage();

    expect(screen.getByTestId("tasks-loading")).toBeInTheDocument();

    await waitForLoaded();
  });

  it("mostra estado vazio quando não há tarefas", async () => {
    renderTasksPage();
    await waitForLoaded();

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma tarefa cadastrada")).toBeInTheDocument();
  });

  it("mostra erro com ação de tentar novamente quando a busca falha", async () => {
    const tasksAdapter: TasksAdapter = Object.assign(new MockTasksAdapter([]), {
      listTasks: () => Promise.reject(new Error("falhou")),
    });

    renderTasksPage({ tasksAdapter });

    const errorAlert = await screen.findByTestId("tasks-error");
    expect(within(errorAlert).getByText("Não foi possível carregar as tarefas.")).toBeInTheDocument();
  });
});

describe("TasksPage — separação abertas/concluídas e destaque de atraso", () => {
  it("separa tarefas abertas e concluídas em seções distintas", async () => {
    const seed = [
      task({ id: "open-1", title: "Aberta" }),
      task({ id: "done-1", title: "Concluída", completedAt: "2026-07-05T00:00:00Z" }),
    ];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    const openSection = screen.getByTestId("tasks-section-open");
    const completedSection = screen.getByTestId("tasks-section-completed");
    expect(within(openSection).getByText("Aberta")).toBeInTheDocument();
    expect(within(completedSection).getByText("Concluída")).toBeInTheDocument();
    expect(within(completedSection).queryByText("Aberta")).not.toBeInTheDocument();
  });

  it("destaca uma tarefa aberta com vencimento no passado como atrasada", async () => {
    const seed = [task({ id: "overdue-1", title: "Vencida", dueDate: "2026-07-01" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    expect(screen.getByTestId("task-overdue-overdue-1")).toBeInTheDocument();
  });

  it("não destaca uma tarefa com vencimento futuro como atrasada", async () => {
    const seed = [task({ id: "future-1", title: "Futura", dueDate: "2026-08-01" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    expect(screen.queryByTestId("task-overdue-future-1")).not.toBeInTheDocument();
  });
});

describe("TasksPage — criação rápida (campo único, Enter cria)", () => {
  it("cria uma tarefa ao submeter o formulário de criação rápida (Enter) e limpa o campo", async () => {
    renderTasksPage();
    await waitForLoaded();

    const input = screen.getByTestId("tasks-quick-add-input");
    fireEvent.change(input, { target: { value: "Ligar para Camila" } });
    fireEvent.click(screen.getByTestId("tasks-quick-add-submit"));

    await waitFor(() => {
      expect(screen.getByText("Ligar para Camila")).toBeInTheDocument();
    });
    expect((screen.getByTestId("tasks-quick-add-input") as HTMLInputElement).value).toBe("");
  });

  it("cria uma tarefa com vencimento opcional", async () => {
    renderTasksPage();
    await waitForLoaded();

    fireEvent.change(screen.getByTestId("tasks-quick-add-input"), { target: { value: "Enviar recibo" } });
    fireEvent.change(screen.getByTestId("tasks-quick-add-due-date"), { target: { value: "2026-07-20" } });
    fireEvent.click(screen.getByTestId("tasks-quick-add-submit"));

    await waitFor(() => {
      expect(screen.getByText("Vencimento: 20/07/2026")).toBeInTheDocument();
    });
  });

  it("rejeita a criação com título vazio", async () => {
    renderTasksPage();
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("tasks-quick-add-submit"));

    expect(screen.getByText("Informe um título para a tarefa.")).toBeInTheDocument();
  });
});

describe("TasksPage — conclusão e reabertura com um clique", () => {
  it("conclui uma tarefa ao marcar o checkbox, movendo-a para a seção de concluídas", async () => {
    const seed = [task({ id: "t1", title: "A concluir" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("task-toggle-t1"));

    await waitFor(() => {
      const completedSection = screen.getByTestId("tasks-section-completed");
      expect(within(completedSection).getByText("A concluir")).toBeInTheDocument();
    });
  });

  it("reabre uma tarefa concluída ao desmarcar o checkbox, movendo-a de volta para abertas", async () => {
    const seed = [task({ id: "t1", title: "Concluída", completedAt: "2026-07-05T00:00:00Z" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("task-toggle-t1"));

    await waitFor(() => {
      const openSection = screen.getByTestId("tasks-section-open");
      expect(within(openSection).getByText("Concluída")).toBeInTheDocument();
    });
  });
});

describe("TasksPage — edição posterior de título/vencimento", () => {
  it("edita o título e o vencimento de uma tarefa existente", async () => {
    const seed = [task({ id: "t1", title: "Título original" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("task-edit-t1"));
    const modal = await screen.findByTestId("edit-task-modal");
    fireEvent.change(within(modal).getByLabelText("Título", { exact: false }), { target: { value: "Título editado" } });
    fireEvent.change(within(modal).getByLabelText("Vencimento", { exact: false }), { target: { value: "2026-07-25" } });
    fireEvent.click(within(modal).getByTestId("confirm-edit-task"));

    await waitFor(() => {
      expect(screen.getByText("Título editado")).toBeInTheDocument();
      expect(screen.getByText("Vencimento: 25/07/2026")).toBeInTheDocument();
    });
  });

  it("editar título de uma tarefa concluída preserva a conclusão (não reabre)", async () => {
    const seed = [task({ id: "t1", title: "Concluída", completedAt: "2026-07-05T00:00:00Z" })];
    renderTasksPage({ tasksAdapter: new MockTasksAdapter(seed) });
    await waitForLoaded();

    fireEvent.click(screen.getByTestId("task-edit-t1"));
    const modal = await screen.findByTestId("edit-task-modal");
    fireEvent.change(within(modal).getByLabelText("Título", { exact: false }), { target: { value: "Concluída editada" } });
    fireEvent.click(within(modal).getByTestId("confirm-edit-task"));

    await waitFor(() => {
      const completedSection = screen.getByTestId("tasks-section-completed");
      expect(within(completedSection).getByText("Concluída editada")).toBeInTheDocument();
    });
  });
});
