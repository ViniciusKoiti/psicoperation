import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpAppointmentsReadAdapter } from "./HttpAppointmentsReadAdapter";
import { MockAppointmentsReadAdapter } from "./MockAppointmentsReadAdapter";
import { resolveAppointmentsReadAdapterKind } from "./index";

/**
 * `./index.ts` é o único ponto de composição da escolha mock/http (mesmo
 * padrão de `src/adapters/patients/index.test.ts`, PSI-033).
 */
describe("resolveAppointmentsReadAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock quando não há override e o build não é de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_APPOINTMENTS_READ_ADAPTER", "");

    expect(resolveAppointmentsReadAdapterKind()).toBe("mock");
  });

  it("usa http por padrão em build de produção, mesmo sem override", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_APPOINTMENTS_READ_ADAPTER", "");

    expect(resolveAppointmentsReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_APPOINTMENTS_READ_ADAPTER=http mesmo fora de produção", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_APPOINTMENTS_READ_ADAPTER", "http");

    expect(resolveAppointmentsReadAdapterKind()).toBe("http");
  });

  it("respeita VITE_APPOINTMENTS_READ_ADAPTER=mock mesmo em produção", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_APPOINTMENTS_READ_ADAPTER", "mock");

    expect(resolveAppointmentsReadAdapterKind()).toBe("mock");
  });
});

describe("appointmentsReadAdapter (composição eager no import)", () => {
  it("expõe o adapter resolvido a partir do ambiente de teste (mock por padrão em test/dev)", async () => {
    const { appointmentsReadAdapter } = await import("./index");
    expect(appointmentsReadAdapter).toBeInstanceOf(MockAppointmentsReadAdapter);
  });
});

describe("HttpAppointmentsReadAdapter vs MockAppointmentsReadAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", () => {
    expect(new MockAppointmentsReadAdapter()).not.toBeInstanceOf(HttpAppointmentsReadAdapter);
    expect(new HttpAppointmentsReadAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockAppointmentsReadAdapter);
  });
});
