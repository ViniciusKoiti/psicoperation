# ADR 0002 — Contracts-first com Zod em packages/contracts

- Status: substituído pelo ADR 0008 em 2026-07-05 (pivô de stack; regras de processo preservadas)
- Data: 2026-07-05

## Contexto

Frontend e backend serão desenvolvidos **em paralelo** por agentes distintos. Sem uma fonte
única de tipos, cada lado inventaria DTOs próprios e a integração falharia tarde.

## Decisão

Todo DTO, evento de domínio e schema de validação vive em `packages/contracts`, definido em
**Zod** com tipos inferidos exportados. Regras:

1. Apps **nunca** duplicam DTOs; importam de `@psiops/contracts`.
2. A API valida entrada/saída com os mesmos schemas que o frontend usa nos formulários.
3. Frontends desenvolvem contra **adapters**: `Mock*Adapter` (memória) e `Http*Adapter`
   (API real), ambos tipados pelo contrato — o frontend não depende da implementação
   concreta da API para avançar (ver ADR 0006).
4. Alterar `packages/contracts` exige tarefa `shared_change: true` dedicada
   (PSI-005, PSI-019). Um agente de feature **não** ajusta contrato para acomodar
   sua implementação; se o contrato estiver errado, registra `open_question` e para.

## Consequências

- Quebras de contrato aparecem como erro de typecheck em todos os consumidores no CI.
- Evolução de contrato é serializada e explícita — mais lenta, porém auditável.
- Zod adiciona custo de runtime na API (aceito: validação é requisito, não overhead).
