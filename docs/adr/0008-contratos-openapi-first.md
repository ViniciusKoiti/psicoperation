# ADR 0008 — Contratos OpenAPI-first com codegen para TS, Java e Dart

- Status: aceito
- Data: 2026-07-05
- Substitui: ADR 0002 (a parte "Zod como fonte única"; as regras de processo permanecem)

## Contexto

Com stack poliglota (web TypeScript, mobile Dart, backend Java), schemas Zod não podem
mais ser a fonte única de contratos — Zod só existe no ecossistema TypeScript.

## Decisão

1. `packages/contracts` passa a conter uma **especificação OpenAPI 3.1** modular
   (arquivo raiz + components) como **fonte única** de DTOs, rotas, erros
   (Problem Details) e schemas de eventos de domínio.
2. Codegen **comitado** no repositório, regenerável de forma determinística:
   - `gen/ts` — tipos TypeScript para landing e clinic;
   - `gen/java` — DTOs/modelos para o Spring Boot (openapi-generator, versão fixada);
   - `gen/dart` — modelos Dart para o Flutter (package local via path dependency).
3. CI e testes verificam **drift**: regenerar e exigir `git diff --exit-code`
   (spec e código gerado nunca divergem).
4. As regras de processo do ADR 0002 continuam valendo: apps **nunca** duplicam DTOs
   (importam do codegen); frontends desenvolvem contra adapters mock/HTTP (ADR 0006);
   alterar `packages/contracts` exige tarefa `shared_change: true` dedicada; agente de
   feature que encontrar contrato errado registra `open_question` e para.
5. Validações de formulário nos frontends são implementadas de forma consistente com
   a spec (formatos/obrigatoriedade), sem redefinir o DTO.

## Consequências

- Um passo de build extra (codegen), pago uma vez e verificado mecanicamente.
- O contrato ganha documentação navegável de graça (a própria spec OpenAPI).
- Quebras de contrato aparecem como diff de codegen + erro de compilação nos três
  ecossistemas.
- A qualidade do código Dart/Java gerado depende do openapi-generator — versão
  fixada e saída comitada tornam qualquer mudança auditável em PR.
