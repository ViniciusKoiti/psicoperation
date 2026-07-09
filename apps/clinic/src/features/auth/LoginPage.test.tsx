import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthError } from "../../adapters/auth";
import { SessionContext, type SessionContextValue } from "../../session/SessionContext";
import { createTestSessionValue } from "../../testing/session";
import { LoginPage } from "./LoginPage";

function renderLogin(options: { from?: string; sessionOverrides?: Partial<SessionContextValue> } = {}) {
  const sessionValue = createTestSessionValue(options.sessionOverrides);
  const initialEntry = options.from
    ? { pathname: "/login", state: { from: { pathname: options.from } } }
    : "/login";

  render(
    <MantineProvider theme={psiopsTheme}>
      <SessionContext.Provider value={sessionValue}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home protegida</div>} />
            <Route path={options.from ?? "/destino"} element={<div>Destino original</div>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </MantineProvider>,
  );

  return sessionValue;
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail", { exact: false }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha", { exact: false }), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginPage", () => {
  it("renderiza o formulário em pt-BR", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha", { exact: false })).toBeInTheDocument();
  });

  it("bloqueia o envio e mostra erros de validação com campos vazios", () => {
    const sessionValue = renderLogin();

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    expect(sessionValue.login).not.toHaveBeenCalled();
  });

  it("login com sucesso navega para a rota de destino preservada", async () => {
    renderLogin({ from: "/destino" });

    fillAndSubmit("ana@exemplo.com.br", "SenhaForte123");

    expect(await screen.findByText("Destino original")).toBeInTheDocument();
  });

  it("login com sucesso sem destino salvo navega para a home", async () => {
    renderLogin();

    fillAndSubmit("ana@exemplo.com.br", "SenhaForte123");

    expect(await screen.findByText("Home protegida")).toBeInTheDocument();
  });

  it("credenciais inválidas mostram mensagem de erro e não navegam", async () => {
    const sessionValue = renderLogin({
      sessionOverrides: {
        login: vi.fn().mockRejectedValue(new AuthError("E-mail ou senha inválidos.", 401, "invalid_credentials")),
      },
    });

    fillAndSubmit("ana@exemplo.com.br", "senha-errada");

    expect(await screen.findByTestId("login-error")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(sessionValue.login).toHaveBeenCalledWith({ email: "ana@exemplo.com.br", password: "senha-errada" });
  });
});
