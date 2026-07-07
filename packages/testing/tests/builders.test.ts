import type { Lead, LeadCreateRequest, User } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  buildLead,
  buildLeadCreateRequest,
  buildLeads,
  buildUser,
  buildUsers,
  createFixtures,
} from "../src/builders.js";
import { patterns } from "../src/patterns.js";

describe("builders — determinismo", () => {
  it("mesma seed produz exatamente o mesmo User", () => {
    expect(buildUser({ seed: "determinismo" })).toEqual(buildUser({ seed: "determinismo" }));
  });

  it("mesma seed produz exatamente o mesmo Lead", () => {
    expect(buildLead({ seed: "determinismo" })).toEqual(buildLead({ seed: "determinismo" }));
  });

  it("seeds diferentes produzem entidades diferentes", () => {
    expect(buildUser({ seed: 1 })).not.toEqual(buildUser({ seed: 2 }));
    expect(buildLead({ seed: 1 })).not.toEqual(buildLead({ seed: 2 }));
  });

  it("séries são reprodutíveis (mesma seed → mesma série)", () => {
    expect(buildUsers(5, { seed: 99 })).toEqual(buildUsers(5, { seed: 99 }));
    expect(buildLeads(5, { seed: 99 })).toEqual(buildLeads(5, { seed: 99 }));
  });

  it("valores travados para seed fixa (garantia entre máquinas)", () => {
    // Snapshot inline: prova que a seed "psi-008" gera exatamente estes dados
    // em qualquer máquina. Se quebrar, o determinismo foi violado.
    expect(buildUser({ seed: "psi-008" })).toMatchInlineSnapshot(`
      {
        "createdAt": "2026-05-13T12:54:30Z",
        "email": "larissa.souza1119@teste.com.br",
        "id": "eb8af6b8-ce79-415e-9172-4c1abb5e7d4a",
        "name": "Larissa Souza",
      }
    `);
    expect(buildLead({ seed: "psi-008" })).toMatchInlineSnapshot(`
      {
        "createdAt": "2026-05-13T12:54:30Z",
        "email": "larissa.souza1119@teste.com.br",
        "id": "eb8af6b8-ce79-415e-9172-4c1abb5e7d4a",
        "name": "Larissa Souza",
        "whatsapp": "+5541901985864",
      }
    `);
  });

  it("fábrica gera sequência determinística com entidades distintas", () => {
    const a = createFixtures("sequencia");
    const b = createFixtures("sequencia");
    const usersA = [a.user(), a.user(), a.user()];
    const usersB = [b.user(), b.user(), b.user()];
    expect(usersA).toEqual(usersB);

    const ids = new Set(usersA.map((user) => user.id));
    expect(ids.size).toBe(3);
  });

  it("reset() da fábrica repete a série do início", () => {
    const fixtures = createFixtures("reset");
    const first = fixtures.user();
    fixtures.user();
    fixtures.reset();
    expect(fixtures.user()).toEqual(first);
  });
});

describe("builders — overrides", () => {
  it("overrides parciais tipados sobrepõem os valores gerados", () => {
    const user = buildUser({
      seed: 10,
      overrides: { name: "Nome Fixado", email: "fixa@exemplo.com.br" },
    });
    expect(user.name).toBe("Nome Fixado");
    expect(user.email).toBe("fixa@exemplo.com.br");
    expect(user.id).toMatch(patterns.uuid); // demais campos continuam gerados
  });

  it("overrides não afetam o determinismo das entidades seguintes", () => {
    const plain = createFixtures("overrides");
    const overridden = createFixtures("overrides");
    plain.user();
    overridden.user({ name: "Outra Pessoa" });
    expect(overridden.user()).toEqual(plain.user()); // segunda entidade idêntica
  });

  it("overrides funcionam em leads e em séries", () => {
    const lead = buildLead({ seed: 11, overrides: { whatsapp: "+5511990000000" } });
    expect(lead.whatsapp).toBe("+5511990000000");

    const users = buildUsers(3, { seed: 12, overrides: { name: "Mesma Pessoa" } });
    expect(users.map((user) => user.name)).toEqual([
      "Mesma Pessoa",
      "Mesma Pessoa",
      "Mesma Pessoa",
    ]);
    expect(new Set(users.map((user) => user.id)).size).toBe(3);
  });
});

describe("builders — formatos dos contratos", () => {
  const fixtures = createFixtures("formatos");
  const users = fixtures.users(25);
  const leads = fixtures.leads(25);

  it("ids são UUID v4", () => {
    for (const entity of [...users, ...leads]) {
      expect(entity.id).toMatch(patterns.uuid);
    }
  });

  it("e-mails são válidos", () => {
    for (const entity of [...users, ...leads]) {
      expect(entity.email).toMatch(patterns.email);
    }
  });

  it("whatsapp segue o schema WhatsAppBR (+55 + DDD sem zero + 9 + 8 dígitos)", () => {
    for (const lead of leads) {
      expect(lead.whatsapp).toMatch(patterns.whatsAppBR);
    }
  });

  it("createdAt é instante ISO 8601 UTC válido", () => {
    for (const entity of [...users, ...leads]) {
      expect(entity.createdAt).toMatch(patterns.isoDateTime);
      expect(Number.isNaN(Date.parse(entity.createdAt))).toBe(false);
    }
  });

  it("leadCreateRequest tem os campos do formulário nos formatos corretos", () => {
    const request = buildLeadCreateRequest({ seed: "form" });
    expect(request.name.length).toBeGreaterThan(0);
    expect(request.email).toMatch(patterns.email);
    expect(request.whatsapp).toMatch(patterns.whatsAppBR);
    expect(request).not.toHaveProperty("id");
    expect(request).not.toHaveProperty("createdAt");
  });
});

describe("builders — tipagem pelos contratos", () => {
  it("retornos são atribuíveis aos tipos gerados de @psiops/contracts", () => {
    // Falha em typecheck (não em runtime) se os builders divergirem dos tipos.
    const user: User = buildUser();
    const lead: Lead = buildLead();
    const request: LeadCreateRequest = buildLeadCreateRequest();
    expect(user).toBeDefined();
    expect(lead).toBeDefined();
    expect(request).toBeDefined();
  });
});
