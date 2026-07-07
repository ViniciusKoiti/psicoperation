/**
 * Builders determinísticos de fixtures do PsiOps.
 *
 * Todos os dados são tipados pelos tipos gerados de @psiops/contracts (nunca
 * redeclarados aqui) e respeitam os formatos dos contratos: UUID v4, e-mail
 * válido, WhatsApp brasileiro em E.164 (`+55DD9XXXXXXXX`) e instantes ISO 8601
 * em UTC. A mesma seed produz exatamente os mesmos dados em qualquer máquina.
 *
 * Escopo atual: entidades existentes nos contratos (User e Lead). O domínio
 * clínico/financeiro (pacientes, mensalidades) chega com a PSI-020, quando os
 * builders correspondentes serão adicionados aqui.
 */
import type { Lead, LeadCreateRequest, User } from "@psiops/contracts";

import { DEFAULT_SEED, SeededRandom, type Seed } from "./random.js";

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
