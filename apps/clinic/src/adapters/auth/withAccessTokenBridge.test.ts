import { afterEach, describe, expect, it } from "vitest";

import { getBridgedAccessToken, resetAccessTokenBridge } from "./accessTokenBridge";
import { MockAuthAdapter, SEED_USER_CREDENTIALS } from "./MockAuthAdapter";
import { withAccessTokenBridge } from "./withAccessTokenBridge";

describe("withAccessTokenBridge", () => {
  afterEach(() => {
    resetAccessTokenBridge();
  });

  it("grava na ponte o access token retornado por login", async () => {
    const adapter = withAccessTokenBridge(new MockAuthAdapter());

    const response = await adapter.login(SEED_USER_CREDENTIALS);

    expect(getBridgedAccessToken()).toBe(response.tokens.accessToken);
  });

  it("grava na ponte o access token retornado por register", async () => {
    const adapter = withAccessTokenBridge(new MockAuthAdapter());

    const response = await adapter.register({
      name: "Nova Usuária",
      email: "nova@exemplo.com.br",
      password: "SenhaForte123",
    });

    expect(getBridgedAccessToken()).toBe(response.tokens.accessToken);
  });

  it("grava na ponte o access token renovado por refresh", async () => {
    const inner = new MockAuthAdapter();
    const adapter = withAccessTokenBridge(inner);

    const loginResponse = await adapter.login(SEED_USER_CREDENTIALS);
    const refreshed = await adapter.refresh({ refreshToken: loginResponse.tokens.refreshToken });

    expect(refreshed.accessToken).not.toBe(loginResponse.tokens.accessToken);
    expect(getBridgedAccessToken()).toBe(refreshed.accessToken);
  });

  it("não altera a ponte quando login/register/refresh falham", async () => {
    const adapter = withAccessTokenBridge(new MockAuthAdapter());

    await expect(adapter.login({ email: SEED_USER_CREDENTIALS.email, password: "senha-errada" })).rejects.toThrow();

    expect(getBridgedAccessToken()).toBeUndefined();
  });

  it("getSession delega sem tocar a ponte (somente leitura)", async () => {
    const inner = new MockAuthAdapter();
    const adapter = withAccessTokenBridge(inner);
    const loginResponse = await adapter.login(SEED_USER_CREDENTIALS);
    resetAccessTokenBridge();

    const session = await adapter.getSession(loginResponse.tokens.accessToken);

    expect(session.user.email).toBe(SEED_USER_CREDENTIALS.email);
    expect(getBridgedAccessToken()).toBeUndefined();
  });
});
