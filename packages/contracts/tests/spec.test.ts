/**
 * Testes estruturais da especificação OpenAPI: convenções invioláveis do
 * projeto (Problem Details RFC 9457, dinheiro em centavos, ISO 8601, WhatsApp
 * brasileiro) expressas como asserções sobre os arquivos YAML modulares.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- asserções sobre YAML dinâmico */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

function loadYaml(relativePath: string): Record<string, any> {
  const url = new URL(`../openapi/${relativePath}`, import.meta.url);
  return parse(readFileSync(fileURLToPath(url), "utf8"));
}

const root = loadYaml("openapi.yaml");
const common = {
  problem: loadYaml("components/common/problem.yaml"),
  money: loadYaml("components/common/money.yaml"),
  datetime: loadYaml("components/common/datetime.yaml"),
  pagination: loadYaml("components/common/pagination.yaml"),
};
const lead = loadYaml("components/lead/schemas.yaml");

describe("arquivo raiz (openapi.yaml)", () => {
  it("declara OpenAPI 3.1", () => {
    expect(root.openapi).toMatch(/^3\.1\./);
  });

  it("mapeia os endpoints de auth e lead para arquivos modulares via $ref", () => {
    const paths = root.paths as Record<string, { $ref?: string }>;
    expect(Object.keys(paths).sort()).toEqual([
      "/auth/login",
      "/auth/refresh",
      "/auth/register",
      "/auth/session",
      "/leads",
    ]);
    for (const item of Object.values(paths)) {
      expect(item.$ref).toMatch(/^\.\/paths\//);
    }
  });

  it("declara todos os schemas nomeados como $ref para os arquivos de components por domínio", () => {
    const schemas = root.components.schemas as Record<string, { $ref?: string }>;
    for (const [name, schema] of Object.entries(schemas)) {
      expect(schema.$ref, `schema ${name} deve ser $ref modular`).toMatch(/^\.\/components\//);
    }
  });

  it("define autenticação bearer JWT", () => {
    expect(root.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });
});

describe("common: Problem Details (RFC 9457)", () => {
  it("Problem tem os campos da RFC e exige title + status", () => {
    const problem = common.problem.Problem;
    expect(Object.keys(problem.properties)).toEqual([
      "type",
      "title",
      "status",
      "detail",
      "instance",
    ]);
    expect(problem.required).toEqual(["title", "status"]);
    expect(problem.properties.type.default).toBe("about:blank");
  });

  it("ValidationProblem estende Problem com violations por campo", () => {
    const validation = common.problem.ValidationProblem;
    expect(validation.allOf[0].$ref).toBe("#/Problem");
    expect(validation.allOf[1].required).toEqual(["violations"]);
    expect(common.problem.FieldViolation.required).toEqual(["field", "message"]);
  });

  it("respostas de erro usam application/problem+json", () => {
    const responses = loadYaml("components/common/responses.yaml");
    for (const [name, response] of Object.entries<any>(responses)) {
      expect(
        response.content["application/problem+json"],
        `response ${name} deve usar application/problem+json`,
      ).toBeDefined();
    }
  });
});

describe("common: dinheiro e datas", () => {
  it("MoneyBRL é inteiro (centavos de BRL), nunca float", () => {
    expect(common.money.MoneyBRL.type).toBe("integer");
    expect(common.money.MoneyBRL.format).toBe("int64");
    expect(common.money.MoneyBRL.description).toContain("centavos");
  });

  it("IsoDate e IsoDateTime usam os formatos ISO 8601 do JSON Schema", () => {
    expect(common.datetime.IsoDate).toMatchObject({ type: "string", format: "date" });
    expect(common.datetime.IsoDateTime).toMatchObject({ type: "string", format: "date-time" });
  });
});

describe("common: paginação", () => {
  it("PageParam/PageSizeParam são query params com limites sensatos", () => {
    expect(common.pagination.PageParam).toMatchObject({
      name: "page",
      in: "query",
      schema: { type: "integer", minimum: 0, default: 0 },
    });
    expect(common.pagination.PageSizeParam).toMatchObject({
      name: "size",
      in: "query",
      schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    });
  });

  it("PageMeta exige page, size, totalElements e totalPages", () => {
    expect(common.pagination.PageMeta.required).toEqual([
      "page",
      "size",
      "totalElements",
      "totalPages",
    ]);
  });
});

describe("lead: lista de espera", () => {
  it("LeadCreateRequest exige name, whatsapp e email (format email)", () => {
    expect(lead.LeadCreateRequest.required).toEqual(["name", "whatsapp", "email"]);
    expect(lead.LeadCreateRequest.properties.email.format).toBe("email");
    expect(lead.LeadCreateRequest.properties.whatsapp.$ref).toBe("#/WhatsAppBR");
  });

  it("WhatsAppBR documenta um pattern E.164 brasileiro", () => {
    const { pattern, minLength, maxLength } = lead.WhatsAppBR;
    expect(pattern).toBeDefined();
    expect(minLength).toBe(14);
    expect(maxLength).toBe(14);

    const regex = new RegExp(pattern);
    // Válidos: +55 + DDD (sem 0) + 9 + 8 dígitos.
    expect("+5511990000000").toMatch(regex);
    expect("+5547988776655").toMatch(regex);
    // Inválidos: sem +55, fixo (sem o 9), DDD com 0, curto/longo demais, mascarado.
    expect("11990000000").not.toMatch(regex);
    expect("+551133334444").not.toMatch(regex);
    expect("+5510990000000").not.toMatch(regex);
    expect("+55119900000001").not.toMatch(regex);
    expect("(11) 99000-0000").not.toMatch(regex);
  });

  it("os exemplos de WhatsAppBR obedecem ao próprio pattern", () => {
    const regex = new RegExp(lead.WhatsAppBR.pattern);
    for (const example of lead.WhatsAppBR.examples) {
      expect(example).toMatch(regex);
    }
  });
});
