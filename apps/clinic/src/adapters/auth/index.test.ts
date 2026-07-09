import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpAuthAdapter } from "./HttpAuthAdapter";
import { MockAuthAdapter } from "./MockAuthAdapter";
import { resolveAuthAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (ver
 * comentário em `resolveAuthAdapterKind`). Estes testes cobrem a regra sem
 * depender do valor de `authAdapter` já resolvido no módulo (que é fixado no
 * import, refletindo o ambiente do processo de teste).
 */
describe("resolveAuthAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_AUTH_ADAPTER", "");

    expect(resolveAuthAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override — mock nunca é o padrão em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AUTH_ADAPTER", "");

    expect(resolveAuthAdapterKind()).toBe("http");
  });

  it("respeita VITE_AUTH_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_AUTH_ADAPTER", "http");

    expect(resolveAuthAdapterKind()).toBe("http");
  });

  it("respeita VITE_AUTH_ADAPTER=mock mesmo em produção (escolha explícita, não padrão)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AUTH_ADAPTER", "mock");

    expect(resolveAuthAdapterKind()).toBe("mock");
  });

  it("ignora valores desconhecidos e cai no padrão por modo de build", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_AUTH_ADAPTER", "algo-invalido");

    expect(resolveAuthAdapterKind()).toBe("http");
  });
});

describe("authAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { authAdapter } = await import("./index");
    expect(authAdapter).toBeInstanceOf(MockAuthAdapter);
  });
});

describe("HttpAuthAdapter vs MockAuthAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockAuthAdapter()).not.toBeInstanceOf(HttpAuthAdapter);
    expect(new HttpAuthAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockAuthAdapter);
  });
});
