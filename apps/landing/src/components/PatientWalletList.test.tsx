import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatientWalletList } from "./PatientWalletList";

describe("PatientWalletList", () => {
  it("renderiza título e as 4 linhas de pacientes com nome e valor (spec §1.4)", () => {
    render(<PatientWalletList />);

    expect(screen.getByText("Carteira de pacientes")).toBeInTheDocument();

    for (const [name, value] of [
      ["Marcos Rocha", "R$ 350"],
      ["Beatriz Lima", "R$ 300"],
      ["Carla Dias", "R$ 357"],
      ["João Prado", "R$ 320"],
    ] as const) {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });
});
