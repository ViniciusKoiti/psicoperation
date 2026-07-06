# PsiOps — psicoperation

Monorepo do **PsiOps**, SaaS de gestão financeira e administrativa para psicólogas
solo brasileiras, com foco em mensalidades.

> Estado atual: **fundação de governança** (onda 0). As aplicações são implementadas
> em 40 tarefas rastreáveis (PSI-001 a PSI-040) — ver `tasks/` e
> `docs/architecture/dependency-graph.md`.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `apps/landing` | Landing page pública (Next.js) |
| `apps/clinic` | Aplicação da psicóloga (Vite + React + Mantine) |
| `apps/api` | Backend (NestJS + Prisma/PostgreSQL) |
| `apps/automation` | Worker assíncrono (BullMQ + Redis) |
| `packages/*` | contracts, database, ui, config, testing |
| `docs/` | Escopo, glossário, arquitetura, ADRs, spec da landing |
| `tasks/` | Manifestos das 40 tarefas (formato em `tasks/_FORMAT.md`) |
| `project/` | Referência visual da landing — **somente leitura** |

## Documentos de partida

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
