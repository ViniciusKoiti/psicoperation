/**
 * Máscara e conversão de WhatsApp para o formulário de pacientes. `Patient.whatsapp`
 * (contrato `WhatsAppBR`, `@psiops/contracts`) é opcional e, quando presente, segue
 * o formato canônico E.164: `+55` + DDD (2 dígitos, nenhum começa com `0`) + `9` +
 * 8 dígitos (ex.: `+5511990000000`). A máscara de UI `(XX) XXXXX-XXXX` (CLAUDE.md)
 * é só apresentação — a conversão para/de E.164 acontece nesta camada.
 */

// Mesmo padrão do contrato (`packages/contracts/openapi/components/lead/schemas.yaml`):
// +55, DDD com dois dígitos 1-9, 9 (nono dígito), 8 dígitos finais.
const WHATSAPP_BR_PATTERN = /^\+55[1-9][1-9]9\d{8}$/;

/** Aplica a máscara `(XX) XXXXX-XXXX` progressivamente enquanto a usuária digita. */
export function formatWhatsAppInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length <= 2) return `(${ddd}`;
  if (rest.length <= 5) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

/**
 * Converte o valor mascarado para o formato canônico E.164 (`+55...`).
 * Retorna `undefined` quando o campo está vazio ou não tem os 11 dígitos
 * esperados (DDD + 9 dígitos) — a validação de formato completo fica em
 * `validation.ts` (`isValidWhatsAppE164`).
 */
export function whatsAppInputToE164(masked: string): string | undefined {
  const digits = masked.replace(/\D/g, "");
  if (digits.length === 0) return undefined;
  if (digits.length !== 11) return undefined;
  return `+55${digits}`;
}

/** Converte o valor canônico E.164 (armazenado) para o texto mascarado exibido no formulário. */
export function e164ToWhatsAppInput(e164: string | undefined): string {
  if (!e164) return "";
  const digits = e164.startsWith("+55") ? e164.slice(3) : e164.replace(/\D/g, "");
  return formatWhatsAppInput(digits);
}

/** `true` quando `value` é um WhatsApp brasileiro válido no formato canônico E.164. */
export function isValidWhatsAppE164(value: string): boolean {
  return WHATSAPP_BR_PATTERN.test(value);
}
