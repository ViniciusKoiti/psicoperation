/**
 * Builders determinísticos de fixtures do PsiOps.
 *
 * Todos os dados são tipados pelos tipos gerados de @psiops/contracts (nunca
 * redeclarados aqui) e respeitam os formatos dos contratos: UUID v4, e-mail
 * válido, WhatsApp brasileiro em E.164 (`+55DD9XXXXXXXX`) e instantes ISO 8601
 * em UTC. A mesma seed produz exatamente os mesmos dados em qualquer máquina.
 *
 * Escopo (PSI-046): domínio completo do MVP — psicóloga/conta (`User`),
 * lista de espera (`Lead`), pacientes (`Patient`), agenda (`Appointment`),
 * mensalidades (`Charge`), tarefas (`Task`) e lembretes (`Reminder`). Nenhum
 * campo clínico existe nos contratos consumidos aqui (por decisão de
 * produto) — os builders, por construção, nunca geram dado de saúde.
 */
import type {
  Appointment,
  AppointmentCreateRequest,
  AppointmentStatus,
  Charge,
  ChargeStatus,
  Lead,
  LeadCreateRequest,
  Patient,
  PatientCreateRequest,
  PatientStatus,
  PaymentMethod,
  Reminder,
  ReminderCreateRequest,
  ReminderStatus,
  Task,
  TaskCreateRequest,
  User,
  WeeklyRecurrence,
  operations,
} from "@psiops/contracts";

import { DEFAULT_SEED, SeededRandom, type Seed } from "./random.js";

/**
 * Payload de emissão de cobrança (`POST /charges`). Não exportado por
 * `@psiops/contracts` como tipo nomeado (schema inline no OpenAPI) — extraído
 * aqui diretamente da operação gerada, nunca redeclarado à mão.
 */
export type ChargeCreateRequest = operations["createCharge"]["requestBody"]["content"]["application/json"];

// ---------------------------------------------------------------------------
// Pools de dados (determinísticos: a escolha é feita pelo PRNG com seed)
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Ana Beatriz",
  "Camila",
  "Carolina",
  "Fernanda",
  "Helena",
  "Juliana",
  "Larissa",
  "Mariana",
  "Patrícia",
  "Renata",
  "Sofia",
  "Tatiane",
] as const;

const LAST_NAMES = [
  "Souza",
  "Silva",
  "Oliveira",
  "Santos",
  "Pereira",
  "Costa",
  "Almeida",
  "Carvalho",
  "Ferreira",
  "Ribeiro",
  "Martins",
  "Rocha",
] as const;

const EMAIL_DOMAINS = ["exemplo.com.br", "teste.com.br", "psicologia.example"] as const;

/** DDDs brasileiros reais (nenhum DDD contém o dígito 0 — ver schema WhatsAppBR). */
const DDDS = ["11", "21", "31", "41", "47", "51", "61", "71", "81", "85", "91", "98"] as const;

/** Base fixa para instantes `createdAt`: 2026-01-01T00:00:00Z. */
const CREATED_AT_BASE_MS = Date.UTC(2026, 0, 1);

/** Janela de 180 dias (em segundos) a partir da base para espalhar instantes. */
const CREATED_AT_RANGE_SECONDS = 180 * 24 * 60 * 60;

/** Faixa plausível de mensalidade/cobrança em centavos BRL (R$ 80–R$ 350). */
const MONEY_CENTS_MIN = 8000;
const MONEY_CENTS_MAX = 35000;

/** Anotações ADMINISTRATIVAS de exemplo (nunca clínicas — decisão de produto). */
const PATIENT_NOTES_POOL = [
  "Prefere contato por WhatsApp após 18h.",
  "Combinou pagamento via Pix até o dia do vencimento.",
  "Recibo mensal por e-mail.",
  "Atendimento quinzenal.",
  "Prefere lembrete por e-mail, não WhatsApp.",
] as const;

const DURATIONS_MINUTES = [30, 50, 60] as const;

const WEEKDAYS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] as const;

const PATIENT_STATUSES: readonly PatientStatus[] = ["ativo", "inativo"];
const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = ["agendada", "realizada", "cancelada", "remarcada"];
const CHARGE_STATUSES: readonly ChargeStatus[] = ["em_dia", "pendente", "atrasada"];
const REMINDER_STATUSES: readonly ReminderStatus[] = ["agendado", "enviado", "falhou", "cancelado"];
const PAYMENT_METHODS: readonly PaymentMethod[] = ["pix", "dinheiro", "transferencia", "cartao", "outro"];

const TASK_TITLES = [
  "Emitir recibo do mês",
  "Revisar cobranças em atraso",
  "Atualizar tabela de valores",
  "Confirmar horários da semana",
  "Enviar boas-vindas para novo paciente",
] as const;

const REMINDER_SUBJECTS = [
  "Lembrete de consulta amanhã",
  "Confirmar presença na sessão",
  "Mensalidade próxima do vencimento",
  "Renovar documento profissional",
] as const;

const REMINDER_BODIES = [
  "Sua consulta está agendada — confirme sua presença.",
  "Não esqueça de confirmar o horário combinado.",
  "A mensalidade deste mês vence em breve.",
  "Verifique a validade do documento antes do prazo.",
] as const;

// ---------------------------------------------------------------------------
// Geradores internos (consomem o PRNG em ordem fixa)
// ---------------------------------------------------------------------------

/** Remove acentos e baixa a caixa para compor a parte local de e-mails. */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");
}

/** Instante ISO 8601 em UTC (precisão de segundos, como o backend emite). */
function genIsoDateTime(rng: SeededRandom): string {
  const ms = CREATED_AT_BASE_MS + rng.int(0, CREATED_AT_RANGE_SECONDS) * 1000;
  return new Date(ms).toISOString().replace(".000Z", "Z");
}

/** Número de WhatsApp brasileiro em E.164: `+55` + DDD + `9` + 8 dígitos. */
function genWhatsApp(rng: SeededRandom): string {
  return `+55${rng.pick(DDDS)}9${rng.digits(8)}`;
}

interface Contact {
  name: string;
  email: string;
  whatsapp: string;
}

function genContact(rng: SeededRandom): Contact {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const email = `${slugify(firstName)}.${slugify(lastName)}${rng.int(1, 9999)}@${rng.pick(EMAIL_DOMAINS)}`;
  return { name, email, whatsapp: genWhatsApp(rng) };
}

function genUser(rng: SeededRandom): User {
  const contact = genContact(rng);
  return {
    id: rng.uuid(),
    name: contact.name,
    email: contact.email,
    createdAt: genIsoDateTime(rng),
  };
}

function genLeadCreateRequest(rng: SeededRandom): LeadCreateRequest {
  const contact = genContact(rng);
  return { name: contact.name, whatsapp: contact.whatsapp, email: contact.email };
}

function genLead(rng: SeededRandom): Lead {
  const request = genLeadCreateRequest(rng);
  return { id: rng.uuid(), ...request, createdAt: genIsoDateTime(rng) };
}

/** Data civil ISO 8601 `YYYY-MM-DD` (schema IsoDate), mesma janela de `genIsoDateTime`. */
function genIsoDate(rng: SeededRandom): string {
  const ms = CREATED_AT_BASE_MS + rng.int(0, CREATED_AT_RANGE_SECONDS) * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Competência (`AAAA-MM`, schema Competence) dentro do ano-base (2026). */
function genCompetence(rng: SeededRandom): string {
  return `2026-${String(rng.int(1, 12)).padStart(2, "0")}`;
}

function genPatientCreateRequest(rng: SeededRandom): PatientCreateRequest {
  const contact = genContact(rng);
  const request: PatientCreateRequest = {
    name: contact.name,
    monthlyFee: rng.int(MONEY_CENTS_MIN, MONEY_CENTS_MAX),
    billingDay: rng.int(1, 28),
  };
  if (rng.boolean(0.8)) {
    request.whatsapp = contact.whatsapp;
  }
  if (rng.boolean(0.6)) {
    request.email = contact.email;
  }
  if (rng.boolean(0.5)) {
    request.notes = rng.pick(PATIENT_NOTES_POOL);
  }
  return request;
}

function genPatient(rng: SeededRandom): Patient {
  const request = genPatientCreateRequest(rng);
  return {
    id: rng.uuid(),
    ...request,
    status: rng.pick(PATIENT_STATUSES),
    createdAt: genIsoDateTime(rng),
  };
}

function genWeeklyRecurrence(rng: SeededRandom): WeeklyRecurrence {
  const recurrence: WeeklyRecurrence = {
    weekday: rng.pick(WEEKDAYS),
    interval: rng.int(1, 2),
  };
  if (rng.boolean(0.3)) {
    recurrence.until = genIsoDate(rng);
  }
  return recurrence;
}

function genAppointmentCreateRequest(rng: SeededRandom): AppointmentCreateRequest {
  const request: AppointmentCreateRequest = {
    patientId: rng.uuid(),
    startsAt: genIsoDateTime(rng),
    durationMinutes: rng.pick(DURATIONS_MINUTES),
  };
  if (rng.boolean(0.3)) {
    request.recurrence = genWeeklyRecurrence(rng);
  }
  return request;
}

function genAppointment(rng: SeededRandom): Appointment {
  const request = genAppointmentCreateRequest(rng);
  return {
    id: rng.uuid(),
    ...request,
    status: rng.pick(APPOINTMENT_STATUSES),
    createdAt: genIsoDateTime(rng),
  };
}

function genChargeCreateRequest(rng: SeededRandom): ChargeCreateRequest {
  const request: ChargeCreateRequest = {
    patientId: rng.uuid(),
    competence: genCompetence(rng),
    amount: rng.int(MONEY_CENTS_MIN, MONEY_CENTS_MAX),
    dueDate: genIsoDate(rng),
  };
  if (rng.boolean(0.5)) {
    request.interest = { monthlyRatePercent: rng.pick([1, 1.5, 2]), finePercent: rng.pick([2, 3]) };
  }
  return request;
}

function genCharge(rng: SeededRandom): Charge {
  const request = genChargeCreateRequest(rng);
  const status = rng.pick(CHARGE_STATUSES);
  const charge: Charge = {
    id: rng.uuid(),
    ...request,
    status,
    createdAt: genIsoDateTime(rng),
  };
  if (status === "em_dia") {
    charge.payment = {
      paidAmount: charge.amount,
      paidAt: genIsoDateTime(rng),
      method: rng.pick(PAYMENT_METHODS),
    };
  }
  return charge;
}

function genTaskCreateRequest(rng: SeededRandom): TaskCreateRequest {
  const request: TaskCreateRequest = { title: rng.pick(TASK_TITLES) };
  if (rng.boolean(0.7)) {
    request.dueDate = genIsoDate(rng);
  }
  return request;
}

function genTask(rng: SeededRandom): Task {
  const request = genTaskCreateRequest(rng);
  const task: Task = { id: rng.uuid(), ...request, createdAt: genIsoDateTime(rng) };
  if (rng.boolean(0.3)) {
    task.completedAt = genIsoDateTime(rng);
  }
  return task;
}

/** Vínculo opcional (no máximo um, ver schema `ReminderCreateRequest`). */
function genReminderLink(rng: SeededRandom): Pick<Reminder, "patientId" | "appointmentId" | "chargeId"> {
  const roll = rng.int(0, 3);
  if (roll === 1) {
    return { patientId: rng.uuid() };
  }
  if (roll === 2) {
    return { appointmentId: rng.uuid() };
  }
  if (roll === 3) {
    return { chargeId: rng.uuid() };
  }
  return {};
}

function genReminderCreateRequest(rng: SeededRandom): ReminderCreateRequest {
  const request: ReminderCreateRequest = {
    channel: "email",
    subject: rng.pick(REMINDER_SUBJECTS),
    body: rng.pick(REMINDER_BODIES),
    scheduledFor: genIsoDateTime(rng),
  };
  return { ...request, ...genReminderLink(rng) };
}

function genReminder(rng: SeededRandom): Reminder {
  const request = genReminderCreateRequest(rng);
  const status = rng.pick(REMINDER_STATUSES);
  const reminder: Reminder = {
    id: rng.uuid(),
    ...request,
    status,
    createdAt: genIsoDateTime(rng),
  };
  if (status === "enviado") {
    reminder.sentAt = genIsoDateTime(rng);
  }
  return reminder;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Fábrica de fixtures ligada a um único PRNG com seed.
 *
 * Chamadas sucessivas avançam a sequência (entidades distintas), mas a
 * sequência inteira é reprodutível: a mesma seed gera sempre a mesma série de
 * entidades. Overrides sobrepõem os valores gerados sem afetar o determinismo
 * das entidades seguintes (o PRNG é consumido do mesmo jeito).
 */
export class Fixtures {
  private readonly rng: SeededRandom;

  constructor(seed: Seed = DEFAULT_SEED) {
    this.rng = new SeededRandom(seed);
  }

  /** Volta ao início da sequência — os próximos builds repetem a série. */
  reset(): void {
    this.rng.reset();
  }

  /** Conta de psicóloga (schema User) com overrides parciais tipados. */
  user(overrides: Partial<User> = {}): User {
    return { ...genUser(this.rng), ...overrides };
  }

  /** Série de `count` contas distintas (mesmos overrides aplicados a todas). */
  users(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.user(overrides));
  }

  /** Lead da lista de espera (schema Lead) com overrides parciais tipados. */
  lead(overrides: Partial<Lead> = {}): Lead {
    return { ...genLead(this.rng), ...overrides };
  }

  /** Série de `count` leads distintos (mesmos overrides aplicados a todos). */
  leads(count: number, overrides: Partial<Lead> = {}): Lead[] {
    return Array.from({ length: count }, () => this.lead(overrides));
  }

  /** Payload do formulário da lista de espera (schema LeadCreateRequest). */
  leadCreateRequest(overrides: Partial<LeadCreateRequest> = {}): LeadCreateRequest {
    return { ...genLeadCreateRequest(this.rng), ...overrides };
  }

  /** Paciente (schema Patient) com overrides parciais tipados — nenhum campo clínico. */
  patient(overrides: Partial<Patient> = {}): Patient {
    return { ...genPatient(this.rng), ...overrides };
  }

  /** Série de `count` pacientes distintos (mesmos overrides aplicados a todos). */
  patients(count: number, overrides: Partial<Patient> = {}): Patient[] {
    return Array.from({ length: count }, () => this.patient(overrides));
  }

  /** Payload de cadastro de paciente (schema PatientCreateRequest). */
  patientCreateRequest(overrides: Partial<PatientCreateRequest> = {}): PatientCreateRequest {
    return { ...genPatientCreateRequest(this.rng), ...overrides };
  }

  /** Consulta agendada (schema Appointment) com overrides parciais tipados. */
  appointment(overrides: Partial<Appointment> = {}): Appointment {
    return { ...genAppointment(this.rng), ...overrides };
  }

  /** Série de `count` consultas distintas (mesmos overrides aplicados a todas). */
  appointments(count: number, overrides: Partial<Appointment> = {}): Appointment[] {
    return Array.from({ length: count }, () => this.appointment(overrides));
  }

  /** Payload de agendamento de consulta (schema AppointmentCreateRequest). */
  appointmentCreateRequest(overrides: Partial<AppointmentCreateRequest> = {}): AppointmentCreateRequest {
    return { ...genAppointmentCreateRequest(this.rng), ...overrides };
  }

  /** Cobrança de mensalidade (schema Charge, valores em centavos BRL) com overrides tipados. */
  charge(overrides: Partial<Charge> = {}): Charge {
    return { ...genCharge(this.rng), ...overrides };
  }

  /** Série de `count` cobranças distintas (mesmos overrides aplicados a todas). */
  charges(count: number, overrides: Partial<Charge> = {}): Charge[] {
    return Array.from({ length: count }, () => this.charge(overrides));
  }

  /** Payload de emissão de cobrança (ver {@link ChargeCreateRequest}). */
  chargeCreateRequest(overrides: Partial<ChargeCreateRequest> = {}): ChargeCreateRequest {
    return { ...genChargeCreateRequest(this.rng), ...overrides };
  }

  /** Tarefa administrativa (schema Task) com overrides parciais tipados. */
  task(overrides: Partial<Task> = {}): Task {
    return { ...genTask(this.rng), ...overrides };
  }

  /** Série de `count` tarefas distintas (mesmos overrides aplicados a todas). */
  tasks(count: number, overrides: Partial<Task> = {}): Task[] {
    return Array.from({ length: count }, () => this.task(overrides));
  }

  /** Payload de criação de tarefa (schema TaskCreateRequest). */
  taskCreateRequest(overrides: Partial<TaskCreateRequest> = {}): TaskCreateRequest {
    return { ...genTaskCreateRequest(this.rng), ...overrides };
  }

  /** Lembrete agendado (schema Reminder) com overrides parciais tipados. */
  reminder(overrides: Partial<Reminder> = {}): Reminder {
    return { ...genReminder(this.rng), ...overrides };
  }

  /** Série de `count` lembretes distintos (mesmos overrides aplicados a todos). */
  reminders(count: number, overrides: Partial<Reminder> = {}): Reminder[] {
    return Array.from({ length: count }, () => this.reminder(overrides));
  }

  /** Payload de criação de lembrete (schema ReminderCreateRequest). */
  reminderCreateRequest(overrides: Partial<ReminderCreateRequest> = {}): ReminderCreateRequest {
    return { ...genReminderCreateRequest(this.rng), ...overrides };
  }
}

/** Cria uma fábrica de fixtures determinística para a seed informada. */
export function createFixtures(seed: Seed = DEFAULT_SEED): Fixtures {
  return new Fixtures(seed);
}

/** Opções dos builders avulsos: seed explícita e overrides parciais tipados. */
export interface BuildOptions<T> {
  seed?: Seed;
  overrides?: Partial<T>;
}

/** Constrói um User determinístico avulso (mesma seed → mesmo User). */
export function buildUser(options: BuildOptions<User> = {}): User {
  return createFixtures(options.seed).user(options.overrides);
}

/** Constrói `count` Users determinísticos (mesma seed → mesma série). */
export function buildUsers(count: number, options: BuildOptions<User> = {}): User[] {
  return createFixtures(options.seed).users(count, options.overrides);
}

/** Constrói um Lead determinístico avulso (mesma seed → mesmo Lead). */
export function buildLead(options: BuildOptions<Lead> = {}): Lead {
  return createFixtures(options.seed).lead(options.overrides);
}

/** Constrói `count` Leads determinísticos (mesma seed → mesma série). */
export function buildLeads(count: number, options: BuildOptions<Lead> = {}): Lead[] {
  return createFixtures(options.seed).leads(count, options.overrides);
}

/** Constrói um LeadCreateRequest determinístico avulso. */
export function buildLeadCreateRequest(
  options: BuildOptions<LeadCreateRequest> = {},
): LeadCreateRequest {
  return createFixtures(options.seed).leadCreateRequest(options.overrides);
}

/** Constrói um Patient determinístico avulso (mesma seed → mesmo Patient). */
export function buildPatient(options: BuildOptions<Patient> = {}): Patient {
  return createFixtures(options.seed).patient(options.overrides);
}

/** Constrói `count` Patients determinísticos (mesma seed → mesma série). */
export function buildPatients(count: number, options: BuildOptions<Patient> = {}): Patient[] {
  return createFixtures(options.seed).patients(count, options.overrides);
}

/** Constrói um PatientCreateRequest determinístico avulso. */
export function buildPatientCreateRequest(
  options: BuildOptions<PatientCreateRequest> = {},
): PatientCreateRequest {
  return createFixtures(options.seed).patientCreateRequest(options.overrides);
}

/** Constrói um Appointment determinístico avulso (mesma seed → mesmo Appointment). */
export function buildAppointment(options: BuildOptions<Appointment> = {}): Appointment {
  return createFixtures(options.seed).appointment(options.overrides);
}

/** Constrói `count` Appointments determinísticos (mesma seed → mesma série). */
export function buildAppointments(
  count: number,
  options: BuildOptions<Appointment> = {},
): Appointment[] {
  return createFixtures(options.seed).appointments(count, options.overrides);
}

/** Constrói um AppointmentCreateRequest determinístico avulso. */
export function buildAppointmentCreateRequest(
  options: BuildOptions<AppointmentCreateRequest> = {},
): AppointmentCreateRequest {
  return createFixtures(options.seed).appointmentCreateRequest(options.overrides);
}

/** Constrói um Charge determinístico avulso (mesma seed → mesmo Charge). */
export function buildCharge(options: BuildOptions<Charge> = {}): Charge {
  return createFixtures(options.seed).charge(options.overrides);
}

/** Constrói `count` Charges determinísticos (mesma seed → mesma série). */
export function buildCharges(count: number, options: BuildOptions<Charge> = {}): Charge[] {
  return createFixtures(options.seed).charges(count, options.overrides);
}

/** Constrói um ChargeCreateRequest determinístico avulso. */
export function buildChargeCreateRequest(
  options: BuildOptions<ChargeCreateRequest> = {},
): ChargeCreateRequest {
  return createFixtures(options.seed).chargeCreateRequest(options.overrides);
}

/** Constrói um Task determinístico avulso (mesma seed → mesmo Task). */
export function buildTask(options: BuildOptions<Task> = {}): Task {
  return createFixtures(options.seed).task(options.overrides);
}

/** Constrói `count` Tasks determinísticos (mesma seed → mesma série). */
export function buildTasks(count: number, options: BuildOptions<Task> = {}): Task[] {
  return createFixtures(options.seed).tasks(count, options.overrides);
}

/** Constrói um TaskCreateRequest determinístico avulso. */
export function buildTaskCreateRequest(
  options: BuildOptions<TaskCreateRequest> = {},
): TaskCreateRequest {
  return createFixtures(options.seed).taskCreateRequest(options.overrides);
}

/** Constrói um Reminder determinístico avulso (mesma seed → mesmo Reminder). */
export function buildReminder(options: BuildOptions<Reminder> = {}): Reminder {
  return createFixtures(options.seed).reminder(options.overrides);
}

/** Constrói `count` Reminders determinísticos (mesma seed → mesma série). */
export function buildReminders(count: number, options: BuildOptions<Reminder> = {}): Reminder[] {
  return createFixtures(options.seed).reminders(count, options.overrides);
}

/** Constrói um ReminderCreateRequest determinístico avulso. */
export function buildReminderCreateRequest(
  options: BuildOptions<ReminderCreateRequest> = {},
): ReminderCreateRequest {
  return createFixtures(options.seed).reminderCreateRequest(options.overrides);
}
