import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  SessionResponse,
  TokenPair,
} from "@psiops/contracts";

/**
 * Interface de acesso à autenticação (ADR 0006 — frontends desacoplados por
 * adapters). Tipada exclusivamente pelos tipos gerados de `@psiops/contracts`
 * (`gen/ts`), espelhando 1:1 os quatro endpoints de `/auth/*`; nenhum DTO é
 * redefinido aqui.
 *
 * Implementações:
 * - `MockAuthAdapter` — estado em memória, determinístico, padrão em
 *   desenvolvimento e testes (usuário semente, simulação de expiração).
 * - `HttpAuthAdapter` — tipada contra os contratos, aponta para a API Spring
 *   Boot, mas sem chamadas reais habilitadas nesta tarefa (integração
 *   completa fica para a PSI-044).
 *
 * O ponto de composição único (seleção mock/http por variável de ambiente)
 * fica em `./index.ts`.
 */
export interface AuthAdapter {
  /** `POST /auth/login` — credenciais inválidas rejeita com `AuthError` (status 401). */
  login(payload: LoginRequest): Promise<AuthResponse>;

  /** `POST /auth/register` — e-mail já cadastrado rejeita com `AuthError` (status 409). */
  register(payload: RegisterRequest): Promise<AuthResponse>;

  /**
   * `POST /auth/refresh` — troca um refresh token válido por um novo par
   * (rotação de uso único). Refresh token inválido/expirado/já usado rejeita
   * com `AuthError` (status 401).
   */
  refresh(payload: RefreshTokenRequest): Promise<TokenPair>;

  /**
   * `GET /auth/session` — retorna a sessão corrente para o access token
   * apresentado. Token ausente/expirado/revogado rejeita com `AuthError`
   * (status 401). É a operação usada para exercitar o refresh transparente
   * (ver `SessionManager.withAuth`).
   */
  getSession(accessToken: string): Promise<SessionResponse>;
}
