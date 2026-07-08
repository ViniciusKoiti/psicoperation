import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage (placeholder PSI-009)", () => {
  it("renderiza a marca e o mote do produto", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "PsiOps" })).toBeInTheDocument();
    expect(screen.getByText("finalmente em ordem")).toBeInTheDocument();
  });
});
