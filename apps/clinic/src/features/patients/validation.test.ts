import { describe, expect, it } from "vitest";

import { EMPTY_PATIENT_FORM_VALUES, hasErrors, type PatientFormValues, toPatientPayload, validatePatientForm } from "./validation";

function values(overrides: Partial<PatientFormValues> = {}): PatientFormValues {
  return {
    ...EMPTY_PATIENT_FORM_VALUES,
    name: "Ana Beatriz Souza",
    monthlyFeeReais: 250,
    billingDay: 10,
    ...overrides,
  };
}

describe("validatePatientForm", () => {
  it("aceita um formulário mínimo válido (só campos obrigatórios)", () => {
    expect(hasErrors(validatePatientForm(values()))).toBe(false);
  });

  it("exige nome", () => {
    const errors = validatePatientForm(values({ name: "  " }));
    expect(errors.name).toBeDefined();
  });

  it("rejeita nome maior que 120 caracteres", () => {
    const errors = validatePatientForm(values({ name: "a".repeat(121) }));
    expect(errors.name).toBeDefined();
  });

  it("exige valor de mensalidade maior que zero", () => {
    expect(validatePatientForm(values({ monthlyFeeReais: "" })).monthlyFeeReais).toBeDefined();
    expect(validatePatientForm(values({ monthlyFeeReais: 0 })).monthlyFeeReais).toBeDefined();
    expect(validatePatientForm(values({ monthlyFeeReais: -10 })).monthlyFeeReais).toBeDefined();
  });

  it("exige dia de vencimento entre 1 e 28", () => {
    expect(validatePatientForm(values({ billingDay: "" })).billingDay).toBeDefined();
    expect(validatePatientForm(values({ billingDay: 0 })).billingDay).toBeDefined();
    expect(validatePatientForm(values({ billingDay: 29 })).billingDay).toBeDefined();
    expect(validatePatientForm(values({ billingDay: 1.5 })).billingDay).toBeDefined();
    expect(hasErrors(validatePatientForm(values({ billingDay: 28 })))).toBe(false);
  });

  it("whatsapp é opcional, mas quando informado precisa ser válido", () => {
    expect(hasErrors(validatePatientForm(values({ whatsapp: "" })))).toBe(false);
    expect(validatePatientForm(values({ whatsapp: "(11) 998" })).whatsapp).toBeDefined();
    expect(hasErrors(validatePatientForm(values({ whatsapp: "(11) 99876-5432" })))).toBe(false);
  });

  it("email é opcional, mas quando informado precisa ter formato válido", () => {
    expect(hasErrors(validatePatientForm(values({ email: "" })))).toBe(false);
    expect(validatePatientForm(values({ email: "invalido" })).email).toBeDefined();
    expect(hasErrors(validatePatientForm(values({ email: "ana@exemplo.com.br" })))).toBe(false);
  });

  it("rejeita anotações maiores que 2000 caracteres", () => {
    const errors = validatePatientForm(values({ notes: "a".repeat(2001) }));
    expect(errors.notes).toBeDefined();
  });

  it("nenhum campo clínico existe no formulário (checagem de forma via chaves conhecidas)", () => {
    const knownKeys = ["name", "whatsapp", "email", "monthlyFeeReais", "billingDay", "notes"];
    expect(Object.keys(EMPTY_PATIENT_FORM_VALUES).sort()).toEqual(knownKeys.sort());
  });
});

describe("toPatientPayload", () => {
  it("converte reais para centavos inteiros e omite campos opcionais vazios", () => {
    const payload = toPatientPayload(values());

    expect(payload).toEqual({ name: "Ana Beatriz Souza", monthlyFee: 25000, billingDay: 10 });
  });

  it("inclui whatsapp (convertido para E.164), email e notes quando informados", () => {
    const payload = toPatientPayload(
      values({ whatsapp: "(11) 99876-5432", email: "ana@exemplo.com.br", notes: "Prefere contato por e-mail." }),
    );

    expect(payload.whatsapp).toBe("+5511998765432");
    expect(payload.email).toBe("ana@exemplo.com.br");
    expect(payload.notes).toBe("Prefere contato por e-mail.");
  });

  it("aparaza (trim) nome, e-mail e anotações", () => {
    const payload = toPatientPayload(values({ name: "  Ana  ", email: "  ana@exemplo.com.br  ", notes: "  nota  " }));

    expect(payload.name).toBe("Ana");
    expect(payload.email).toBe("ana@exemplo.com.br");
    expect(payload.notes).toBe("nota");
  });
});
