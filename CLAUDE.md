# CLAUDE.md — psicoperation

Monorepo do **PsiOps**: SaaS de gestão financeira para psicólogas solo brasileiras,
com foco em mensalidades. Idioma do projeto: **pt-BR** (código em inglês, textos de
UI/documentação em português).

## Mapa do repositório

- `apps/landing` — landing page pública (Next.js/React + Tailwind).
- `apps/clinic` — aplicação web da psicóloga (Vite + React + Mantine).
- `apps/mobile` — app companion da psicóloga (Flutter; fora do pnpm/turbo).
- `apps/api` — backend único (Spring Boot 3 + Axon, Java 21, Maven wrapper;
  JPA + Flyway + PostgreSQL; fora do pnpm/turbo).
- `packages/contracts` — **especificação OpenAPI 3.1 (fonte única de contratos)** +
  codegen comitado: `gen/ts`, `gen/java`, `gen/dart`.
- `packages/ui` — tokens de design (CSS vars, TS, tema Mantine, preset Tailwind,
  `tokens.json` para o tema Flutter) e primitivas React.
- `packages/config` — configs TS; `packages/testing` — fixtures/mocks TS.
- `docs/` — escopo, glossário, arquitetura, ADRs (0007–0009 = stack vigente),
  spec da landing.
- `tasks/PSI-001.yaml … PSI-046.yaml` — manifestos das 46 tarefas (formato: `tasks/_FORMAT.md`).
- `scripts/validate-task-scope.mjs` — valida manifestos e escopo de diff.
- `scripts/create-worktree.sh` — cria worktree + branch para uma tarefa.
- `project/PsiOps Landing.html` — **referência visual, SOMENTE LEITURA.**
  Nunca altere, formate, mova ou remova nada em `project/`.

## Regras para agentes (obrigatórias)

Você trabalha em **exatamente uma tarefa**, identificada por PSI-0NN. Antes de codar:

1. Leia este arquivo e o seu manifesto `tasks/PSI-0NN.yaml` inteiro.
2. Confirme que **todas** as `dependencies` já foram integradas à `main`.
3. Trabalhe em um worktree próprio: `bash scripts/create-worktree.sh PSI-0NN`
   (cria a branch `agent/psi-0nn-<slug>` definida no manifesto).

Durante a implementação:

4. Modifique **somente** caminhos que casem com `allowed_paths` e com nenhum
   `forbidden_paths`. Valide a qualquer momento:
   `node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main`.
5. **Sem refatoração oportunista**: não "melhore" código fora do escopo.
6. **Sem dependências novas** salvo autorização no manifesto. Tarefas
   `shared_change: false` nunca tocam `pnpm-lock.yaml`; no Java/Flutter, o
   `pom.xml` de `apps/api` e o `pubspec.yaml` de `apps/mobile` só mudam se o
   manifesto autorizar.
7. **Nunca** modifique `packages/contracts` (spec ou codegen) nem migrations
   Flyway (`**/db/migration/**`) para acomodar sua implementação. Contrato/schema
   errado → registre `open_question` no PR e pare.
8. DTOs vêm exclusivamente do codegen de `packages/contracts`
   (`gen/ts` no web, `gen/java` na API, `gen/dart` no mobile). Não duplique tipos.
9. Implemente testes junto com o código (Vitest/Playwright no JS; JUnit +
   Testcontainers no Java; flutter_test/integration_test no Flutter).
10. Antes de abrir PR: lint, typecheck, testes e build verdes no seu escopo
    (comandos exatos em `validation_commands` do manifesto).

Entrega:

11. Commits pequenos e descritivos (conventional commits, sufixo `[PSI-0NN]`).
12. Push **somente** da sua branch `agent/*`.
13. Abra **um PR draft** usando o template (`.github/pull_request_template.md`).
14. **Nunca**: merge, force-push, commit na `main`, ou iniciar outra tarefa
    por conta própria.

## Restrições de produto (invioláveis)

- **Nenhum** diagnóstico automático, recomendação clínica ou decisão de saúde por IA.
- Nenhum dado clínico é modelado (sem prontuário, evolução ou anotação terapêutica);
  registros de consulta são **administrativos** (presença, falta, remarcação).
- Dinheiro em centavos (inteiro), BRL. Datas ISO 8601.
- Sem secrets no código; configuração via env (`.env.example` documenta).

## Arquitetura (resumo — detalhes em docs/)

- Contratos **OpenAPI-first** com codegen comitado e verificação de drift. ADR 0008.
- Frontends (web e mobile) acessam dados por **adapters** (`Mock*` em dev/test,
  HTTP real nas integrações PSI-044/045); mocks proibidos em produção. ADR 0006.
- Assincronicidade **dentro do backend** via Axon: eventos, deadlines (lembretes,
  cobranças vencidas) e handlers de e-mail. Sem Redis, sem worker separado. ADR 0009.
- Agregados Axon **state-stored**; event store JPA no PostgreSQL; sem Axon Server. ADR 0007.
- Migrations Flyway sequenciais e imutáveis; só tarefas designadas as tocam. ADR 0009.
- Arquivos compartilhados exigem `shared_change: true` (uma tarefa por vez). ADR 0005.
- Landing **reconstruída** como componentes semânticos a partir de
  `docs/design/landing-page-spec.md` — proibido converter o HTML da referência
  diretamente para JSX.

## Convenções

- **Workspaces JS**: `@psiops/<nome>` (`@psiops/landing`, `@psiops/clinic`,
  `@psiops/contracts`, `@psiops/ui`, `@psiops/config`, `@psiops/testing`).
- **Java**: groupId `com.psiops`, app `apps/api`, build `cd apps/api && ./mvnw verify`.
- **Flutter**: package `psiops_mobile` em `apps/mobile`,
  build `cd apps/mobile && flutter analyze && flutter test`.
- Branches: `agent/psi-0nn-<slug>`; commits: conventional commits com `[PSI-0NN]`.

## Comandos úteis

```bash
pnpm install                        # lado JS (raiz)
docker compose up -d                # PostgreSQL + Mailpit
pnpm turbo run lint typecheck test build          # JS
cd apps/api && ./mvnw verify                      # Java (JDK 21)
cd apps/mobile && flutter analyze && flutter test # Flutter
node scripts/validate-task-scope.mjs --lint-all
node scripts/validate-task-scope.mjs --task PSI-014 --base origin/main
bash scripts/create-worktree.sh PSI-014
```
