/**
 * Conversão/formatação de dinheiro para a feature de financeiro. Regra de
 * produto (inviolável, CLAUDE.md): dinheiro sempre em centavos inteiros BRL
 * na camada de dados/adapter (`Charge.amount`, `Patient.monthlyFee`); a
 * formatação em reais (R$, pt-BR) é responsabilidade exclusiva desta camada
 * de apresentação. Mesmo padrão de `src/features/patients/money.ts` —
 * duplicado aqui por feature, não compartilhado, para não criar acoplamento
 * entre features via refactor fora de escopo desta tarefa.
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um valor em centavos (inteiro) como moeda brasileira (ex.: 25000 → "R$ 250,00"). */
export function formatCentsAsBRL(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

/** Converte um valor em reais (o que um `NumberInput` mantém) para centavos inteiros, arredondando. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Converte centavos para o valor em reais exibido/editado em um `NumberInput`. */
export function centsToReais(cents: number): number {
  return cents / 100;
}
