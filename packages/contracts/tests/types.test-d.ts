/**
 * Testes de tipo dos artefatos gerados em gen/ts (rodam via
 * `vitest run` com typecheck habilitado — ver vitest.config.ts).
 * Validam que os tipos compilam e refletem o contrato: campos obrigatórios,
 * camelCase, dinheiro como number inteiro (centavos) e datas como string ISO.
 */
import { describe, expectTypeOf, it } from "vitest";
import type {
  AuthResponse,
  IsoDate,
  IsoDateTime,
  Lead,
  LeadCreateRequest,
  LoginRequest,
  MoneyBRL,
  PageMeta,
  Problem,
  RefreshTokenRequest,
  RegisterRequest,
  SessionResponse,
  TokenPair,
  User,
  ValidationProblem,
  WhatsAppBR,
  components,
  operations,
  paths,
} from "../gen/ts/index";

describe("common", () => {
  it("Problem segue RFC 9457 (title/status obrigatórios, detail/instance opcionais)", () => {
    expectTypeOf<Problem["title"]>().toEqualTypeOf<string>();
    expectTypeOf<Problem["status"]>().toEqualTypeOf<number>();
    expectTypeOf<Problem["detail"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Problem["instance"]>().toEqualTypeOf<string | undefined>();
  });

  it("ValidationProblem estende Problem com violations tipadas", () => {
    expectTypeOf<ValidationProblem>().toExtend<Problem>();
    expectTypeOf<ValidationProblem["violations"][number]["field"]>().toEqualTypeOf<string>();
    expectTypeOf<ValidationProblem["violations"][number]["message"]>().toEqualTypeOf<string>();
  });

  it("MoneyBRL é number (centavos) e datas são string ISO 8601", () => {
    expectTypeOf<MoneyBRL>().toEqualTypeOf<number>();
    expectTypeOf<IsoDate>().toEqualTypeOf<string>();
    expectTypeOf<IsoDateTime>().toEqualTypeOf<string>();
  });

  it("PageMeta expõe os quatro campos de paginação obrigatórios", () => {
    expectTypeOf<PageMeta>().toEqualTypeOf<{
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>();
  });
});

describe("auth", () => {
  it("payloads de register/login/refresh têm os campos obrigatórios em camelCase", () => {
    expectTypeOf<RegisterRequest>().toEqualTypeOf<{
      name: string;
      email: string;
      password: string;
    }>();
    expectTypeOf<LoginRequest>().toEqualTypeOf<{ email: string; password: string }>();
    expectTypeOf<RefreshTokenRequest>().toEqualTypeOf<{ refreshToken: string }>();
  });

  it("TokenPair fixa tokenType em 'Bearer' e expõe o par de tokens", () => {
    expectTypeOf<TokenPair["tokenType"]>().toEqualTypeOf<"Bearer">();
    expectTypeOf<TokenPair["accessToken"]>().toEqualTypeOf<string>();
    expectTypeOf<TokenPair["refreshToken"]>().toEqualTypeOf<string>();
    expectTypeOf<TokenPair["expiresIn"]>().toEqualTypeOf<number>();
  });

  it("AuthResponse e SessionResponse compõem User", () => {
    expectTypeOf<AuthResponse["user"]>().toEqualTypeOf<User>();
    expectTypeOf<AuthResponse["tokens"]>().toEqualTypeOf<TokenPair>();
    expectTypeOf<SessionResponse["user"]>().toEqualTypeOf<User>();
    expectTypeOf<SessionResponse["expiresAt"]>().toEqualTypeOf<string>();
  });

  it("operations mapeiam requests e responses aos schemas nomeados", () => {
    expectTypeOf<
      operations["registerUser"]["requestBody"]["content"]["application/json"]
    >().toEqualTypeOf<RegisterRequest>();
    expectTypeOf<
      operations["registerUser"]["responses"][201]["content"]["application/json"]
    >().toEqualTypeOf<AuthResponse>();
    expectTypeOf<
      operations["loginUser"]["responses"][401]["content"]["application/problem+json"]
    >().toEqualTypeOf<Problem>();
    expectTypeOf<
      operations["refreshToken"]["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<TokenPair>();
    expectTypeOf<
      operations["getCurrentSession"]["responses"][200]["content"]["application/json"]
    >().toEqualTypeOf<SessionResponse>();
  });
});

describe("lead", () => {
  it("LeadCreateRequest exige name, whatsapp e email", () => {
    expectTypeOf<LeadCreateRequest>().toEqualTypeOf<{
      name: string;
      whatsapp: WhatsAppBR;
      email: string;
    }>();
    // @ts-expect-error — whatsapp é obrigatório
    const _missingWhatsapp: LeadCreateRequest = {
      name: "Ana Beatriz Souza",
      email: "ana@exemplo.com.br",
    };
  });

  it("Lead retornado inclui id e createdAt", () => {
    expectTypeOf<Lead>().toEqualTypeOf<{
      id: string;
      name: string;
      whatsapp: string;
      email: string;
      createdAt: string;
    }>();
  });

  it("POST /leads usa createLead com resposta 201 tipada", () => {
    expectTypeOf<paths["/leads"]["post"]>().toEqualTypeOf<operations["createLead"]>();
    expectTypeOf<
      operations["createLead"]["responses"][201]["content"]["application/json"]
    >().toEqualTypeOf<Lead>();
    expectTypeOf<
      operations["createLead"]["responses"][400]["content"]["application/problem+json"]
    >().toEqualTypeOf<components["schemas"]["ValidationProblem"]>();
  });
});
