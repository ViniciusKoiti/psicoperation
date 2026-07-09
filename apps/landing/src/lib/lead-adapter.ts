// Tipos vêm exclusivamente do codegen de packages/contracts (gen/ts) —
// nenhum DTO equivalente é redefinido aqui (acceptance criteria PSI-018).
//
// Import via caminho relativo, e não via especificador de pacote
// "@psiops/contracts": apps/landing/package.json ainda não declara
// @psiops/contracts como dependência (diferente de apps/clinic) e
// package.json/pnpm-lock.yaml são forbidden_paths desta tarefa — não é
// possível adicionar a dependência aqui. Assumption registrada no PR;
// recomenda-se que uma tarefa futura (ou emenda à PSI-009) declare a
// dependência para que o import passe a usar o especificador do pacote.
import type { Lead, LeadCreateRequest } from "../../../../packages/contracts/gen/ts/index";

/**
 * Porta de envio do lead da lista de espera (spec §1.7, `#lista`),
 * desacoplada de rede (ADR 0006 — adapters `Mock*`/HTTP real). Esta tarefa
 * (PSI-018) entrega apenas a implementação mock em memória abaixo; a
 * integração HTTP real acontece na PSI-044, trocando a instância exportada
 * por um adapter que chama a API sem alterar `<LeadForm>`.
 */
export interface LeadAdapter {
  submit(payload: LeadCreateRequest): Promise<Lead>;
}

/**
 * Implementação mock em memória: nenhuma chamada de rede. Gera um `Lead`
 * completo (id + createdAt) só para satisfazer a assinatura da porta;
 * os leads não são persistidos além da vida do módulo.
 */
export function createInMemoryLeadAdapter(): LeadAdapter {
  const leads: Lead[] = [];

  return {
    async submit(payload) {
      const lead: Lead = {
        id: crypto.randomUUID(),
        name: payload.name,
        whatsapp: payload.whatsapp,
        email: payload.email,
        createdAt: new Date().toISOString(),
      };

      leads.push(lead);
      return lead;
    },
  };
}

/**
 * Instância mock consumida por `<LeadForm>` nesta fase. Único ponto de
 * troca necessário na PSI-044 para ligar o formulário à API real.
 */
export const leadAdapter: LeadAdapter = createInMemoryLeadAdapter();
