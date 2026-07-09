/**
 * Conversão/formatação de dinheiro para o passo "valor padrão de sessão".
 * Regra de produto (inviolável, CLAUDE.md): dinheiro sempre em centavos
 * inteiros BRL na camada de dados/adapter; a formatação em reais (R$,
 * pt-BR) é responsabilidade exclusiva desta camada de apresentação.
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor em centavos (inteiro) como moeda brasileira (ex.: 15000 → "R$ 150,00"). */
export function formatCentsAsBRL(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

/** Converte um valor em reais (o que o `NumberInput` do passo 2 mantém) para centavos inteiros. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Converte centavos para o valor em reais exibido/editado no `NumberInput`. */
export function centsToReais(cents: number): number {
  return cents / 100;
}
