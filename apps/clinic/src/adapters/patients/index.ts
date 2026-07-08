import { MockPatientsAdapter } from "./MockPatientsAdapter";
import type { PatientsAdapter } from "./PatientsAdapter";

export type { PatientsAdapter } from "./PatientsAdapter";
export { MockPatientsAdapter } from "./MockPatientsAdapter";

/**
 * Único ponto de composição do adapter de pacientes (ADR 0006).
 *
 * Hoje só existe `MockPatientsAdapter`: a `HttpPatientsAdapter` chega
 * completa na PSI-039, junto da verificação automatizada de que o bundle de
 * produção não referencia adapters mock. Quando ela existir, a seleção passa
 * a ser, por exemplo:
 *
 *   return import.meta.env.PROD ? new HttpPatientsAdapter() : new MockPatientsAdapter();
 *
 * Até lá, mantemos o aviso explícito abaixo para deixar claro que este
 * scaffold ainda não deve ir para produção com dados reais.
 */
function createPatientsAdapter(): PatientsAdapter {
  if (import.meta.env.PROD) {
    // TODO(PSI-039): trocar por HttpPatientsAdapter assim que a API real
    // estiver disponível. Mocks em build de produção são proibidos (ADR 0006).
    console.warn(
      "[@psiops/clinic] PatientsAdapter: HttpPatientsAdapter ainda não existe (PSI-039) — " +
        "usando MockPatientsAdapter mesmo em produção. Não usar além deste scaffold.",
    );
  }
  return new MockPatientsAdapter();
}

/** Instância única do adapter de pacientes, consumida pelas features. */
export const patientsAdapter: PatientsAdapter = createPatientsAdapter();
