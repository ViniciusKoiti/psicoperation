#!/usr/bin/env node
/* global process, console */
// Ver a mesma nota em `support/api-proxy.mjs`: este script roda só via
// `node` (fora de `src/**`), então precisa declarar os globals do Node que
// o preset ESLint de apps/clinic (focado em código de navegador) não conhece.
/**
 * Verificação anti-mock (PSI-044, acceptance criteria #3): falha se módulos
 * mock entrarem no bundle de PRODUÇÃO do clinic.
 *
 * NÃO precisa de infraestrutura (sem Postgres/Mailpit/API): builda o app
 * (`vite build`, mesmo comando de `pnpm --filter @psiops/clinic build`) SEM
 * nenhuma variável `VITE_*_ADAPTER` no ambiente — ou seja, exatamente a
 * configuração padrão de um deploy de produção real (ver
 * `src/adapters/<dominio>/index.ts`: sem override, `import.meta.env.PROD` decide, e
 * PROD nunca escolhe mock por padrão — ADR 0006) — e então varre o
 * JavaScript gerado em `dist/assets/*.js` por identificadores que só
 * deveriam existir nas implementações `Mock*Adapter`.
 *
 * POR QUE ISSO É NECESSÁRIO (não é só teórico): a primeira versão desta
 * checagem, rodada antes de `createXAdapter()` ser "achatado" em cada
 * `src/adapters/<dominio>/index.ts` (ver o comentário em `createAuthAdapter`),
 * PEGOU um bundle de produção real contendo `MockAuthAdapter` inteiro
 * (classe, credenciais semente `ana@exemplo.com.br`/`SenhaForte123`, etc.)
 * — o minificador (esbuild, via Vite) não conseguia provar que o branch
 * mock era morto quando a decisão passava por uma função auxiliar
 * (`resolveXAdapterKind` → `readExplicitKind`). Depois de reescrever a
 * decisão como uma única expressão local em cada `createXAdapter()`, o
 * bundle passou a eliminar os sete `Mock*Adapter` por completo. Este
 * script existe para que essa classe de regressão nunca mais passe
 * silenciosamente — qualquer mudança futura em `src/adapters/<dominio>/index.ts`
 * que reintroduza a indireção (ou importe um `Mock*Adapter` de outro jeito
 * alcançável em produção) faz este script falhar de novo.
 *
 * Uso:
 *   node apps/clinic/e2e/check-no-mock-in-bundle.mjs
 *
 * Saída: 0 e "OK" se nenhum marcador for encontrado; 1 e a lista de
 * marcadores encontrados (arquivo + trecho) caso contrário.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLINIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = join(CLINIC_DIR, "dist");
const ASSETS_DIR = join(DIST_DIR, "assets");

/**
 * Identificadores que só existem no código-fonte dos sete `Mock*Adapter`
 * (nomes de classe, exports mock-only e valores literais só usados por
 * eles) — nenhum deveria aparecer em um bundle de produção puro.
 */
const FORBIDDEN_MARKERS = [
  "MockAuthAdapter",
  "MockPatientsAdapter",
  "MockAgendaAdapter",
  "MockChargesAdapter",
  "MockTasksAdapter",
  "MockRemindersAdapter",
  "MockSettingsAdapter",
  "SEED_USER_CREDENTIALS",
  // Credenciais da conta semente do MockAuthAdapter — se aparecerem,
  // MockAuthAdapter foi incluído mesmo que seu nome de classe tenha sido
  // renomeado pela minificação.
  "ana@exemplo.com.br",
  "SenhaForte123",
  // Prefixos de token só emitidos por MockAuthAdapter.issueTokenPair.
  "mock-access-",
  "mock-refresh-",
];

function log(message) {
  process.stdout.write(`${message}\n`);
}

function buildProductionBundle() {
  log("[anti-mock] building apps/clinic em modo produção (sem VITE_*_ADAPTER no ambiente)...");

  // Ambiente limpo: remove qualquer VITE_*_ADAPTER herdado do shell do
  // chamador — a checagem precisa validar o DEFAULT de produção, não uma
  // escolha explícita de quem rodou o script.
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^VITE_.*_ADAPTER$/.test(key)) delete env[key];
  }

  if (existsSync(DIST_DIR)) rmSync(DIST_DIR, { recursive: true, force: true });

  execFileSync("pnpm", ["exec", "vite", "build"], {
    cwd: CLINIC_DIR,
    env,
    stdio: "inherit",
  });
}

function collectBundleFiles() {
  if (!existsSync(ASSETS_DIR)) {
    throw new Error(`dist/assets não encontrado em ${ASSETS_DIR} — build de produção falhou?`);
  }
  return readdirSync(ASSETS_DIR)
    .filter((name) => name.endsWith(".js"))
    .map((name) => join(ASSETS_DIR, name));
}

function scanForMocks(files) {
  const findings = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const marker of FORBIDDEN_MARKERS) {
      if (content.includes(marker)) {
        findings.push({ file, marker });
      }
    }
  }
  return findings;
}

function main() {
  buildProductionBundle();
  const files = collectBundleFiles();
  if (files.length === 0) {
    throw new Error("Nenhum arquivo .js encontrado em dist/assets — build de produção não gerou saída esperada.");
  }

  log(`[anti-mock] varrendo ${files.length} arquivo(s) de bundle por marcadores de mock...`);
  const findings = scanForMocks(files);

  if (findings.length > 0) {
    console.error("\n[anti-mock] FALHOU: o build de produção do clinic referencia código de mock:\n");
    for (const { file, marker } of findings) {
      console.error(`  - "${marker}" encontrado em ${file}`);
    }
    console.error(
      "\nUm build de produção (sem VITE_*_ADAPTER definido) nunca deve incluir Mock*Adapter no bundle " +
        "(ADR 0006). Verifique src/adapters/*/index.ts: a escolha mock/http deve ser resolvida como uma " +
        "expressão local dentro de createXAdapter() (sem indireção via função auxiliar), para que o " +
        "minificador consiga eliminar o branch morto — ver o comentário em createAuthAdapter().\n",
    );
    process.exitCode = 1;
    return;
  }

  log("\n[anti-mock] OK: nenhum marcador de mock encontrado no build de produção do clinic.\n");
}

main();
