import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renderiza o shell da rota protegida por padrão (sem crashar)", async () => {
    render(
      <MantineProvider theme={psiopsTheme}>
        <App />
      </MantineProvider>,
    );

    expect(screen.getByTestId("app-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();

    // Aguarda o carregamento assíncrono do dashboard (MockPatientsAdapter)
    // terminar, para não deixar um update de estado pendente após o teste.
    await screen.findByText("Marina Alves");
  });
});
