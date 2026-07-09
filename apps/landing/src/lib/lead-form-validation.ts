import { isCompleteWhatsapp } from "./whatsapp-mask";

export interface LeadFormValues {
  name: string;
  /** Valor mascarado do campo (apresentação) — ver `whatsapp-mask.ts`. */
  whatsapp: string;
  email: string;
}

export type LeadFormField = keyof LeadFormValues;

export type LeadFormErrors = Partial<Record<LeadFormField, string>>;

/**
 * Mesmo padrão de e-mail usado pelo protótipo (`project/PsiOps Landing.html`,
 * validação do `#leadForm`): simples e sem lib externa, coerente com o
 * `format: email` do schema `LeadCreateRequest` (packages/contracts), que
 * não gera regras de UX — só o tipo.
 */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Validação local de obrigatoriedade e formato dos 3 campos do formulário
 * de lista de espera (spec §1.7, acceptance criteria da PSI-018). Além da
 * obrigatoriedade (paridade com o protótipo), exige o WhatsApp completo
 * (11 dígitos via a máscara) — o protótipo original só checava
 * "não vazio", mas o manifesto pede essa validação adicional para não
 * enviar um valor que o schema `WhatsAppBR` rejeitaria na PSI-044.
 */
export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Informe seu nome completo.";
  }

  if (!values.whatsapp.trim()) {
    errors.whatsapp = "Informe seu WhatsApp.";
  } else if (!isCompleteWhatsapp(values.whatsapp)) {
    errors.whatsapp = "Informe um WhatsApp completo, com DDD.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  return errors;
}
