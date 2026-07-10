#!/usr/bin/env bash
# Sobe a infraestrutura local (PostgreSQL 16 + Mailpit) via o docker compose
# da raiz do repositório (PSI-003) e aguarda os dois serviços ficarem
# saudáveis antes de retornar. NÃO altera docker-compose.yml (fora dos
# caminhos permitidos da PSI-044) — só o consome com `docker compose up -d`.
#
# Uso: bash e2e/scripts/start-infra.sh
# Pré-requisito: Docker rodando e acessível (em WSL2, normalmente
# `export DOCKER_HOST=unix:///var/run/docker.sock` antes de chamar este
# script — ver e2e/README.md).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[start-infra] docker compose up -d (postgres + mailpit)..."
docker compose up -d

wait_healthy() {
  local container="$1"
  local attempts=60 # 60 * 2s = 120s
  for ((i = 1; i <= attempts; i++)); do
    local status
    status="$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")"
    if [[ "$status" == "healthy" ]]; then
      echo "[start-infra] $container está healthy."
      return 0
    fi
    sleep 2
  done
  echo "[start-infra] ERRO: $container não ficou healthy em $((attempts * 2))s (status final: $status)." >&2
  docker logs "$container" --tail 50 >&2 || true
  return 1
}

wait_healthy "psiops-postgres"
wait_healthy "psiops-mailpit"

echo "[start-infra] infraestrutura pronta (Postgres em \${POSTGRES_PORT:-5432}, Mailpit SMTP em \${MAILPIT_SMTP_PORT:-1025}, UI em http://localhost:\${MAILPIT_UI_PORT:-8025})."
