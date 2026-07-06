# ADR 0001 — Monorepo com pnpm workspaces e Turborepo

- Status: aceito
- Data: 2026-07-05

## Contexto

O PsiOps compreende quatro aplicações (landing, clinic, api, automation) que compartilham
contratos, tokens visuais, acesso a banco e configuração. O desenvolvimento será feito por
múltiplos agentes em paralelo, cada um com escopo de arquivos restrito.

## Decisão

Monorepo único (`ViniciusKoiti/psicoperation`) com **pnpm workspaces** (`apps/*`, `packages/*`)
e **Turborepo** como orquestrador de tarefas (`lint`, `typecheck`, `test`, `build`) com cache
e grafo de dependências entre pacotes.

## Consequências

- Contratos e tokens são consumidos por referência de workspace (`workspace:*`),
  eliminando publicação/versionamento interno.
- `pnpm-lock.yaml` torna-se ponto único de conflito → alterações de dependência são
  restritas a tarefas `shared_change: true`, executadas uma por vez (ver ADR 0005).
- CI roda o monorepo inteiro por PR com cache do Turborepo para manter tempo aceitável.
- Node >= 20 fixado em `.nvmrc`; gerenciador fixado via `packageManager` no `package.json` raiz.

## Adendo (2026-07-05, pivô de stack — ADR 0007)

O monorepo tornou-se **poliglota**: pnpm workspaces e Turborepo orquestram apenas os
pacotes JS/TS (`apps/landing`, `apps/clinic`, `packages/*`). `apps/api` (Java/Maven)
e `apps/mobile` (Flutter) vivem no mesmo repositório, fora do pnpm, com builds
invocados diretamente pelo CI. A decisão de repositório único permanece.
