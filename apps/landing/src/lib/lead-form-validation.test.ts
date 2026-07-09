import { describe, expect, it } from "vitest";

import { validateLeadForm } from "./lead-form-validation";

describe("validateLeadForm", () => {
  it("aponta erro em todos os campos vazios", () => {
    const errors = validateLeadForm({ name: "", whatsapp: "", email: "" });

    expect(errors.name).toBeDefined();
    expect(errors.whatsapp).toBeDefined();
    expect(errors.email).toBeDefined();
  });

  it("exige o WhatsApp completo (11 dígitos), não só não-vazio", () => {
    const errors = validateLeadForm({
      name: "Ana Beatriz",
      whatsapp: "(11) 990",
      email: "ana@exemplo.com.br",
    });

    expect(errors.whatsapp).toBeDefined();
    expect(errors.name).toBeUndefined();
    expect(errors.email).toBeUndefined();
  });

  it("rejeita e-mail com formato inválido", () => {
    const errors = validateLeadForm({
      name: "Ana Beatriz",
      whatsapp: "(11) 99000-0000",
      email: "ana@invalido",
    });

    expect(errors.email).toBeDefined();
  });

  it("não retorna erros para valores completos e válidos", () => {
    const errors = validateLeadForm({
      name: "Ana Beatriz",
      whatsapp: "(11) 99000-0000",
      email: "ana@exemplo.com.br",
    });

    expect(errors).toEqual({});
  });
});
