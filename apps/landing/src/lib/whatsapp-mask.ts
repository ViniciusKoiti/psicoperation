/**
 * Máscara do campo WhatsApp do formulário de lista de espera (spec
 * §1.7, `#lista`): `(XX) XXXXX-XXXX`. Reproduz o comportamento do
 * protótipo (`project/PsiOps Landing.html`, listener `whats.addEventListener
 * ('input', ...)`), reconstruindo a máscara a partir dos dígitos a cada
 * evento de input — não tenta preservar a posição do cursor de forma
 * explícita (o protótipo também não faz isso); ao digitar/apagar no final
 * do campo (o caso comum) o cursor permanece no fim de forma imperceptível.
 *
 * O valor mascarado é só apresentação. O formato canônico de
 * armazenamento/integração é E.164 (schema `WhatsAppBR` de
 * packages/contracts): `+55` + DDD (2 dígitos) + `9` + 8 dígitos.
 */

/** DDD (2) + 9 + 8 dígitos = 11 dígitos no total, sem o `+55`. */
const MAX_DIGITS = 11;

/** Remove tudo que não for dígito e trunca em 11 (lida com colagem de texto formatado/excedente). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_DIGITS);
}

/**
 * Formata dígitos brutos como `(XX) XXXXX-XXXX`, incrementalmente —
 * funciona tanto para digitação parcial quanto para colagem do número
 * completo (ou com máscara já aplicada, já que `digitsOnly` a remove antes).
 */
export function maskWhatsApp(value: string): string {
  const digits = digitsOnly(value);
  let out = digits;

  if (digits.length > 0) out = "(" + digits.slice(0, 2);
  if (digits.length >= 2) out += ") " + digits.slice(2, 7);
  if (digits.length >= 7) out += "-" + digits.slice(7, 11);

  return out;
}

/** `true` quando o valor (mascarado ou não) tem os 11 dígitos esperados. */
export function isCompleteWhatsapp(value: string): boolean {
  return digitsOnly(value).length === MAX_DIGITS;
}

/**
 * Normaliza um WhatsApp completo (mascarado ou não) para E.164, formato
 * canônico do schema `WhatsAppBR` (packages/contracts): `+55` + 11 dígitos.
 * Chame apenas quando `isCompleteWhatsapp(value)` for `true`.
 */
export function toE164(value: string): string {
  return `+55${digitsOnly(value)}`;
}
