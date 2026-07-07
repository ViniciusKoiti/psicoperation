/**
 * PRNG determinístico do @psiops/testing.
 *
 * Implementação própria (mulberry32 + hash FNV-1a para seeds string): apenas
 * aritmética inteira de 32 bits e uma divisão — o mesmo seed produz exatamente
 * a mesma sequência em qualquer máquina, SO ou versão de Node, sem depender
 * de biblioteca externa de dados fake.
 */

/** Seed aceita pelos utilitários do pacote: número inteiro ou string legível. */
export type Seed = number | string;

/** Seed padrão usada quando o chamador não informa uma. */
export const DEFAULT_SEED: Seed = "psiops";

/** Hash FNV-1a de 32 bits — converte seeds string em estado inicial numérico. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function toInitialState(seed: Seed): number {
  return typeof seed === "number" ? seed >>> 0 : fnv1a(seed);
}

/**
 * Gerador pseudoaleatório com seed explícita e sequência reprodutível.
 *
 * A mesma seed produz sempre a mesma sequência de valores; `reset()` volta
 * ao início da sequência.
 */
export class SeededRandom {
  readonly seed: Seed;
  private state: number;

  constructor(seed: Seed = DEFAULT_SEED) {
    this.seed = seed;
    this.state = toInitialState(seed);
  }

  /** Volta ao início da sequência (mesma seed → mesma sequência de novo). */
  reset(): void {
    this.state = toInitialState(this.seed);
  }

  /** Próximo número pseudoaleatório em `[0, 1)` (mulberry32). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro pseudoaleatório no intervalo fechado `[min, max]`. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new TypeError("int(min, max) requer inteiros");
    }
    if (max < min) {
      throw new RangeError(`int(min, max) requer min <= max (recebi ${min} > ${max})`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Um item pseudoaleatório de uma lista não vazia. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError("pick() requer uma lista não vazia");
    }
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Booleano pseudoaleatório com probabilidade `probability` de ser `true`. */
  boolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /** String com `count` dígitos decimais pseudoaleatórios. */
  digits(count: number): string {
    let out = "";
    for (let i = 0; i < count; i += 1) {
      out += String(this.int(0, 9));
    }
    return out;
  }

  /** UUID v4 (formato RFC 4122) derivado da sequência pseudoaleatória. */
  uuid(): string {
    const hexChars = "0123456789abcdef";
    let hex = "";
    for (let i = 0; i < 32; i += 1) {
      if (i === 12) {
        hex += "4"; // versão 4
      } else if (i === 16) {
        hex += this.pick(["8", "9", "a", "b"]); // variante RFC 4122
      } else {
        hex += hexChars.charAt(this.int(0, 15));
      }
    }
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }
}
