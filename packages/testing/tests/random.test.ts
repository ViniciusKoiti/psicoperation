import { describe, expect, it } from "vitest";

import { patterns } from "../src/patterns.js";
import { DEFAULT_SEED, SeededRandom } from "../src/random.js";

describe("SeededRandom", () => {
  it("mesma seed produz exatamente a mesma sequência", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("seeds diferentes produzem sequências diferentes", () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("seeds string são estáveis (hash FNV-1a determinístico)", () => {
    const a = new SeededRandom("psiops");
    const b = new SeededRandom("psiops");
    expect(a.next()).toBe(b.next());
    expect(a.int(0, 1000)).toBe(b.int(0, 1000));
  });

  it("reset() volta ao início da sequência", () => {
    const rng = new SeededRandom(7);
    const first = [rng.next(), rng.next(), rng.next()];
    rng.reset();
    const again = [rng.next(), rng.next(), rng.next()];
    expect(again).toEqual(first);
  });

  it("valores conhecidos para uma seed fixa (garantia entre máquinas)", () => {
    // Valores travados: se este teste quebrar, o algoritmo do PRNG mudou e
    // TODOS os snapshots dos consumidores quebram junto. Não altere sem major.
    const rng = new SeededRandom(2026);
    expect(rng.next()).toBeCloseTo(0.45540769933722913, 15);
    expect(rng.int(0, 99)).toBe(30);
    expect(rng.digits(4)).toHaveLength(4);
  });

  it("int() respeita o intervalo fechado e valida argumentos", () => {
    const rng = new SeededRandom(3);
    for (let i = 0; i < 200; i += 1) {
      const value = rng.int(5, 8);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(8);
    }
    expect(rng.int(4, 4)).toBe(4);
    expect(() => rng.int(2, 1)).toThrow(RangeError);
    expect(() => rng.int(0.5, 2)).toThrow(TypeError);
  });

  it("pick() escolhe um item da lista e rejeita lista vazia", () => {
    const rng = new SeededRandom(4);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(rng.pick(items));
    }
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("digits() gera somente dígitos decimais", () => {
    const rng = new SeededRandom(5);
    expect(rng.digits(12)).toMatch(/^\d{12}$/);
  });

  it("uuid() gera UUID v4 válido e determinístico", () => {
    const a = new SeededRandom("uuid-seed");
    const b = new SeededRandom("uuid-seed");
    const uuid = a.uuid();
    expect(uuid).toMatch(patterns.uuid);
    expect(uuid).toBe(b.uuid());
    expect(a.uuid()).not.toBe(uuid); // sequência avança
  });

  it("usa DEFAULT_SEED quando nenhuma seed é informada", () => {
    const a = new SeededRandom();
    const b = new SeededRandom(DEFAULT_SEED);
    expect(a.next()).toBe(b.next());
  });
});
