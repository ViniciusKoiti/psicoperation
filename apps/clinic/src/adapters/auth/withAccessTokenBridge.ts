import type { AuthAdapter } from "./AuthAdapter";
import { setBridgedAccessToken } from "./accessTokenBridge";

/**
 * Decora um `AuthAdapter` para espelhar o access token de cada login,
 * registro ou renovação bem-sucedidos na ponte em memória de
 * `./accessTokenBridge.ts` — ver a doc lá para o problema que isso resolve.
 * Funciona com qualquer implementação (`MockAuthAdapter` ou
 * `HttpAuthAdapter`): a ponte não sabe, nem precisa saber, qual delas está
 * por trás — só reflete o token que a sessão real está usando.
 *
 * `getSession` é somente-leitura (não emite um token novo) — passa direto,
 * sem decoração.
 */
export function withAccessTokenBridge(adapter: AuthAdapter): AuthAdapter {
  return {
    async login(payload) {
      const response = await adapter.login(payload);
      setBridgedAccessToken(response.tokens.accessToken);
      return response;
    },
    async register(payload) {
      const response = await adapter.register(payload);
      setBridgedAccessToken(response.tokens.accessToken);
      return response;
    },
    async refresh(payload) {
      const tokens = await adapter.refresh(payload);
      setBridgedAccessToken(tokens.accessToken);
      return tokens;
    },
    getSession(accessToken) {
      return adapter.getSession(accessToken);
    },
  };
}
