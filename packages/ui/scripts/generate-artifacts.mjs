#!/usr/bin/env node
/**
 * Gera os artefatos derivados da fonte única de tokens (src/tokens):
 *
 * - tokens.json (canônico; consumido pelo tema Flutter na PSI-013);
 * - css/tokens.css (custom properties --psi-* / --shadow-* / --font-*).
 *
 * Requer o pacote compilado (importa de dist/). Fluxo completo:
 *   pnpm --filter @psiops/ui generate
 *
 * O drift entre a fonte e os artefatos comitados é bloqueado por
 * tests/artifacts-drift.test.ts.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const { renderTokensCss, renderTokensJson } = await import("../dist/tokens/artifacts.js");

const jsonPath = fileURLToPath(new URL("../tokens.json", import.meta.url));
const cssPath = fileURLToPath(new URL("../css/tokens.css", import.meta.url));

writeFileSync(jsonPath, renderTokensJson());
writeFileSync(cssPath, renderTokensCss());

console.log(`gerado: ${jsonPath}`);
console.log(`gerado: ${cssPath}`);
