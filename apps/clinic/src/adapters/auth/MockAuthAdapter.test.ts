import { describe, expect, it } from "vitest";

import { AuthError } from "./AuthError";
import { MockAuthAdapter, SEED_USER_CREDENTIALS } from "./MockAuthAdapter";

describe("MockAuthAdapter", () => {
  describe("login", () => {
    it("autentica a conta semente com sucesso e emite um par de tokens", async () => {
      const adapter = new MockAuthAdapter();

      const response = await adapter.login(SEED_USER_CREDENTIALS);

      expect(response.user.email).toBe(SEED_USER_CREDENTIALS.email);
      expect(response.tokens.tokenType).toBe("Bearer");
      expect(response.tokens.accessToken).toEqual(expect.any(String));
      expect(response.tokens.refreshToken).toEqual(expect.any(String));
      expect(response.tokens.expiresIn).toBeGreaterThan(0);
    });

    it("rejeita credenciais inválidas com AuthError 401", async () => {
      const adapter = new MockAuthAdapter();

      await expect(
        adapter.login({ email: SEED_USER_CREDENTIALS.email, password: "senha-errada" }),
      ).rejects.toMatchObject({ status: 401 });
      await expect(adapter.login({ email: "quem@nao.existe", password: "qualquer12" })).rejects.toBeInstanceOf(
        AuthError,
      );
    });
  });

  describe("register", () => {
    it("cria a conta e já inicia a sessão", async () => {
      const adapter = new MockAuthAdapter();

      const response = await adapter.register({
        name: "Camila Souza",
        email: "camila@exemplo.com.br",
        password: "outraSenha123",
      });

      expect(response.user.name).toBe("Camila Souza");
      expect(response.user.id).toEqual(expect.any(String));
      expect(response.tokens.accessToken).toEqual(expect.any(String));

      // A conta recém-criada já pode logar.
      const login = await adapter.login({ email: "camila@exemplo.com.br", password: "outraSenha123" });
      expect(login.user.email).toBe("camila@exemplo.com.br");
    });

    it("rejeita e-mail já cadastrado com AuthError 409", async () => {
      const adapter = new MockAuthAdapter();

      await expect(
        adapter.register({ name: "Outra Pessoa", email: SEED_USER_CREDENTIALS.email, password: "senha12345" }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it("rejeita senha curta com AuthError 400", async () => {
      const adapter = new MockAuthAdapter();

      await expect(
        adapter.register({ name: "Nome", email: "nova@exemplo.com.br", password: "curta" }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("refresh", () => {
    it("rotaciona o par de tokens e invalida o refresh token usado (uso único)", async () => {
      const adapter = new MockAuthAdapter();
      const { tokens } = await adapter.login(SEED_USER_CREDENTIALS);

      const renewed = await adapter.refresh({ refreshToken: tokens.refreshToken });

      expect(renewed.accessToken).not.toBe(tokens.accessToken);
      expect(renewed.refreshToken).not.toBe(tokens.refreshToken);

      // O refresh token antigo não pode ser reutilizado.
      await expect(adapter.refresh({ refreshToken: tokens.refreshToken })).rejects.toMatchObject({ status: 401 });
    });

    it("rejeita refresh token desconhecido com AuthError 401", async () => {
      const adapter = new MockAuthAdapter();

      await expect(adapter.refresh({ refreshToken: "token-inexistente" })).rejects.toBeInstanceOf(AuthError);
    });
  });

  describe("getSession", () => {
    it("retorna a sessão para um access token válido", async () => {
      const adapter = new MockAuthAdapter();
      const { tokens, user } = await adapter.login(SEED_USER_CREDENTIALS);

      const session = await adapter.getSession(tokens.accessToken);

      expect(session.user).toEqual(user);
      expect(session.expiresAt).toEqual(expect.any(String));
    });

    it("simula expiração de token via relógio injetável", async () => {
      let now = 0;
      const adapter = new MockAuthAdapter({ clock: () => now, accessTokenTtlMs: 1_000 });
      const { tokens } = await adapter.login(SEED_USER_CREDENTIALS);

      now += 500;
      await expect(adapter.getSession(tokens.accessToken)).resolves.toBeDefined();

      now += 1_000; // ultrapassa o TTL de 1000ms.
      await expect(adapter.getSession(tokens.accessToken)).rejects.toMatchObject({ status: 401 });
    });

    it("rejeita access token desconhecido com AuthError 401", async () => {
      const adapter = new MockAuthAdapter();

      await expect(adapter.getSession("token-que-nunca-existiu")).rejects.toBeInstanceOf(AuthError);
    });
  });
});
