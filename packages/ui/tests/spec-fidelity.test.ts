/**
 * Fidelidade à spec: parseia docs/design/landing-page-spec.md (fonte da
 * verdade dos valores) e compara com a fonte única de tokens, valor a valor.
 * Um dígito errado em qualquer hex, sombra ou pilha de fontes falha aqui.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildCssVariables } from "../src/tokens/index.js";

// cwd do Vitest = packages/ui (raiz do pacote).
const SPEC_PATH = resolve(process.cwd(), "../../docs/design/landing-page-spec.md");
const spec = readFileSync(SPEC_PATH, "utf8");

describe("fidelidade a docs/design/landing-page-spec.md", () => {
  const cssVars = buildCssVariables();

  it("reproduz exatamente todas as cores --psi-* das tabelas da spec (§3)", () => {
    const matches = [
      ...spec.matchAll(/\|\s*`(--psi-[a-z0-9-]+)`\s*\|\s*`(#[0-9A-Fa-f]{6})`\s*\|/g),
    ];
    const specColors = Object.fromEntries(matches.map((m) => [m[1]!, m[2]!])) as Record<
      string,
      string
    >;

    // 10 primary + 10 accent + 12 neutral + 12 semânticas + 3 calm = 47
    expect(Object.keys(specColors)).toHaveLength(47);

    const tokenColors = Object.fromEntries(
      Object.entries(cssVars).filter(([name]) => name.startsWith("--psi-")),
    );
    expect(tokenColors).toEqual(specColors);
  });

  it("reproduz exatamente as sombras --shadow-* do bloco CSS da spec (§3)", () => {
    const matches = [...spec.matchAll(/(--shadow-[a-z]+):\s*(.+?);/g)];
    const specShadows = Object.fromEntries(matches.map((m) => [m[1]!, m[2]!])) as Record<
      string,
      string
    >;

    expect(Object.keys(specShadows).sort()).toEqual([
      "--shadow-card",
      "--shadow-lift",
      "--shadow-soft",
    ]);

    for (const [name, value] of Object.entries(specShadows)) {
      expect(cssVars[name], name).toBe(value);
    }
  });

  it("reproduz exatamente as famílias --font-* do bloco de tipografia (§2)", () => {
    const matches = [...spec.matchAll(/(--font-[a-z]+):\s*(.+?);/g)];
    const specFonts = Object.fromEntries(
      matches.map((m) => [m[1]!, m[2]!.replace(/\s+/g, " ").trim()]),
    ) as Record<string, string>;

    expect(Object.keys(specFonts).sort()).toEqual([
      "--font-body",
      "--font-display",
      "--font-serif",
    ]);

    for (const [name, value] of Object.entries(specFonts)) {
      expect(cssVars[name], name).toBe(value);
    }
  });
});
