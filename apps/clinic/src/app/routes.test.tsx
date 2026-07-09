import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render, screen } from "@testing-library/react";
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

    // Aguarda o carregamento assíncrono do MockPatientsAdapter terminar.
    await screen.findByText("Marina Alves");
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

    await screen.findByText("Marina Alves");
  });
});
