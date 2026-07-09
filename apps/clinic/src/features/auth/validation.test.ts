import { describe, expect, it } from "vitest";

import { hasErrors, validateLogin, validateRegister } from "./validation";

describe("validateLogin", () => {
  it("aceita e-mail e senha válidos", () => {
    const errors = validateLogin({ email: "ana@exemplo.com.br", password: "qualquer" });
    expect(hasErrors(errors)).toBe(false);
  });

  it("acusa e-mail vazio ou em formato inválido", () => {
    expect(validateLogin({ email: "", password: "x" }).email).toBeDefined();
    expect(validateLogin({ email: "nao-e-email", password: "x" }).email).toBeDefined();
  });

  it("acusa senha vazia", () => {
    expect(validateLogin({ email: "ana@exemplo.com.br", password: "" }).password).toBeDefined();
  });
});

describe("validateRegister", () => {
  const valid = { name: "Ana Beatriz Souza", email: "ana@exemplo.com.br", password: "SenhaForte123" };

  it("aceita um payload válido", () => {
    expect(hasErrors(validateRegister(valid))).toBe(false);
  });

  it("acusa nome vazio", () => {
    expect(validateRegister({ ...valid, name: "  " }).name).toBeDefined();
  });

  it("acusa e-mail inválido", () => {
    expect(validateRegister({ ...valid, email: "invalido" }).email).toBeDefined();
  });

  it("acusa senha com menos de 8 caracteres", () => {
    expect(validateRegister({ ...valid, password: "curta" }).password).toBeDefined();
  });

  it("acusa senha com mais de 72 caracteres", () => {
    expect(validateRegister({ ...valid, password: "a".repeat(73) }).password).toBeDefined();
  });
});
