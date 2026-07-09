import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Quote } from "./Quote";

describe("Quote", () => {
  it("renderiza o texto da citação idêntico à referência (spec §1.6)", () => {
    render(<Quote />);

    expect(
      screen.getByText("“Você cuida das pessoas. A gente cuida do que vem depois da sessão.”"),
    ).toBeInTheDocument();
  });
});
