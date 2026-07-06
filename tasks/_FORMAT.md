# Formato dos manifestos de tarefa (tasks/PSI-0NN.yaml)

Todo manifesto usa um **subconjunto restrito de YAML**, parseável por `scripts/validate-task-scope.mjs`:

- Apenas chaves de nível raiz.
- Valores escalares em uma linha (`chave: "valor"` ou `chave: true`).
- Blocos literais multi-linha com `chave: |` (indentação de 2 espaços).
- Listas de strings com `- "item"` (indentação de 2 espaços).
- Lista vazia: `chave: []`.
- **Proibido**: mapas aninhados, âncoras, referências, flow mappings.

## Chaves obrigatórias, nesta ordem

```yaml
id: PSI-001
title: "Título curto em pt-BR"
project: root            # root|landing|clinic|api|automation|contracts|database|ui|config|testing|infra|integration
shared_change: false     # true somente para tarefas autorizadas a tocar arquivos compartilhados
branch: "agent/psi-001-slug-curto"
commit_message: "tipo(escopo): descrição [PSI-001]"
pr_title: "PSI-001: Título do PR"
description: |
  Texto em pt-BR explicando o que a tarefa entrega e por quê.
dependencies: []         # ou lista de IDs "PSI-0NN"
allowed_paths:
  - "apps/exemplo/**"
forbidden_paths:
  - "project/**"
acceptance_criteria:
  - "Critério verificável"
validation_commands:
  - "pnpm --filter exemplo test"
risks:
  - "Risco conhecido"
out_of_scope:
  - "Item explicitamente fora do escopo"
assumptions: []          # premissas registradas quando houver ambiguidade
open_questions: []       # perguntas abertas para o orquestrador/produto
```

## Regras

1. `forbidden_paths` sempre inclui `"project/**"` e `"tasks/**"`. Para tarefas com
   `shared_change: false`, inclui também: `"package.json"`, `"pnpm-lock.yaml"`,
   `"pnpm-workspace.yaml"`, `"turbo.json"`, `".github/workflows/**"`,
   `"packages/contracts/**"`, `"packages/database/**"`, `"**/migrations/**"` —
   exceto os que estiverem em `allowed_paths` (um caminho não pode aparecer nas duas listas).
2. Arquivo alterado pelo agente deve casar com ao menos um glob de `allowed_paths`
   e com nenhum de `forbidden_paths` (proibição vence).
3. `shared_change: true` autoriza tocar arquivos compartilhados listados em
   `allowed_paths`; apenas uma tarefa `shared_change: true` executa por vez.
4. Dependências referenciam somente IDs existentes; o grafo não pode ter ciclos.
5. Ambiguidade nunca é resolvida silenciosamente: registrar em `assumptions`
   ou `open_questions`.
