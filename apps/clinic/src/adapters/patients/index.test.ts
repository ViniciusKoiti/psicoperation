import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpPatientsAdapter } from "./HttpPatientsAdapter";
import { resolvePatientsAdapterKind } from "./index";
import { MockPatientsAdapter } from "./MockPatientsAdapter";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/auth/index.ts` PSI-030 e `src/adapters/settings/index.ts` PSI-031).
 */
describe("resolvePatientsAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "");

    expect(resolvePatientsAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override — mock nunca é o padrão em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "");

    expect(resolvePatientsAdapterKind()).toBe("http");
  });

  it("respeita VITE_PATIENTS_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "http");

    expect(resolvePatientsAdapterKind()).toBe("http");
  });

  it("respeita VITE_PATIENTS_ADAPTER=mock mesmo em produção (escolha explícita, não padrão)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "mock");

    expect(resolvePatientsAdapterKind()).toBe("mock");
  });

  it("ignora valores desconhecidos e cai no padrão por modo de build", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "algo-invalido");

    expect(resolvePatientsAdapterKind()).toBe("http");
  });
});

describe("patientsAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { patientsAdapter } = await import("./index");
    expect(patientsAdapter).toBeInstanceOf(MockPatientsAdapter);
  });
});

describe("HttpPatientsAdapter vs MockPatientsAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockPatientsAdapter()).not.toBeInstanceOf(HttpPatientsAdapter);
    expect(new HttpPatientsAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockPatientsAdapter);
  });
});

describe("patientsAdapter em modo http usa a ponte de access token (PSI-044)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("envia Authorization: Bearer <token> lido da ponte de src/adapters/auth", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_PATIENTS_ADAPTER", "");

    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [], meta: { page: 0, size: 20, totalItems: 0, totalPages: 0 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    // `vi.resetModules()` garante um grafo de módulos novo — "./index" e
    // "../auth/accessTokenBridge" precisam ser a MESMA instância de módulo
    // (mesmo estado) para que `setBridgedAccessToken` aqui seja visível pelo
    // `getAccessToken` que "./index" passa ao `HttpPatientsAdapter`.
    vi.resetModules();
    const { setBridgedAccessToken } = await import("../auth/accessTokenBridge");
    setBridgedAccessToken("token-da-sessao");

    // Não comparamos com `instanceof HttpPatientsAdapter` aqui: o
    // `vi.resetModules()` acima faz "./index" reimportar sua própria cópia
    // da classe, distinta da importada estaticamente no topo deste arquivo
    // — o comportamento abaixo (chamada HTTP com o header esperado) já prova
    // que o caminho http foi escolhido.
    const { patientsAdapter } = await import("./index");

    await patientsAdapter.listPatients();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-da-sessao");
  });
});
