import { describe, expect, it, vi } from "vitest";

import { HttpPatientsAdapter } from "./HttpPatientsAdapter";
import { isPatientNotFoundError } from "./PatientsAdapterError";

/**
 * Testes unitários com `fetch` substituído por um stub — NÃO é um teste de
 * integração contra um backend real (ver aviso em `HttpPatientsAdapter.ts`).
 * O objetivo é garantir que a tipagem e o mapeamento request/response estão
 * corretos; o exercício ponta a ponta acontece na PSI-044.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SAMPLE_PATIENT = {
  id: "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d",
  name: "Marina Alves",
  monthlyFee: 25000,
  billingDay: 10,
  status: "ativo" as const,
  createdAt: "2026-01-05T12:00:00Z",
};

describe("HttpPatientsAdapter", () => {
  it("faz GET /patients com page/size/status na query string", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ items: [SAMPLE_PATIENT], meta: { page: 0, size: 10, totalElements: 1, totalPages: 1 } }),
    );
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const page = await adapter.listPatients({ page: 0, size: 10, status: "ativo" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/patients?page=0&size=10&status=ativo",
      expect.objectContaining({ method: "GET" }),
    );
    expect(page.items).toHaveLength(1);
  });

  it("NÃO envia o parâmetro search — o contrato de GET /patients não o expõe", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], meta: { page: 0, size: 10, totalElements: 0, totalPages: 0 } }));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.listPatients({ search: "marina" });

    const [url] = fetchFn.mock.calls[0] as [string, unknown];
    expect(url).not.toContain("search");
    expect(url).not.toContain("marina");
  });

  it("faz GET /patients/{id} e mapeia a resposta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_PATIENT));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const patient = await adapter.getPatient(SAMPLE_PATIENT.id);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/patients/${SAMPLE_PATIENT.id}`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(patient.name).toBe("Marina Alves");
  });

  it("faz POST /patients com o payload", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_PATIENT, 201));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const payload = { name: "Marina Alves", monthlyFee: 25000, billingDay: 10 };
    const created = await adapter.createPatient(payload);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/patients",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      }),
    );
    expect(created.id).toBe(SAMPLE_PATIENT.id);
  });

  it("faz PUT /patients/{id} com o payload", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_PATIENT, monthlyFee: 30000 }));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const updated = await adapter.updatePatient(SAMPLE_PATIENT.id, { monthlyFee: 30000 });

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/patients/${SAMPLE_PATIENT.id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ monthlyFee: 30000 }),
      }),
    );
    expect(updated.monthlyFee).toBe(30000);
  });

  it("archivePatient faz PUT com status inativo (não usa DELETE)", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_PATIENT, status: "inativo" }));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const archived = await adapter.archivePatient(SAMPLE_PATIENT.id);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/patients/${SAMPLE_PATIENT.id}`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ status: "inativo" }) }),
    );
    expect(archived.status).toBe("inativo");
  });

  it("unarchivePatient faz PUT com status ativo", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_PATIENT));
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.unarchivePatient(SAMPLE_PATIENT.id);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.psiops.com.br/patients/${SAMPLE_PATIENT.id}`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ status: "ativo" }) }),
    );
  });

  it("propaga erro com o detail do Problem e status quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ type: "about:blank", title: "Não encontrado", status: 404, detail: "Paciente não encontrado." }, 404),
      );
    const adapter = new HttpPatientsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.getPatient("inexistente");
    await expect(rejection).rejects.toThrow("Paciente não encontrado.");
    await expect(rejection.catch((e) => e)).resolves.toSatisfy(isPatientNotFoundError);
  });
});
