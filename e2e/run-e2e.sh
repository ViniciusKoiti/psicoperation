#!/usr/bin/env bash
# Orquestra a suíte E2E cross-app da PSI-044 de ponta a ponta: sobe a infra
# (Postgres 16 + Mailpit via docker compose), builda/sobe a API Spring,
# espera as duas ficarem saudáveis, roda a suíte do clinic
# (apps/clinic/e2e/**) e a suíte cross-app da raiz (e2e/specs/**), e derruba
# tudo no final (a API sempre; o docker compose também, a menos que
# PSI044_KEEP_INFRA=1 esteja setado).
#
# Uso: bash e2e/run-e2e.sh
#
# Pré-requisitos (ver e2e/README.md §0): pnpm install +
# bash e2e/scripts/link-playwright.sh já rodados; JDK 21 no PATH
# (JAVA_HOME); Docker acessível (DOCKER_HOST em WSL2); chromium do
# Playwright instalado (pnpm exec playwright install chromium).
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  echo
  echo "[run-e2e] derrubando infra/API..."
  bash "$ROOT_DIR/e2e/scripts/stop-all.sh"
}
trap cleanup EXIT

echo "[run-e2e] === 1/4: infraestrutura (Postgres + Mailpit) ==="
bash "$ROOT_DIR/e2e/scripts/start-infra.sh" || exit 1

echo "[run-e2e] === 2/4: API Spring ==="
bash "$ROOT_DIR/e2e/scripts/start-api.sh" || exit 1

STATUS=0

echo "[run-e2e] === 3/4: suíte do clinic (registro → login → paciente → agenda) ==="
(cd "$ROOT_DIR/apps/clinic" && pnpm exec playwright test --config e2e/playwright.config.ts) || STATUS=1

echo "[run-e2e] === 4/4: suíte cross-app (landing — lead → API real → banco) ==="
(cd "$ROOT_DIR" && pnpm exec playwright test --config e2e/playwright.config.ts) || STATUS=1

if [[ "$STATUS" -eq 0 ]]; then
  echo "[run-e2e] TUDO VERDE."
else
  echo "[run-e2e] FALHOU — ver a saída das suítes acima." >&2
fi

exit "$STATUS"
