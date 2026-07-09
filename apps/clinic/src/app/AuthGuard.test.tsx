import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionContext } from "../session/SessionContext";
import { createTestSessionValue } from "../testing/session";
import { AuthGuard } from "./AuthGuard";

function LoginSpy() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return <div>Login (from: {from ?? "nenhuma"})</div>;
}

function renderGuarded(status: "anonymous" | "authenticated", initialEntry = "/protegida") {
  const sessionValue = createTestSessionValue({ status });
  return render(
    <SessionContext.Provider value={sessionValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/protegida" element={<div>Conteúdo protegido</div>} />
          </Route>
          <Route path="/login" element={<LoginSpy />} />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );
}

describe("AuthGuard", () => {
  it("permite o acesso quando há sessão autenticada", () => {
    renderGuarded("authenticated");

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
    expect(screen.queryByText(/^Login/)).not.toBeInTheDocument();
  });

  it("redireciona para /login quando não há sessão autenticada, preservando a rota de destino", () => {
    renderGuarded("anonymous");

    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
    expect(screen.getByText("Login (from: /protegida)")).toBeInTheDocument();
  });
});
