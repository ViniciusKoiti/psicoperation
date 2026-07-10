import type { Charge, ChargeStatus, Patient } from "@psiops/contracts";

import type { ChargeDraft, GenerateMonthlyChargesResult } from "../../adapters/charges";

/**
 * Helpers puros da tela de financeiro (PSI-037): navegação entre meses
 * (competência), rótulos pt-BR, agrupamento/totais por status e montagem
 * dos rascunhos de mensalidade a gerar. Mantidos fora de `FinancePage.tsx`
 * para serem testáveis sem montar componentes React — mesmo padrão de
 * `src/features/dashboard/dashboard.ts` e `src/features/patients/patientDetail.ts`.
 */

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasada: "Atrasada",
};

/** Ordem de exibição das seções de situação financeira (mesmo critério de `src/features/patients/patientDetail.ts`). */
export const CHARGE_STATUS_ORDER: readonly ChargeStatus[] = ["em_dia", "pendente", "atrasada"];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Formata uma `Competence` (`AAAA-MM`) como "Mês/AAAA" em pt-BR (ex.: "2026-07" → "Julho/2026"). Duplicado de `formatCompetence` (`src/features/patients/patientDetail.ts`) — ver docstring do módulo sobre duplicação deliberada por feature. */
export function formatCompetence(competence: string): string {
  const [year, month] = competence.split("-");
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? month;
  return `${monthName}/${year}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** Formata um `IsoDate` (`AAAA-MM-DD`) como `dd/mm/aaaa` em pt-BR, construindo a partir dos componentes (evita o deslocamento de fuso do `new Date(isoDate)` direto). Duplicado de `formatIsoDate`/`formatIsoDateLabel` já existentes em outras features. */
export function formatIsoDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

/** Competência (`AAAA-MM`) do mês-calendário LOCAL de `date`. */
export function toCompetence(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Desloca uma competência (`AAAA-MM`) em `delta` meses (negativo = meses
 * anteriores), cruzando limites de ano corretamente — usada pela navegação
 * "mês anterior"/"próximo mês" da tela de financeiro.
 */
export function shiftCompetence(competence: string, delta: number): string {
  const [year, month] = competence.split("-").map(Number);
  const shifted = new Date(year ?? 1970, (month ?? 1) - 1 + delta, 1);
  return toCompetence(shifted);
}

/** Agrupa cobranças por `ChargeStatus` (em_dia/pendente/atrasada) — critério de aceite do manifesto. */
export function groupChargesByStatus(charges: readonly Charge[]): Record<ChargeStatus, Charge[]> {
  const groups: Record<ChargeStatus, Charge[]> = { em_dia: [], pendente: [], atrasada: [] };
  for (const charge of charges) {
    groups[charge.status].push(charge);
  }
  return groups;
}

/** Soma os valores (centavos BRL inteiros) de um grupo de cobranças. */
export function sumChargeAmounts(charges: readonly Charge[]): number {
  return charges.reduce((total, charge) => total + charge.amount, 0);
}

/**
 * Constrói o `dueDate` (`AAAA-MM-DD`) de uma mensalidade a partir da
 * competência e do dia de vencimento do paciente (`Patient.billingDay`,
 * limitado a 1–28 pelo contrato — por isso sempre existe em qualquer mês,
 * sem precisar de `Date`/clamping). RESOLVE o open_question do manifesto
 * ("o dia de vencimento é fixo por paciente, global da conta ou informado
 * na geração do mês?"): o contrato (`packages/contracts`, fonte única) já
 * modela `billingDay` como campo POR PACIENTE — não há necessidade de um
 * dia global configurável na geração (ver open_question do PR sobre esta
 * decisão).
 */
export function buildDueDate(competence: string, billingDay: number): string {
  const [year, month] = competence.split("-");
  const day = String(billingDay).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Monta os rascunhos de mensalidade (`ChargeDraft`) do mês selecionado a
 * partir dos pacientes ativos (assumption do manifesto: "o valor da
 * mensalidade deriva do valor acordado por paciente" — `Patient.monthlyFee`,
 * campo OBRIGATÓRIO no contrato, então nunca há fallback para um valor
 * padrão de configurações a considerar aqui). Um rascunho por paciente; a
 * idempotência (não duplicar mensalidade já gerada) é responsabilidade do
 * `ChargesAdapter.generateMonthlyCharges` (chave paciente+competência), não
 * desta função — ela só monta a INTENÇÃO de gerar, sempre para todos os
 * pacientes ativos recebidos.
 */
export function buildChargeDraftsForMonth(patients: readonly Patient[], competence: string): ChargeDraft[] {
  return patients.map((patient) => ({
    patientId: patient.id,
    competence,
    amount: patient.monthlyFee,
    dueDate: buildDueDate(competence, patient.billingDay),
  }));
}

/**
 * Mensagem pt-BR do resumo de `generateMonthlyCharges` (critério de aceite:
 * "apresenta resumo do resultado"), como uma única string — evitada a
 * montagem via JSX multi-linha para não depender da regra de colapso de
 * espaços em branco do JSX entre expressões (fonte de bugs sutis de
 * espaçamento no texto renderizado).
 */
export function formatGenerateSummary(result: GenerateMonthlyChargesResult): string {
  const createdText = `${result.created.length} mensalidade(s) gerada(s)`;
  if (result.skipped.length === 0) return `${createdText}.`;
  return `${createdText}; ${result.skipped.length} já existia(m) para este mês (nenhuma duplicada).`;
}
