/**
 * Expressões regulares dos formatos usados pelos contratos do PsiOps.
 * Fonte dos formatos: packages/contracts/openapi/openapi.yaml.
 */
export const patterns = {
  /** UUID v4 (RFC 4122), minúsculo — formato dos ids gerados. */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,

  /** E-mail simples (validação estrutural, não RFC completa). */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /**
   * WhatsApp brasileiro em E.164 (schema WhatsAppBR):
   * `+55` + DDD de 2 dígitos sem zero + `9` + 8 dígitos.
   */
  whatsAppBR: /^\+55[1-9][1-9]9\d{8}$/,

  /** Data civil ISO 8601 `YYYY-MM-DD` (schema IsoDate). */
  isoDate: /^\d{4}-\d{2}-\d{2}$/,

  /** Instante ISO 8601 em UTC com sufixo `Z` (schema IsoDateTime). */
  isoDateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/,
} as const;
