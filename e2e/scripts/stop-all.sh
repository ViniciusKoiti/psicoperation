#!/usr/bin/env bash
# Derruba o que `start-api.sh`/`start-infra.sh` subiram: mata o processo da
# API (via e2e/.api.pid) e roda `docker compose down` (raiz do repo).
#
# Uso: bash e2e/scripts/stop-all.sh
#   PSI044_KEEP_INFRA=1 bash e2e/scripts/stop-all.sh   # só para a API, mantém o compose de pé
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="$ROOT_DIR/e2e/.api.pid"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "[stop-all] encerrando API (PID $PID)..."
    # mvnw spring-boot:run gera um processo filho (a JVM) — mata o grupo
    # inteiro para não deixar a JVM órfã rodando.
    pkill -TERM -P "$PID" 2>/dev/null || true
    kill -TERM "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
else
  echo "[stop-all] nenhum e2e/.api.pid encontrado — API já parada ou nunca iniciada por este script."
fi

if [[ "${PSI044_KEEP_INFRA:-}" == "1" ]]; then
  echo "[stop-all] PSI044_KEEP_INFRA=1 — mantendo docker compose (postgres/mailpit) de pé."
else
  echo "[stop-all] docker compose down..."
  (cd "$ROOT_DIR" && docker compose down)
fi
