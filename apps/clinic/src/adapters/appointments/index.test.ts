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

describe("agendaAdapter em modo http usa a ponte de access token (PSI-044)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("envia Authorization: Bearer <token> lido da ponte de src/adapters/auth", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AGENDA_ADAPTER", "");

    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [], meta: { page: 0, size: 20, totalItems: 0, totalPages: 0 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    // Mesma ressalva de `src/adapters/patients/index.test.ts`: precisa da
    // MESMA instância de módulo de `accessTokenBridge` que "./index" usa.
    vi.resetModules();
    const { setBridgedAccessToken } = await import("../auth/accessTokenBridge");
    setBridgedAccessToken("token-da-sessao");

    // Não comparamos com `instanceof HttpAgendaAdapter` aqui pelo mesmo
    // motivo documentado em `src/adapters/patients/index.test.ts`.
    const { agendaAdapter } = await import("./index");

    await agendaAdapter.listAppointments({ from: "2026-07-01T00:00:00Z", to: "2026-07-02T00:00:00Z" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-da-sessao");
  });
});
