import { describe, expect, it } from "vitest";

import { base, react } from "../eslint/index.js";
import prettierConfig from "../prettier/index.js";
import { defineVitestConfig, vitestPreset } from "../vitest/index.js";

describe("preset ESLint", () => {
  it("base é um array flat config não vazio", () => {
    expect(Array.isArray(base)).toBe(true);
    expect(base.length).toBeGreaterThan(0);
  });

  it("base inclui o parser TypeScript", () => {
    const hasTsParser = base.some(
      (entry) => entry.languageOptions?.parser?.meta?.name === "typescript-eslint/parser",
    );
    expect(hasTsParser).toBe(true);
  });

  it("react estende base e registra plugins react e react-hooks", () => {
    expect(react.length).toBeGreaterThan(base.length);
    const plugins = react.flatMap((entry) => Object.keys(entry.plugins ?? {}));
    expect(plugins).toContain("react");
    expect(plugins).toContain("react-hooks");
  });

  it("react termina com eslint-config-prettier (regras conflitantes desativadas)", () => {
    const last = react[react.length - 1];
    expect(last?.name).toContain("prettier");
  });
});

describe("configuração Prettier", () => {
  it("exporta um objeto de configuração válido", () => {
    expect(prettierConfig).toMatchObject({
      printWidth: 100,
      trailingComma: "all",
      endOfLine: "lf",
    });
  });
});

describe("preset Vitest", () => {
  it("define ambiente node, globals e cobertura v8", () => {
    expect(vitestPreset.test).toMatchObject({
      environment: "node",
      globals: true,
      coverage: { provider: "v8", reportsDirectory: "coverage" },
    });
  });

  it("defineVitestConfig aplica overrides por merge profundo", () => {
    const merged = defineVitestConfig({ test: { environment: "jsdom" } });
    expect(merged.test?.environment).toBe("jsdom");
    // defaults do preset preservados após o merge
    expect(merged.test?.globals).toBe(true);
    expect(merged.test?.coverage?.provider).toBe("v8");
  });
});
