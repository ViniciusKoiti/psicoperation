import type { Reminder } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  buildPaymentReminderContent,
  buildPaymentReminderRequest,
  buildSessionReminderContent,
  buildSessionReminderRequest,
  chargeReferenceInstant,
  computeScheduledFor,
  formatCentsAsBRL,
  isReminderCancellable,
  sortRemindersByScheduledFor,
} from "./reminders";

function reminder(overrides: Partial<Reminder>): Reminder {
  return {
    id: overrides.id ?? "reminder-1",
    channel: "email",
    subject: overrides.subject ?? "Lembrete de consulta",
    body: overrides.body ?? "Corpo",
    scheduledFor: overrides.scheduledFor ?? "2026-07-12T14:00:00Z",
    status: overrides.status ?? "agendado",
    createdAt: overrides.createdAt ?? "2026-07-01T09:00:00Z",
    ...overrides,
  };
}

describe("computeScheduledFor", () => {
  it("subtrai a antecedência (em horas) do instante de referência", () => {
    expect(computeScheduledFor("2026-07-13T14:00:00.000Z", 24)).toBe("2026-07-12T14:00:00.000Z");
  });

  it("antecedência de 0 horas mantém o mesmo instante", () => {
    expect(computeScheduledFor("2026-07-13T14:00:00.000Z", 0)).toBe("2026-07-13T14:00:00.000Z");
  });
});

describe("chargeReferenceInstant", () => {
  it("constrói o instante a partir da meia-noite local do dia de vencimento (sem deslocamento de fuso do parse direto)", () => {
    const instant = chargeReferenceInstant("2026-07-10");
    const parsed = new Date(instant);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(10);
    expect(parsed.getHours()).toBe(0);
  });
});

describe("templates administrativos (sem conteúdo clínico)", () => {
  it("lembrete de sessão contém apenas data/horário", () => {
    const { subject, body } = buildSessionReminderContent("2026-07-13T14:00:00Z");
    expect(subject).toBe("Lembrete de consulta");
    expect(body).toMatch(/consulta agendada/);
    expect(body).not.toMatch(/diagnóstico|terapia|sintoma|queixa/i);
  });

  it("lembrete de pagamento contém competência, valor e vencimento", () => {
    const { subject, body } = buildPaymentReminderContent("2026-07", 25000, "2026-07-10");
    expect(subject).toBe("Lembrete de pagamento");
    expect(body).toContain("R$");
    expect(body).toContain("07/2026");
  });
});

describe("buildSessionReminderRequest / buildPaymentReminderRequest", () => {
  it("monta o payload de sessão vinculado à consulta, com antecedência aplicada", () => {
    const payload = buildSessionReminderRequest("patient-a", "appointment-1", "2026-07-13T14:00:00.000Z", 24);

    expect(payload).toMatchObject({
      channel: "email",
      patientId: "patient-a",
      appointmentId: "appointment-1",
      scheduledFor: "2026-07-12T14:00:00.000Z",
    });
    expect(payload.chargeId).toBeUndefined();
  });

  it("monta o payload de pagamento vinculado à cobrança, com antecedência aplicada", () => {
    const payload = buildPaymentReminderRequest("patient-a", "charge-1", "2026-07", 25000, "2026-07-10", 48);

    expect(payload.channel).toBe("email");
    expect(payload.patientId).toBe("patient-a");
    expect(payload.chargeId).toBe("charge-1");
    expect(payload.appointmentId).toBeUndefined();
    expect(payload.body).toContain("R$ 250,00");
  });
});

describe("sortRemindersByScheduledFor", () => {
  it("ordena do mais próximo para o mais distante", () => {
    const reminders = [
      reminder({ id: "later", scheduledFor: "2026-07-20T00:00:00Z" }),
      reminder({ id: "sooner", scheduledFor: "2026-07-10T00:00:00Z" }),
    ];

    const sorted = sortRemindersByScheduledFor(reminders);
    expect(sorted.map((r) => r.id)).toEqual(["sooner", "later"]);
  });
});

describe("isReminderCancellable", () => {
  it("só lembretes agendados são canceláveis", () => {
    expect(isReminderCancellable(reminder({ status: "agendado" }))).toBe(true);
    expect(isReminderCancellable(reminder({ status: "enviado" }))).toBe(false);
    expect(isReminderCancellable(reminder({ status: "falhou" }))).toBe(false);
    expect(isReminderCancellable(reminder({ status: "cancelado" }))).toBe(false);
  });
});

describe("formatCentsAsBRL", () => {
  it("formata centavos como R$", () => {
    expect(formatCentsAsBRL(25000)).toBe("R$ 250,00");
  });
});
