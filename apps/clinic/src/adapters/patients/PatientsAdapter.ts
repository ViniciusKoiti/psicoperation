import type { Patient, PatientCreateRequest, PatientPage, PatientStatus, PatientUpdateRequest } from "@psiops/contracts";

/**
 * Parâmetros de listagem — espelham 1:1 os `query` de `operations["listPatients"]`
 * em `@psiops/contracts` (`page`, `size`, `status`), mais `search`, um filtro por
 * nome resolvido pelo adapter (não é um DTO redeclarado: é apenas o parâmetro do
 * método, igual às `options` de `MockAuthAdapter`/`MockSettingsAdapter`).
 *
 * IMPORTANTE (ver open_question do PR PSI-033): o contrato de `GET /patients`
 * hoje NÃO expõe um parâmetro de busca por nome — só paginação e `status`. Até
 * o contrato ganhar esse parâmetro, `search` é resolvido inteiramente em memória
 * pelo `MockPatientsAdapter`; `HttpPatientsAdapter.listPatients` aceita `search`
 * na assinatura (para o call site ficar idêntico ao trocar de adapter) mas não
 * o envia à API — só `page`/`size`/`status` viram query string real.
 */
export interface ListPatientsParams {
  /** Índice da página desejada (base 0). Padrão do adapter: `0`. */
  page?: number;
  /** Quantidade de itens por página. Padrão do adapter: ver `DEFAULT_PATIENTS_PAGE_SIZE`. */
  size?: number;
  /**
   * Filtra por situação cadastral. Padrão do adapter quando omitido: `"ativo"`
   * (assumption do manifesto PSI-033 — "lista de pacientes ativos" é a visão
   * padrão; pacientes arquivados ficam atrás de uma aba/filtro dedicado).
   */
  status?: PatientStatus;
  /**
   * Filtro por nome (busca), insensível a maiúsculas e acentos (assumption do
   * manifesto). Aplicado inteiramente pelo adapter — ver ressalva acima sobre
   * `HttpPatientsAdapter`.
   */
  search?: string;
}

/**
 * Interface de acesso a dados de pacientes (ADR 0006 — frontends desacoplados
 * por adapters). Tipada exclusivamente pelo codegen de `@psiops/contracts`
 * (`gen/ts`); nenhum DTO é redefinido aqui — `ListPatientsParams` acima é só o
 * parâmetro do método, não um schema do contrato.
 *
 * `archivePatient`/`unarchivePatient` são atalhos semânticos sobre
 * `updatePatient` (que já aceita `status` em `PatientUpdateRequest`): arquivar
 * grava `status: "inativo"`, desarquivar grava `status: "ativo"`. O contrato
 * também expõe `DELETE /patients/{patientId}` (`deletePatient`, descrito como
 * "remove (arquiva)" — a política de arquivamento vs. exclusão definitiva fica
 * para a implementação); esta tarefa NÃO usa esse endpoint: exclusão definitiva
 * e fluxos de LGPD são explicitamente fora de escopo (ver manifesto), e usar
 * `status: "inativo"` via `updatePatient` dá uma operação simétrica e
 * reversível (o objeto `Patient` completo volta na resposta nos dois sentidos),
 * o que a resposta `204 sem corpo` de `DELETE` não permite tão bem. Ver
 * open_question do PR sobre esta escolha.
 *
 * Implementações:
 * - `MockPatientsAdapter` — estado em memória, determinístico, padrão em
 *   desenvolvimento e testes, com dados semente paginados (ver
 *   `./MockPatientsAdapter.ts`).
 * - `HttpPatientsAdapter` — tipada contra os contratos, aponta para a API
 *   real; sem exercício ponta a ponta nesta tarefa (ver `./HttpPatientsAdapter.ts`).
 *
 * O ponto de composição único (seleção mock/http por variável de ambiente)
 * fica em `./index.ts`.
 */
export interface PatientsAdapter {
  /** `GET /patients` — busca e paginação resolvidas aqui (ver `ListPatientsParams`). */
  listPatients(params?: ListPatientsParams): Promise<PatientPage>;

  /** `GET /patients/{patientId}` */
  getPatient(patientId: string): Promise<Patient>;

  /** `POST /patients` */
  createPatient(payload: PatientCreateRequest): Promise<Patient>;

  /** `PUT /patients/{patientId}` — usado tanto pela edição quanto, internamente, por archive/unarchive. */
  updatePatient(patientId: string, payload: PatientUpdateRequest): Promise<Patient>;

  /** Arquiva o paciente (`status: "inativo"`): sai da lista ativa; histórico preservado; reversível. */
  archivePatient(patientId: string): Promise<Patient>;

  /** Reverte o arquivamento (`status: "ativo"`): volta a aparecer na lista ativa. */
  unarchivePatient(patientId: string): Promise<Patient>;
}
