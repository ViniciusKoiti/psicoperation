import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhatsAppMock } from "./WhatsAppMock";

describe("WhatsAppMock", () => {
  it("renderiza o header (remetente/horário) e o balão com mensagem e recibo (spec §1.4)", () => {
    render(<WhatsAppMock />);

    expect(screen.getByText("PsiOps · Lembrete")).toBeInTheDocument();
    expect(screen.getByText("hoje, 09:02")).toBeInTheDocument();
    expect(screen.getByText("R$ 350")).toBeInTheDocument();
    expect(screen.getByText("3 dias")).toBeInTheDocument();
    expect(screen.getByText("Entregue ✓✓")).toBeInTheDocument();
  });
});
