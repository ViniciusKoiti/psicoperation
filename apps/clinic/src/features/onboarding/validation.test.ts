import { describe, expect, it } from "vitest";

import {
  hasErrors,
  validateProfileStep,
  validateReminderPreferencesStep,
  validateScheduleStep,
  validateSessionFeeStep,
} from "./validation";

describe("validateProfileStep", () => {
  it("exige nome de exibição", () => {
    const errors = validateProfileStep({ displayName: "" });
    expect(errors.displayName).toBeDefined();
  });

  it("aceita CRP ausente (opcional)", () => {
    const errors = validateProfileStep({ displayName: "Ana" });
    expect(hasErrors(errors)).toBe(false);
  });

  it("valida o formato do CRP quando preenchido", () => {
    expect(hasErrors(validateProfileStep({ displayName: "Ana", crp: "invalido" }))).toBe(true);
    expect(hasErrors(validateProfileStep({ displayName: "Ana", crp: "06/12345" }))).toBe(false);
  });
});

describe("validateSessionFeeStep", () => {
  it("exige um valor em centavos maior que zero", () => {
    expect(hasErrors(validateSessionFeeStep(undefined))).toBe(true);
    expect(hasErrors(validateSessionFeeStep(0))).toBe(true);
    expect(hasErrors(validateSessionFeeStep(-100))).toBe(true);
    expect(hasErrors(validateSessionFeeStep(15000))).toBe(false);
  });
});

describe("validateScheduleStep", () => {
  it("exige ao menos um dia e uma janela válida", () => {
    expect(hasErrors(validateScheduleStep({ days: [], timeWindows: [] }))).toBe(true);
    expect(
      hasErrors(validateScheduleStep({ days: ["seg"], timeWindows: [{ start: "", end: "" }] })),
    ).toBe(true);
    expect(
      hasErrors(validateScheduleStep({ days: ["seg"], timeWindows: [{ start: "10:00", end: "08:00" }] })),
    ).toBe(true);
    expect(
      hasErrors(validateScheduleStep({ days: ["seg"], timeWindows: [{ start: "08:00", end: "12:00" }] })),
    ).toBe(false);
  });
});

describe("validateReminderPreferencesStep", () => {
  it("exige ao menos um canal e antecedência positiva", () => {
    expect(hasErrors(validateReminderPreferencesStep({ channels: [], leadTimeHours: 24 }))).toBe(true);
    expect(hasErrors(validateReminderPreferencesStep({ channels: ["email"], leadTimeHours: 0 }))).toBe(true);
    expect(hasErrors(validateReminderPreferencesStep({ channels: ["email"], leadTimeHours: 24 }))).toBe(false);
  });
});
