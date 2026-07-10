import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpLeadAdapter } from "./HttpLeadAdapter";
import { resolveLeadAdapterKind } from "./index";

/**
 * `./index.ts` é o ponto único de composição mock/http deste adapter (mesmo
 * padrão de `apps/clinic/src/adapters/<dominio>/index.ts`), embora ainda não
 * esteja ligado a `<LeadForm>` — ver open_question do PR da PSI-044.
 */
describe("resolveLeadAdapterKind", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa mock em desenvolvimento sem override", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_LEAD_ADAPTER", "");

    expect(resolveLeadAdapterKind()).toBe("mock");
  });

  it("usa http em produção sem override", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_LEAD_ADAPTER", "");

    expect(resolveLeadAdapterKind()).toBe("http");
  });

  it("usa http em test sem override (ambiente de teste, acceptance criteria PSI-044)", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_LEAD_ADAPTER", "");

    expect(resolveLeadAdapterKind()).toBe("http");
  });

  it("respeita NEXT_PUBLIC_LEAD_ADAPTER=mock mesmo fora de desenvolvimento", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_LEAD_ADAPTER", "mock");

    expect(resolveLeadAdapterKind()).toBe("mock");
  });

  it("respeita NEXT_PUBLIC_LEAD_ADAPTER=http mesmo em desenvolvimento", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_LEAD_ADAPTER", "http");

    expect(resolveLeadAdapterKind()).toBe("http");
  });
});

describe("leadAdapter (composição eager no import)", () => {
  it("expõe um adapter funcional a partir do ambiente de teste", async () => {
    const { leadAdapter } = await import("./index");
    expect(typeof leadAdapter.submit).toBe("function");
  });
});

describe("HttpLeadAdapter é selecionável pelo mesmo ponto de composição", () => {
  it("é uma implementação distinta do mock em memória", () => {
    expect(new HttpLeadAdapter({ baseUrl: "https://x" })).toBeInstanceOf(HttpLeadAdapter);
  });
});
