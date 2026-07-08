import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./Hero";

describe("Hero", () => {
  it("renderiza a headline, a subheadline e a pill (spec §1.2)", () => {
    render(<Hero />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent?.replace(/\s+/g, " ").trim()).toBe(
      "Cuidar da sua clínica é cuidar de você também.",
    );
    expect(within(heading).getByText("você").tagName).toBe("EM");

    expect(
      screen.getByText(/Controle de mensalidades, lembretes automáticos e cobrança pelo WhatsApp/),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Feito para psicólogos que trabalham com mensalidade"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Sendo construído junto com psicólogas autônomas do Brasil"),
    ).toBeInTheDocument();
  });

  it("os CTAs primário e secundário apontam para as âncoras corretas (spec §9)", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: "Quero acesso antecipado" })).toHaveAttribute(
      "href",
      "#lista",
    );
    expect(screen.getByRole("link", { name: "Ver como funciona" })).toHaveAttribute(
      "href",
      "#solucao",
    );
  });

  it("renderiza o mockup de dashboard com as linhas de pacientes (spec §1.2)", () => {
    render(<Hero />);

    expect(screen.getByText("Pacientes — Maio")).toBeInTheDocument();
    expect(screen.getByText("8 mensalistas ativos")).toBeInTheDocument();
    expect(screen.getByText("5 em dia")).toBeInTheDocument();

    for (const [name, meta, status] of [
      ["Marcos Rocha", "Venc. dia 5 · R$ 350", "Pago"],
      ["Beatriz Lima", "Venc. dia 10 · R$ 300", "Em aberto"],
      ["Carla Dias", "Atrasado 4 dias · R$ 357 com juros", "Atrasado"],
    ] as const) {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(meta)).toBeInTheDocument();
      expect(screen.getByText(status)).toBeInTheDocument();
    }
  });

  it("renderiza os dois chips flutuantes no layout largo (spec §1.2/§7)", () => {
    render(<Hero />);

    const chips = screen.getAllByTestId("hero-chip");
    expect(chips).toHaveLength(2);

    expect(screen.getByText("Receita do mês")).toBeInTheDocument();
    expect(screen.getByText("R$ 4.200")).toBeInTheDocument();

    expect(screen.getByText(/Lembrete enviado/)).toBeInTheDocument();
    expect(screen.getByText("automaticamente")).toBeInTheDocument();

    for (const chip of chips) {
      expect(chip.className).toContain("max-[920px]:hidden");
    }
  });
});
