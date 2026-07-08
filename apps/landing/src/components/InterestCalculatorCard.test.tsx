import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InterestCalculatorCard } from "./InterestCalculatorCard";

describe("InterestCalculatorCard", () => {
  it("renderiza paciente, status, linhas de valores e o total idênticos à referência (spec §1.4)", () => {
    render(<InterestCalculatorCard />);

    expect(screen.getByText("Carla Dias")).toBeInTheDocument();
    expect(screen.getByText("Atrasado há 4 dias")).toBeInTheDocument();

    expect(screen.getByText("Valor original")).toBeInTheDocument();
    expect(screen.getByText("R$ 350,00")).toBeInTheDocument();
    expect(screen.getByText("Juros (1% a.m.)")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,47")).toBeInTheDocument();
    expect(screen.getByText("Multa (2%)")).toBeInTheDocument();
    expect(screen.getByText("R$ 7,00")).toBeInTheDocument();

    expect(screen.getByText("Total atualizado")).toBeInTheDocument();
    expect(screen.getByText("R$ 357,47")).toBeInTheDocument();
  });
});
