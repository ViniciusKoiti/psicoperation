import { render, screen } from "@testing-library/react";

import { Card } from "../src/components/index.js";

describe("Card", () => {
  it("renderiza uma div .psi-card com shadow-card por padrão", () => {
    render(<Card data-testid="card">Conteúdo</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveTextContent("Conteúdo");
    expect(card).toHaveClass("psi-card");
    expect(card).not.toHaveClass(
      "psi-card--shadow-soft",
      "psi-card--shadow-lift",
      "psi-card--lift",
    );
  });

  it.each([
    ["soft", "psi-card--shadow-soft"],
    ["lift", "psi-card--shadow-lift"],
  ] as const)("aplica a classe da sombra %s", (shadow, expected) => {
    render(
      <Card data-testid="card" shadow={shadow}>
        Conteúdo
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("psi-card", expected);
  });

  it("aplica o utilitário de hover .psi-card--lift quando lift=true", () => {
    render(
      <Card data-testid="card" lift>
        Conteúdo
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("psi-card--lift");
  });

  it("mescla className e repassa atributos (ex.: role/aria)", () => {
    render(
      <Card className="extra" role="region" aria-label="Carteira de pacientes">
        Conteúdo
      </Card>,
    );
    const card = screen.getByRole("region", {
      name: "Carteira de pacientes",
    });
    expect(card).toHaveClass("psi-card", "extra");
  });
});
