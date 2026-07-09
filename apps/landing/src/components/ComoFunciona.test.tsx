import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComoFunciona } from "./ComoFunciona";

describe("ComoFunciona", () => {
  it("renderiza o header (eyebrow + h2) e a seção com id #como (spec §1.5)", () => {
    render(<ComoFunciona />);

    expect(document.getElementById("como")).not.toBeNull();
    expect(screen.getByText("Passo a passo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Simples como deve ser" }),
    ).toBeInTheDocument();
  });

  it("renderiza os 3 passos numerados com título e descrição idênticos à referência", () => {
    render(<ComoFunciona />);

    const steps = [
      ["01", "Cadastre seus pacientes", "Em menos de 2 minutos por paciente. Sem complicação."],
      ["02", "Configure as regras", "Defina valores, vencimentos e juros uma única vez."],
      ["03", "Acompanhe e cobre", "Receba alertas, envie lembretes, mantenha tudo em ordem."],
    ] as const;

    for (const [number, title, text] of steps) {
      expect(screen.getByText(number)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });
});
