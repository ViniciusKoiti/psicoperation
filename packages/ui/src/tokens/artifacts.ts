/**
 * Renderizadores dos artefatos derivados dos tokens:
 *
 * - buildCssVariables / renderTokensCss → css/tokens.css (custom properties);
 * - buildTokensJson / renderTokensJson → tokens.json (fonte do tema Flutter,
 *   PSI-013).
 *
 * Os artefatos comitados no pacote são gerados por scripts/generate-artifacts.mjs
 * e o drift é bloqueado por tests/artifacts-drift.test.ts.
 *
 * Este módulo contém apenas funções puras (sem estado de módulo) para manter
 * segura a reexportação circular a partir de ./index.ts.
 */

import {
  accent,
  calm,
  fontStackToCss,
  neutral,
  primary,
  semantic,
  shadows,
  typography,
} from "./index.js";

/**
 * Mapa ordenado de todas as custom properties CSS (`--psi-*`, `--shadow-*`,
 * `--font-*`), com os mesmos nomes e valores do protótipo/spec.
 */
export function buildCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [shade, hex] of Object.entries(primary)) {
    vars[`--psi-primary-${shade}`] = hex;
  }
  for (const [shade, hex] of Object.entries(accent)) {
    vars[`--psi-accent-${shade}`] = hex;
  }
  for (const [shade, hex] of Object.entries(neutral)) {
    vars[`--psi-neutral-${shade}`] = hex;
  }
  for (const [tone, variants] of Object.entries(semantic)) {
    for (const [variant, hex] of Object.entries(variants)) {
      vars[`--psi-${tone}-${variant}`] = hex;
    }
  }
  for (const [variant, hex] of Object.entries(calm)) {
    vars[`--psi-calm-${variant}`] = hex;
  }
  for (const [name, shadow] of Object.entries(shadows)) {
    vars[`--shadow-${name}`] = shadow.css;
  }
  for (const [role, font] of Object.entries(typography)) {
    vars[`--font-${role}`] = fontStackToCss(font.stack);
  }

  return vars;
}

/** Conteúdo integral de css/tokens.css (bloco `:root` com todas as vars). */
export function renderTokensCss(): string {
  const lines = Object.entries(buildCssVariables()).map(([name, value]) => `  ${name}: ${value};`);
  return [
    "/**",
    " * PsiOps — design tokens como CSS custom properties.",
    " *",
    " * ARQUIVO GERADO a partir de src/tokens — NÃO EDITE À MÃO.",
    " * Regenere com: pnpm --filter @psiops/ui generate",
    " */",
    "",
    ":root {",
    ...lines,
    "}",
    "",
  ].join("\n");
}

/**
 * Objeto canônico e agnóstico de plataforma serializado em tokens.json.
 * É a fonte do tema Flutter (PSI-013): cores em hex, sombras em camadas
 * estruturadas (px + cor/alfa) e tipografia como famílias/pesos.
 */
export function buildTokensJson(): Record<string, unknown> {
  return {
    $description:
      "Tokens de design canônicos do PsiOps. Gerado a partir de packages/ui/src/tokens (fonte única; valores da docs/design/landing-page-spec.md). Consumido pelo tema Flutter (PSI-013). Não edite à mão — regenere com: pnpm --filter @psiops/ui generate.",
    colors: {
      primary,
      accent,
      neutral,
      ...semantic,
      calm,
    },
    shadows,
    typography,
  };
}

/** Conteúdo integral de tokens.json (JSON com indentação de 2 espaços). */
export function renderTokensJson(): string {
  return `${JSON.stringify(buildTokensJson(), null, 2)}\n`;
}
