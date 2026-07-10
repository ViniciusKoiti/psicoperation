import { describe, expect, it, vi } from "vitest";

import { ChargesReadAdapterError } from "./ChargesReadAdapterError";
import { HttpChargesReadAdapter } from "./HttpChargesReadAdapter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const SAMPLE_CHARGE = {
  id: "charge-1",
  patientId: "patient-1",
  competence: "2026-07",
  amount: 20000,
  dueDate: "2026-07-10",
  status: "pendente" as const,
  createdAt: "2026-07-01T09:00:00Z",
};

describe("HttpChargesReadAdapter", () => {
  it("faz GET /charges com patientId/page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_CHARGE], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpChargesReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const charges = await adapter.listChargesByPatient("patient-1");

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges?patientId=patient-1&page=0&size=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(charges).toHaveLength(1);
    expect(charges[0]?.amount).toBe(20000);
  });

  it("propaga erro com o detail do Problem e status quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ type: "about:blank", title: "Erro", status: 500, detail: "Falha ao listar cobranças." }, 500),
      );
    const adapter = new HttpChargesReadAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listChargesByPatient("patient-1");
    await expect(rejection).rejects.toThrow("Falha ao listar cobranças.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(ChargesReadAdapterError);
  });
});
