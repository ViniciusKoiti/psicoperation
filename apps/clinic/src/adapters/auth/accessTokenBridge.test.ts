import { afterEach, describe, expect, it } from "vitest";

import { getBridgedAccessToken, resetAccessTokenBridge, setBridgedAccessToken } from "./accessTokenBridge";

describe("accessTokenBridge", () => {
  afterEach(() => {
    resetAccessTokenBridge();
  });

  it("começa sem token (sessão anônima)", () => {
    expect(getBridgedAccessToken()).toBeUndefined();
  });

  it("reflete o último token gravado", () => {
    setBridgedAccessToken("token-a");
    expect(getBridgedAccessToken()).toBe("token-a");

    setBridgedAccessToken("token-b");
    expect(getBridgedAccessToken()).toBe("token-b");
  });

  it("resetAccessTokenBridge limpa o token gravado", () => {
    setBridgedAccessToken("token-a");
    resetAccessTokenBridge();
    expect(getBridgedAccessToken()).toBeUndefined();
  });
});
