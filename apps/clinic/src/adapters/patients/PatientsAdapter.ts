import type { PatientPage } from "@psiops/contracts";

/**
 * Interface de acesso a dados de pacientes (ADR 0006 — frontends desacoplados
 * por adapters). Tipada exclusivamente pelo codegen de `@psiops/contracts`
 * (`gen/ts`); nenhum DTO é redefinido aqui.
 *
 * Implementações:
 * - `MockPatientsAdapter` — estado em memória, determinístico, padrão em
 *   desenvolvimento e testes (ver `./MockPatientsAdapter.ts`).
 * - `HttpPatientsAdapter` — chama a API real; chega completa na PSI-039.
 *   Fora de escopo desta tarefa (PSI-012 entrega apenas o scaffold).
 */
export interface PatientsAdapter {
  /** Lista pacientes (sem paginação/filtros reais ainda — placeholder estrutural). */
  listPatients(): Promise<PatientPage>;
}
