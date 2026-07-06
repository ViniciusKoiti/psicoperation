# ADR 0005 — Isolamento de tarefas: manifestos, worktrees e shared_change

- Status: aceito
- Data: 2026-07-05

## Contexto

O projeto será implementado em exatamente 40 tarefas (PSI-001 a PSI-040) por agentes
autônomos paralelos. Sem fronteiras mecânicas, agentes colidem nos mesmos arquivos,
fazem refatorações oportunistas e quebram contratos alheios.

## Decisão

1. Cada tarefa tem um **manifesto** `tasks/PSI-0NN.yaml` (formato em `tasks/_FORMAT.md`)
   declarando escopo, `allowed_paths`, `forbidden_paths`, dependências, critérios de
   aceite e comandos de validação. O manifesto é lei: nada fora de `allowed_paths`.
2. Cada agente trabalha em **worktree próprio** (`scripts/create-worktree.sh PSI-0NN`)
   na branch `agent/<task-id>-<slug>`, abre **um PR draft** e nunca faz merge,
   force-push ou commit na `main`.
3. Arquivos compartilhados (raiz do workspace, lockfile, workflows, `packages/contracts`,
   migrations Flyway `**/db/migration/**`, `project/PsiOps Landing.html`) são proibidos
   por padrão; somente tarefas com **`shared_change: true`** os alteram, e apenas
   **uma tarefa shared_change executa por vez**.
4. A conformidade é verificada mecanicamente por `scripts/validate-task-scope.mjs`
   (localmente e no CI em branches `agent/*`): diff contra a base deve casar com
   `allowed_paths` e com nenhum `forbidden_paths` (proibição vence).
5. Ambiguidade não é resolvida silenciosamente: vira `assumption` (premissa registrada)
   ou `open_question` (bloqueio a escalar) no manifesto.

## Consequências

- Paralelismo seguro: tarefas da mesma onda têm `allowed_paths` disjuntos por construção.
- O custo é rigidez: descobrir mid-task que é preciso tocar um arquivo compartilhado
  significa parar e replanejar (nova tarefa ou promoção a shared_change pelo orquestrador).
- O validador usa um subconjunto restrito de YAML para não depender de bibliotecas
  externas antes da fundação existir.
