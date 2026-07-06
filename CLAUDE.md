# CLAUDE.md — psicoperation

Monorepo do **PsiOps**: SaaS de gestão financeira para psicólogas solo brasileiras,
com foco em mensalidades. Idioma do projeto: **pt-BR** (código em inglês, textos de
UI/documentação em português).

## Mapa do repositório

- `apps/landing` — landing page pública (Next.js).
- `apps/clinic` — aplicação da psicóloga (Vite + React + Mantine).
- `apps/api` — backend (NestJS + Prisma/PostgreSQL).
- `apps/automation` — worker assíncrono (BullMQ + Redis, e-mail).
- `packages/contracts` — DTOs, eventos e schemas Zod. **Fonte única de tipos.**
- `packages/database` — Prisma, migrations, seeds.
- `packages/ui` — tokens de design e componentes; `packages/config` — configs; `packages/testing` — fixtures.
- `docs/` — escopo, glossário, arquitetura, ADRs, spec da landing.
- `tasks/PSI-001.yaml … PSI-040.yaml` — manifestos das 40 tarefas (formato: `tasks/_FORMAT.md`).
- `scripts/validate-task-scope.mjs` — valida manifestos e escopo de diff.
- `scripts/create-worktree.sh` — cria worktree + branch para uma tarefa.
- `project/PsiOps Landing.html` — **referência visual, SOMENTE LEITURA.**
  Nunca altere, formate, mova ou remova nada em `project/`.

## Regras para agentes (obrigatórias)

Você trabalha em **exatamente uma tarefa**, identificada por PSI-0NN. Antes de codar:

1. Leia este arquivo e o seu manifesto `tasks/PSI-0NN.yaml` inteiro.
2. Confirme que **todas** as `dependencies` já foram integradas à `main`
   (o orquestrador só despacha nessa condição — confira mesmo assim).
3. Trabalhe em um worktree próprio: `bash scripts/create-worktree.sh PSI-0NN`
   (cria a branch `agent/psi-0nn-<slug>` definida no manifesto).

Durante a implementação:

4. Modifique **somente** caminhos que casem com `allowed_paths` e com nenhum
   `forbidden_paths`. Valide a qualquer momento:
   `node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main`.
5. **Sem refatoração oportunista**: não "melhore" código fora do escopo.
6. **Sem dependências novas** salvo autorização explícita no manifesto
   (tarefas `shared_change: false` nunca tocam `pnpm-lock.yaml`).
7. **Nunca** modifique `packages/contracts` ou `packages/database` para acomodar sua
   implementação. Contrato errado → registre `open_question` no PR e pare.
8. DTOs vêm exclusivamente de `@psiops/contracts`. Não duplique tipos.
9. Implemente testes junto com o código (Vitest; Playwright quando o manifesto pedir).
10. Antes de abrir PR: `lint`, `typecheck`, `test` e `build` verdes no seu escopo
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

- Frontends acessam dados por **adapters** (`Mock*Adapter` em dev/test,
  `Http*Adapter` na integração); mocks proibidos em build de produção. ADR 0006.
- API → automation somente via tabela **Outbox**; API não conhece Redis. ADR 0004.
- Migrations sequenciais e imutáveis; só tarefas de database as tocam. ADR 0004.
- Arquivos compartilhados exigem `shared_change: true` (uma tarefa por vez). ADR 0005.
- Landing é **reconstruída** como componentes semânticos a partir de
  `docs/design/landing-page-spec.md` — proibido converter o HTML da referência
  diretamente para JSX.

## Convenções

- **Nome de workspace**: todo pacote/app chama-se `@psiops/<nome>`
  (`@psiops/landing`, `@psiops/clinic`, `@psiops/api`, `@psiops/automation`,
  `@psiops/contracts`, `@psiops/database`, `@psiops/ui`, `@psiops/config`,
  `@psiops/testing`). Os `validation_commands` dos manifestos dependem disso.
- Branches: `agent/psi-0nn-<slug>`; commits: conventional commits com `[PSI-0NN]`.

## Comandos úteis

```bash
pnpm install                        # instalar (raiz)
docker compose up -d                # Postgres + Redis + Mailpit
pnpm turbo run lint typecheck test build
node scripts/validate-task-scope.mjs --lint-all          # valida os 40 manifestos
node scripts/validate-task-scope.mjs --task PSI-013 --base origin/main
bash scripts/create-worktree.sh PSI-013                  # worktree + branch da tarefa
```
