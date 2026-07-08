import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("renderiza as 3 colunas: marca + tagline, navegação e legal (spec §1.10)", () => {
    render(<Footer />);

    expect(
      screen.getByText("O financeiro da sua clínica, com a calma que a sua rotina merece."),
    ).toBeInTheDocument();
    expect(screen.getByText("© 2026 PsiOps")).toBeInTheDocument();

    const navColumn = screen.getByRole("navigation", { name: "Navegação do rodapé" });
    expect(navColumn).toBeInTheDocument();

    for (const [label, href] of [
      ["Sobre", "#solucao"],
      ["FAQ", "#faq"],
      ["Contato", "#lista"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    const legalColumn = screen.getByRole("navigation", { name: "Links legais" });
    expect(legalColumn).toBeInTheDocument();

    for (const label of ["Política de Privacidade", "Termos de Uso"]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "#");
    }
  });
});
