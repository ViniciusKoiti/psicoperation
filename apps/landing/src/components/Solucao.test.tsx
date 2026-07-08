import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Solucao } from "./Solucao";

describe("Solucao", () => {
  it("renderiza o header (eyebrow + h2) e a seção com id #solucao (spec §1.4)", () => {
    render(<Solucao />);

    expect(document.getElementById("solucao")).not.toBeNull();
    expect(screen.getByText("A solução")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Tudo em um lugar, finalmente." }),
    ).toBeInTheDocument();
  });

  it("renderiza as 3 feature rows com badge, título e texto idênticos à referência", () => {
    render(<Solucao />);

    expect(screen.getByText("Cadastro")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Carteira de pacientes mensalistas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cadastre cada paciente uma vez. Defina o valor da mensalidade e o dia de vencimento. Pronto — o sistema acompanha tudo para você.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Automático")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Lembretes automáticos pelo WhatsApp" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure uma vez e esqueça. Antes do vencimento, o sistema avisa seu paciente educadamente. Você só entra em cena quando precisa.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Sem conta de cabeça")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Juros calculados automaticamente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Defina a regra uma vez — 1% ao mês, multa de 2%, o que fizer sentido pra você — e o sistema aplica em todos os atrasos. Sem conta de cabeça, sem erro.",
      ),
    ).toBeInTheDocument();
  });

  it("renderiza os três visuais da Solução (carteira, WhatsApp e calculadora de juros)", () => {
    render(<Solucao />);

    expect(screen.getByTestId("patient-wallet-list")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-mock")).toBeInTheDocument();
    expect(screen.getByTestId("interest-calculator-card")).toBeInTheDocument();
  });

  it("a feature 2 (WhatsApp) inverte o lado: texto antes do visual no DOM (spec §1.4/§7)", () => {
    render(<Solucao />);

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Lembretes automáticos pelo WhatsApp",
    });
    const row = heading.closest(".psi-feature");
    expect(row).not.toBeNull();

    const children = Array.from(row!.children);
    const contentIndex = children.findIndex((el) => el.contains(heading));
    const visualIndex = children.findIndex((el) =>
      el.contains(screen.getByTestId("whatsapp-mock")),
    );
    expect(contentIndex).toBeLessThan(visualIndex);
  });
});
