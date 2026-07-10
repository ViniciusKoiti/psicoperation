import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpPatientsAdapter } from "./HttpPatientsAdapter";
import { MockPatientsAdapter } from "./MockPatientsAdapter";
import { resolvePatientsAdapterKind } from "./index";

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
