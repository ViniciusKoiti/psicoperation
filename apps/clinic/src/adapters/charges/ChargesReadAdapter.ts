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
  /**
   * Filtra por competência (`AAAA-MM`). Sem filtro, retorna cobranças de
   * todas as competências. Adicionado pela PSI-037 para a visão mensal de
   * financeiro (`GET /charges?competence=...`, já suportado pelo contrato
   * — ver `operations["listCharges"]`) — extensão prevista desde a doc
   * original desta interface (ver nota de reconciliação abaixo).
   */
  competence?: string;
}

/**
 * Interface de LEITURA mínima de cobranças (mensalidades), criada pela
 * PSI-034 (só por paciente) e ESTENDIDA pela PSI-032 (dashboard) com uma
 * listagem AGREGADA (entre pacientes) porque a tela completa de financeiro
 * (PSI-037) ainda não existia. `Charge.amount` já vem em centavos BRL
 * inteiros (`MoneyBRL` do contrato). O agrupamento por `ChargeStatus`
 * (em_dia/pendente/atrasada) e a soma de totais são responsabilidade da
 * camada de apresentação (`groupChargesByStatus` em
 * `src/features/patients/patientDetail.ts` para o detalhe do paciente;
 * `selectOutstandingCharges`/`sumChargeAmounts` em
 * `src/features/dashboard/dashboard.ts` para o dashboard; `groupChargesByStatus`/
 * `sumChargeAmounts` em `src/features/finance/finance.ts` para a visão
 * mensal de financeiro), não deste adapter.
 *
 * RECONCILIAÇÃO COM A PSI-037: esta interface continua cobrindo só LEITURA
 * (mesmo espírito de `AppointmentsReadAdapter` após a PSI-035) — ganhou
 * apenas o filtro `competence` acima. As operações de ESCRITA da tela de
 * financeiro (gerar mensalidades do mês, marcar como paga, desfazer) vivem
 * em `ChargesAdapter` (`./ChargesAdapter.ts`), que ESTENDE esta interface,
 * no mesmo módulo `src/adapters/charges/**` — não um adapter concorrente.
 * `MockChargesAdapter`/`HttpChargesAdapter` (que implementam `ChargesAdapter`)
 * SUBSTITUEM `MockChargesReadAdapter`/`HttpChargesReadAdapter` (PSI-034)
 * como única implementação de dados de cobranças do app; `DashboardPage` e
 * `PatientDetailPage` (que só leem) continuam tipados por
 * `ChargesReadAdapter`, sem nenhuma mudança de contrato para essas telas —
 * só a troca de instância (`chargesAdapter`, exportado por `./index.ts`).
 *
 * Implementações: `MockChargesAdapter` (estado em memória, padrão em
 * desenvolvimento e testes) e `HttpChargesAdapter` (tipada pelo contrato).
 * Ponto de composição único (seleção mock/http por variável de ambiente) em
 * `./index.ts`, mesmo padrão de `src/adapters/patients`.
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
