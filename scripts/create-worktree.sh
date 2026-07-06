#!/usr/bin/env bash
# Cria um git worktree isolado para uma tarefa PSI-0NN, na branch definida
# pelo manifesto (agent/psi-0nn-slug), a partir da main atualizada.
#
# Uso: bash scripts/create-worktree.sh PSI-013
set -euo pipefail

TASK_ID="${1:-}"
if [[ ! "$TASK_ID" =~ ^PSI-[0-9]{3}$ ]]; then
  echo "Uso: bash scripts/create-worktree.sh PSI-0NN" >&2
  exit 2
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
MANIFEST="$REPO_ROOT/tasks/$TASK_ID.yaml"
if [[ ! -f "$MANIFEST" ]]; then
  echo "Manifesto não encontrado: $MANIFEST" >&2
  exit 1
fi

BRANCH="$(sed -n 's/^branch:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$MANIFEST" | head -n1)"
if [[ ! "$BRANCH" =~ ^agent/psi-[0-9]{3}-[a-z0-9-]+$ ]]; then
  echo "Branch inválida no manifesto ($MANIFEST): '$BRANCH'" >&2
  exit 1
fi

SLUG="${BRANCH#agent/}"
WORKTREES_DIR="$(dirname "$REPO_ROOT")/psicoperation-worktrees"
WORKTREE_PATH="$WORKTREES_DIR/$SLUG"

if [[ -e "$WORKTREE_PATH" ]]; then
  echo "Worktree já existe: $WORKTREE_PATH" >&2
  exit 1
fi

mkdir -p "$WORKTREES_DIR"
git -C "$REPO_ROOT" fetch origin main
if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" "$BRANCH"
else
  git -C "$REPO_ROOT" worktree add -b "$BRANCH" "$WORKTREE_PATH" origin/main
fi

cat <<EOF
Worktree criado.

  Tarefa:    $TASK_ID
  Branch:    $BRANCH
  Diretório: $WORKTREE_PATH

Próximos passos do agente:
  1. cd "$WORKTREE_PATH"
  2. Ler CLAUDE.md e tasks/$TASK_ID.yaml
  3. pnpm install (se necessário) e implementar dentro de allowed_paths
  4. node scripts/validate-task-scope.mjs --task $TASK_ID --base origin/main
  5. Push da branch e abertura de PR draft
EOF
