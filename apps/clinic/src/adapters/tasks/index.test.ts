import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpTasksAdapter } from "./HttpTasksAdapter";
import { MockTasksAdapter } from "./MockTasksAdapter";
import { resolveTasksAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/charges/index.test.ts`, PSI-037).
 */
describe("resolveTasksAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_TASKS_ADAPTER", "");

    expect(resolveTasksAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_TASKS_ADAPTER", "");

    expect(resolveTasksAdapterKind()).toBe("http");
  });

  it("respeita VITE_TASKS_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_TASKS_ADAPTER", "http");

    expect(resolveTasksAdapterKind()).toBe("http");
  });

  it("respeita VITE_TASKS_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_TASKS_ADAPTER", "mock");

    expect(resolveTasksAdapterKind()).toBe("mock");
  });
});

describe("tasksAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { tasksAdapter } = await import("./index");
    expect(tasksAdapter).toBeInstanceOf(MockTasksAdapter);
  });
});

describe("HttpTasksAdapter vs MockTasksAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockTasksAdapter()).not.toBeInstanceOf(HttpTasksAdapter);
    expect(new HttpTasksAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockTasksAdapter);
  });
});
