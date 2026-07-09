import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinalCta } from "./FinalCta";

describe("FinalCta", () => {
  it("renderiza título, subtítulo e CTA para #lista (spec §1.9)", () => {
    render(<FinalCta />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Pronto para colocar o financeiro em ordem?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Entre na lista de espera e ganhe acesso antecipado."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quero acesso antecipado" })).toHaveAttribute(
      "href",
      "#lista",
    );
  });

  it("exibe a marca decorativa e arma o scroll reveal (spec §1.9/§8.1)", () => {
    const { container } = render(<FinalCta />);

    const mark = container.querySelector("img.psi-cta__mark");
    expect(mark).not.toBeNull();
    expect(mark).toHaveAttribute("src", "/assets/psiops-mark.png");

    expect(container.querySelector(".psi-cta")).toHaveClass("psi-reveal");
  });
});
