import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpRemindersAdapter } from "./HttpRemindersAdapter";
import { MockRemindersAdapter } from "./MockRemindersAdapter";
import { resolveRemindersAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/tasks/index.test.ts`, PSI-038).
 */
describe("resolveRemindersAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_REMINDERS_ADAPTER", "");

    expect(resolveRemindersAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_REMINDERS_ADAPTER", "");

    expect(resolveRemindersAdapterKind()).toBe("http");
  });

  it("respeita VITE_REMINDERS_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_REMINDERS_ADAPTER", "http");

    expect(resolveRemindersAdapterKind()).toBe("http");
  });

  it("respeita VITE_REMINDERS_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_REMINDERS_ADAPTER", "mock");

    expect(resolveRemindersAdapterKind()).toBe("mock");
  });
});

describe("remindersAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { remindersAdapter } = await import("./index");
    expect(remindersAdapter).toBeInstanceOf(MockRemindersAdapter);
  });
});

describe("HttpRemindersAdapter vs MockRemindersAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockRemindersAdapter()).not.toBeInstanceOf(HttpRemindersAdapter);
    expect(new HttpRemindersAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockRemindersAdapter);
  });
});
