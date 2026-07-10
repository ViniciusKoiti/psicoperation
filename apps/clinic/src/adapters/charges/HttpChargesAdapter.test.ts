import { describe, expect, it, vi } from "vitest";

import { ChargesAdapterError } from "./ChargesAdapterError";
import { ChargesAdapterUnsupportedError, HttpChargesAdapter } from "./HttpChargesAdapter";

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

describe("HttpChargesAdapter — leitura (mantida da PSI-034/032)", () => {
  it("faz GET /charges com patientId/page/size na query string", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_CHARGE], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

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
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.listChargesByPatient("patient-1");
    await expect(rejection).rejects.toThrow("Falha ao listar cobranças.");
    await expect(rejection.catch((e) => e)).resolves.toBeInstanceOf(ChargesAdapterError);
  });

  it("listCharges faz GET /charges com page/size na query string, sem patientId", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ items: [SAMPLE_CHARGE], meta: { page: 0, size: 200, totalElements: 1, totalPages: 1 } }),
      );
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const charges = await adapter.listCharges();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges?page=0&size=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(charges).toHaveLength(1);
  });

  it("listCharges inclui status na query string quando informado", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], meta: { page: 0, size: 200, totalElements: 0, totalPages: 0 } }));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.listCharges({ status: "atrasada" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges?page=0&size=200&status=atrasada",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("listCharges inclui competence na query string quando informada", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], meta: { page: 0, size: 200, totalElements: 0, totalPages: 0 } }));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.listCharges({ competence: "2026-07" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges?page=0&size=200&competence=2026-07",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("HttpChargesAdapter — geração do mês (PSI-037)", () => {
  it("emite um POST /charges por rascunho e devolve os criados", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_CHARGE, 201));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const result = await adapter.generateMonthlyCharges([
      { patientId: "patient-1", competence: "2026-07", amount: 20000, dueDate: "2026-07-10" },
    ]);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.created).toHaveLength(1);
    expect(result.skipped).toEqual([]);
  });

  it("um 409 (já existe) marca o rascunho como skipped e segue para o próximo, sem abortar o lote", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ type: "about:blank", title: "Conflito", status: 409 }, 409))
      .mockResolvedValueOnce(jsonResponse({ ...SAMPLE_CHARGE, id: "charge-2", patientId: "patient-2" }, 201));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const drafts = [
      { patientId: "patient-1", competence: "2026-07", amount: 20000, dueDate: "2026-07-10" },
      { patientId: "patient-2", competence: "2026-07", amount: 22000, dueDate: "2026-07-05" },
    ];

    const result = await adapter.generateMonthlyCharges(drafts);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.created.map((c) => c.id)).toEqual(["charge-2"]);
    expect(result.skipped).toEqual([drafts[0]]);
  });

  it("um erro que não seja 409 propaga e interrompe o restante do lote", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ type: "about:blank", title: "Erro", status: 500 }, 500));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const drafts = [
      { patientId: "patient-1", competence: "2026-07", amount: 20000, dueDate: "2026-07-10" },
      { patientId: "patient-2", competence: "2026-07", amount: 22000, dueDate: "2026-07-05" },
    ];

    await expect(adapter.generateMonthlyCharges(drafts)).rejects.toBeInstanceOf(ChargesAdapterError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe("HttpChargesAdapter — marcar como paga / desfazer (PSI-037)", () => {
  it("registra o pagamento via POST /charges/{id}/payment", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ...SAMPLE_CHARGE, status: "em_dia" }));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const result = await adapter.registerChargePayment("charge-1", {
      paidAmount: 20000,
      paidAt: "2026-07-05T12:00:00Z",
      method: "pix",
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/charges/charge-1/payment",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.status).toBe("em_dia");
  });

  it("propaga 409 com o detail/title do Problem devolvido pela API quando presente", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ type: "about:blank", title: "Conflito", status: 409 }, 409));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.registerChargePayment("charge-1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    await expect(rejection).rejects.toThrow("Conflito");
    await expect(rejection.catch((e) => e)).resolves.toMatchObject({ status: 409 });
  });

  it("cai para a mensagem pt-BR de 'já paga' quando o 409 vem sem corpo Problem legível", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("", { status: 409 }));
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const rejection = adapter.registerChargePayment("charge-1", { paidAmount: 20000, paidAt: "2026-07-05T12:00:00Z", method: "pix" });
    await expect(rejection).rejects.toThrow("Esta mensalidade já está paga.");
    await expect(rejection.catch((e) => e)).resolves.toMatchObject({ status: 409 });
  });

  it("undoChargePayment lança ChargesAdapterUnsupportedError sem fazer chamada de rede (sem endpoint no contrato)", async () => {
    const fetchFn = vi.fn();
    const adapter = new HttpChargesAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.undoChargePayment("charge-1")).rejects.toBeInstanceOf(ChargesAdapterUnsupportedError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("HttpChargesAdapter vs MockChargesAdapter", () => {
  it("são implementações distintas selecionáveis pelo mesmo ponto de composição", async () => {
    const { MockChargesAdapter } = await import("./MockChargesAdapter");
    expect(new MockChargesAdapter()).not.toBeInstanceOf(HttpChargesAdapter);
    expect(new HttpChargesAdapter({ baseUrl: "https://x" })).not.toBeInstanceOf(MockChargesAdapter);
  });
});
