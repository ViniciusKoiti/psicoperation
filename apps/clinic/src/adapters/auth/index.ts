import { HttpAuthAdapter } from "./HttpAuthAdapter";
import { MockAuthAdapter } from "./MockAuthAdapter";
import { withAccessTokenBridge } from "./withAccessTokenBridge";

export type { AuthAdapter } from "./AuthAdapter";
export { AuthError, isUnauthorizedError } from "./AuthError";
export { HttpAuthAdapter } from "./HttpAuthAdapter";
export { MockAuthAdapter, SEED_USER_CREDENTIALS } from "./MockAuthAdapter";
export { getBridgedAccessToken } from "./accessTokenBridge";
export { withAccessTokenBridge } from "./withAccessTokenBridge";

import type { AuthAdapter } from "./AuthAdapter";

type AuthAdapterKind = "mock" | "http";

function readExplicitKind(): AuthAdapterKind | undefined {
  const raw = import.meta.env.VITE_AUTH_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `AuthAdapter` usar. Único ponto de decisão do app — nenhum
 * outro módulo deve importar `MockAuthAdapter`/`HttpAuthAdapter` diretamente.
 *
 * Regra (ADR 0006 — mocks nunca em produção por padrão):
 * - `VITE_AUTH_ADAPTER=mock` ou `VITE_AUTH_ADAPTER=http` força a escolha,
 *   útil para rodar o app localmente contra o backend real antes da
 *   integração completa (PSI-044) ou para ambientes de demonstração.
 * - Sem variável definida: build de produção (`import.meta.env.PROD`) usa
 *   `HttpAuthAdapter`; qualquer outro modo (dev/test) usa `MockAuthAdapter`.
 *
 * Ou seja, produção só ativa o mock se alguém setar `VITE_AUTH_ADAPTER=mock`
 * explicitamente — nunca por padrão.
 */
export function resolveAuthAdapterKind(): AuthAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return import.meta.env.PROD ? "http" : "mock";
}

function createAuthAdapter(): AuthAdapter {
  // Decisão "achatada" de propósito (não chama `resolveAuthAdapterKind`):
  // só assim o minificador do build de produção (esbuild via Vite)
  // consegue provar, dentro desta única função, que o branch
  // `MockAuthAdapter` é morto quando não há override e
  // `import.meta.env.PROD` é `true`, e removê-lo do bundle. A indireção
  // via função auxiliar IMPEDE essa eliminação — confirmado empiricamente:
  // o bundle de produção continha `MockAuthAdapter` inteiro (classe e
  // credenciais semente) antes desta mudança. Ver a checagem anti-mock
  // (PSI-044, `apps/clinic/e2e/check-no-mock-in-bundle.mjs`).
  // `resolveAuthAdapterKind` continua exportada e testada isoladamente com
  // o MESMO comportamento — só não é mais chamada aqui.
  const explicitRaw = import.meta.env.VITE_AUTH_ADAPTER;
  const explicit = explicitRaw === "mock" || explicitRaw === "http" ? explicitRaw : undefined;
  const kind = explicit ?? (import.meta.env.PROD ? "http" : "mock");
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpAuthAdapter({ baseUrl });
  }
  return new MockAuthAdapter();
}

/**
 * Instância única do adapter de autenticação, consumida por
 * `SessionProvider`. Decorada por `withAccessTokenBridge` (PSI-044): cada
 * login/registro/renovação bem-sucedidos aqui também grava o access token
 * emitido na ponte de `./accessTokenBridge.ts`, que os adapters HTTP de
 * domínio (`src/adapters/patients`, `src/adapters/appointments`, ...) leem
 * para autenticar suas próprias chamadas — ver a doc de
 * `accessTokenBridge.ts` para o porquê dessa indireção.
 */
export const authAdapter: AuthAdapter = withAccessTokenBridge(createAuthAdapter());
