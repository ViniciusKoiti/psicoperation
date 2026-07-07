/**
 * Anti-drift: os artefatos comitados (tokens.json e css/tokens.css) devem
 * ser byte a byte iguais ao que os renderizadores derivam da fonte única.
 * Se este teste falhar, rode: pnpm --filter @psiops/ui generate
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildTokensJson,
  renderTokensCss,
  renderTokensJson,
  shadowLayersToCss,
  shadows,
  tokens,
} from "../src/tokens/index.js";

// cwd do Vitest = packages/ui (raiz do pacote).
const read = (relative: string): string => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("artefatos gerados derivam da fonte única (sem drift)", () => {
  it("tokens.json comitado === renderTokensJson()", () => {
    expect(read("tokens.json")).toBe(renderTokensJson());
  });

  it("css/tokens.css comitado === renderTokensCss()", () => {
    expect(read("css/tokens.css")).toBe(renderTokensCss());
  });

  it("tokens.json expõe cores, sombras e tipografia idênticas ao objeto TS", () => {
    const json = buildTokensJson() as {
      colors: Record<string, unknown>;
      shadows: unknown;
      typography: unknown;
    };
    expect(json.colors).toEqual(tokens.colors);
    expect(json.shadows).toEqual(tokens.shadows);
    expect(json.typography).toEqual(tokens.typography);
  });

  it("o valor CSS de cada sombra deriva das camadas estruturadas", () => {
    for (const shadow of Object.values(shadows)) {
      expect(shadow.css).toBe(shadowLayersToCss(shadow.layers));
    }
  });
});
