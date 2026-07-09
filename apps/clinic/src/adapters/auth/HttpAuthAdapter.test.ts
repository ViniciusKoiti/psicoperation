import { describe, expect, it, vi } from "vitest";

import { AuthError } from "./AuthError";
import { HttpAuthAdapter } from "./HttpAuthAdapter";

/**
 * Testes unitários com `fetch` substituído por um stub — NÃO é um teste de
 * integração contra um backend real (ver aviso em `HttpAuthAdapter.ts`).
 * O objetivo aqui é só garantir que a tipagem e o mapeamento
 * request/response estão corretos; o exercício ponta a ponta acontece na
 * PSI-044.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpAuthAdapter", () => {
  it("faz POST /auth/login com o payload e mapeia a resposta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        user: { id: "1", name: "Ana", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" },
        tokens: { tokenType: "Bearer", accessToken: "a", refreshToken: "r", expiresIn: 900 },
      }),
    );
    const adapter = new HttpAuthAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const response = await adapter.login({ email: "ana@exemplo.com.br", password: "SenhaForte123" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ana@exemplo.com.br", password: "SenhaForte123" }),
      }),
    );
    expect(response.user.email).toBe("ana@exemplo.com.br");
  });

  it("propaga erro 401 como AuthError com o detail do Problem", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ type: "about:blank", title: "Não autorizado", status: 401, detail: "Credenciais inválidas." }, 401));
    const adapter = new HttpAuthAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.login({ email: "x@x.com", password: "errada12" })).rejects.toMatchObject({
      status: 401,
      message: "Credenciais inválidas.",
    });
  });

  it("envia o bearer token em GET /auth/session", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        user: { id: "1", name: "Ana", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" },
        expiresAt: "2026-01-01T01:00:00Z",
      }),
    );
    const adapter = new HttpAuthAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await adapter.getSession("meu-access-token");

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/auth/session",
      expect.objectContaining({ headers: { Authorization: "Bearer meu-access-token" } }),
    );
  });

  it("normaliza a barra final da baseUrl", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ tokenType: "Bearer", accessToken: "a", refreshToken: "r", expiresIn: 900 }),
    );
    const adapter = new HttpAuthAdapter({ baseUrl: "https://api.psiops.com.br/", fetchFn });

    await adapter.refresh({ refreshToken: "algum" });

    expect(fetchFn).toHaveBeenCalledWith("https://api.psiops.com.br/auth/refresh", expect.anything());
  });

  it("lança AuthError mesmo quando o corpo do erro não é JSON válido", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("erro interno", { status: 500 }));
    const adapter = new HttpAuthAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.register({ name: "N", email: "n@n.com", password: "12345678" })).rejects.toBeInstanceOf(
      AuthError,
    );
  });
});
