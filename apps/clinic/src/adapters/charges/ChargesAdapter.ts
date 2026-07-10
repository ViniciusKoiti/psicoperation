import type { Charge, RegisterPaymentRequest, SimpleInterestParams } from "@psiops/contracts";

import type { ChargesReadAdapter } from "./ChargesReadAdapter";

/**
 * Rascunho de UMA mensalidade a gerar para um paciente/competência —
 * montado pela camada de apresentação (`buildChargeDraftsForMonth`,
 * `src/features/finance/finance.ts`) a partir de `PatientsAdapter.listPatients`
 * (pacientes ativos, `monthlyFee`/`billingDay`) e passado para
 * `ChargesAdapter.generateMonthlyCharges`. Não é um DTO redeclarado: espelha
 * exatamente o corpo de `operations["createCharge"]` (`POST /charges`), sem
 * `interest` obrigatório porque o contrato também o trata como opcional.
 */
export interface ChargeDraft {
  patientId: string;
  competence: string;
  amount: number;
  dueDate: string;
  interest?: SimpleInterestParams;
}

/**
 * Resumo de `generateMonthlyCharges` (critério de aceite do manifesto:
 * "apresenta resumo do resultado"): `created` são as cobranças
 * efetivamente emitidas nesta chamada; `skipped` são os rascunhos que já
 * tinham uma cobrança para o mesmo paciente+competência (idempotência —
 * ver a doc de `generateMonthlyCharges`), na ordem em que apareceram em
 * `drafts`.
 */
export interface GenerateMonthlyChargesResult {
  created: Charge[];
  skipped: ChargeDraft[];
}

/**
 * Interface completa de cobranças/mensalidades (PSI-037): estende
 * `ChargesReadAdapter` (leitura, PSI-034/032) com as três operações de
 * escrita da tela de financeiro. Ver a nota de reconciliação na doc de
 * `ChargesReadAdapter` — mesmo padrão de `AgendaAdapter extends
 * AppointmentsReadAdapter` (PSI-035).
 *
 * Implementações: `MockChargesAdapter` (memória, padrão dev/test) e
 * `HttpChargesAdapter` (tipada pelo contrato, sem exercício ponta a ponta
 * nesta tarefa — PSI-044). Ponto de composição único em `./index.ts`.
 */
export interface ChargesAdapter extends ChargesReadAdapter {
  /**
   * Cria uma cobrança por rascunho (`POST /charges` por item, o único
   * formato que o contrato expõe — não há endpoint de emissão em lote),
   * IDEMPOTENTE pela chave paciente+competência: um rascunho cujo paciente
   * já tem uma cobrança na mesma competência é IGNORADO (não duplica, não
   * sobrescreve a cobrança existente) e volta em `skipped`, nunca rejeita
   * a chamada inteira por isso — mesmo espírito de conflito parcial de
   * `createAppointmentSeries` (PSI-035): rascunhos livres são criados,
   * rascunhos com conflito de idempotência ficam de fora do resultado, sem
   * abortar os demais. Qualquer outro erro (rede, 500, rascunho inválido)
   * propaga e interrompe o processamento dos rascunhos restantes.
   */
  generateMonthlyCharges(drafts: readonly ChargeDraft[]): Promise<GenerateMonthlyChargesResult>;

  /**
   * `POST /charges/{chargeId}/payment`: registra o pagamento (data,
   * valor, meio) e move a cobrança para `"em_dia"`. Lança `ChargesAdapterError`
   * com `status: 409` (`isChargeAlreadyPaidError`) se a cobrança já estava
   * paga — mesma condição que a API real modela (ver contrato).
   */
  registerChargePayment(chargeId: string, payload: RegisterPaymentRequest): Promise<Charge>;

  /**
   * Desfaz o ÚLTIMO `registerChargePayment` desta cobrança nesta sessão do
   * adapter (critério de aceite: "marcar como paga... permite desfazer"),
   * restaurando exatamente o estado anterior (status e, se havia, o
   * pagamento anterior). Lança `ChargesAdapterError` com `status: 404`
   * (`isChargeNotFoundError`) se não houver pagamento para desfazer (nunca
   * pago, ou desfeito duas vezes seguidas).
   *
   * RESSALVA (ver open_question do PR): o contrato REST hoje NÃO expõe um
   * endpoint para desfazer/cancelar um pagamento já registrado — só
   * `POST /charges/{id}/payment` (avança o estado). `MockChargesAdapter`
   * sustenta esta operação com um log de undo em memória (mesmo espírito
   * de `SettingsAdapterUnsupportedError`); `HttpChargesAdapter.undoChargePayment`
   * lança `ChargesAdapterUnsupportedError` até o contrato ganhar um
   * endpoint equivalente (ex.: `DELETE /charges/{id}/payment`) — PSI-044.
   */
  undoChargePayment(chargeId: string): Promise<Charge>;
}
