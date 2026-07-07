import type { Lead } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { InMemoryStore, createInMemoryStore } from "../src/adapters.js";
import { buildLead, buildLeads, createFixtures } from "../src/builders.js";

describe("InMemoryStore", () => {
  it("save + get: armazena e retorna itens pelo id", () => {
    const store = new InMemoryStore<Lead>();
    const lead = buildLead({ seed: 1 });
    store.save(lead);
    expect(store.get(lead.id)).toEqual(lead);
    expect(store.has(lead.id)).toBe(true);
    expect(store.size).toBe(1);
  });

  it("get retorna undefined (e getOrThrow lança) para id inexistente", () => {
    const store = new InMemoryStore<Lead>();
    expect(store.get("nao-existe")).toBeUndefined();
    expect(() => store.getOrThrow("nao-existe")).toThrow(/não encontrado/);
  });

  it("save é upsert: substitui item com o mesmo id", () => {
    const store = new InMemoryStore<Lead>();
    const lead = buildLead({ seed: 2 });
    store.save(lead);
    store.save({ ...lead, name: "Nome Atualizado" });
    expect(store.size).toBe(1);
    expect(store.getOrThrow(lead.id).name).toBe("Nome Atualizado");
  });

  it("list preserva a ordem de inserção e aceita predicado", () => {
    const store = new InMemoryStore<Lead>();
    const leads = buildLeads(3, { seed: 3 });
    store.saveAll(leads);
    expect(store.list()).toEqual(leads);
    const [first] = leads;
    expect(store.list((lead) => lead.id === first?.id)).toEqual([first]);
  });

  it("find retorna o primeiro item que satisfaz o predicado", () => {
    const store = new InMemoryStore<Lead>();
    const leads = buildLeads(3, { seed: 4 });
    store.saveAll(leads);
    expect(store.find((lead) => lead.email === leads[1]?.email)).toEqual(leads[1]);
    expect(store.find(() => false)).toBeUndefined();
  });

  it("delete remove pelo id e informa se removeu", () => {
    const store = new InMemoryStore<Lead>();
    const lead = buildLead({ seed: 5 });
    store.save(lead);
    expect(store.delete(lead.id)).toBe(true);
    expect(store.delete(lead.id)).toBe(false);
    expect(store.size).toBe(0);
  });

  it("clear esvazia; reset restaura os itens iniciais", () => {
    const initial = buildLeads(2, { seed: 6 });
    const store = new InMemoryStore<Lead>({ initialItems: initial });
    expect(store.list()).toEqual(initial);

    store.save(buildLead({ seed: 7 }));
    expect(store.size).toBe(3);

    store.clear();
    expect(store.size).toBe(0);

    store.reset();
    expect(store.list()).toEqual(initial);
  });

  it("isola estado por clonagem: mutações externas não vazam", () => {
    const store = new InMemoryStore<Lead>();
    const lead = buildLead({ seed: 8 });
    store.save(lead);

    lead.name = "Mutação Externa";
    expect(store.getOrThrow(lead.id).name).not.toBe("Mutação Externa");

    const read = store.getOrThrow(lead.id);
    read.name = "Outra Mutação";
    expect(store.getOrThrow(lead.id).name).not.toBe("Outra Mutação");
  });

  it("aceita getId customizado para itens sem propriedade id", () => {
    interface Session {
      token: string;
      userId: string;
    }
    const store = createInMemoryStore<Session>({ getId: (session) => session.token });
    store.save({ token: "abc", userId: "u1" });
    expect(store.getOrThrow("abc").userId).toBe("u1");
  });

  it("lança erro claro quando o item não tem id e não há getId", () => {
    const store = new InMemoryStore<{ name: string }>();
    expect(() => store.save({ name: "sem id" })).toThrow(/getId/);
  });

  it("serve de base para mock adapters de domínio (padrão ADR 0006)", () => {
    // Exemplo do padrão que os apps seguem: adapter de domínio composto
    // sobre o store genérico, com regra de negócio própria (e-mail único).
    const fixtures = createFixtures("adapter-demo");

    class MockLeadAdapter {
      private readonly store = new InMemoryStore<Lead>();

      create(input: { name: string; whatsapp: string; email: string }): Lead {
        if (this.store.find((lead) => lead.email === input.email)) {
          throw new Error("e-mail já cadastrado na lista de espera");
        }
        return this.store.save(fixtures.lead(input));
      }

      list(): Lead[] {
        return this.store.list();
      }

      reset(): void {
        this.store.reset();
        fixtures.reset();
      }
    }

    const adapter = new MockLeadAdapter();
    const created = adapter.create({
      name: "Ana Beatriz Souza",
      whatsapp: "+5511990000000",
      email: "ana@exemplo.com.br",
    });
    expect(adapter.list()).toEqual([created]);
    expect(() =>
      adapter.create({ name: "Outra", whatsapp: "+5521990000000", email: "ana@exemplo.com.br" }),
    ).toThrow(/já cadastrado/);

    adapter.reset();
    expect(adapter.list()).toEqual([]);
  });
});
