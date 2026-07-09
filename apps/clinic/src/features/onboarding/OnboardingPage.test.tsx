import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MockSettingsAdapter, ONBOARDING_STEP_KEYS } from "../../adapters/settings";
import { OnboardingPage } from "./OnboardingPage";

function renderOnboarding(adapter: MockSettingsAdapter) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={["/onboarding"]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage adapter={adapter} />} />
          <Route path="/" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  );
}

function fillAndSubmitScheduleStep() {
  fireEvent.click(screen.getByLabelText("Segunda"));
  fireEvent.change(screen.getByLabelText("Início da janela 1"), { target: { value: "08:00" } });
  fireEvent.change(screen.getByLabelText("Término da janela 1"), { target: { value: "12:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
}

describe("OnboardingPage", () => {
  it("abre no primeiro passo (perfil) para uma conta nova", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);

    expect(await screen.findByTestId("onboarding-step-perfil")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-step-valor-sessao")).not.toBeInTheDocument();
  });

  it("valida o passo antes de avançar (nome de exibição obrigatório)", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));

    expect(await screen.findByText("Informe o nome de exibição.")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-perfil")).toBeInTheDocument();
    const status = await adapter.getOnboardingStatus();
    expect(status.steps.find((s) => s.key === "perfil")?.done).toBe(false);
  });

  it("valida o formato do CRP quando preenchido", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.change(screen.getByLabelText("CRP", { exact: false }), { target: { value: "invalido" } });
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));

    expect(await screen.findByText("Use o formato UF/número (ex.: 06/12345).")).toBeInTheDocument();
  });

  it("cada passo salva via adapter e avança para o próximo", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.change(screen.getByLabelText("CRP", { exact: false }), { target: { value: "06/12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));

    expect(await screen.findByTestId("onboarding-step-valor-sessao")).toBeInTheDocument();

    const data = await adapter.getOnboardingData();
    expect(data.perfil).toEqual({ displayName: "Ana Beatriz", crp: "06/12345" });
    const status = await adapter.getOnboardingStatus();
    expect(status.steps.find((s) => s.key === "perfil")?.done).toBe(true);
  });

  it("pular um passo avança sem gravar dado", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.click(screen.getByRole("button", { name: "Pular este passo" }));

    expect(await screen.findByTestId("onboarding-step-valor-sessao")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data.perfil).toBeUndefined();
    const status = await adapter.getOnboardingStatus();
    expect(status.steps.find((s) => s.key === "perfil")?.done).toBe(true);
  });

  it("permite voltar ao passo anterior", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.click(screen.getByRole("button", { name: "Pular este passo" }));
    await screen.findByTestId("onboarding-step-valor-sessao");

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByTestId("onboarding-step-perfil")).toBeInTheDocument();
  });

  it("pular o fluxo inteiro ('Concluir depois') marca tudo concluído e vai ao dashboard", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    fireEvent.click(screen.getByRole("button", { name: "Concluir depois" }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    const status = await adapter.getOnboardingStatus();
    expect(status.completed).toBe(true);
    expect(status.steps.every((step) => step.done)).toBe(true);
  });

  it("retomada reabre no passo pendente salvo pelo adapter", async () => {
    const adapter = new MockSettingsAdapter();
    await adapter.saveOnboardingProfile({ displayName: "Ana" });
    await adapter.saveOnboardingSessionFee(15000);

    renderOnboarding(adapter);

    expect(await screen.findByTestId("onboarding-step-horarios")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-step-perfil")).not.toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-step-valor-sessao")).not.toBeInTheDocument();
  });

  it("usuária que já concluiu o onboarding não vê o fluxo novamente", async () => {
    const adapter = new MockSettingsAdapter();
    for (const key of ONBOARDING_STEP_KEYS) {
      await adapter.completeOnboardingStep({ stepKey: key });
    }

    renderOnboarding(adapter);

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-page")).not.toBeInTheDocument();
  });

  it("percorre e conclui os quatro passos, redirecionando ao dashboard com o valor de sessão em centavos", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);
    await screen.findByTestId("onboarding-step-perfil");

    // Passo 1: perfil.
    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await screen.findByTestId("onboarding-step-valor-sessao");

    // Passo 2: valor da sessão — o NumberInput mantém reais; a conversão para
    // centavos inteiros BRL acontece na submissão (ver `money.ts`).
    fireEvent.change(screen.getByLabelText("Valor da sessão", { exact: false }), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await screen.findByTestId("onboarding-step-horarios");

    // Passo 3: dias/horários.
    fillAndSubmitScheduleStep();
    await screen.findByTestId("onboarding-step-lembretes");

    // Passo 4: lembretes (valores padrão já satisfazem a validação: e-mail + 24h).
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();

    const data = await adapter.getOnboardingData();
    expect(data["valor-sessao"]).toBe(15000);
    expect(data.horarios).toEqual({ days: ["seg"], timeWindows: [{ start: "08:00", end: "12:00" }] });
    expect(data.lembretes).toEqual({ channels: ["email"], leadTimeHours: 24 });

    const settings = await adapter.getSettings();
    expect(settings.onboardingCompletedAt).toEqual(expect.any(String));

    const status = await adapter.getOnboardingStatus();
    expect(status.completed).toBe(true);
  });

  it("mostra um loader enquanto carrega o status do onboarding e o remove ao concluir", async () => {
    const adapter = new MockSettingsAdapter();
    renderOnboarding(adapter);

    expect(screen.getByTestId("onboarding-loading")).toBeInTheDocument();

    // Aguarda a resolução assíncrona do `getOnboardingStatus`/`getOnboardingData`
    // terminar, para não deixar um update de estado pendente após o teste.
    await waitFor(() => expect(screen.queryByTestId("onboarding-loading")).not.toBeInTheDocument());
    expect(await screen.findByTestId("onboarding-step-perfil")).toBeInTheDocument();
  });
});
