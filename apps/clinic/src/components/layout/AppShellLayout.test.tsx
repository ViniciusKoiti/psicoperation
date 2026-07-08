import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppShellLayout } from "./AppShellLayout";

function renderShell() {
  return render(
    <MantineProvider theme={psiopsTheme}>
      <MemoryRouter>
        <AppShellLayout>
          <div>Conteúdo da rota</div>
        </AppShellLayout>
      </MemoryRouter>
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
});
