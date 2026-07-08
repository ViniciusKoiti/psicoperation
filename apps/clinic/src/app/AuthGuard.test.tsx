import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthGuard } from "./AuthGuard";

/**
 * Documenta o comportamento provisório do guard (ver TODO em AuthGuard.tsx):
 * hoje ele SEMPRE permite o acesso, não existe autenticação real ainda. Este
 * teste deve ser atualizado quando a checagem real for implementada.
 */
describe("AuthGuard (placeholder)", () => {
  it("hoje sempre permite o acesso à rota protegida (sem autenticação real)", () => {
    render(
      <MemoryRouter initialEntries={["/protegida"]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/protegida" element={<div>Conteúdo protegido</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });
});
