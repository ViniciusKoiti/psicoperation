import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { MockSettingsAdapter, type SettingsAdapter } from "../../adapters/settings";
import { SessionContext, type SessionContextValue } from "../../session/SessionContext";
import { createTestSessionValue } from "../../testing/session";
import { OnboardingPage } from "../onboarding/OnboardingPage";
import { SettingsPage } from "./SettingsPage";

function renderSettings(adapter: SettingsAdapter, session?: Partial<SessionContextValue>) {
  const sessionValue = createTestSessionValue({
    status: "authenticated",
    user: { id: "1", name: "Ana Beatriz Souza", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" },
    ...session,
  });
  return {
    sessionValue,
    ...render(
      <MantineProvider theme={psiopsTheme}>
        <SessionContext.Provider value={sessionValue}>
          <MemoryRouter initialEntries={["/configuracoes"]}>
            <Routes>
              <Route path="/configuracoes" element={<SettingsPage adapter={adapter} />} />
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </SessionContext.Provider>
      </MantineProvider>,
    ),
  };
}

function fillAndSubmitSchedule() {
  fireEvent.click(screen.getByLabelText("Segunda"));
  fireEvent.change(screen.getByLabelText("Início da janela 1"), { target: { value: "08:00" } });
  fireEvent.change(screen.getByLabelText("Término da janela 1"), { target: { value: "12:00" } });
  fireEvent.click(screen.getByTestId("settings-section-horarios").querySelector('button[type="submit"]')!);
}

describe("SettingsPage", () => {
  it("mostra um loader durante o carregamento inicial e depois todas as seções", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);

    expect(screen.getByTestId("settings-loading")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId("settings-loading")).not.toBeInTheDocument());

    expect(screen.getByTestId("settings-section-perfil")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-valor-sessao")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-horarios")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-lembretes")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-sessao")).toBeInTheDocument();
  });

  it("mostra erro de carregamento com ação de tentar novamente, e recupera ao clicar", async () => {
    const adapter = new MockSettingsAdapter();
    const spy = vi
      .spyOn(adapter, "getOnboardingData")
      .mockRejectedValueOnce(new Error("falha de rede"))
      .mockResolvedValueOnce({});
    renderSettings(adapter);

    expect(await screen.findByTestId("settings-load-error")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-perfil")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(screen.getByTestId("settings-section-perfil")).toBeInTheDocument());
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("carrega o valor já salvo pelo onboarding e preenche o formulário de perfil", async () => {
    const adapter = new MockSettingsAdapter();
    await adapter.saveOnboardingProfile({ displayName: "Ana Beatriz", crp: "06/12345" });

    renderSettings(adapter);
    await screen.findByTestId("settings-section-perfil");

    expect(screen.getByLabelText("Nome de exibição", { exact: false })).toHaveValue("Ana Beatriz");
    expect(screen.getByLabelText("CRP", { exact: false })).toHaveValue("06/12345");
  });

  it("seção perfil: valida o formato do CRP e não salva enquanto inválido", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("CRP", { exact: false }), { target: { value: "invalido" } });
    fireEvent.click(screen.getByTestId("settings-section-perfil").querySelector('button[type="submit"]')!);

    expect(await screen.findByText("Use o formato UF/número (ex.: 06/12345).")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data.perfil).toBeUndefined();
  });

  it("seção perfil: salva via adapter com notificação de sucesso, sem afetar outras seções", async () => {
    const adapter = new MockSettingsAdapter();
    await adapter.saveOnboardingSessionFee(15000);

    renderSettings(adapter);
    await screen.findByTestId("settings-section-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.change(screen.getByLabelText("CRP", { exact: false }), { target: { value: "06/12345" } });
    fireEvent.click(screen.getByTestId("settings-section-perfil").querySelector('button[type="submit"]')!);

    expect(await screen.findByTestId("settings-perfil-success")).toBeInTheDocument();

    const data = await adapter.getOnboardingData();
    expect(data.perfil).toEqual({ displayName: "Ana Beatriz", crp: "06/12345" });
    // Independência entre seções: salvar o perfil não mexeu no valor de sessão salvo antes.
    expect(data["valor-sessao"]).toBe(15000);
  });

  it("seção perfil: mostra notificação de erro quando o adapter falha e preserva o formulário", async () => {
    const adapter = new MockSettingsAdapter();
    vi.spyOn(adapter, "saveOnboardingProfile").mockRejectedValueOnce(new Error("falha"));

    renderSettings(adapter);
    await screen.findByTestId("settings-section-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.click(screen.getByTestId("settings-section-perfil").querySelector('button[type="submit"]')!);

    expect(await screen.findByTestId("settings-perfil-error")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome de exibição", { exact: false })).toHaveValue("Ana Beatriz");
  });

  it("seção financeira: converte reais para centavos inteiros BRL e persiste via adapter", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-valor-sessao");

    fireEvent.change(screen.getByLabelText("Valor da sessão", { exact: false }), { target: { value: "150" } });
    fireEvent.click(screen.getByTestId("settings-section-valor-sessao").querySelector('button[type="submit"]')!);

    const success = await screen.findByTestId("settings-valor-sessao-success");
    expect(success).toHaveTextContent("150,00");

    const data = await adapter.getOnboardingData();
    expect(data["valor-sessao"]).toBe(15000);
  });

  it("seção financeira: valida valor obrigatório maior que zero", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-valor-sessao");

    fireEvent.click(screen.getByTestId("settings-section-valor-sessao").querySelector('button[type="submit"]')!);

    expect(await screen.findByText("Informe o valor padrão da sessão.")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data["valor-sessao"]).toBeUndefined();
  });

  it("seção atendimento: valida dias e janelas obrigatórios antes de salvar", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-horarios");

    fireEvent.click(screen.getByTestId("settings-section-horarios").querySelector('button[type="submit"]')!);

    expect(await screen.findByText("Selecione ao menos um dia de atendimento.")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data.horarios).toBeUndefined();
  });

  it("seção atendimento: salva dias e janelas de horário via adapter", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-horarios");

    fillAndSubmitSchedule();

    expect(await screen.findByTestId("settings-horarios-success")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data.horarios).toEqual({ days: ["seg"], timeWindows: [{ start: "08:00", end: "12:00" }] });
  });

  it("seção lembretes: salva canal e antecedência via adapter", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-lembretes");

    fireEvent.click(screen.getByTestId("settings-section-lembretes").querySelector('button[type="submit"]')!);

    expect(await screen.findByTestId("settings-lembretes-success")).toBeInTheDocument();
    const data = await adapter.getOnboardingData();
    expect(data.lembretes).toEqual({ channels: ["email"], leadTimeHours: 24 });
  });

  it("seção lembretes: exige ao menos um canal habilitado", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-lembretes");

    fireEvent.click(screen.getByLabelText("E-mail"));
    fireEvent.click(screen.getByTestId("settings-section-lembretes").querySelector('button[type="submit"]')!);

    expect(await screen.findByText("Selecione ao menos um canal de lembrete.")).toBeInTheDocument();
  });

  it("logout com confirmação encerra a sessão e redireciona ao login", async () => {
    const adapter = new MockSettingsAdapter();
    const { sessionValue } = renderSettings(adapter);
    await screen.findByTestId("settings-section-sessao");

    fireEvent.click(screen.getByTestId("settings-logout-button"));
    expect(screen.getByTestId("settings-logout-modal")).toBeInTheDocument();
    expect(sessionValue.logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("settings-logout-confirm"));

    expect(sessionValue.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Login")).toBeInTheDocument();
  });

  it("logout: cancelar a confirmação não encerra a sessão", async () => {
    const adapter = new MockSettingsAdapter();
    const { sessionValue } = renderSettings(adapter);
    await screen.findByTestId("settings-section-sessao");

    fireEvent.click(screen.getByTestId("settings-logout-button"));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(sessionValue.logout).not.toHaveBeenCalled();
    expect(screen.getByTestId("settings-section-sessao")).toBeInTheDocument();
  });

  it("paridade com onboarding: um dado editado na tela de configurações é lido pelo mesmo SettingsAdapter usado no onboarding", async () => {
    const adapter = new MockSettingsAdapter();
    renderSettings(adapter);
    await screen.findByTestId("settings-section-perfil");

    fireEvent.change(screen.getByLabelText("Nome de exibição", { exact: false }), { target: { value: "Ana Beatriz" } });
    fireEvent.click(screen.getByTestId("settings-section-perfil").querySelector('button[type="submit"]')!);
    await screen.findByTestId("settings-perfil-success");

    // O onboarding, montado com a MESMA instância de adapter, enxerga o passo
    // "perfil" como concluído e pula direto para o próximo passo pendente —
    // prova de que não há duplicação de estado entre as duas telas.
    render(
      <MantineProvider theme={psiopsTheme}>
        <MemoryRouter initialEntries={["/onboarding"]}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage adapter={adapter} />} />
            <Route path="/" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </MantineProvider>,
    );

    expect(await screen.findByTestId("onboarding-step-valor-sessao")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-step-perfil")).not.toBeInTheDocument();
  });
});
