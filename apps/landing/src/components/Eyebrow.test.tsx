import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renderiza o texto com a classe do design system (.psi-eyebrow)", () => {
    render(<Eyebrow>A realidade de quem atende sozinho</Eyebrow>);

    const eyebrow = screen.getByText("A realidade de quem atende sozinho");
    expect(eyebrow).toHaveClass("psi-eyebrow");
    expect(eyebrow.tagName).toBe("P");
  });
});
