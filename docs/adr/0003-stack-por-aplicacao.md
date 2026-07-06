# ADR 0003 — Stack por aplicação

- Status: aceito
- Data: 2026-07-05

## Contexto

Cada aplicação tem requisitos distintos: SEO e performance estática (landing),
produtividade em UI rica autenticada (clinic), regras de negócio e autorização (api),
processamento assíncrono confiável (automation).

## Decisão

| App | Stack | Racional |
|---|---|---|
| `apps/landing` | **Next.js** (App Router) + Tailwind (pipeline própria) | SEO, renderização estática, paridade com o protótipo Tailwind. Proibido Tailwind via CDN. |
| `apps/clinic` | **Vite + React + Mantine** | SPA autenticada sem necessidade de SSR; Mantine dá componentes acessíveis tematizáveis pelos tokens do `@psiops/ui`. |
| `apps/api` | **NestJS** | Modularidade por domínio, guards/pipes para JWT e validação Zod, maturidade de testes. |
| `apps/automation` | **Node + BullMQ + Redis** | Filas com retries/backoff/idempotência; separação física do ciclo request/response. |
| Persistência | **Prisma + PostgreSQL** em `packages/database` | Migrations versionadas e tipagem gerada compartilhada entre api e automation. |
| Testes | **Vitest** (unitário) e **Playwright** (E2E) | Padrão único de runner em todo o monorepo. |
| Infra local | **Docker Compose** (Postgres, Redis, Mailpit) | Ambiente reprodutível em um comando. |
| CI | **GitHub Actions** | Integração nativa com PRs e validação de escopo por branch `agent/*`. |

## Consequências

- Dois frameworks React (Next e Vite) coexistem; o custo é aceito porque os apps não
  compartilham código de aplicação — apenas `packages/ui` e `packages/contracts`.
- A API nunca fala com Redis: integração API→automation é via tabela Outbox (ADR 0004).
