import { describe, expect, it } from "vitest";

import { digitsOnly, isCompleteWhatsapp, maskWhatsApp, toE164 } from "./whatsapp-mask";

describe("maskWhatsApp", () => {
  it("formata dígitos progressivamente conforme a digitação avança", () => {
    expect(maskWhatsApp("1")).toBe("(1");
    expect(maskWhatsApp("11")).toBe("(11) ");
    expect(maskWhatsApp("1199")).toBe("(11) 99");
    expect(maskWhatsApp("119900")).toBe("(11) 9900");
    expect(maskWhatsApp("1199000")).toBe("(11) 99000-");
    expect(maskWhatsApp("11990000000")).toBe("(11) 99000-0000");
  });

  it("ignora caracteres não numéricos (o input já pode conter a máscara anterior)", () => {
    expect(maskWhatsApp("(11) 99000-0000")).toBe("(11) 99000-0000");
  });

  it("trunca em 11 dígitos ao colar um valor mais longo", () => {
    expect(maskWhatsApp("11990000000999")).toBe("(11) 99000-0000");
  });

  it("volta ao vazio quando o campo é apagado", () => {
    expect(maskWhatsApp("")).toBe("");
  });
});

describe("digitsOnly", () => {
  it("extrai só os dígitos, truncando em 11", () => {
    expect(digitsOnly("(11) 99000-0000")).toBe("11990000000");
    expect(digitsOnly("abc123")).toBe("123");
  });
});

describe("isCompleteWhatsapp", () => {
  it("é falso para valores parciais e verdadeiro com os 11 dígitos", () => {
    expect(isCompleteWhatsapp("(11) 9900")).toBe(false);
    expect(isCompleteWhatsapp("(11) 99000-0000")).toBe(true);
  });
});

describe("toE164", () => {
  it("normaliza o valor mascarado para +55 + 11 dígitos (schema WhatsAppBR)", () => {
    expect(toE164("(11) 99000-0000")).toBe("+5511990000000");
  });
});
