import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Nav } from "./Nav";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

describe("Nav", () => {
  afterEach(() => {
    setScrollY(0);
  });

  it("renderiza a logo, os links de navegação e o CTA de acesso antecipado", () => {
    render(<Nav />);

    const logoLink = screen.getByRole("link", { name: "PsiOps — início" });
    expect(logoLink).toHaveAttribute("href", "#top");

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toBeInTheDocument();

    for (const [label, href] of [
      ["O problema", "#problema"],
      ["Recursos", "#solucao"],
      ["Como funciona", "#como"],
      ["Dúvidas", "#faq"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    expect(screen.getByRole("link", { name: "Acesso antecipado" })).toHaveAttribute(
      "href",
      "#lista",
    );
  });

  it("não está opaca (scrolled) quando a página está no topo", () => {
    setScrollY(0);
    render(<Nav />);

    expect(screen.getByTestId("nav")).not.toHaveClass("psi-nav--scrolled");
  });

  it("fica opaca (scrolled) quando scrollY > 12, conforme spec §8.2", () => {
    render(<Nav />);
    const nav = screen.getByTestId("nav");

    expect(nav).not.toHaveClass("psi-nav--scrolled");

    setScrollY(13);
    fireEvent.scroll(window);

    expect(nav).toHaveClass("psi-nav--scrolled");

    setScrollY(0);
    fireEvent.scroll(window);

    expect(nav).not.toHaveClass("psi-nav--scrolled");
  });
});
