/**
 * Conversão/formatação de dinheiro para a feature de pacientes. Regra de
 * produto (inviolável, CLAUDE.md): dinheiro sempre em centavos inteiros BRL
 * na camada de dados/adapter (`Patient.monthlyFee`); a formatação em reais
 * (R$, pt-BR) é responsabilidade exclusiva desta camada de apresentação.
 * Mesmo padrão de `src/features/onboarding/money.ts` (PSI-031) — duplicado
 * aqui por feature, não compartilhado, para não criar acoplamento entre
 * features via refactor fora de escopo.
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor em centavos (inteiro) como moeda brasileira (ex.: 25000 → "R$ 250,00"). */
export function formatCentsAsBRL(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

/** Converte um valor em reais (o que o `NumberInput` do formulário mantém) para centavos inteiros. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Converte centavos para o valor em reais exibido/editado no `NumberInput`. */
export function centsToReais(cents: number): number {
  return cents / 100;
}
