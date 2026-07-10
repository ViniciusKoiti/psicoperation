import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SEED_USER_CREDENTIALS } from "./adapters/auth";
import { App } from "./App";

describe("App", () => {
  it("exige login antes do shell protegido e retoma a rota após autenticar (composição real: SessionProvider + MockAuthAdapter)", async () => {
    render(
      <MantineProvider theme={psiopsTheme}>
        <App />
      </MantineProvider>,
    );

    // Sem sessão: a rota "/" (protegida) redireciona para /login.
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("E-mail", { exact: false }), { target: { value: SEED_USER_CREDENTIALS.email } });
    fireEvent.change(screen.getByLabelText("Senha", { exact: false }), { target: { value: SEED_USER_CREDENTIALS.password } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByTestId("app-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();

    // Aguarda o dashboard (rota "/") montar — os atalhos são estáticos (sem
    // carregamento assíncrono), landmark estável para não deixar um update
    // de estado pendente após o teste sem depender de dados cujo conteúdo
    // varia com a data atual real (ver PSI-032).
    await screen.findByTestId("dashboard-shortcuts");
  });
});
