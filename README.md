# PsiOps — psicoperation

Monorepo do **PsiOps**, SaaS de gestão financeira e administrativa para psicólogas
solo brasileiras, com foco em mensalidades.

> Estado atual: **fundação de governança** (onda 0) + bootstrap do monorepo
> (pnpm + Turborepo). As aplicações são implementadas em 46 tarefas rastreáveis
> (PSI-001 a PSI-046) — ver `tasks/` e `docs/architecture/dependency-graph.md`.

## Setup (lado JS)

Pré-requisitos: Node 22 (fixado em `.nvmrc`) e pnpm 10.15.0 (fixado em
`packageManager` no `package.json`; `corepack enable` resolve).

```bash
nvm use          # Node 22
pnpm install     # instala o workspace JS (apps/* e packages/* com package.json)
pnpm lint        # turbo run lint
pnpm typecheck   # turbo run typecheck
pnpm test        # turbo run test
pnpm build       # turbo run build
```

O workspace pnpm/Turborepo orquestra **somente o lado JavaScript/TypeScript**:
`apps/api` (Spring Boot/Maven) e `apps/mobile` (Flutter) vivem em `apps/` sem
participar do workspace — são invocados diretamente via Maven wrapper e Flutter
CLI. Pacotes TS estendem `tsconfig.base.json` (strict).

## Setup do zero (todos os ecossistemas)

Guia único, verificado na prática, cobrindo Node+pnpm, JDK 21+Maven, Flutter
e a infraestrutura local (Docker Compose) — incluindo como subir a API com
dados de demonstração (perfil `demo`):
[`docs/setup.md`](docs/setup.md). Checklist de release do MVP (três
ecossistemas verdes + smoke test do perfil demo) em
[`docs/release-checklist.md`](docs/release-checklist.md).

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `apps/landing` | Landing page pública (Next.js/React) |
| `apps/clinic` | Aplicação web da psicóloga (Vite + React + Mantine) |
| `apps/mobile` | App companion da psicóloga (Flutter) |
| `apps/api` | Backend único (Spring Boot 3 + Axon, JPA/Flyway + PostgreSQL) |
| `packages/*` | contracts (OpenAPI + codegen TS/Java/Dart), ui, config, testing |
| `docs/` | Escopo, glossário, arquitetura, ADRs, spec da landing |
| `tasks/` | Manifestos das 46 tarefas (formato em `tasks/_FORMAT.md`) |
| `project/` | Referência visual da landing — **somente leitura** |

## Documentos de partida

- [Setup do zero](docs/setup.md)
- [Checklist de release do MVP](docs/release-checklist.md)
- [Escopo do MVP](docs/product/scope.md)
- [Glossário do domínio](docs/product/domain-glossary.md)
- [Contexto do sistema](docs/architecture/system-context.md)
- [Grafo de dependências e ondas](docs/architecture/dependency-graph.md)
- [ADRs](docs/adr/)
- [Regras para agentes](CLAUDE.md)

## Fluxo de trabalho

```bash
bash scripts/create-worktree.sh PSI-0NN        # worktree + branch da tarefa
node scripts/validate-task-scope.mjs --lint-all
node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main
```

Cada tarefa gera no máximo um pull request (draft), validado por lint, typecheck,
testes, build e verificação mecânica de escopo de arquivos.
