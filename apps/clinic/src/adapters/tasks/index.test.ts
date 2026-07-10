import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpTasksReadAdapter } from "./HttpTasksReadAdapter";
import { MockTasksReadAdapter } from "./MockTasksReadAdapter";
import { resolveTasksReadAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/charges/index.test.ts`, PSI-034).
 */
describe("resolveTasksReadAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_TASKS_READ_ADAPTER", "");

    expect(resolveTasksReadAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_TASKS_READ_ADAPTER", "");

    expect(resolveTasksReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_TASKS_READ_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_TASKS_READ_ADAPTER", "http");

    expect(resolveTasksReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_TASKS_READ_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_TASKS_READ_ADAPTER", "mock");

    expect(resolveTasksReadAdapterKind()).toBe("mock");
  });
});

describe("tasksReadAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { tasksReadAdapter } = await import("./index");
    expect(tasksReadAdapter).toBeInstanceOf(MockTasksReadAdapter);
  });
});

describe("HttpTasksReadAdapter vs MockTasksReadAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockTasksReadAdapter()).not.toBeInstanceOf(HttpTasksReadAdapter);
    expect(new HttpTasksReadAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockTasksReadAdapter);
  });
});
