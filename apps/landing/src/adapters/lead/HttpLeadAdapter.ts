// Tipos vêm exclusivamente do codegen de packages/contracts (gen/ts) — mesma
// ressalva de import relativo já registrada em `src/lib/lead-adapter.ts`
// (apps/landing/package.json ainda não declara @psiops/contracts como
// dependência, e package.json/pnpm-lock.yaml são forbidden_paths desta
// tarefa).
import type { Lead, LeadCreateRequest, Problem } from "../../../../../packages/contracts/gen/ts/index";
// `LeadAdapter` é a porta já definida por `src/lib/lead-adapter.ts`
// (PSI-018) — reaproveitada aqui por import (leitura, não edita aquele
// arquivo, que está fora de `allowed_paths` desta tarefa: só
// `apps/landing/src/adapters/**`). Ver open_question do PR: esta
// implementação HTTP não está ligada a `<LeadForm>` porque isso exigiria
// editar `src/lib/lead-adapter.ts`/`src/components/LeadForm.tsx`.
import type { LeadAdapter } from "../../lib/lead-adapter";

export interface HttpLeadAdapterOptions {
  /** URL base da API (ex.: `http://localhost:8080`), sem barra final. */
  baseUrl: string;
  /** Injetável para testes; padrão é o `fetch` global do runtime. */
  fetchFn?: typeof fetch;
}

/** Lançado quando `POST /leads` falha (validação, rate limit, e-mail duplicado, rede). */
export class LeadAdapterError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LeadAdapterError";
    this.status = status;
  }
}

/**
 * Implementação HTTP de `LeadAdapter` (PSI-044), tipada contra os
 * contratos gerados em `packages/contracts/gen/ts`, apontando para
 * `POST /leads` da API Spring (rota pública, sem autenticação — ver
 * `SecurityConfig` da API e `packages/contracts/openapi/paths/lead/leads.yaml`).
 *
 * Usada em ambiente de teste (ver `./index.ts`); o mock em memória de
 * `src/lib/lead-adapter.ts` continua o padrão de desenvolvimento.
 */
export class HttpLeadAdapter implements LeadAdapter {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpLeadAdapterOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
  }

  async submit(payload: LeadCreateRequest): Promise<Lead> {
    const response = await this.fetchFn(`${this.baseUrl}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const problem = await this.tryParseProblem(response);
      throw new LeadAdapterError(
        problem?.detail ?? problem?.title ?? "Não foi possível entrar na lista de espera agora.",
        response.status,
      );
    }

    return (await response.json()) as Lead;
  }

  private async tryParseProblem(response: Response): Promise<Problem | undefined> {
    try {
      return (await response.json()) as Problem;
    } catch {
      return undefined;
    }
  }
}
