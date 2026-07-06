# ADR 0006 — Frontends desacoplados por adapters (mock e HTTP)

- Status: aceito (ampliado em 2026-07-05: vale também para o mobile Flutter;
  tipos vêm do codegen OpenAPI — ADR 0008; integrações reais nas PSI-044/045)
- Data: 2026-07-05

## Contexto

Clinic (web), mobile e landing serão construídos em paralelo com a API. Esperar
endpoints prontos serializaria as ondas e destruiria o paralelismo planejado.

## Decisão

1. Todo acesso a dados nos frontends passa por uma **interface de adapter** tipada pelos
   contratos de `@psiops/contracts` (ex.: `AuthAdapter`, `PatientsAdapter`, `LeadAdapter`).
2. Cada interface tem duas implementações:
   - `Mock*Adapter` — estado em memória, determinístico, padrão em desenvolvimento e testes;
   - `Http*Adapter` — chama a API real; implementado de forma completa na PSI-039.
3. A seleção é feita por variável de ambiente em um único ponto de composição.
4. **Mocks são proibidos em build de produção** — a PSI-039 inclui verificação
   automatizada de que o bundle de produção não referencia adapters mock.
5. Como os dois lados obedecem ao mesmo schema Zod, a troca mock→HTTP não altera
   componentes nem páginas — somente o ponto de composição.

## Consequências

- Clinic (PSI-028–037) e API (PSI-021–027) avançam simultaneamente após os contratos
  (PSI-019) estarem na `main`.
- Divergência mock × API real é o principal risco residual; mitigada porque ambos são
  validados pelos mesmos schemas e cobertos por E2E de integração na PSI-039.
- Um pouco de código extra (duas implementações por domínio) — aceito como preço do
  paralelismo.
