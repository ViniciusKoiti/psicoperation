/**
 * Consulta direta ao PostgreSQL do docker compose (container
 * `psiops-postgres`), usada pela suíte E2E para provar persistência (ex.:
 * lead da landing gravado na tabela `leads`) sem precisar de um endpoint
 * `GET` correspondente no contrato.
 *
 * SEM DRIVER NPM DE POSTGRES: nenhuma dependência nova é permitida nesta
 * tarefa (package.json/pnpm-lock.yaml são forbidden_paths). Em vez de um
 * client `pg`, isto invoca `docker exec psiops-postgres psql` — o próprio
 * container já tem o cliente `psql` (imagem oficial `postgres`), e Docker
 * já é um pré-requisito da suíte (mesma infra subida por
 * `e2e/scripts/start-infra.sh`). Consulta apenas leitura (`SELECT`).
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CONTAINER = process.env.POSTGRES_CONTAINER ?? "psiops-postgres";
const DB_USER = process.env.POSTGRES_USER ?? "psiops";
const DB_NAME = process.env.POSTGRES_DB ?? "psiops";

/**
 * Roda uma query de leitura contra o Postgres do compose e devolve as
 * linhas como um array de objetos (colunas pelo nome), decodificando o
 * formato `-A` (sem alinhamento) e `-F` (delimitador custom) do `psql`.
 */
export async function queryRows(sql, { columns }) {
  const delimiter = "";
  const { stdout } = await execFileAsync("docker", [
    "exec",
    CONTAINER,
    "psql",
    "-U",
    DB_USER,
    "-d",
    DB_NAME,
    "-t", // tuples only (sem cabeçalho/rodapé)
    "-A", // sem alinhamento de colunas
    "-F",
    delimiter,
    "-c",
    sql,
  ]);

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const values = line.split(delimiter);
      return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
    });
}

/** Busca o lead persistido com o e-mail informado (ou `undefined` se não existir). */
export async function findLeadByEmail(email) {
  const escaped = email.replace(/'/g, "''");
  const rows = await queryRows(`SELECT id, name, whatsapp, email, created_at FROM leads WHERE email = '${escaped}';`, {
    columns: ["id", "name", "whatsapp", "email", "createdAt"],
  });
  return rows[0];
}

/** Busca a conta de usuária persistida com o e-mail informado (ou `undefined` se não existir). */
export async function findUserByEmail(email) {
  const escaped = email.replace(/'/g, "''");
  const rows = await queryRows(`SELECT id, name, email, created_at FROM users WHERE email = '${escaped}';`, {
    columns: ["id", "name", "email", "createdAt"],
  });
  return rows[0];
}
