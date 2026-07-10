import type { Charge } from "@psiops/contracts";

/**
 * Interface de LEITURA mínima de cobranças (mensalidades) de um paciente,
 * criada por esta tarefa (PSI-034) porque a tela completa de financeiro
 * (PSI-037) ainda não existe. Cobre exatamente o que o detalhe do paciente
 * precisa: todas as cobranças de UM paciente, em centavos BRL inteiros
 * (`Charge.amount`, ver `MoneyBRL` do contrato), sem paginação. O
 * agrupamento por `ChargeStatus` (em_dia/pendente/atrasada) é
 * responsabilidade da camada de apresentação (`groupChargesByStatus` em
 * `src/features/patients/patientDetail.ts`), não deste adapter.
 *
 * PROJETADA PARA SER ESTENDIDA PELA PSI-037 — o que esta interface
 * deliberadamente NÃO cobre, e fica para a tela de financeiro decidir como
 * adicionar (extensão desta interface, ou uma nova ao lado dela no mesmo
 * módulo `src/adapters/charges/**`):
 * - listagem financeira agregada (todos os pacientes, por competência,
 *   dashboards, totais) — o contrato já expõe `GET /charges` com filtros
 *   por paciente/competência/status (`operations["listCharges"]`), mas esta
 *   interface só usa o filtro por `patientId`, sem paginar;
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
}
