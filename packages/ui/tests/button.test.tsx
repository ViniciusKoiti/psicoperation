import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { Button } from "../src/components/index.js";

describe("Button", () => {
  it("renderiza um <button type='button'> com a variante primary por padrão", () => {
    render(<Button>Quero acesso antecipado</Button>);
    const button = screen.getByRole("button", {
      name: "Quero acesso antecipado",
    });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("psi-btn", "psi-btn--primary");
    expect(button).not.toHaveClass("psi-btn--compact", "psi-btn--lg");
  });

  it.each([
    ["primary", "psi-btn--primary"],
    ["ghost", "psi-btn--ghost"],
    ["white", "psi-btn--white"],
  ] as const)("aplica a classe da variante %s", (variant, expected) => {
    render(<Button variant={variant}>Rótulo</Button>);
    expect(screen.getByRole("button", { name: "Rótulo" })).toHaveClass("psi-btn", expected);
  });

  it.each([
    ["compact", "psi-btn--compact"],
    ["lg", "psi-btn--lg"],
  ] as const)("aplica a classe do tamanho %s", (size, expected) => {
    render(<Button size={size}>Rótulo</Button>);
    expect(screen.getByRole("button", { name: "Rótulo" })).toHaveClass(expected);
  });

  it("respeita type explícito (submit do lead form)", () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("type", "submit");
  });

  it("renderiza como link quando recebe href (CTAs de âncora)", () => {
    render(
      <Button href="#lista" variant="white">
        Quero acesso antecipado
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Quero acesso antecipado" });
    expect(link).toHaveAttribute("href", "#lista");
    expect(link).toHaveClass("psi-btn", "psi-btn--white");
    expect(link).not.toHaveAttribute("type");
  });

  it("renderiza o ícone após o rótulo (seta do btn-ghost do hero)", () => {
    render(
      <Button variant="ghost" icon={<svg data-testid="icone" aria-hidden="true" />}>
        Ver como funciona
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Ver como funciona" });
    const icon = screen.getByTestId("icone");
    expect(button).toContainElement(icon);
    expect(button.lastElementChild).toBe(icon);
  });

  it("dispara onClick e respeita disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Enviando…
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Enviando…" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("mescla className e repassa atributos ARIA", () => {
    render(
      <Button className="extra" aria-label="Abrir lista de espera">
        CTA
      </Button>,
    );
    const button = screen.getByRole("button", {
      name: "Abrir lista de espera",
    });
    expect(button).toHaveClass("psi-btn", "psi-btn--primary", "extra");
  });
});
