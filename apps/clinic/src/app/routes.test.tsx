import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "./routes";

function renderAt(path: string) {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe("AppRoutes", () => {
  it("mostra o dashboard protegido dentro do shell em /", async () => {
    renderAt("/");

    expect(screen.getByTestId("app-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();

    // Aguarda o carregamento assíncrono do MockPatientsAdapter terminar.
    await screen.findByText("Marina Alves");
  });

  it("mostra a rota pública /login sem o shell protegido", () => {
    renderAt("/login");

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
  });

  it("redireciona rotas desconhecidas para a home", async () => {
    renderAt("/rota-inexistente");

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();

    await screen.findByText("Marina Alves");
  });
});
