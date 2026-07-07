/**
 * Helpers Vitest do @psiops/testing (subpath `@psiops/testing/vitest`).
 *
 * Ficam em um entry point separado porque importam `vitest` (peer dependency
 * opcional): quem consome só os builders/stores não precisa do runner.
 */
import { beforeEach, expect } from "vitest";

import { type Resettable } from "../adapters.js";
import { Fixtures } from "../builders.js";
import { patterns } from "../patterns.js";
import { DEFAULT_SEED, type Seed } from "../random.js";

/**
 * Registra um `beforeEach` que chama `reset()` em cada alvo (stores em
 * memória, fábricas de fixtures, mock adapters…), garantindo estado limpo e
 * determinístico entre testes. Chamar no topo do arquivo ou dentro de um
 * `describe`.
 */
export function resetBetweenTests(...resettables: readonly Resettable[]): void {
  beforeEach(() => {
    for (const resettable of resettables) {
      resettable.reset();
    }
  });
}

/**
 * Cria uma fábrica de fixtures e a reinicia antes de cada teste: todo teste
 * enxerga a mesma sequência determinística desde o início, independentemente
 * da ordem de execução.
 */
export function useFixtures(seed: Seed = DEFAULT_SEED): Fixtures {
  const fixtures = new Fixtures(seed);
  beforeEach(() => {
    fixtures.reset();
  });
  return fixtures;
}

function expectStringMatching(
  value: unknown,
  pattern: RegExp,
  label: string,
): asserts value is string {
  expect(value, `esperava ${label}, recebi: ${JSON.stringify(value)}`).toBeTypeOf("string");
  expect(value).toMatch(pattern);
}

/** Afirma que o valor é um UUID v4 (formato dos ids dos contratos). */
export function expectUuid(value: unknown): void {
  expectStringMatching(value, patterns.uuid, "um UUID v4");
}

/** Afirma que o valor é um e-mail estruturalmente válido. */
export function expectEmail(value: unknown): void {
  expectStringMatching(value, patterns.email, "um e-mail válido");
}

/** Afirma que o valor é um WhatsApp brasileiro E.164 (schema WhatsAppBR). */
export function expectWhatsAppBR(value: unknown): void {
  expectStringMatching(value, patterns.whatsAppBR, "um WhatsApp brasileiro E.164");
}

/** Afirma que o valor é uma data civil ISO 8601 válida (schema IsoDate). */
export function expectIsoDate(value: unknown): void {
  expectStringMatching(value, patterns.isoDate, "uma data ISO 8601 (YYYY-MM-DD)");
  expect(Number.isNaN(Date.parse(value)), `data inválida no calendário: ${value}`).toBe(false);
}

/** Afirma que o valor é um instante ISO 8601 UTC válido (schema IsoDateTime). */
export function expectIsoDateTime(value: unknown): void {
  expectStringMatching(value, patterns.isoDateTime, "um instante ISO 8601 UTC");
  expect(Number.isNaN(Date.parse(value)), `instante inválido: ${value}`).toBe(false);
}
