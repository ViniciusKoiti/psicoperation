import { expect, test } from "@playwright/test";

import { findLeadByEmail } from "../support/db.mjs";
import { uniqueEmail } from "../support/unique.mjs";
// Import direto do código-fonte do adapter (não passa por `next build`): o
// mesmo `HttpLeadAdapter` que fica pronto em `apps/landing/src/adapters/lead/**`
// para uma futura PSI-044.1/similar ligar em `<LeadForm>` — ver o
// open_question do PR desta tarefa sobre por que a ligação real na UI não
// está neste escopo (allowed_paths não cobre `src/lib/lead-adapter.ts` nem
// `src/components/LeadForm.tsx`, que são as telas/porta atualmente
// consumidas pela landing).
import { HttpLeadAdapter } from "../../apps/landing/src/adapters/lead/HttpLeadAdapter";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * Cenário E2E da landing (PSI-044 acceptance criteria): submissão do lead
 * resulta em persistência real no banco, verificada de forma automatizada
 * (aqui via consulta direta à tabela `leads`, já que o contrato só expõe
 * `POST /leads` — não há `GET` correspondente).
 *
 * NOTA DE ESCOPO (ver README/PR): isto exercita o `HttpLeadAdapter` (esta
 * tarefa) diretamente contra a API real — não passa pelo formulário
 * `<LeadForm>` no navegador, porque `<LeadForm>` ainda consome o mock de
 * `src/lib/lead-adapter.ts`, um arquivo fora de `allowed_paths` desta
 * tarefa. A cobertura de UI do formulário (validação, máscara de WhatsApp,
 * estado de sucesso) já existe em `apps/landing/e2e/landing.spec.ts`
 * (PSI-019, roda contra o mock).
 */
test.describe("Landing — lead da lista de espera (API real)", () => {
  test("HttpLeadAdapter.submit persiste o lead no banco (POST /leads real)", async () => {
    const email = uniqueEmail("lead");
    const adapter = new HttpLeadAdapter({ baseUrl: API_BASE_URL });

    const lead = await adapter.submit({
      name: "Ana Beatriz Souza (E2E)",
      whatsapp: "+5511990000000",
      email,
    });

    expect(lead.email).toBe(email);
    expect(lead.id).toBeTruthy();
    expect(lead.createdAt).toBeTruthy();

    const persisted = await findLeadByEmail(email);
    expect(persisted).toBeDefined();
    expect(persisted?.email).toBe(email);
    expect(persisted?.name).toBe("Ana Beatriz Souza (E2E)");
  });

  test("e-mail duplicado é idempotente na API real — mesmo lead devolvido, sem erro", async () => {
    // Divergência real descoberta ao integrar contra a API (registrada no
    // PR desta tarefa): `LeadService.create` (apps/api) NÃO rejeita e-mail
    // duplicado com 409 — devolve o MESMO registro já existente como
    // sucesso, de propósito (evita revelar, a um formulário público, que um
    // e-mail já está na lista de espera; ver a doc de `LeadService.create`
    // e `LeadExceptionHandler`). `HttpLeadAdapter`/`LeadCreateRequest` já
    // cobrem isso corretamente: não há tratamento especial de 409 para
    // lead. Este teste prova esse comportamento idempotente.
    const email = uniqueEmail("lead-dup");
    const adapter = new HttpLeadAdapter({ baseUrl: API_BASE_URL });

    const first = await adapter.submit({ name: "Primeira Submissão", whatsapp: "+5511990000000", email });
    const second = await adapter.submit({ name: "Segunda Submissão", whatsapp: "+5511990000001", email });

    expect(second.id).toBe(first.id);
    expect(second.name).toBe("Primeira Submissão"); // devolve o registro já existente, não o novo payload.

    const persisted = await findLeadByEmail(email);
    expect(persisted?.id).toBe(first.id);
  });
});
