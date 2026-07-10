import { describe, expect, it } from "vitest";

import { e164ToWhatsAppInput, formatWhatsAppInput, isValidWhatsAppE164, whatsAppInputToE164 } from "./whatsapp";

describe("whatsapp", () => {
  describe("formatWhatsAppInput", () => {
    it("aplica a máscara progressivamente", () => {
      expect(formatWhatsAppInput("")).toBe("");
      expect(formatWhatsAppInput("1")).toBe("(1");
      expect(formatWhatsAppInput("11")).toBe("(11");
      expect(formatWhatsAppInput("119")).toBe("(11) 9");
      expect(formatWhatsAppInput("11998765")).toBe("(11) 99876-5");
      expect(formatWhatsAppInput("11998765432")).toBe("(11) 99876-5432");
    });

    it("ignora caracteres não numéricos e limita a 11 dígitos", () => {
      expect(formatWhatsAppInput("(11) 99876-5432extra")).toBe("(11) 99876-5432");
    });
  });

  describe("whatsAppInputToE164", () => {
    it("converte o valor mascarado completo para E.164", () => {
      expect(whatsAppInputToE164("(11) 99876-5432")).toBe("+5511998765432");
    });

    it("retorna undefined para campo vazio ou incompleto", () => {
      expect(whatsAppInputToE164("")).toBeUndefined();
      expect(whatsAppInputToE164("(11) 998")).toBeUndefined();
    });
  });

  describe("e164ToWhatsAppInput", () => {
    it("converte E.164 de volta para o valor mascarado", () => {
      expect(e164ToWhatsAppInput("+5511998765432")).toBe("(11) 99876-5432");
    });

    it("retorna string vazia quando não há valor", () => {
      expect(e164ToWhatsAppInput(undefined)).toBe("");
    });
  });

  describe("isValidWhatsAppE164", () => {
    it("aceita o formato canônico brasileiro", () => {
      expect(isValidWhatsAppE164("+5511998765432")).toBe(true);
    });

    it("rejeita formatos inválidos", () => {
      expect(isValidWhatsAppE164("+5511998765432extra")).toBe(false);
      expect(isValidWhatsAppE164("11998765432")).toBe(false);
      expect(isValidWhatsAppE164("+5510987654321")).toBe(false); // DDD com segundo dígito 0
      expect(isValidWhatsAppE164("")).toBe(false);
    });
  });
});
