/**
 * Infraestrutura reutilizável de mock adapters em memória (ADR 0006).
 *
 * `InMemoryStore<T>` é o bloco genérico que os apps estendem ou compõem para
 * implementar seus `Mock*Adapter` (ex.: `MockLeadAdapter`, `MockAuthAdapter`)
 * sem rede nem banco. O estado vive em memória, é isolado por clonagem
 * estrutural e volta ao estado inicial com `reset()` — pensado para ser
 * zerado entre testes (ver helpers em `@psiops/testing/vitest`).
 *
 * Mocks são padrão em desenvolvimento e testes e proibidos em build de
 * produção (verificação automatizada chega com as integrações HTTP reais).
 */

/** Qualquer coisa cujo estado possa voltar ao inicial entre testes. */
export interface Resettable {
  reset(): void;
}

export interface InMemoryStoreOptions<T> {
  /**
   * Extrai o identificador de um item. Padrão: propriedade `id` (string).
   */
  getId?: (item: T) => string;
  /**
   * Itens presentes no estado inicial (restaurados por `reset()`).
   */
  initialItems?: readonly T[];
}

function defaultGetId<T>(item: T): string {
  const id = (item as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0) {
    throw new TypeError(
      "InMemoryStore: item sem propriedade `id` string — informe `getId` nas opções",
    );
  }
  return id;
}

/**
 * Repositório fake genérico com estado em memória.
 *
 * Leituras e escritas clonam os itens (via `structuredClone`), então mutações
 * externas nunca vazam para o estado interno — o comportamento imita um
 * armazenamento real por valor.
 */
export class InMemoryStore<T> implements Resettable {
  private readonly getId: (item: T) => string;
  private readonly initialItems: readonly T[];
  private items = new Map<string, T>();

  constructor(options: InMemoryStoreOptions<T> = {}) {
    this.getId = options.getId ?? defaultGetId;
    this.initialItems = structuredClone(options.initialItems ?? []);
    this.reset();
  }

  /** Quantidade de itens armazenados. */
  get size(): number {
    return this.items.size;
  }

  /** Insere ou substitui (upsert) o item; retorna o snapshot armazenado. */
  save(item: T): T {
    const stored = structuredClone(item);
    this.items.set(this.getId(stored), stored);
    return structuredClone(stored);
  }

  /** Insere ou substitui vários itens de uma vez. */
  saveAll(items: readonly T[]): T[] {
    return items.map((item) => this.save(item));
  }

  /** Verdadeiro se existe item com esse id. */
  has(id: string): boolean {
    return this.items.has(id);
  }

  /** Item pelo id, ou `undefined` se não existir. */
  get(id: string): T | undefined {
    const item = this.items.get(id);
    return item === undefined ? undefined : structuredClone(item);
  }

  /** Item pelo id; lança se não existir (útil em arrange de testes). */
  getOrThrow(id: string): T {
    const item = this.get(id);
    if (item === undefined) {
      throw new Error(`InMemoryStore: item não encontrado para id "${id}"`);
    }
    return item;
  }

  /** Todos os itens (opcionalmente filtrados), em ordem de inserção. */
  list(predicate?: (item: T) => boolean): T[] {
    const all = [...this.items.values()].map((item) => structuredClone(item));
    return predicate ? all.filter(predicate) : all;
  }

  /** Primeiro item que satisfaz o predicado, ou `undefined`. */
  find(predicate: (item: T) => boolean): T | undefined {
    return this.list(predicate)[0];
  }

  /** Remove o item pelo id; retorna `true` se algo foi removido. */
  delete(id: string): boolean {
    return this.items.delete(id);
  }

  /** Esvazia o store (sem restaurar os itens iniciais). */
  clear(): void {
    this.items.clear();
  }

  /** Restaura o estado inicial (itens de `initialItems`). */
  reset(): void {
    this.items = new Map(
      this.initialItems.map((item) => {
        const stored = structuredClone(item);
        return [this.getId(stored), stored] as const;
      }),
    );
  }
}

/** Açúcar para criar um `InMemoryStore<T>` sem `new`. */
export function createInMemoryStore<T>(options: InMemoryStoreOptions<T> = {}): InMemoryStore<T> {
  return new InMemoryStore(options);
}
