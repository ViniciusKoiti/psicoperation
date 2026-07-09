import type { LoginRequest, RegisterRequest } from "@psiops/contracts";

/**
 * Validação client-side dos formulários de autenticação. Os tipos dos
 * formulários SÃO os DTOs do contrato (`LoginRequest`/`RegisterRequest` de
 * `@psiops/contracts`, gen/ts) — nenhum tipo é redeclarado; as regras abaixo
 * apenas espelham em runtime as restrições já documentadas nos comentários
 * do contrato (`packages/contracts/openapi/components/auth/schemas.yaml`):
 * e-mail em formato válido, senha com 8–72 caracteres no registro.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contrato: "Mínimo de 8 caracteres; máximo de 72 bytes (limite do BCrypt)".
// Aproximamos o limite de bytes por comprimento de caracteres — a validação
// definitiva de bytes acontece no backend.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export type LoginFormErrors = Partial<Record<keyof LoginRequest, string>>;
export type RegisterFormErrors = Partial<Record<keyof RegisterRequest, string>>;

export function validateLogin(values: LoginRequest): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!values.password) {
    errors.password = "Informe sua senha.";
  }

  return errors;
}

export function validateRegister(values: RegisterRequest): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Informe seu nome completo.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!values.password) {
    errors.password = "Crie uma senha.";
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  }

  return errors;
}

export function hasErrors(errors: LoginFormErrors | RegisterFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
