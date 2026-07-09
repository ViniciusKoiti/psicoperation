import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SessionContext } from "../../session/SessionContext";
import { createTestSessionValue } from "../../testing/session";
import { Topbar } from "./Topbar";

describe("Topbar", () => {
  it("o botão Sair encerra a sessão e redireciona para /login", () => {
    const sessionValue = createTestSessionValue({
      status: "authenticated",
      user: { id: "1", name: "Ana Beatriz Souza", email: "ana@exemplo.com.br", createdAt: "2026-01-01T00:00:00Z" },
    });

    render(
      <MantineProvider theme={psiopsTheme}>
        <SessionContext.Provider value={sessionValue}>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<Topbar />} />
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </SessionContext.Provider>
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(sessionValue.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});
