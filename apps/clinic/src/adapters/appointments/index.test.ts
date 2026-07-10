import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpAgendaAdapter } from "./HttpAgendaAdapter";
import { MockAgendaAdapter } from "./MockAgendaAdapter";
import { resolveAgendaAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/patients/index.test.ts`, PSI-033).
 */
describe("resolveAgendaAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_AGENDA_ADAPTER", "");

    expect(resolveAgendaAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AGENDA_ADAPTER", "");

    expect(resolveAgendaAdapterKind()).toBe("http");
  });

  it("respeita VITE_AGENDA_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_AGENDA_ADAPTER", "http");

    expect(resolveAgendaAdapterKind()).toBe("http");
  });

  it("respeita VITE_AGENDA_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AGENDA_ADAPTER", "mock");

    expect(resolveAgendaAdapterKind()).toBe("mock");
  });
});

describe("agendaAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { agendaAdapter } = await import("./index");
    expect(agendaAdapter).toBeInstanceOf(MockAgendaAdapter);
  });
});

describe("HttpAgendaAdapter vs MockAgendaAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockAgendaAdapter()).not.toBeInstanceOf(HttpAgendaAdapter);
    expect(new HttpAgendaAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockAgendaAdapter);
  });
});
