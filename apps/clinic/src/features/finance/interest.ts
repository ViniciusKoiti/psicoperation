/**
 * Calculadora de juros simples (PSI-037), FUNÇÃO PURA sem efeitos
 * colaterais: recebe os dados de uma mensalidade em atraso e devolve o
 * valor atualizado — NUNCA altera a cobrança em si (fora de escopo do
 * manifesto: "aplicação automática de juros ao valor da mensalidade").
 *
 * PARIDADE COM A LANDING (critério de aceite do manifesto): mesmos campos e
 * mesma fórmula do card "Juros calculados automaticamente" (seção Solução,
 * `project/PsiOps Landing.html`, feature 3 — card da paciente "Carla Dias").
 * A landing é SOMENTE REFERÊNCIA de comportamento (arquivo `project/**` é
 * leitura, nunca alterado); esta função é a fonte de verdade do app — os
 * testes (`interest.test.ts`) fixam o exemplo exato do card como caso de
 * paridade, então uma mudança na landing não quebra este módulo (e
 * vice-versa) silenciosamente, ela só fica documentada aqui.
 *
 * O card mostra, para uma mensalidade de R$ 350,00 (35000 centavos)
 * atrasada há 4 dias, com juros de 1% a.m. e multa de 2%:
 *
 * - Juros (1% a.m.): R$ 0,47   → pró-rata dia: 350 × 1% × (4/30) ≈ R$ 0,4667 → arredonda para R$ 0,47
 * - Multa (2%): R$ 7,00        → aplicada uma única vez sobre o valor original: 350 × 2% = R$ 7,00
 * - Total atualizado: R$ 357,47 → valor original + juros + multa
 *
 * Ou seja, os MESMOS campos do card (valor original, dias de atraso, taxa
 * de juros ao mês, percentual de multa) e a MESMA fórmula: juros simples
 * pró-rata dia (assumption do manifesto) sobre o valor original, mais uma
 * multa fixa (não pró-rata) também sobre o valor original, tudo somado ao
 * valor original para o total atualizado.
 *
 * DINHEIRO É SAGRADO (CLAUDE.md): toda a aritmética opera sobre centavos
 * inteiros BRL — nunca ponto flutuante para dinheiro na camada de dados. Os
 * termos intermediários (juros/multa) SÃO ponto flutuante durante o
 * cálculo (a fórmula multiplica por percentuais e frações de dias), mas o
 * resultado de cada termo é arredondado para o centavo mais próximo
 * (`Math.round`, arredondamento determinístico — nunca trunca) ANTES de
 * somar ao valor original, para que o total nunca acumule erro de
 * ponto flutuante visível na UI.
 */

/** Dias corridos considerados em um mês, para o pró-rata dos juros (assumption do manifesto, mesmo critério do card da landing). */
const DAYS_PER_MONTH = 30;

export interface SimpleInterestCalculatorInput {
  /** Valor original da mensalidade em atraso, em centavos BRL inteiros. */
  amountCents: number;
  /**
   * Dias corridos de atraso. `0` (ou negativo) significa "ainda não
   * atrasada": a calculadora não aplica juros nem multa e devolve o valor
   * original sem alteração (caso de borda documentado no manifesto —
   * consistente com a regra de que uma mensalidade só vira `"atrasada"` no
   * dia SEGUINTE ao vencimento, nunca no próprio dia).
   */
  overdueDays: number;
  /**
   * Taxa de juros simples ao mês, em percentual (ex.: `1` = 1% a.m.),
   * aplicada de forma linear e pró-rata dia (`overdueDays / 30`) — mesmo
   * campo/fórmula do card da landing (`SimpleInterestParams.monthlyRatePercent`
   * no contrato, `@psiops/contracts`).
   */
  monthlyRatePercent: number;
  /**
   * Percentual de multa única aplicada sobre o valor original quando a
   * cobrança está em atraso (ex.: `2` = 2%), SEM pró-rata — mesmo campo do
   * card da landing (`SimpleInterestParams.finePercent` no contrato).
   */
  finePercent: number;
}

export interface SimpleInterestCalculatorResult {
  /** Juros pró-rata dia sobre `amountCents`, em centavos inteiros (arredondado). */
  interestCents: number;
  /** Multa única sobre `amountCents`, em centavos inteiros (arredondado). */
  fineCents: number;
  /** `amountCents + interestCents + fineCents` — o "total atualizado" exibido no card. */
  totalCents: number;
}

/** Arredonda um valor em centavos (possivelmente fracionário) para o centavo inteiro mais próximo — `Math.round` arredonda `,5` para cima, determinístico e sempre o mesmo resultado para a mesma entrada. */
function roundToCent(value: number): number {
  return Math.round(value);
}

/**
 * Calcula o valor atualizado (juros + multa) de uma mensalidade em atraso.
 * Ver a doc do módulo para a fórmula e o exemplo de paridade com a landing.
 */
export function calculateOverdueAmount(input: SimpleInterestCalculatorInput): SimpleInterestCalculatorResult {
  const { amountCents, overdueDays, monthlyRatePercent, finePercent } = input;

  if (overdueDays <= 0) {
    return { interestCents: 0, fineCents: 0, totalCents: amountCents };
  }

  const interestCents = roundToCent((amountCents * monthlyRatePercent * overdueDays) / (100 * DAYS_PER_MONTH));
  const fineCents = roundToCent((amountCents * finePercent) / 100);

  return { interestCents, fineCents, totalCents: amountCents + interestCents + fineCents };
}
