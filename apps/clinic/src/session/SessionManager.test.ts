import { describe, expect, it, vi } from "vitest";

import type { AuthAdapter } from "../adapters/auth/AuthAdapter";
import { AuthError } from "../adapters/auth/AuthError";
import { MockAuthAdapter, SEED_USER_CREDENTIALS } from "../adapters/auth/MockAuthAdapter";
import { SessionExpiredError, SessionManager } from "./SessionManager";

describe("SessionManager", () => {
  describe("login", () => {
    it("autentica com sucesso e atualiza o snapshot para authenticated", async () => {
      const manager = new SessionManager(new MockAuthAdapter());

      expect(manager.getSnapshot().status).toBe("anonymous");

      await manager.login(SEED_USER_CREDENTIALS);

      const snapshot = manager.getSnapshot();
      expect(snapshot.status).toBe("authenticated");
      expect(snapshot.user?.email).toBe(SEED_USER_CREDENTIALS.email);
    });

    it("credenciais inválidas propagam o AuthError e mantêm a sessão anônima", async () => {
      const manager = new SessionManager(new MockAuthAdapter());

      await expect(
        manager.login({ email: SEED_USER_CREDENTIALS.email, password: "senha-errada" }),
      ).rejects.toBeInstanceOf(AuthError);

      expect(manager.getSnapshot().status).toBe("anonymous");
      expect(manager.getSnapshot().user).toBeNull();
    });
  });

  describe("register", () => {
    it("cria a conta e já autentica a sessão", async () => {
      const manager = new SessionManager(new MockAuthAdapter());

      await manager.register({ name: "Camila Souza", email: "camila@exemplo.com.br", password: "senhaBoa123" });

      const snapshot = manager.getSnapshot();
      expect(snapshot.status).toBe("authenticated");
      expect(snapshot.user?.name).toBe("Camila Souza");
    });
  });

  describe("logout", () => {
    it("encerra a sessão e volta o snapshot para anonymous", async () => {
      const manager = new SessionManager(new MockAuthAdapter());
      await manager.login(SEED_USER_CREDENTIALS);
      expect(manager.getSnapshot().status).toBe("authenticated");

      manager.logout();

      expect(manager.getSnapshot()).toEqual({ status: "anonymous", user: null });
    });
  });

  describe("withAuth — refresh transparente", () => {
    it("renova a sessão automaticamente quando o access token expira e repete a operação", async () => {
      let now = 0;
      const adapter = new MockAuthAdapter({ clock: () => now, accessTokenTtlMs: 1_000 });
      const manager = new SessionManager(adapter);
      await manager.login(SEED_USER_CREDENTIALS);

      now += 2_000; // access token expirado; refresh token continua válido.

      const result = await manager.withAuth((accessToken) => adapter.getSession(accessToken));

      expect(result.user.email).toBe(SEED_USER_CREDENTIALS.email);
      expect(manager.getSnapshot().status).toBe("authenticated");
    });

    it("serializa renovações concorrentes: múltiplas chamadas simultâneas disparam só um refresh", async () => {
      let now = 0;
      const adapter = new MockAuthAdapter({ clock: () => now, accessTokenTtlMs: 1_000 });
      const refreshSpy = vi.spyOn(adapter, "refresh");
      const manager = new SessionManager(adapter);
      await manager.login(SEED_USER_CREDENTIALS);

      now += 2_000; // expira o access token para as três chamadas concorrentes.

      const [a, b, c] = await Promise.all([
        manager.withAuth((accessToken) => adapter.getSession(accessToken)),
        manager.withAuth((accessToken) => adapter.getSession(accessToken)),
        manager.withAuth((accessToken) => adapter.getSession(accessToken)),
      ]);

      expect(a.user.email).toBe(SEED_USER_CREDENTIALS.email);
      expect(b.user.email).toBe(SEED_USER_CREDENTIALS.email);
      expect(c.user.email).toBe(SEED_USER_CREDENTIALS.email);
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    it("quando a renovação falha, encerra a sessão e propaga SessionExpiredError", async () => {
      const inner = new MockAuthAdapter();
      // Decorator que delega tudo ao mock real, exceto refresh (força a
      // falha determinística de "refresh token inválido/revogado" sem
      // depender de mexer no relógio). login/register/getSession continuam
      // exercitando o MockAuthAdapter de verdade.
      const adapter: AuthAdapter = {
        login: (payload) => inner.login(payload),
        register: (payload) => inner.register(payload),
        getSession: (token) => inner.getSession(token),
        refresh: () => Promise.reject(new AuthError("Refresh token inválido, expirado ou já utilizado.", 401)),
      };
      const manager = new SessionManager(adapter);
      await manager.login(SEED_USER_CREDENTIALS);

      // Força o caminho reativo: getSession falha com 401 (token
      // desconhecido do adapter real), o que dispara a tentativa de refresh
      // — que por sua vez falha (adapter acima) e deve encerrar a sessão.
      await expect(manager.withAuth(() => inner.getSession("token-forjado-invalido"))).rejects.toBeInstanceOf(
        SessionExpiredError,
      );

      expect(manager.getSnapshot()).toEqual({ status: "anonymous", user: null });
    });

    it("sem sessão nenhuma, lança SessionExpiredError sem chamar a operação", async () => {
      const manager = new SessionManager(new MockAuthAdapter());
      const operation = vi.fn();

      await expect(manager.withAuth(operation)).rejects.toBeInstanceOf(SessionExpiredError);
      expect(operation).not.toHaveBeenCalled();
    });
  });
});
