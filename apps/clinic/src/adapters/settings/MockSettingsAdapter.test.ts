import { describe, expect, it } from "vitest";

import { MockSettingsAdapter } from "./MockSettingsAdapter";
import { ONBOARDING_STEP_KEYS } from "./SettingsAdapter";

describe("MockSettingsAdapter", () => {
  describe("getSettings/updateSettings", () => {
    it("começa com o fuso padrão e sem valores definidos", async () => {
      const adapter = new MockSettingsAdapter();

      const settings = await adapter.getSettings();

      expect(settings.timezone).toBe("America/Sao_Paulo");
      expect(settings.defaultMonthlyFee).toBeUndefined();
      expect(settings.onboardingCompletedAt).toBeUndefined();
    });

    it("atualiza campos parciais e carimba updatedAt", async () => {
      const adapter = new MockSettingsAdapter({ clock: () => Date.parse("2026-05-01T10:00:00Z") });

      const updated = await adapter.updateSettings({ defaultMonthlyFee: 20000 });

      expect(updated.defaultMonthlyFee).toBe(20000);
      expect(updated.updatedAt).toBe("2026-05-01T10:00:00.000Z");
    });
  });

  describe("getOnboardingStatus", () => {
    it("começa com os quatro passos pendentes e completed=false", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.getOnboardingStatus();

      expect(status.completed).toBe(false);
      expect(status.steps).toEqual(ONBOARDING_STEP_KEYS.map((key) => ({ key, done: false })));
    });
  });

  describe("saveOnboarding* — cada passo salva via adapter e marca-se concluído", () => {
    it("saveOnboardingProfile persiste o perfil e marca 'perfil' como concluído", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.saveOnboardingProfile({ displayName: "Ana Beatriz", crp: "06/12345" });

      expect(status.steps.find((s) => s.key === "perfil")?.done).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data.perfil).toEqual({ displayName: "Ana Beatriz", crp: "06/12345" });
    });

    it("saveOnboardingSessionFee persiste o valor em centavos e marca 'valor-sessao' como concluído", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.saveOnboardingSessionFee(15000);

      expect(status.steps.find((s) => s.key === "valor-sessao")?.done).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data["valor-sessao"]).toBe(15000);
    });

    it("saveOnboardingSchedule persiste dias/horários e marca 'horarios' como concluído", async () => {
      const adapter = new MockSettingsAdapter();
      const schedule = { days: ["seg", "qua", "sex"] as const, timeWindows: [{ start: "08:00", end: "12:00" }] };

      const status = await adapter.saveOnboardingSchedule({ days: [...schedule.days], timeWindows: schedule.timeWindows });

      expect(status.steps.find((s) => s.key === "horarios")?.done).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data.horarios).toEqual({ days: ["seg", "qua", "sex"], timeWindows: [{ start: "08:00", end: "12:00" }] });
    });

    it("saveOnboardingReminderPreferences persiste canais/antecedência e marca 'lembretes' como concluído", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.saveOnboardingReminderPreferences({ channels: ["email"], leadTimeHours: 24 });

      expect(status.steps.find((s) => s.key === "lembretes")?.done).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data.lembretes).toEqual({ channels: ["email"], leadTimeHours: 24 });
    });

    it("mantém isolamento entre os dados salvos de passos distintos", async () => {
      const adapter = new MockSettingsAdapter();

      await adapter.saveOnboardingProfile({ displayName: "Ana" });
      await adapter.saveOnboardingSessionFee(9900);

      const data = await adapter.getOnboardingData();
      expect(data.perfil).toEqual({ displayName: "Ana" });
      expect(data["valor-sessao"]).toBe(9900);
      expect(data.horarios).toBeUndefined();
      expect(data.lembretes).toBeUndefined();
    });
  });

  describe("completeOnboardingStep — usado tanto para concluir quanto para 'pular'", () => {
    it("marca um passo como concluído sem gravar dado (equivalente a pular)", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.completeOnboardingStep({ stepKey: "perfil" });

      expect(status.steps.find((s) => s.key === "perfil")?.done).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data.perfil).toBeUndefined();
    });

    it("ignora stepKey desconhecido sem lançar erro", async () => {
      const adapter = new MockSettingsAdapter();

      const status = await adapter.completeOnboardingStep({ stepKey: "passo-inexistente" });

      expect(status.steps).toHaveLength(ONBOARDING_STEP_KEYS.length);
      expect(status.completed).toBe(false);
    });
  });

  describe("completed / onboardingCompletedAt", () => {
    it("só fica completed=true quando os quatro passos estão concluídos (pulados ou com dado)", async () => {
      const adapter = new MockSettingsAdapter({ clock: () => Date.parse("2026-06-01T00:00:00Z") });

      await adapter.saveOnboardingProfile({ displayName: "Ana" });
      await adapter.saveOnboardingSessionFee(15000);
      await adapter.completeOnboardingStep({ stepKey: "horarios" }); // pulado
      let status = await adapter.getOnboardingStatus();
      expect(status.completed).toBe(false);

      status = await adapter.saveOnboardingReminderPreferences({ channels: ["email"], leadTimeHours: 12 });

      expect(status.completed).toBe(true);
      const settings = await adapter.getSettings();
      expect(settings.onboardingCompletedAt).toBe("2026-06-01T00:00:00.000Z");
    });

    it("permite pular o fluxo inteiro completando todos os passos sem dado algum", async () => {
      const adapter = new MockSettingsAdapter();

      let status = await adapter.getOnboardingStatus();
      for (const step of status.steps) {
        status = await adapter.completeOnboardingStep({ stepKey: step.key });
      }

      expect(status.completed).toBe(true);
      const data = await adapter.getOnboardingData();
      expect(data).toEqual({});
    });
  });

  describe("retomada — passo pendente", () => {
    it("o primeiro passo não concluído é identificável a partir de getOnboardingStatus", async () => {
      const adapter = new MockSettingsAdapter();
      await adapter.saveOnboardingProfile({ displayName: "Ana" });
      await adapter.saveOnboardingSessionFee(15000);

      const status = await adapter.getOnboardingStatus();
      const pendingIndex = status.steps.findIndex((s) => !s.done);

      expect(status.steps[pendingIndex]?.key).toBe("horarios");
    });
  });
});
