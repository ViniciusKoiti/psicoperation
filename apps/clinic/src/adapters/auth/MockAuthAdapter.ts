import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  SessionResponse,
  TokenPair,
  User,
} from "@psiops/contracts";

import type { AuthAdapter } from "./AuthAdapter";
import { AuthError } from "./AuthError";

/**
 * Credenciais da conta semente disponível em `MockAuthAdapter` (dev/test).
 * Documentado aqui (em vez de só no código) para facilitar login manual
 * durante o desenvolvimento local.
 */
export const SEED_USER_CREDENTIALS = {
  email: "ana@exemplo.com.br",
  password: "SenhaForte123",
} as const;

const SEED_USER: User = {
  id: "6f1d2c4a-8b3e-4f5a-9c7d-1e2f3a4b5c6d",
  name: "Ana Beatriz Souza",
  email: SEED_USER_CREDENTIALS.email,
  createdAt: "2026-01-01T00:00:00Z",
};

const DEFAULT_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 900s, mesmo exemplo do contrato (expiresIn).

interface AccountRecord {
  user: User;
  /**
   * Mock-only: senha em texto claro só para permitir validação de login em
   * memória. O backend real usa BCrypt (ver descrição de `RegisterRequest`
   * no contrato) — nada aqui reflete hashing real nem deve ir para produção.
   */
  passwordPlain: string;
}

interface AccessTokenRecord {
  userId: string;
  expiresAt: number;
}

export interface MockAuthAdapterOptions {
  /** Contas adicionais pré-cadastradas, além da conta semente. */
  seedAccounts?: readonly { user: User; password: string }[];
  /** TTL do access token emitido, em ms. Padrão: 15 minutos. */
  accessTokenTtlMs?: number;
  /**
   * Relógio injetável — permite simular expiração de token de forma
   * determinística nos testes, sem depender de timers reais.
   */
  clock?: () => number;
}

/**
 * Implementação em memória de `AuthAdapter` (ADR 0006): sem rede, sem banco,
 * estado isolado por instância. Padrão em desenvolvimento e testes — NUNCA
 * deve ser a seleção padrão em build de produção (ver `./index.ts`).
 *
 * Comportamento modelado a partir do contrato:
 * - `login`/`register` emitem um par de tokens (`TokenPair`) com `expiresIn`
 *   em segundos; `register` também inicia a sessão (conforme a descrição do
 *   endpoint no contrato).
 * - `refresh` rotaciona o refresh token: o token apresentado é invalidado
 *   (uso único) e um novo par é emitido.
 * - `getSession` reflete a expiração do access token — usado pela camada de
 *   sessão (`SessionManager`) para exercitar o refresh transparente.
 */
export class MockAuthAdapter implements AuthAdapter {
  private readonly accountsByEmail = new Map<string, AccountRecord>();
  private readonly accountsById = new Map<string, AccountRecord>();
  private readonly accessTokens = new Map<string, AccessTokenRecord>();
  /** userId do dono de cada refresh token válido; removido no uso (rotação). */
  private readonly refreshTokens = new Map<string, string>();
  private readonly accessTokenTtlMs: number;
  private readonly clock: () => number;

  constructor(options: MockAuthAdapterOptions = {}) {
    this.accessTokenTtlMs = options.accessTokenTtlMs ?? DEFAULT_ACCESS_TOKEN_TTL_MS;
    this.clock = options.clock ?? (() => Date.now());

    this.seedAccount(SEED_USER, SEED_USER_CREDENTIALS.password);
    for (const seed of options.seedAccounts ?? []) {
      this.seedAccount(seed.user, seed.password);
    }
  }

  private seedAccount(user: User, password: string): void {
    const record: AccountRecord = { user, passwordPlain: password };
    this.accountsByEmail.set(normalizeEmail(user.email), record);
    this.accountsById.set(user.id, record);
  }

  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    const account = this.accountsByEmail.get(normalizeEmail(email));
    if (!account || account.passwordPlain !== password) {
      throw new AuthError("E-mail ou senha inválidos.", 401, "invalid_credentials");
    }
    return this.issueAuthResponse(account.user);
  }

  async register({ name, email, password }: RegisterRequest): Promise<AuthResponse> {
    const key = normalizeEmail(email);
    if (this.accountsByEmail.has(key)) {
      throw new AuthError("E-mail já cadastrado.", 409, "email_taken");
    }
    if (password.length < 8) {
      // Mesma regra descrita no contrato para `RegisterRequest.password`.
      throw new AuthError("A senha deve ter ao menos 8 caracteres.", 400, "invalid_password");
    }

    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date(this.clock()).toISOString(),
    };
    this.seedAccount(user, password);

    // `/auth/register` já inicia a sessão (ver descrição do endpoint no contrato).
    return this.issueAuthResponse(user);
  }

  async refresh({ refreshToken }: RefreshTokenRequest): Promise<TokenPair> {
    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      throw new AuthError("Refresh token inválido, expirado ou já utilizado.", 401, "invalid_refresh_token");
    }
    // Rotação de uso único: o token apresentado é invalidado imediatamente.
    this.refreshTokens.delete(refreshToken);

    const account = this.accountsById.get(userId);
    if (!account) {
      throw new AuthError("Refresh token inválido, expirado ou já utilizado.", 401, "invalid_refresh_token");
    }
    return this.issueTokenPair(account.user);
  }

  async getSession(accessToken: string): Promise<SessionResponse> {
    const record = this.accessTokens.get(accessToken);
    if (!record || record.expiresAt <= this.clock()) {
      throw new AuthError("Token ausente, expirado ou revogado.", 401, "token_expired");
    }
    const account = this.accountsById.get(record.userId);
    if (!account) {
      throw new AuthError("Token ausente, expirado ou revogado.", 401, "token_expired");
    }
    return { user: account.user, expiresAt: new Date(record.expiresAt).toISOString() };
  }

  private issueAuthResponse(user: User): AuthResponse {
    return { user, tokens: this.issueTokenPair(user) };
  }

  private issueTokenPair(user: User): TokenPair {
    const accessToken = `mock-access-${crypto.randomUUID()}`;
    const refreshToken = `mock-refresh-${crypto.randomUUID()}`;
    const expiresAt = this.clock() + this.accessTokenTtlMs;

    this.accessTokens.set(accessToken, { userId: user.id, expiresAt });
    this.refreshTokens.set(refreshToken, user.id);

    return {
      tokenType: "Bearer",
      accessToken,
      expiresIn: Math.floor(this.accessTokenTtlMs / 1000),
      refreshToken,
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
