import { describe, expect, it, vi } from "vitest";

import { HttpLeadAdapter, LeadAdapterError } from "./HttpLeadAdapter";

const PAYLOAD = { name: "Ana Beatriz Souza", whatsapp: "+5511990000000", email: "ana@exemplo.com.br" };

describe("HttpLeadAdapter", () => {
  it("faz POST {baseUrl}/leads com o payload e devolve o Lead criado", async () => {
    const lead = { id: "0b8f4a2d-6c1e-4d3b-8a5f-9e7c6d5b4a3f", ...PAYLOAD, createdAt: "2026-07-10T12:00:00Z" };
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify(lead), { status: 201, headers: { "Content-Type": "application/json" } }),
    );
    const adapter = new HttpLeadAdapter({ baseUrl: "http://localhost:8080/", fetchFn });

    const result = await adapter.submit(PAYLOAD);

    expect(result).toEqual(lead);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://localhost:8080/leads",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(PAYLOAD),
      }),
    );
  });

  it("remove a barra final de baseUrl antes de montar a URL", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "x", ...PAYLOAD, createdAt: "2026-07-10T12:00:00Z" }), { status: 201 }),
    );
    const adapter = new HttpLeadAdapter({ baseUrl: "http://localhost:8080///", fetchFn });

    await adapter.submit(PAYLOAD);

    expect(fetchFn).toHaveBeenCalledWith("http://localhost:8080/leads", expect.anything());
  });

  it("lança LeadAdapterError com o detail do Problem em respostas de erro", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ title: "Conflito", detail: "E-mail já cadastrado na lista." }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const adapter = new HttpLeadAdapter({ baseUrl: "http://localhost:8080", fetchFn });

    const error = await adapter.submit(PAYLOAD).catch((e) => e);

    expect(error).toBeInstanceOf(LeadAdapterError);
    expect(error.message).toBe("E-mail já cadastrado na lista.");
    expect(error.status).toBe(409);
  });

  it("cai num fallback genérico quando a resposta de erro não tem corpo Problem", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 500 }));
    const adapter = new HttpLeadAdapter({ baseUrl: "http://localhost:8080", fetchFn });

    const error = await adapter.submit(PAYLOAD).catch((e) => e);

    expect(error).toBeInstanceOf(LeadAdapterError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("Não foi possível entrar na lista de espera agora.");
  });
});
