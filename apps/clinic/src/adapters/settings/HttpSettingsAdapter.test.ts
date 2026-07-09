import { describe, expect, it, vi } from "vitest";

import { HttpSettingsAdapter, SettingsAdapterUnsupportedError } from "./HttpSettingsAdapter";

/**
 * Testes unitários com `fetch` substituído por um stub — NÃO é um teste de
 * integração contra um backend real (ver aviso em `HttpSettingsAdapter.ts`).
 * O objetivo é garantir que a tipagem e o mapeamento request/response dos
 * quatro métodos cobertos pelo contrato estão corretos; o exercício ponta a
 * ponta acontece na PSI-044.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpSettingsAdapter", () => {
  it("faz GET /settings e mapeia a resposta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ timezone: "America/Sao_Paulo" }));
    const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const settings = await adapter.getSettings();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/settings",
      expect.objectContaining({ method: "GET" }),
    );
    expect(settings.timezone).toBe("America/Sao_Paulo");
  });

  it("faz PUT /settings com o payload", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ timezone: "America/Sao_Paulo", defaultMonthlyFee: 20000 }));
    const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const settings = await adapter.updateSettings({ defaultMonthlyFee: 20000 });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/settings",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ defaultMonthlyFee: 20000 }),
      }),
    );
    expect(settings.defaultMonthlyFee).toBe(20000);
  });

  it("faz GET /settings/onboarding e mapeia a resposta", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ completed: false, steps: [{ key: "perfil", done: false }] }));
    const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const status = await adapter.getOnboardingStatus();

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/settings/onboarding",
      expect.objectContaining({ method: "GET" }),
    );
    expect(status.completed).toBe(false);
  });

  it("faz POST /settings/onboarding com o stepKey", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ completed: false, steps: [{ key: "perfil", done: true }] }));
    const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    const status = await adapter.completeOnboardingStep({ stepKey: "perfil" });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.psiops.com.br/settings/onboarding",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stepKey: "perfil" }),
      }),
    );
    expect(status.steps[0]?.done).toBe(true);
  });

  it("propaga erro com o detail do Problem quando a resposta não é ok", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ type: "about:blank", title: "Erro", status: 401, detail: "Sem sessão." }, 401));
    const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn });

    await expect(adapter.getSettings()).rejects.toThrow("Sem sessão.");
  });

  describe("extensões locais ainda sem endpoint no contrato", () => {
    it("rejeita getOnboardingData/saveOnboarding* com SettingsAdapterUnsupportedError", async () => {
      const adapter = new HttpSettingsAdapter({ baseUrl: "https://api.psiops.com.br", fetchFn: vi.fn() });

      await expect(adapter.getOnboardingData()).rejects.toBeInstanceOf(SettingsAdapterUnsupportedError);
      await expect(adapter.saveOnboardingProfile({ displayName: "Ana" })).rejects.toBeInstanceOf(
        SettingsAdapterUnsupportedError,
      );
      await expect(adapter.saveOnboardingSessionFee(15000)).rejects.toBeInstanceOf(SettingsAdapterUnsupportedError);
      await expect(
        adapter.saveOnboardingSchedule({ days: ["seg"], timeWindows: [{ start: "08:00", end: "12:00" }] }),
      ).rejects.toBeInstanceOf(SettingsAdapterUnsupportedError);
      await expect(
        adapter.saveOnboardingReminderPreferences({ channels: ["email"], leadTimeHours: 24 }),
      ).rejects.toBeInstanceOf(SettingsAdapterUnsupportedError);
    });
  });
});
