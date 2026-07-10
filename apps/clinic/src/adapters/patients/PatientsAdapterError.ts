/**
 * Erro de acesso a dados de pacientes, levantado pelas implementações de
 * `PatientsAdapter` (mock e HTTP). Modela o suficiente do RFC 9457
 * (`Problem`, ver `@psiops/contracts`) para a camada de features decidir o que
 * fazer sem depender de detalhes de transporte: `status` segue os códigos
 * HTTP documentados no contrato (400/401/404/500) — mesmo padrão de `AuthError`
 * (`src/adapters/auth/AuthError.ts`, PSI-030).
 */
export class PatientsAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PatientsAdapterError";
    this.status = status;
  }
}

/** `true` quando o erro representa "paciente não encontrado" (404). */
export function isPatientNotFoundError(error: unknown): error is PatientsAdapterError {
  return error instanceof PatientsAdapterError && error.status === 404;
}
