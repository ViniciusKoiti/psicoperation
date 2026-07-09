import type { LoginRequest, RegisterRequest, User } from "@psiops/contracts";

import type { AuthAdapter } from "../adapters/auth/AuthAdapter";
import { isUnauthorizedError } from "../adapters/auth/AuthError";

export type SessionStatus = "anonymous" | "authenticated";

export interface SessionSnapshot {
  status: SessionStatus;
  user: User | null;
}

/** Lançado por `withAuth` quando não há sessão válida nem forma de renová-la. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Sessão expirada — faça login novamente.");
    this.name = "SessionExpiredError";
  }
}

const ANONYMOUS_SNAPSHOT: SessionSnapshot = { status: "anonymous", user: null };

/**
 * Gerenciamento de sessão do app clinic, independente de React (facilita
 * testar a lógica de renovação sem precisar renderizar componentes).
 * `SessionContext`/`SessionProvider` expõem isto via um hook (`useSession`).
 *
 * Responsabilidades (acceptance criteria da PSI-030):
 * - Mantém o access token **apenas em memória** (nunca em localStorage,
 *   sessionStorage ou cookies geridos pelo app) — ver campos privados abaixo.
 * - Renovação transparente: `withAuth` renova automaticamente a sessão
 *   quando o access token está prestes a expirar (checagem proativa) ou
 *   quando a operação encapsulada falha com 401 (checagem reativa), e repete
 *   a operação uma vez após a renovação.
 * - Falha na renovação encerra a sessão (`logout`), refletido no snapshot —
 *   quem consome via `SessionContext` (ex.: `AuthGuard`) reage e redireciona.
 * - Serializa renovações concorrentes: múltiplas chamadas de `withAuth` que
 *   disparem 401 ao mesmo tempo compartilham a mesma renovação em andamento
 *   (nunca duas chamadas paralelas a `adapter.refresh`).
 */
export class SessionManager {
  private readonly adapter: AuthAdapter;
  private readonly listeners = new Set<() => void>();

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private user: User | null = null;
  private snapshot: SessionSnapshot = ANONYMOUS_SNAPSHOT;

  private refreshInFlight: Promise<void> | null = null;

  constructor(adapter: AuthAdapter) {
    this.adapter = adapter;
  }

  // --- API para consumo via useSyncExternalStore (SessionContext) ---

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): SessionSnapshot => this.snapshot;

  // --- Ações públicas ---

  async login(payload: LoginRequest): Promise<void> {
    const response = await this.adapter.login(payload);
    this.applyAuthResponse(response.user, response.tokens.accessToken, response.tokens.refreshToken, response.tokens.expiresIn);
  }

  async register(payload: RegisterRequest): Promise<void> {
    const response = await this.adapter.register(payload);
    this.applyAuthResponse(response.user, response.tokens.accessToken, response.tokens.refreshToken, response.tokens.expiresIn);
  }

  /** Encerra a sessão localmente (não há endpoint de logout no contrato). */
  logout(): void {
    this.clearSession();
  }

  /**
   * Executa `operation` com um access token válido, renovando a sessão
   * automaticamente quando necessário (proativa por expiração conhecida,
   * reativa por 401) e repetindo a operação uma única vez após a renovação.
   * Se a renovação falhar, a sessão é encerrada e o erro é propagado.
   */
  async withAuth<T>(operation: (accessToken: string) => Promise<T>): Promise<T> {
    await this.ensureFreshAccessToken();
    if (!this.accessToken) {
      throw new SessionExpiredError();
    }

    try {
      return await operation(this.accessToken);
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error;
      }
      await this.refreshSession();
      if (!this.accessToken) {
        throw new SessionExpiredError();
      }
      return operation(this.accessToken);
    }
  }

  // --- Internos ---

  private applyAuthResponse(user: User, accessToken: string, refreshToken: string, expiresIn: number): void {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.accessTokenExpiresAt = Date.now() + expiresIn * 1000;
    this.setSnapshot({ status: "authenticated", user });
  }

  private clearSession(): void {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.accessTokenExpiresAt = 0;
    this.setSnapshot(ANONYMOUS_SNAPSHOT);
  }

  private setSnapshot(next: SessionSnapshot): void {
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private async ensureFreshAccessToken(): Promise<void> {
    if (!this.accessToken) return; // sem sessão: withAuth lança SessionExpiredError.
    if (Date.now() < this.accessTokenExpiresAt) return; // ainda válido.
    await this.refreshSession();
  }

  /**
   * Serializa a renovação: se já existe uma em andamento, todo mundo aguarda
   * a mesma promise em vez de disparar `adapter.refresh` em paralelo.
   */
  private refreshSession(): Promise<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return Promise.resolve();
    }

    this.refreshInFlight = this.adapter
      .refresh({ refreshToken })
      .then((tokens) => {
        // `user` não muda no refresh — mantém o já conhecido.
        if (!this.user) {
          this.clearSession();
          return;
        }
        this.applyAuthResponse(this.user, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      })
      .catch(() => {
        // Falha no refresh encerra a sessão (acceptance criteria da PSI-030).
        this.clearSession();
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }
}
