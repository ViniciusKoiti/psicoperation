// `LeadAdapter`/`createInMemoryLeadAdapter` são a porta e a implementação
// mock definidas por `src/lib/lead-adapter.ts` (PSI-018) — reaproveitadas
// aqui por import (leitura; aquele arquivo está fora de `allowed_paths`
// desta tarefa). Ver a nota de escopo em `HttpLeadAdapter.ts` e o
// open_question do PR: `<LeadForm>` continua consumindo o singleton mock
// exportado por `src/lib/lead-adapter.ts` diretamente, não este módulo.
import { createInMemoryLeadAdapter, type LeadAdapter } from "../../lib/lead-adapter";
import { HttpLeadAdapter } from "./HttpLeadAdapter";

export type { LeadAdapter } from "../../lib/lead-adapter";
export { HttpLeadAdapter, LeadAdapterError } from "./HttpLeadAdapter";

type LeadAdapterKind = "mock" | "http";

function readExplicitKind(): LeadAdapterKind | undefined {
  const raw = process.env.NEXT_PUBLIC_LEAD_ADAPTER;
  return raw === "mock" || raw === "http" ? raw : undefined;
}

/**
 * Resolve qual `LeadAdapter` usar. Ponto único de composição para este
 * adapter (mesmo espírito de `apps/clinic/src/adapters/<dominio>/index.ts`, ADR
 * 0006), ainda não referenciado pela árvore de páginas da landing — ver
 * open_question do PR da PSI-044.
 *
 * - `NEXT_PUBLIC_LEAD_ADAPTER=mock` ou `=http` força a escolha.
 * - Sem variável definida: `NODE_ENV=development` (o que `next dev` usa)
 *   escolhe mock; qualquer outro valor (`production`, `test`, ...) escolhe
 *   http — mock nunca é o padrão fora de desenvolvimento.
 */
export function resolveLeadAdapterKind(): LeadAdapterKind {
  const explicit = readExplicitKind();
  if (explicit) return explicit;
  return process.env.NODE_ENV === "development" ? "mock" : "http";
}

function createLeadAdapter(): LeadAdapter {
  const kind = resolveLeadAdapterKind();
  if (kind === "http") {
    const baseUrl = process.env.NEXT_PUBLIC_LEAD_API_BASE_URL ?? process.env.LEAD_API_BASE_URL ?? "http://localhost:8080";
    return new HttpLeadAdapter({ baseUrl });
  }
  return createInMemoryLeadAdapter();
}

/**
 * Instância única do adapter de lead, composta a partir do ambiente
 * (mesmo padrão do clinic). NÃO é a instância que `<LeadForm>` usa hoje —
 * ver a nota de escopo no topo deste arquivo.
 */
export const leadAdapter: LeadAdapter = createLeadAdapter();
