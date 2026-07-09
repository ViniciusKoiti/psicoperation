import type {
  AuthResponse,
  LoginRequest,
  Problem,
  RefreshTokenRequest,
  RegisterRequest,
  SessionResponse,
  TokenPair,
} from "@psiops/contracts";

import type { AuthAdapter } from "./AuthAdapter";
import { AuthError } from "./AuthError";

export interface HttpAuthAdapterOptions {
  /** URL base da API (ex.: `https://api.psiops.com.br`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
}

/**
 * Implementação HTTP de `AuthAdapter`, tipada contra os contratos gerados em
 * `@psiops/contracts` (`gen/ts`), apontando para a API Spring Boot (`/auth/*`).
 *
 * IMPORTANTE: esta tarefa (PSI-030) entrega a implementação e sua tipagem,
 * mas NÃO habilita chamadas reais contra um backend em execução — não há
 * teste de integração aqui, apenas testes unitários com `fetch` substituído
 * por um stub. O exercício ponta a ponta contra a API real acontece na
 * PSI-044. Também não é a seleção padrão em nenhum ambiente hoje (ver
 * `./index.ts`): produção só a usa quando explicitamente selecionada por
 * variável de ambiente, e o mock nunca é o padrão em produção.
 */
export class HttpAuthAdapter implements AuthAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpAuthAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    return this.postJson<AuthResponse>("/auth/login", payload);
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return this.postJson<AuthResponse>("/auth/register", payload);
  }

  async refresh(payload: RefreshTokenRequest): Promise<TokenPair> {
    return this.postJson<TokenPair>("/auth/refresh", payload);
  }

  async getSession(accessToken: string): Promise<SessionResponse> {
    const response = await this.fetchFn(`${this.baseUrl}/auth/session`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return this.parseResponse<SessionResponse>(response);
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new AuthError(
        problem?.detail ?? problem?.title ?? "Não foi possível completar a operação de autenticação.",
        response.status,
        problem?.type,
      );
    }
    return (await response.json()) as T;
  }

  private async tryParseProblem(response: Response): Promise<Problem | undefined> {
    try {
      return (await response.json()) as Problem;
    } catch {
      return undefined;
    }
  }
}
