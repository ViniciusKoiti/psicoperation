/**
 * Erro de autenticação/sessão levantado pelas implementações de `AuthAdapter`.
 *
 * Modela o suficiente do RFC 9457 (`Problem`, ver `@psiops/contracts`) para a
 * camada de sessão decidir o que fazer sem depender de detalhes de transporte:
 * `status` segue os códigos HTTP documentados no contrato (400/401/409/500).
 */
export class AuthError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

/**
 * `true` quando o erro representa "não autenticado" (401): credenciais
 * inválidas, token ausente, expirado ou revogado — os únicos casos em que a
 * camada de sessão tenta uma renovação automática (ver `SessionManager.withAuth`).
 */
export function isUnauthorizedError(error: unknown): error is AuthError {
  return error instanceof AuthError && error.status === 401;
}
