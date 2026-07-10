import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpChargesReadAdapter } from "./HttpChargesReadAdapter";
import { MockChargesReadAdapter } from "./MockChargesReadAdapter";
import { resolveChargesReadAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/patients/index.test.ts`, PSI-033).
 */
describe("resolveChargesReadAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_CHARGES_READ_ADAPTER", "");

    expect(resolveChargesReadAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CHARGES_READ_ADAPTER", "");

    expect(resolveChargesReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_CHARGES_READ_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_CHARGES_READ_ADAPTER", "http");

    expect(resolveChargesReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_CHARGES_READ_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CHARGES_READ_ADAPTER", "mock");

    expect(resolveChargesReadAdapterKind()).toBe("mock");
  });
});

describe("chargesReadAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { chargesReadAdapter } = await import("./index");
    expect(chargesReadAdapter).toBeInstanceOf(MockChargesReadAdapter);
  });
});

describe("HttpChargesReadAdapter vs MockChargesReadAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockChargesReadAdapter()).not.toBeInstanceOf(HttpChargesReadAdapter);
    expect(new HttpChargesReadAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockChargesReadAdapter);
  });
});
