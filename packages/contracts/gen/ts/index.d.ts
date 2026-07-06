/**
 * ARQUIVO GERADO — NÃO EDITAR MANUALMENTE.
 *
 * Fonte: packages/contracts/openapi/openapi.yaml
 * Regenerar: pnpm --filter @psiops/contracts generate
 * Drift é reprovado por tests/drift.test.ts e pelo script check:drift.
 */

export type { components, operations, paths } from "./api";

import type { components } from "./api";

export type Problem = components["schemas"]["Problem"];
export type FieldViolation = components["schemas"]["FieldViolation"];
export type ValidationProblem = components["schemas"]["ValidationProblem"];
export type PageMeta = components["schemas"]["PageMeta"];
export type MoneyBRL = components["schemas"]["MoneyBRL"];
export type IsoDate = components["schemas"]["IsoDate"];
export type IsoDateTime = components["schemas"]["IsoDateTime"];
export type User = components["schemas"]["User"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RefreshTokenRequest = components["schemas"]["RefreshTokenRequest"];
export type TokenPair = components["schemas"]["TokenPair"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type SessionResponse = components["schemas"]["SessionResponse"];
export type WhatsAppBR = components["schemas"]["WhatsAppBR"];
export type LeadCreateRequest = components["schemas"]["LeadCreateRequest"];
export type Lead = components["schemas"]["Lead"];
