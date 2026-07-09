import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FAQ_ITEMS, Faq } from "./Faq";

describe("Faq", () => {
  it("renderiza o header (eyebrow + h2) e a seção com id #faq (spec §1.8)", () => {
    render(<Faq />);

    expect(document.getElementById("faq")).not.toBeNull();
    expect(screen.getByText("Dúvidas")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Perguntas que você pode ter" }),
    ).toBeInTheDocument();
  });

  it("renderiza as 5 perguntas idênticas à referência, todas fechadas inicialmente", () => {
    render(<Faq />);

    for (const item of FAQ_ITEMS) {
      const button = screen.getByRole("button", { name: item.question });
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("clicar em uma pergunta abre a resposta (aria-expanded true) e revela o painel", () => {
    render(<Faq />);

    const firstButton = screen.getByRole("button", { name: FAQ_ITEMS[0]!.question });
    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute("aria-expanded", "true");
    const panelId = firstButton.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText(FAQ_ITEMS[0]!.answer)).toBeInTheDocument();
  });

  it("apenas um item fica aberto por vez: abrir outro fecha o anteriormente aberto", () => {
    render(<Faq />);

    const firstButton = screen.getByRole("button", { name: FAQ_ITEMS[0]!.question });
    const secondButton = screen.getByRole("button", { name: FAQ_ITEMS[1]!.question });

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(secondButton);
    expect(secondButton).toHaveAttribute("aria-expanded", "true");
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
  });

  it("clicar no item aberto o fecha (toggle)", () => {
    render(<Faq />);

    const firstButton = screen.getByRole("button", { name: FAQ_ITEMS[0]!.question });

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
  });
});
