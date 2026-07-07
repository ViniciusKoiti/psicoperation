/**
 * Codegen do @psiops/contracts — três alvos a partir de openapi/openapi.yaml
 * (fonte única — ADR 0008):
 *
 *   - gen/ts   — tipos TypeScript via openapi-typescript (versão exata fixada
 *                no package.json);
 *   - gen/java — DTOs Java (POJOs Jackson + Bean Validation) via
 *                openapi-generator, generator `spring` em modo models-only,
 *                empacotados como projeto Maven mínimo (pom.xml de template);
 *   - gen/dart — modelos Dart via openapi-generator, generator `dart`
 *                (models + supporting files, sem clients de endpoint),
 *                empacotados como package Dart local (pubspec.yaml de
 *                template).
 *
 * A versão do openapi-generator é FIXADA em openapitools.json
 * (generator-cli.version) e resolvida pelo pacote npm
 * @openapitools/openapi-generator-cli (versão exata no package.json). O jar
 * é baixado do Maven Central na primeira execução; requer Java 11+ no PATH
 * (ou JAVA_HOME apontando para um JDK — o script o antepõe ao PATH).
 *
 * Para os alvos java/dart a spec modular é bundlada antes (redocly bundle):
 * os path items referenciam os arquivos de components diretamente e, sem o
 * bundle, o openapi-generator sintetizaria modelos inline duplicados
 * (CreateLead201Response etc.) em vez de reutilizar os schemas nomeados.
 *
 * O output é determinístico (hideGenerationTimestamp; versões fixadas):
 * mesmo input produz exatamente os mesmos bytes. Drift é reprovado pelos
 * testes (tests/drift.test.ts, tests/gen-targets.test.ts) e pelo script
 * `check:drift` (regenera e roda `git diff --exit-code -- gen`).
 *
 * Uso: node scripts/generate.mjs [ts|java|dart]...  (sem argumentos: todos)
 */
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";
import { parse } from "yaml";

const require = createRequire(import.meta.url);

const PKG_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SPEC_URL = new URL("../openapi/openapi.yaml", import.meta.url);
const SPEC_PATH = fileURLToPath(SPEC_URL);
const GEN_TS_DIR_URL = new URL("../gen/ts/", import.meta.url);
const GEN_JAVA_DIR = join(PKG_ROOT, "gen", "java");
const GEN_DART_DIR = join(PKG_ROOT, "gen", "dart");
const TEMPLATES_DIR = join(PKG_ROOT, "scripts", "templates");

const REDOCLY_BIN = require.resolve("@redocly/cli/bin/cli.js");
const GENERATOR_CLI_BIN = require.resolve("@openapitools/openapi-generator-cli/main.js");

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
  const spec = parse(readFileSync(SPEC_PATH, "utf8"));
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

/** Escreve gen/ts a partir da spec. */
export async function generateTs() {
  const [apiDts, indexDts] = await Promise.all([generateApiDts(), generateIndexDts()]);
  mkdirSync(fileURLToPath(GEN_TS_DIR_URL), { recursive: true });
  writeFileSync(new URL("api.d.ts", GEN_TS_DIR_URL), apiDts);
  writeFileSync(new URL("index.d.ts", GEN_TS_DIR_URL), indexDts);
}

/**
 * Ambiente de processo com o bin do JAVA_HOME (quando definido) anteposto ao
 * PATH — o openapi-generator-cli invoca `java` diretamente.
 *
 * @returns {NodeJS.ProcessEnv}
 */
function javaEnv() {
  const env = { ...process.env };
  if (env.JAVA_HOME) {
    env.PATH = `${join(env.JAVA_HOME, "bin")}${delimiter}${env.PATH ?? ""}`;
  }
  return env;
}

/**
 * Executa um CLI Node (arquivo js resolvido de node_modules) com cwd na raiz
 * do pacote; lança com stdout/stderr no erro em caso de exit code != 0.
 *
 * @param {string} bin caminho do entrypoint js
 * @param {string[]} args
 */
function runNodeCli(bin, args) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: PKG_ROOT,
    env: javaEnv(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `Comando falhou (exit ${result.status}): node ${bin} ${args.join(" ")}\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

/**
 * Bundla a spec modular em um único arquivo (redocly bundle), reescrevendo os
 * $ref dos paths para os schemas nomeados de #/components/schemas.
 *
 * @param {string} outFile caminho do yaml bundlado
 */
export function bundleSpec(outFile) {
  runNodeCli(REDOCLY_BIN, ["bundle", "openapi/openapi.yaml", "-o", outFile]);
}

/**
 * Invoca o openapi-generator-cli (versão do generator fixada em
 * openapitools.json) sobre a spec bundlada.
 *
 * @param {object} opts
 * @param {string} opts.generator nome do generator (spring, dart, ...)
 * @param {string} opts.specFile spec bundlada
 * @param {string} opts.outDir diretório de saída
 * @param {string} opts.globalProperty valor de --global-property
 * @param {string} opts.additionalProperties valor de --additional-properties
 */
function runOpenapiGenerator({
  generator,
  specFile,
  outDir,
  globalProperty,
  additionalProperties,
}) {
  runNodeCli(GENERATOR_CLI_BIN, [
    "generate",
    "-g",
    generator,
    "-i",
    specFile,
    "-o",
    outDir,
    "--global-property",
    globalProperty,
    "--additional-properties",
    additionalProperties,
  ]);
}

/**
 * Gera os DTOs Java (generator `spring`, models-only) + pom.xml de template
 * em outDir (default gen/java). Limpa o diretório antes para não deixar
 * modelos órfãos de schemas removidos.
 *
 * @param {object} [opts]
 * @param {string} [opts.outDir]
 * @param {string} [opts.specFile] spec já bundlada (bundla se omitido)
 */
export function generateJava({ outDir = GEN_JAVA_DIR, specFile } = {}) {
  const bundled = specFile ?? bundleToTemp();
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  runOpenapiGenerator({
    generator: "spring",
    specFile: bundled,
    outDir,
    globalProperty: "models,modelDocs=false,modelTests=false",
    additionalProperties: [
      "useSpringBoot3=true",
      "documentationProvider=none",
      "annotationLibrary=none",
      "useBeanValidation=true",
      "hideGenerationTimestamp=true",
      "openApiNullable=false",
      "modelPackage=com.psiops.contracts.model",
    ].join(","),
  });
  cpSync(join(TEMPLATES_DIR, "java", "pom.xml"), join(outDir, "pom.xml"));
  cpSync(join(TEMPLATES_DIR, "java", "gitignore"), join(outDir, ".gitignore"));
}

/**
 * Gera o package Dart (generator `dart`, models + supporting files, sem
 * clients de endpoint) + pubspec.yaml de template em outDir (default
 * gen/dart). O .openapi-generator-ignore é semeado ANTES da geração para
 * suprimir acessórios (pubspec/README/git_push/.travis/analysis_options).
 *
 * @param {object} [opts]
 * @param {string} [opts.outDir]
 * @param {string} [opts.specFile] spec já bundlada (bundla se omitido)
 */
export function generateDart({ outDir = GEN_DART_DIR, specFile } = {}) {
  const bundled = specFile ?? bundleToTemp();
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(
    join(TEMPLATES_DIR, "dart", "openapi-generator-ignore"),
    join(outDir, ".openapi-generator-ignore"),
  );
  runOpenapiGenerator({
    generator: "dart",
    specFile: bundled,
    outDir,
    globalProperty: "models,supportingFiles,modelDocs=false,modelTests=false",
    additionalProperties: [
      "pubName=psiops_contracts",
      "pubVersion=0.1.0",
      "hideGenerationTimestamp=true",
    ].join(","),
  });
  cpSync(join(TEMPLATES_DIR, "dart", "pubspec.yaml"), join(outDir, "pubspec.yaml"));
}

/**
 * Bundla a spec em um arquivo temporário e retorna o caminho.
 *
 * @returns {string}
 */
export function bundleToTemp() {
  const dir = mkdtempSync(join(tmpdir(), "psiops-contracts-bundle-"));
  const file = join(dir, "openapi.bundle.yaml");
  bundleSpec(file);
  return file;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const known = ["ts", "java", "dart"];
  const requested = process.argv.slice(2);
  const invalid = requested.filter((t) => !known.includes(t));
  if (invalid.length > 0) {
    console.error(`Alvos desconhecidos: ${invalid.join(", ")} (válidos: ${known.join(", ")})`);
    process.exit(1);
  }
  const targets = requested.length > 0 ? requested : known;

  if (targets.includes("ts")) {
    await generateTs();
    console.warn("gen/ts regenerado a partir de openapi/openapi.yaml");
  }
  if (targets.includes("java") || targets.includes("dart")) {
    const specFile = bundleToTemp();
    if (targets.includes("java")) {
      generateJava({ specFile });
      console.warn("gen/java regenerado a partir de openapi/openapi.yaml (bundle)");
    }
    if (targets.includes("dart")) {
      generateDart({ specFile });
      console.warn("gen/dart regenerado a partir de openapi/openapi.yaml (bundle)");
    }
  }
}
