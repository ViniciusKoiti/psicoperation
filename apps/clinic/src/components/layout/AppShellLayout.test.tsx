import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionContext } from "../../session/SessionContext";
import { createTestSessionValue } from "../../testing/session";
import { AppShellLayout } from "./AppShellLayout";

function renderShell() {
  // Topbar usa useSession() (nome + sair); AppShellLayout só é usado atrás
  // do AuthGuard em produção, então o cenário realista aqui é autenticado.
  const sessionValue = createTestSessionValue({
    status: "authenticated",
    user: { id: "1", name: "Ana Beatriz Souza", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" },
  });
  return render(
    <MantineProvider theme={psiopsTheme}>
      <SessionContext.Provider value={sessionValue}>
        <MemoryRouter>
          <AppShellLayout>
            <div>Conteúdo da rota</div>
          </AppShellLayout>
        </MemoryRouter>
      </SessionContext.Provider>
    </MantineProvider>,
  );
}

describe("AppShellLayout", () => {
  it("renderiza o shell com topbar e sidebar", () => {
    renderShell();

    expect(screen.getByTestId("app-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
  });

  it("mostra a marca do produto na topbar", () => {
    renderShell();

    const topbar = screen.getByTestId("app-topbar");
    expect(topbar).toHaveTextContent("PsiOps");
  });

  it("mostra a navegação da sidebar (ex.: Dashboard)", () => {
    renderShell();

    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).toHaveTextContent("Dashboard");
  });

  it("renderiza o conteúdo da rota dentro do shell", () => {
    renderShell();

    expect(screen.getByText("Conteúdo da rota")).toBeInTheDocument();
  });

  it("mostra o nome da usuária autenticada e um botão para sair", () => {
    renderShell();

    expect(screen.getByTestId("topbar-user-name")).toHaveTextContent("Ana Beatriz Souza");
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });
});
