#!/usr/bin/env bash
# Builda e sobe a API Spring (apps/api) em segundo plano, apontando para o
# PostgreSQL/Mailpit do docker compose (via os defaults do próprio
# application.yml — mesmas variáveis do .env.example), e aguarda
# `GET /actuator/health` responder `{"status":"UP"}` antes de retornar.
#
# Uso: bash e2e/scripts/start-api.sh
# Pré-requisitos:
#   - `bash e2e/scripts/start-infra.sh` já rodado (Postgres/Mailpit healthy);
#   - JDK 21 no PATH (ex.: `export JAVA_HOME=~/.local/jdk/current && export
#     PATH=$JAVA_HOME/bin:$PATH` — ver e2e/README.md).
#
# Escreve o PID em e2e/.api.pid e os logs em e2e/.api.log (ambos
# gitignorados — apenas estado de execução local, não versionado).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
PID_FILE="$ROOT_DIR/e2e/.api.pid"
LOG_FILE="$ROOT_DIR/e2e/.api.log"
HEALTH_URL="${API_HEALTH_URL:-http://localhost:8080/actuator/health}"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "[start-api] já há uma API rodando (PID $(cat "$PID_FILE")) — reaproveitando."
else
  echo "[start-api] iniciando API Spring (apps/api) em segundo plano — log em $LOG_FILE..."
  (
    cd "$API_DIR"
    nohup ./mvnw -q spring-boot:run > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
  )
fi

echo "[start-api] aguardando $HEALTH_URL responder UP (até 180s — primeira build Maven pode ser lenta)..."
attempts=90 # 90 * 2s = 180s
for ((i = 1; i <= attempts; i++)); do
  if curl -fsS "$HEALTH_URL" 2>/dev/null | grep -q '"status":"UP"'; then
    echo "[start-api] API pronta em $HEALTH_URL."
    exit 0
  fi
  sleep 2
done

echo "[start-api] ERRO: API não respondeu UP em $((attempts * 2))s. Últimas linhas do log ($LOG_FILE):" >&2
tail -n 80 "$LOG_FILE" >&2 || true
exit 1
