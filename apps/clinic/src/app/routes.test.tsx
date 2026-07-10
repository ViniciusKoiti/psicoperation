import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionContext } from "../session/SessionContext";
import { createTestSessionValue } from "../testing/session";
import { AppRoutes } from "./routes";

function renderAt(path: string, status: "anonymous" | "authenticated" = "authenticated") {
  const sessionValue = createTestSessionValue({
    status,
    user: status === "authenticated" ? { id: "1", name: "Ana Beatriz Souza", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" } : null,
  });
  return render(
    <MantineProvider theme={psiopsTheme}>
      <SessionContext.Provider value={sessionValue}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </SessionContext.Provider>
    </MantineProvider>,
  );
}

describe("AppRoutes", () => {
  it("mostra o dashboard protegido dentro do shell em / quando autenticado", async () => {
    renderAt("/", "authenticated");

    expect(screen.getByTestId("app-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();

    // Atalhos são estáticos (sem carregamento assíncrono) — landmark estável
    // para aguardar o dashboard montar, sem depender de dados de um adapter
    // cujo conteúdo varia com a data atual real (ver PSI-032).
    await screen.findByTestId("dashboard-shortcuts");
    expect(screen.getByRole("link", { name: "Novo paciente" })).toHaveAttribute("href", "/pacientes/novo");
  });

  it("redireciona / para /login quando não autenticado", () => {
    renderAt("/", "anonymous");

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("mostra a rota pública /login sem o shell protegido", () => {
    renderAt("/login", "anonymous");

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("mostra a rota pública /registrar sem o shell protegido", () => {
    renderAt("/registrar", "anonymous");

    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("redireciona rotas desconhecidas para a home (autenticado mostra o dashboard)", async () => {
    renderAt("/rota-inexistente", "authenticated");

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();

    await screen.findByTestId("dashboard-shortcuts");
  });

  it("navega da lista de pacientes (PSI-033) para o detalhe (PSI-034) e volta preservando a busca", async () => {
    // Monta já com a busca aplicada na URL (equivalente a uma usuária que já
    // filtrou e deixou o debounce assentar) — evita testar a corrida entre o
    // debounce da busca e a sincronização da URL, que já tem cobertura própria
    // em `PatientsListPage.test.tsx`; aqui o foco é a preservação ao navegar.
    renderAt("/pacientes?q=Marina&status=ativo&page=0", "authenticated");

    await screen.findByText("Marina Alves");
    expect(screen.queryByText("Camila Souza")).not.toBeInTheDocument();
    expect((screen.getByLabelText("Buscar paciente por nome") as HTMLInputElement).value).toBe("Marina");

    fireEvent.click(screen.getByRole("link", { name: "Marina Alves" }));

    expect(await screen.findByRole("heading", { name: "Marina Alves" })).toBeInTheDocument();
    expect(screen.getByText("Detalhe do paciente")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Voltar para a lista" }));

    await screen.findByText("Marina Alves");
    expect(screen.queryByText("Camila Souza")).not.toBeInTheDocument();
    expect((screen.getByLabelText("Buscar paciente por nome") as HTMLInputElement).value).toBe("Marina");
  });

  it("mostra 'paciente não encontrado' ao acessar diretamente um id de paciente inexistente", async () => {
    renderAt("/pacientes/id-inexistente", "authenticated");

    await screen.findByTestId("patient-detail-not-found");
    expect(screen.getByRole("heading", { name: "Paciente não encontrado" })).toBeInTheDocument();
  });

  it("mostra a tela de financeiro dentro do shell em /financeiro (PSI-037)", async () => {
    renderAt("/financeiro", "authenticated");

    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Financeiro" })).toBeInTheDocument();

    await screen.findByTestId("finance-page");
  });

  it("mostra a tela de configurações dentro do shell em /configuracoes (PSI-039), com link na sidebar", async () => {
    renderAt("/configuracoes", "authenticated");

    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).toHaveTextContent("Configurações");

    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument();
    await screen.findByTestId("settings-section-perfil");
  });
});
