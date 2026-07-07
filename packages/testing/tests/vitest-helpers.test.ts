import type { Lead } from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import { InMemoryStore } from "../src/adapters.js";
import { buildLead, buildUser } from "../src/builders.js";
import {
  expectEmail,
  expectIsoDate,
  expectIsoDateTime,
  expectUuid,
  expectWhatsAppBR,
  resetBetweenTests,
  useFixtures,
} from "../src/vitest/index.js";

describe("resetBetweenTests", () => {
  const store = new InMemoryStore<Lead>({ initialItems: [buildLead({ seed: 1 })] });
  resetBetweenTests(store);

  it("primeiro teste suja o estado", () => {
    store.save(buildLead({ seed: 2 }));
    store.save(buildLead({ seed: 3 }));
    expect(store.size).toBe(3);
  });

  it("segundo teste enxerga o estado inicial restaurado", () => {
    expect(store.size).toBe(1);
  });
});

describe("useFixtures", () => {
  const fixtures = useFixtures("helper-seed");
  let firstSeen: string | undefined;

  it("gera a partir do início da sequência", () => {
    firstSeen = fixtures.user().id;
    fixtures.user(); // avança a sequência
    expect(firstSeen).toBeDefined();
  });

  it("recomeça a sequência a cada teste (independe da ordem)", () => {
    expect(fixtures.user().id).toBe(firstSeen);
  });
});

describe("asserções de formato", () => {
  it("aceitam os dados gerados pelos builders", () => {
    const user = buildUser({ seed: "assert" });
    const lead = buildLead({ seed: "assert" });
    expectUuid(user.id);
    expectEmail(user.email);
    expectIsoDateTime(user.createdAt);
    expectWhatsAppBR(lead.whatsapp);
    expectIsoDate("2026-07-05");
  });

  it("rejeitam valores fora dos formatos dos contratos", () => {
    expect(() => expectUuid("nao-e-uuid")).toThrow();
    expect(() => expectUuid(123)).toThrow();
    expect(() => expectEmail("sem-arroba")).toThrow();
    expect(() => expectWhatsAppBR("11990000000")).toThrow(); // sem +55
    expect(() => expectWhatsAppBR("+5501990000000")).toThrow(); // DDD com zero
    expect(() => expectWhatsAppBR("+55118 9000000")).toThrow();
    expect(() => expectIsoDate("05/07/2026")).toThrow();
    expect(() => expectIsoDateTime("2026-07-05 12:00:00")).toThrow(); // sem T/Z
    expect(() => expectIsoDateTime("2026-99-99T00:00:00Z")).toThrow(); // inválido no calendário
  });
});
