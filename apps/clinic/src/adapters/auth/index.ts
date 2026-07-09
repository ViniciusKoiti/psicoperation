import { HttpAuthAdapter } from "./HttpAuthAdapter";
import { MockAuthAdapter } from "./MockAuthAdapter";

export type { AuthAdapter } from "./AuthAdapter";
export { AuthError, isUnauthorizedError } from "./AuthError";
export { HttpAuthAdapter } from "./HttpAuthAdapter";
export { MockAuthAdapter, SEED_USER_CREDENTIALS } from "./MockAuthAdapter";

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
  const kind = resolveAuthAdapterKind();
  if (kind === "http") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    return new HttpAuthAdapter({ baseUrl });
  }
  return new MockAuthAdapter();
}

/** Instância única do adapter de autenticação, consumida por `SessionProvider`. */
export const authAdapter: AuthAdapter = createAuthAdapter();
