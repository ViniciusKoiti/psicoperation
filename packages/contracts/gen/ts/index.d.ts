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
export type Patient = components["schemas"]["Patient"];
export type PatientStatus = components["schemas"]["PatientStatus"];
export type PatientCreateRequest = components["schemas"]["PatientCreateRequest"];
export type PatientUpdateRequest = components["schemas"]["PatientUpdateRequest"];
export type PatientPage = components["schemas"]["PatientPage"];
export type Appointment = components["schemas"]["Appointment"];
export type AppointmentStatus = components["schemas"]["AppointmentStatus"];
export type WeeklyRecurrence = components["schemas"]["WeeklyRecurrence"];
export type AppointmentCreateRequest = components["schemas"]["AppointmentCreateRequest"];
export type AppointmentUpdateRequest = components["schemas"]["AppointmentUpdateRequest"];
export type AttendanceRecord = components["schemas"]["AttendanceRecord"];
export type AttendanceStatus = components["schemas"]["AttendanceStatus"];
export type AppointmentPage = components["schemas"]["AppointmentPage"];
export type Charge = components["schemas"]["Charge"];
export type Competence = components["schemas"]["Competence"];
export type ChargeStatus = components["schemas"]["ChargeStatus"];
export type SimpleInterestParams = components["schemas"]["SimpleInterestParams"];
export type Payment = components["schemas"]["Payment"];
export type PaymentMethod = components["schemas"]["PaymentMethod"];
export type RegisterPaymentRequest = components["schemas"]["RegisterPaymentRequest"];
export type ChargePage = components["schemas"]["ChargePage"];
export type Task = components["schemas"]["Task"];
export type TaskCreateRequest = components["schemas"]["TaskCreateRequest"];
export type TaskUpdateRequest = components["schemas"]["TaskUpdateRequest"];
export type TaskPage = components["schemas"]["TaskPage"];
export type Reminder = components["schemas"]["Reminder"];
export type ReminderChannel = components["schemas"]["ReminderChannel"];
export type ReminderStatus = components["schemas"]["ReminderStatus"];
export type ReminderCreateRequest = components["schemas"]["ReminderCreateRequest"];
export type ReminderPage = components["schemas"]["ReminderPage"];
export type Settings = components["schemas"]["Settings"];
export type SettingsUpdateRequest = components["schemas"]["SettingsUpdateRequest"];
export type OnboardingStatus = components["schemas"]["OnboardingStatus"];
export type OnboardingStep = components["schemas"]["OnboardingStep"];
export type OnboardingCompleteRequest = components["schemas"]["OnboardingCompleteRequest"];
export type DomainEvent = components["schemas"]["DomainEvent"];
export type ChargeOverduePayload = components["schemas"]["ChargeOverduePayload"];
export type ChargeOverdueEvent = components["schemas"]["ChargeOverdueEvent"];
export type ReminderDuePayload = components["schemas"]["ReminderDuePayload"];
export type ReminderDueEvent = components["schemas"]["ReminderDueEvent"];
