import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Wrap } from "./Wrap";

describe("Wrap", () => {
  it("aplica a classe do container e a largura máxima padrão (1180px, spec §4)", () => {
    render(<Wrap>conteúdo</Wrap>);

    const wrap = screen.getByText("conteúdo");
    expect(wrap).toHaveClass("psi-wrap");
    expect(wrap).toHaveStyle({ maxWidth: "1180px" });
  });

  it("aceita um maxWidth customizado (ex.: 820px para a FAQ)", () => {
    render(<Wrap maxWidth={820}>faq</Wrap>);

    expect(screen.getByText("faq")).toHaveStyle({ maxWidth: "820px" });
  });

  it("mescla className e style extras sem perder os padrões", () => {
    render(
      <Wrap className="extra" style={{ color: "red" }}>
        x
      </Wrap>,
    );

    const wrap = screen.getByText("x");
    expect(wrap).toHaveClass("psi-wrap", "extra");
    expect(wrap).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });
});
