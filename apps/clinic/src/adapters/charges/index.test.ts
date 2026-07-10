import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpChargesAdapter } from "./HttpChargesAdapter";
import { MockChargesAdapter } from "./MockChargesAdapter";
import { resolveChargesAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/patients/index.test.ts`, PSI-033).
 */
describe("resolveChargesAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_CHARGES_ADAPTER", "");

    expect(resolveChargesAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CHARGES_ADAPTER", "");

    expect(resolveChargesAdapterKind()).toBe("http");
  });

  it("respeita VITE_CHARGES_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_CHARGES_ADAPTER", "http");

    expect(resolveChargesAdapterKind()).toBe("http");
  });

  it("respeita VITE_CHARGES_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CHARGES_ADAPTER", "mock");

    expect(resolveChargesAdapterKind()).toBe("mock");
  });
});

describe("chargesAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { chargesAdapter } = await import("./index");
    expect(chargesAdapter).toBeInstanceOf(MockChargesAdapter);
  });
});

describe("HttpChargesAdapter vs MockChargesAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockChargesAdapter()).not.toBeInstanceOf(HttpChargesAdapter);
    expect(new HttpChargesAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockChargesAdapter);
  });
});
