import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section } from "./Section";

describe("Section", () => {
  it("renderiza um <section> com id, padding padrão (96/96, spec §4) e o Wrap interno", () => {
    render(
      <Section id="problema">
        <p>conteúdo</p>
      </Section>,
    );

    const section = document.getElementById("problema");
    expect(section).not.toBeNull();
    expect(section).toHaveClass("psi-section");
    expect(section).toHaveStyle({ paddingTop: "96px", paddingBottom: "96px" });
    expect(section?.querySelector(".psi-wrap")).not.toBeNull();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("aceita paddings verticais customizados (ex.: quote 110px, spec §4)", () => {
    render(
      <Section id="quote" paddingTop={110} paddingBottom={110}>
        quote
      </Section>,
    );

    expect(document.getElementById("quote")).toHaveStyle({
      paddingTop: "110px",
      paddingBottom: "110px",
    });
  });

  it("aplica a cor de fundo informada e repassa wrapMaxWidth ao Wrap", () => {
    render(
      <Section id="faq" background="var(--psi-primary-50)" wrapMaxWidth={820}>
        faq
      </Section>,
    );

    const section = document.getElementById("faq");
    expect(section).toHaveStyle({ background: "var(--psi-primary-50)" });
    expect(section?.querySelector(".psi-wrap")).toHaveStyle({ maxWidth: "820px" });
  });
});
