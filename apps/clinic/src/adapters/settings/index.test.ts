import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpSettingsAdapter } from "./HttpSettingsAdapter";
import { MockSettingsAdapter } from "./MockSettingsAdapter";
import { resolveSettingsAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/auth/index.ts`, PSI-030).
 */
describe("resolveSettingsAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_SETTINGS_ADAPTER", "");

    expect(resolveSettingsAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override — mock nunca é o padrão em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SETTINGS_ADAPTER", "");

    expect(resolveSettingsAdapterKind()).toBe("http");
  });

  it("respeita VITE_SETTINGS_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_SETTINGS_ADAPTER", "http");

    expect(resolveSettingsAdapterKind()).toBe("http");
  });

  it("respeita VITE_SETTINGS_ADAPTER=mock mesmo em produção (escolha explícita, não padrão)", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SETTINGS_ADAPTER", "mock");

    expect(resolveSettingsAdapterKind()).toBe("mock");
  });

  it("ignora valores desconhecidos e cai no padrão por modo de build", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SETTINGS_ADAPTER", "algo-invalido");

    expect(resolveSettingsAdapterKind()).toBe("http");
  });
});

describe("settingsAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { settingsAdapter } = await import("./index");
    expect(settingsAdapter).toBeInstanceOf(MockSettingsAdapter);
  });
});

describe("HttpSettingsAdapter vs MockSettingsAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockSettingsAdapter()).not.toBeInstanceOf(HttpSettingsAdapter);
    expect(new HttpSettingsAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockSettingsAdapter);
  });
});
