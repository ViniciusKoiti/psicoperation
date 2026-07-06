/**
 * Codegen TypeScript do @psiops/contracts.
 *
 * Gera, a partir de openapi/openapi.yaml (fonte única — ADR 0008):
 *
 *   - gen/ts/api.d.ts   — tipos `paths`/`components`/`operations` via
 *                         openapi-typescript (versão exata fixada no
 *                         package.json para garantir determinismo);
 *   - gen/ts/index.d.ts — reexports + um alias nomeado por schema declarado
 *                         em components.schemas do arquivo raiz (ex.:
 *                         `type Lead = components["schemas"]["Lead"]`).
 *
 * O output é determinístico: mesmo input (spec + versão do gerador) produz
 * exatamente os mesmos bytes. O teste de drift (tests/drift.test.ts) regenera
 * em memória e compara com o conteúdo comitado; o script `check:drift` faz o
 * equivalente via `git diff --exit-code -- gen`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import { parse } from "yaml";

const SPEC_URL = new URL("../openapi/openapi.yaml", import.meta.url);
const GEN_DIR_URL = new URL("../gen/ts/", import.meta.url);

const HEADER = `/**
 * ARQUIVO GERADO — NÃO EDITAR MANUALMENTE.
 *
 * Fonte: packages/contracts/openapi/openapi.yaml
 * Regenerar: pnpm --filter @psiops/contracts generate
 * Drift é reprovado por tests/drift.test.ts e pelo script check:drift.
 */
`;

/**
 * Gera o conteúdo de gen/ts/api.d.ts (tipos openapi-typescript).
 *
 * @returns {Promise<string>}
 */
export async function generateApiDts() {
  const ast = await openapiTS(SPEC_URL);
  return `${HEADER}\n${astToString(ast)}`;
}

/**
 * Gera o conteúdo de gen/ts/index.d.ts: reexporta paths/components/operations
 * e cria um alias por schema nomeado no components.schemas do arquivo raiz,
 * preservando a ordem de declaração da spec.
 *
 * @returns {Promise<string>}
 */
export async function generateIndexDts() {
  const spec = parse(readFileSync(fileURLToPath(SPEC_URL), "utf8"));
  const schemaNames = Object.keys(spec?.components?.schemas ?? {});
  if (schemaNames.length === 0) {
    throw new Error("Nenhum schema declarado em components.schemas do openapi.yaml");
  }
  const aliases = schemaNames
    .map((name) => `export type ${name} = components["schemas"]["${name}"];`)
    .join("\n");
  return `${HEADER}
export type { components, operations, paths } from "./api";

import type { components } from "./api";

${aliases}
`;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const [apiDts, indexDts] = await Promise.all([generateApiDts(), generateIndexDts()]);
  mkdirSync(fileURLToPath(GEN_DIR_URL), { recursive: true });
  writeFileSync(new URL("api.d.ts", GEN_DIR_URL), apiDts);
  writeFileSync(new URL("index.d.ts", GEN_DIR_URL), indexDts);
  console.warn("gen/ts/api.d.ts e gen/ts/index.d.ts regenerados a partir de openapi/openapi.yaml");
}
