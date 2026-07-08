import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Problema } from "./Problema";

describe("Problema", () => {
  it("renderiza o header (eyebrow + h2) e a seção com id #problema (spec §1.3)", () => {
    render(<Problema />);

    expect(document.getElementById("problema")).not.toBeNull();
    expect(screen.getByText("A realidade de quem atende sozinho")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Você já passou por isso?" }),
    ).toBeInTheDocument();
  });

  it("renderiza os 3 cards com título e descrição idênticos à referência", () => {
    render(<Problema />);

    const cards = [
      [
        "Perdeu o controle de quem pagou",
        "A planilha cresce e cada mês fica mais difícil saber quem está em dia.",
      ],
      [
        "Cobrança toma tempo da semana",
        "Digitar mensagem para cada paciente atrasado, entre uma sessão e outra.",
      ],
      [
        "Juros e multa calculados na mão",
        "Fazer a conta toda vez que alguém atrasa é desgastante e dá margem para erro.",
      ],
    ] as const;

    for (const [title, text] of cards) {
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("cada card usa o utilitário .lift do design system (hover elevação, spec §1.3/§6)", () => {
    render(<Problema />);

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Perdeu o controle de quem pagou",
    });
    const card = heading.closest(".psi-card");
    expect(card).toHaveClass("psi-card--lift");
  });
});
