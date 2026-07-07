import { render, screen } from "@testing-library/react";

import { Pill } from "../src/components/index.js";

describe("Pill", () => {
  it("renderiza um span .psi-pill sem dot por padrão", () => {
    render(<Pill>Feito para psicólogos</Pill>);
    const pill = screen.getByText("Feito para psicólogos");
    expect(pill).toHaveClass("psi-pill");
    expect(screen.queryByTestId("psi-pill-dot")).not.toBeInTheDocument();
  });

  it("exibe o status-dot decorativo (aria-hidden) quando dot=true", () => {
    render(<Pill dot>Feito para psicólogos</Pill>);
    const dot = screen.getByTestId("psi-pill-dot");
    expect(dot).toHaveClass("psi-pill__dot");
    expect(dot).toHaveAttribute("aria-hidden", "true");
    // Sem cor inline: usa o padrão accent-500 do CSS.
    expect(dot).not.toHaveAttribute("style");
  });

  it("aceita dotColor customizado (implica dot)", () => {
    render(<Pill dotColor="var(--psi-success-medium)">Lembrete enviado</Pill>);
    const dot = screen.getByTestId("psi-pill-dot");
    expect(dot).toHaveStyle({ background: "var(--psi-success-medium)" });
  });

  it("mescla className e repassa atributos", () => {
    render(
      <Pill className="extra" data-testid="pill">
        Cadastro
      </Pill>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveClass("psi-pill", "extra");
  });
});
