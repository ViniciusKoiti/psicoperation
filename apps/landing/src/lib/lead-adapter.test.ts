import { describe, expect, it } from "vitest";

import { createInMemoryLeadAdapter } from "./lead-adapter";

describe("createInMemoryLeadAdapter", () => {
  it("resolve com um Lead completo (id + createdAt) a partir do payload, sem chamada de rede", async () => {
    const adapter = createInMemoryLeadAdapter();

    const lead = await adapter.submit({
      name: "Ana Beatriz Souza",
      whatsapp: "+5511990000000",
      email: "ana@exemplo.com.br",
    });

    expect(lead.name).toBe("Ana Beatriz Souza");
    expect(lead.whatsapp).toBe("+5511990000000");
    expect(lead.email).toBe("ana@exemplo.com.br");
    expect(typeof lead.id).toBe("string");
    expect(lead.id.length).toBeGreaterThan(0);
    expect(typeof lead.createdAt).toBe("string");
  });

  it("cada instância mantém sua própria lista em memória (sem estado compartilhado global)", async () => {
    const first = createInMemoryLeadAdapter();
    const second = createInMemoryLeadAdapter();

    const leadA = await first.submit({
      name: "A",
      whatsapp: "+5511990000000",
      email: "a@exemplo.com.br",
    });
    const leadB = await second.submit({
      name: "B",
      whatsapp: "+5521990000000",
      email: "b@exemplo.com.br",
    });

    expect(leadA.id).not.toBe(leadB.id);
  });
});
