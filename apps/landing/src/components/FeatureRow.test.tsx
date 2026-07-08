import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureRow } from "./FeatureRow";

describe("FeatureRow", () => {
  it("por padrão renderiza o visual antes do texto no DOM (spec §1.4, feature 1/3)", () => {
    render(
      <FeatureRow
        badge="Cadastro"
        badgeColor="var(--psi-primary-700)"
        badgeBg="var(--psi-primary-100)"
        title="Título"
        text="Texto"
        visual={<div data-testid="visual">visual</div>}
      />,
    );

    const heading = screen.getByRole("heading", { level: 3, name: "Título" });
    const row = heading.closest(".psi-feature")!;
    const children = Array.from(row.children);

    const visualIndex = children.findIndex((el) => el.contains(screen.getByTestId("visual")));
    const contentIndex = children.findIndex((el) => el.contains(heading));
    expect(visualIndex).toBeLessThan(contentIndex);
  });

  it("com reverse, renderiza o texto antes do visual no DOM (spec §1.4, feature 2)", () => {
    render(
      <FeatureRow
        reverse
        badge="Automático"
        badgeColor="var(--psi-success-dark)"
        badgeBg="var(--psi-success-light)"
        badgeDot="var(--psi-success-medium)"
        title="Título invertido"
        text="Texto invertido"
        visual={<div data-testid="visual-2">visual</div>}
      />,
    );

    const heading = screen.getByRole("heading", { level: 3, name: "Título invertido" });
    const row = heading.closest(".psi-feature")!;
    const children = Array.from(row.children);

    const contentIndex = children.findIndex((el) => el.contains(heading));
    const visualIndex = children.findIndex((el) => el.contains(screen.getByTestId("visual-2")));
    expect(contentIndex).toBeLessThan(visualIndex);
  });
});
