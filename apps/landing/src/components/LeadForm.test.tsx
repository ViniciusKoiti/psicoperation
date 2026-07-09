import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { leadAdapter } from "../lib/lead-adapter";
import { LeadForm } from "./LeadForm";

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Nome completo"), {
    target: { value: "Ana Beatriz Souza" },
  });
  fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "11990000000" } });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "ana@exemplo.com.br" },
  });
}

describe("LeadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza a seção #lista com os 3 campos e o texto de referência (spec §1.7)", () => {
    render(<LeadForm />);

    expect(screen.getByTestId("lead-form-section")).toHaveAttribute("id", "lista");
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entre na lista de espera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quero acesso antecipado" })).toBeInTheDocument();
  });

  it("aplica a máscara (XX) XXXXX-XXXX no campo WhatsApp conforme os dígitos chegam (digitação parcial)", () => {
    render(<LeadForm />);
    const whatsapp = screen.getByLabelText("WhatsApp") as HTMLInputElement;

    fireEvent.change(whatsapp, { target: { value: "1" } });
    expect(whatsapp.value).toBe("(1");

    fireEvent.change(whatsapp, { target: { value: "1199" } });
    expect(whatsapp.value).toBe("(11) 99");

    fireEvent.change(whatsapp, { target: { value: "11990000000" } });
    expect(whatsapp.value).toBe("(11) 99000-0000");
  });

  it("lida com colagem de um valor completo de uma vez (evento único com o valor inteiro)", () => {
    render(<LeadForm />);
    const whatsapp = screen.getByLabelText("WhatsApp") as HTMLInputElement;

    fireEvent.change(whatsapp, { target: { value: "11990000000" } });

    expect(whatsapp.value).toBe("(11) 99000-0000");
  });

  it("lida com apagamento (valor volta a ficar parcial/vazio sem quebrar)", () => {
    render(<LeadForm />);
    const whatsapp = screen.getByLabelText("WhatsApp") as HTMLInputElement;

    fireEvent.change(whatsapp, { target: { value: "11990000000" } });
    expect(whatsapp.value).toBe("(11) 99000-0000");

    fireEvent.change(whatsapp, { target: { value: "" } });
    expect(whatsapp.value).toBe("");
  });

  it("bloqueia o submit com campos vazios e mostra erro inline por campo", () => {
    const submitSpy = vi.spyOn(leadAdapter, "submit");
    render(<LeadForm />);

    fireEvent.click(screen.getByRole("button", { name: "Quero acesso antecipado" }));

    const nameField = screen.getByLabelText("Nome completo");
    expect(nameField).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu WhatsApp.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("rejeita um WhatsApp incompleto mesmo com nome e e-mail válidos", () => {
    render(<LeadForm />);

    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Ana Beatriz Souza" },
    });
    fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "119900" } });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@exemplo.com.br" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Quero acesso antecipado" }));

    expect(screen.getByText("Informe um WhatsApp completo, com DDD.")).toBeInTheDocument();
  });

  it("limpa o erro do campo assim que o valor é corrigido", () => {
    render(<LeadForm />);

    fireEvent.click(screen.getByRole("button", { name: "Quero acesso antecipado" }));
    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana" } });

    expect(screen.queryByText("Informe seu nome completo.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).not.toHaveAttribute("aria-invalid");
  });

  it("no submit válido, envia via LeadAdapter normalizando o WhatsApp para E.164 e mostra o estado de sucesso", async () => {
    const submitSpy = vi.spyOn(leadAdapter, "submit");
    render(<LeadForm />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Quero acesso antecipado" }));

    await waitFor(() => {
      expect(screen.getByTestId("lead-success")).toBeInTheDocument();
    });

    expect(submitSpy).toHaveBeenCalledWith({
      name: "Ana Beatriz Souza",
      whatsapp: "+5511990000000",
      email: "ana@exemplo.com.br",
    });

    expect(screen.getByRole("heading", { name: "Você está na lista!" })).toBeInTheDocument();
    expect(screen.queryByTestId("lead-form")).not.toBeInTheDocument();
  });

  it("nunca faz chamada de rede (fetch) durante o submit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<LeadForm />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Quero acesso antecipado" }));

    await waitFor(() => {
      expect(screen.getByTestId("lead-success")).toBeInTheDocument();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
