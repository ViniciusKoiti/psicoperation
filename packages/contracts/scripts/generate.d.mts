/**
 * Declarações de tipos de scripts/generate.mjs para consumo nos testes
 * (tests/drift.test.ts) sob `tsc --noEmit` sem allowJs.
 */
export declare function generateApiDts(): Promise<string>;
export declare function generateIndexDts(): Promise<string>;
