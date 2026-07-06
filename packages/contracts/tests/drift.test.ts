/**
 * Teste de drift do codegen (ADR 0008): regenera os arquivos de gen/ts em
 * memória a partir de openapi/openapi.yaml e compara byte a byte com o
 * conteúdo comitado. Qualquer dessincronização entre spec e código gerado
 * reprova o build — equivalente determinístico de regenerar e rodar
 * `git diff --exit-code -- gen` (disponível como script `check:drift`).
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { generateApiDts, generateIndexDts } from "../scripts/generate.mjs";

const GEN_DIR = new URL("../gen/ts/", import.meta.url);
const HINT =
  "gen/ts está dessincronizado de openapi/openapi.yaml — rode `pnpm --filter @psiops/contracts generate` e comite o resultado.";

describe("drift do codegen TypeScript (gen/ts)", () => {
  it("gen/ts/api.d.ts está sincronizado com a spec", async () => {
    const [committed, regenerated] = await Promise.all([
      readFile(new URL("api.d.ts", GEN_DIR), "utf8"),
      generateApiDts(),
    ]);
    expect(regenerated, HINT).toBe(committed);
  });

  it("gen/ts/index.d.ts está sincronizado com a spec", async () => {
    const [committed, regenerated] = await Promise.all([
      readFile(new URL("index.d.ts", GEN_DIR), "utf8"),
      generateIndexDts(),
    ]);
    expect(regenerated, HINT).toBe(committed);
  });

  it("a regeneração é determinística (duas execuções, mesmo output)", async () => {
    const [first, second] = await Promise.all([generateApiDts(), generateApiDts()]);
    expect(second).toBe(first);
  });
});
