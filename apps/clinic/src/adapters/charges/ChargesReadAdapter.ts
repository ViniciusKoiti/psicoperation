import type { Charge, ChargeStatus } from "@psiops/contracts";

/**
 * Parâmetros de `listCharges` — subconjunto do `query` de
 * `operations["listCharges"]` em `@psiops/contracts` (`status`), sem
 * `patientId` (esta é a listagem AGREGADA, entre pacientes — ver
 * `listCharges` abaixo). Não é um DTO redeclarado: é só o parâmetro do
 * método, mesmo espírito de `ListAppointmentsRangeParams`
 * (`src/adapters/appointments/AgendaAdapter.ts`).
 */
export interface ListChargesParams {
  /** Filtra por situação de pagamento. Sem filtro, retorna cobranças de todos os status. */
  status?: ChargeStatus;
}

/**
 * Interface de LEITURA mínima de cobranças (mensalidades), criada pela
 * PSI-034 (só por paciente) e ESTENDIDA pela PSI-032 (dashboard) com uma
 * listagem AGREGADA (entre pacientes) porque a tela completa de financeiro
 * (PSI-037) ainda não existe. `Charge.amount` já vem em centavos BRL
 * inteiros (`MoneyBRL` do contrato). O agrupamento por `ChargeStatus`
 * (em_dia/pendente/atrasada) e a soma de totais são responsabilidade da
 * camada de apresentação (`groupChargesByStatus` em
 * `src/features/patients/patientDetail.ts` para o detalhe do paciente;
 * `selectOutstandingCharges`/`sumChargeAmounts` em
 * `src/features/dashboard/dashboard.ts` para o dashboard), não deste
 * adapter.
 *
 * PROJETADA PARA SER ESTENDIDA PELA PSI-037 — o que esta interface
 * deliberadamente NÃO cobre, e fica para a tela de financeiro decidir como
 * adicionar (extensão desta interface, ou uma nova ao lado dela no mesmo
 * módulo `src/adapters/charges/**`):
 * - listagem financeira agregada com paginação REAL, filtro por
 *   competência e múltiplos status numa única chamada — o contrato já
 *   expõe todos esses filtros em `operations["listCharges"]`, mas
 *   `listCharges` aqui só cobre `status` (único) sem paginar de verdade
 *   (mesma ressalva de `HttpChargesReadAdapter` sobre `HTTP_CHARGES_READ_PAGE_SIZE`),
 *   o suficiente para o dashboard (PSI-032) buscar pendências (`pendente`
 *   e `atrasada`) e filtrar/somar em memória;
 * - emissão de cobrança (`POST /charges`) e registro de pagamento
 *   (`POST /charges/{id}/payment` — ver ressalva em `HttpChargesReadAdapter`
 *   sobre o endpoint real de pagamento no contrato).
 *
 * Implementações: `MockChargesReadAdapter` (estado em memória, padrão em
 * desenvolvimento e testes) e `HttpChargesReadAdapter` (tipada pelo
 * contrato). Ponto de composição único (seleção mock/http por variável de
 * ambiente) em `./index.ts`, mesmo padrão de `src/adapters/patients`.
 */
export interface ChargesReadAdapter {
  /**
   * Todas as cobranças de um paciente, em qualquer ordem retornada pelo
   * adapter — o agrupamento/ordenação para exibição é resolvido pela camada
   * de apresentação. Paciente sem nenhuma cobrança (ou inexistente) resolve
   * com lista vazia, nunca rejeita.
   */
  listChargesByPatient(patientId: string): Promise<Charge[]>;

  /**
   * Todas as cobranças da psicóloga (entre pacientes), opcionalmente
   * filtradas por status (`ListChargesParams.status`) — usada pelo
   * dashboard (PSI-032) para as pendências financeiras agregadas. Sem
   * cobranças (ou nenhuma no status filtrado) resolve com lista vazia,
   * nunca rejeita.
   */
  listCharges(params?: ListChargesParams): Promise<Charge[]>;
}
