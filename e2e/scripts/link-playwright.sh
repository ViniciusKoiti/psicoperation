#!/usr/bin/env bash
# Torna `@playwright/test` resolvível a partir de apps/clinic/e2e/** e
# e2e/** sem adicionar dependência nenhuma (package.json/pnpm-lock.yaml são
# forbidden_paths da PSI-044).
#
# POR QUE ISSO EXISTE: `@playwright/test` já é devDependency do workspace —
# mas hoje só de apps/landing (PSI-009/PSI-019). Com o node_modules
# isolado do pnpm (sem hoisting), um pacote só enxerga, via resolução
# padrão do Node, as dependências QUE ELE MESMO declara — apps/clinic e a
# raiz do repo não veem @playwright/test mesmo com pnpm install rodado.
# Como não podemos declarar a dependência nós mesmos (package.json/
# pnpm-lock.yaml proibidos nesta tarefa), este script cria links
# simbólicos apontando para a cópia real já resolvida em
# apps/landing/node_modules — node_modules é gitignorado, então isto é só
# estado de ambiente local/CI, nunca versionado.
#
# Solução INTERINA — ver open_question do PR da PSI-044: o correto a
# prazo é uma tarefa shared_change futura declarar @playwright/test como
# devDependency da raiz (ou de apps/clinic também), o que tornaria este
# script desnecessário.
#
# Uso: bash e2e/scripts/link-playwright.sh   (rodar depois de `pnpm install`)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_DIR="$ROOT_DIR/apps/landing/node_modules/@playwright/test"
SOURCE_BIN="$ROOT_DIR/apps/landing/node_modules/.bin/playwright"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "[link-playwright] ERRO: $SOURCE_DIR não existe — rode 'pnpm install' na raiz primeiro." >&2
  exit 1
fi

link_into() {
  local target_pkg_dir="$1"
  mkdir -p "$target_pkg_dir/node_modules/@playwright" "$target_pkg_dir/node_modules/.bin"
  ln -sfn "$SOURCE_DIR" "$target_pkg_dir/node_modules/@playwright/test"
  if [[ -e "$SOURCE_BIN" ]]; then
    ln -sfn "$SOURCE_BIN" "$target_pkg_dir/node_modules/.bin/playwright"
  fi
  echo "[link-playwright] linkado em $target_pkg_dir/node_modules/@playwright/test"
}

link_into "$ROOT_DIR/apps/clinic"
link_into "$ROOT_DIR"

echo "[link-playwright] OK — @playwright/test resolvível a partir de apps/clinic/e2e/** e e2e/**."
