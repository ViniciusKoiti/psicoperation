import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthError } from "../../adapters/auth";
import { SessionContext, type SessionContextValue } from "../../session/SessionContext";
import { createTestSessionValue } from "../../testing/session";
import { RegisterPage } from "./RegisterPage";

function renderRegister(sessionOverrides?: Partial<SessionContextValue>) {
  const sessionValue = createTestSessionValue(sessionOverrides);
  render(
    <MantineProvider theme={psiopsTheme}>
      <SessionContext.Provider value={sessionValue}>
        <MemoryRouter initialEntries={["/registrar"]}>
          <Routes>
            <Route path="/registrar" element={<RegisterPage />} />
            <Route path="/" element={<div>Home protegida</div>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </MantineProvider>,
  );
  return sessionValue;
}

function fillAndSubmit(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Nome completo", { exact: false }), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("E-mail", { exact: false }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Senha", { exact: false }), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
}

describe("RegisterPage", () => {
  it("renderiza o formulário em pt-BR", () => {
    renderRegister();

    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha", { exact: false })).toBeInTheDocument();
  });

  it("bloqueia o envio com campos vazios e mostra os erros de validação", () => {
    const sessionValue = renderRegister();

    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Crie uma senha.")).toBeInTheDocument();
    expect(sessionValue.register).not.toHaveBeenCalled();
  });

  it("acusa senha curta antes de chamar o adapter", () => {
    const sessionValue = renderRegister();

    fillAndSubmit("Ana Beatriz Souza", "ana@exemplo.com.br", "curta");

    expect(screen.getByText("A senha deve ter ao menos 8 caracteres.")).toBeInTheDocument();
    expect(sessionValue.register).not.toHaveBeenCalled();
  });

  it("registro com sucesso já inicia a sessão e navega para a home", async () => {
    renderRegister();

    fillAndSubmit("Ana Beatriz Souza", "nova@exemplo.com.br", "SenhaForte123");

    expect(await screen.findByText("Home protegida")).toBeInTheDocument();
  });

  it("e-mail já cadastrado mostra mensagem de erro e não navega", async () => {
    const sessionValue = renderRegister({
      register: vi.fn().mockRejectedValue(new AuthError("E-mail já cadastrado.", 409, "email_taken")),
    });

    fillAndSubmit("Ana Beatriz Souza", "ana@exemplo.com.br", "SenhaForte123");

    expect(await screen.findByTestId("register-error")).toHaveTextContent("Este e-mail já está cadastrado.");
    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(sessionValue.register).toHaveBeenCalled();
  });
});
