import type { Appointment, AppointmentCreateRequest, AttendanceRecord } from "@psiops/contracts";

import type {
  AgendaAdapter,
  CreateAppointmentSeriesInput,
  CreateAppointmentSeriesResult,
  ListAppointmentsRangeParams,
  RescheduleAppointmentInput,
} from "./AgendaAdapter";
import { AGENDA_CONFLICT_MESSAGE, AgendaAdapterError } from "./AgendaAdapterError";
import type { AppointmentHistoryEntry } from "./AppointmentsReadAdapter";
import { findConflictingAppointment } from "./conflict";
import { createAppointmentSeriesWith } from "./createAppointmentSeries";

interface SeedEntry {
  appointment: Appointment;
  attendance?: AttendanceRecord;
}

// IDs compartilhados com o seed de `MockPatientsAdapter`
// (src/adapters/patients/MockPatientsAdapter.ts) só para o mock de
// desenvolvimento ficar coerente (mesma paciente aparece com histórico nos
// dois adapters) — não há acoplamento de código entre os dois mocks.
const MARINA_ALVES_ID = "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d";
const CAMILA_SOUZA_ID = "8b1e6f3a-2c9d-4e7b-a1f5-6d3c2b9a8e7f";

/**
 * Seed de exemplo determinístico (não é fixture de teste com seed — estado
 * inicial plausível para dev/demo). Armazenado como lista PLANA (não mais
 * agrupado por paciente, como o seed de `MockAppointmentsReadAdapter` da
 * PSI-034): a agenda completa desta tarefa precisa listar por INTERVALO DE
 * DATAS entre pacientes diferentes, então agrupar por paciente só
 * atrapalharia — `listAppointmentsByPatient` agora filtra esta lista em vez
 * de indexar um mapa.
 *
 * Marina Alves tem histórico variado (consultas passadas
 * realizadas/faltas/remarcadas/canceladas, mais consultas futuras
 * agendadas), preservado da PSI-034 para não regredir os cenários que a
 * tela de detalhe do paciente já exercitava. Camila Souza tem um volume
 * grande de consultas (risco do manifesto PSI-034 sobre paginação).
 */
const DEFAULT_SEED: readonly SeedEntry[] = [
  {
    appointment: {
      id: "c1a1a1a1-0001-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-04-13T14:00:00Z",
      durationMinutes: 50,
      status: "realizada",
      createdAt: "2026-04-01T12:00:00Z",
    },
    attendance: { attendance: "compareceu", recordedAt: "2026-04-13T15:00:00Z" },
  },
  {
    appointment: {
      id: "c1a1a1a1-0002-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-04-20T14:00:00Z",
      durationMinutes: 50,
      status: "realizada",
      createdAt: "2026-04-01T12:00:00Z",
    },
    attendance: {
      attendance: "faltou",
      administrativeNotes: "Faltou sem aviso prévio.",
      recordedAt: "2026-04-20T15:00:00Z",
    },
  },
  {
    appointment: {
      id: "c1a1a1a1-0003-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-04-27T14:00:00Z",
      durationMinutes: 50,
      status: "remarcada",
      createdAt: "2026-04-01T12:00:00Z",
    },
    attendance: {
      attendance: "remarcada",
      administrativeNotes: "Remarcou por viagem de trabalho.",
      recordedAt: "2026-04-27T13:30:00Z",
    },
  },
  {
    appointment: {
      id: "c1a1a1a1-0004-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-05-04T14:00:00Z",
      durationMinutes: 50,
      status: "cancelada",
      createdAt: "2026-04-01T12:00:00Z",
    },
  },
  {
    appointment: {
      id: "c1a1a1a1-0005-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-07-13T14:00:00Z",
      durationMinutes: 50,
      status: "agendada",
      createdAt: "2026-06-01T12:00:00Z",
    },
  },
  {
    appointment: {
      id: "c1a1a1a1-0006-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-07-20T14:00:00Z",
      durationMinutes: 50,
      status: "agendada",
      createdAt: "2026-06-01T12:00:00Z",
    },
  },
  // Mais algumas consultas na semana de 2026-07-06 a 2026-07-12 (e vizinhas),
  // espalhadas em dias/horários diferentes, só para a visão semanal/diária
  // de demonstração não ficar vazia logo de cara em dev.
  {
    appointment: {
      id: "c1a1a1a1-0007-4a6b-8c9d-0e1f2a3b4c5d",
      patientId: MARINA_ALVES_ID,
      startsAt: "2026-07-09T10:00:00Z",
      durationMinutes: 50,
      status: "agendada",
      createdAt: "2026-06-01T12:00:00Z",
    },
  },
  {
    appointment: {
      id: "c2a2a2a2-0000-4e7b-a1f5-6d3c2b9a8e7f",
      patientId: CAMILA_SOUZA_ID,
      startsAt: "2026-07-10T16:00:00Z",
      durationMinutes: 50,
      status: "agendada",
      createdAt: "2026-06-01T12:00:00Z",
    },
  },
  ...Array.from({ length: 14 }, (_, index) => {
    const week = index + 1;
    const day = String(week).padStart(2, "0");
    const month = 3 + Math.floor(week / 4); // avança de mês a cada ~4 semanas
    const monthStr = String(Math.min(month, 12)).padStart(2, "0");
    return {
      appointment: {
        id: `c2a2a2a2-${String(index).padStart(4, "0")}-4e7b-a1f5-6d3c2b9a8e7f`,
        patientId: CAMILA_SOUZA_ID,
        startsAt: `2026-${monthStr}-${day}T10:00:00Z`,
        durationMinutes: 50,
        status: "realizada",
        createdAt: "2026-02-01T12:00:00Z",
      },
      attendance: { attendance: "compareceu", recordedAt: `2026-${monthStr}-${day}T11:00:00Z` },
    } satisfies SeedEntry;
  }),
];

export interface MockAgendaAdapterOptions {
  /** Relógio injetável — determinismo nos testes (ex.: `createdAt`). */
  clock?: () => number;
  /** Gerador de identificadores injetável — determinismo nos testes. */
  idGenerator?: () => string;
}

/**
 * Implementação em memória de `AgendaAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas fronteiras.
 * Padrão em desenvolvimento e testes — NUNCA deve ser usada em build de
 * produção por padrão (o ponto de troca mock → HTTP fica centralizado em
 * `./index.ts`).
 *
 * SUBSTITUI `MockAppointmentsReadAdapter` (PSI-034) — ver a doc de
 * `AgendaAdapter` para a justificativa da reconciliação. `attendance`
 * continua vindo só do seed local (o contrato não tem `GET` de presença,
 * mesma ressalva 2 de `HttpAppointmentsReadAdapter`).
 *
 * `createAppointment`/`rescheduleAppointment` reproduzem o 409 de conflito
 * de horário com a MESMA regra usada pela validação client-side
 * (`findConflictingAppointment`, `./conflict.ts`) — é o que garante a
 * paridade com `HttpAgendaAdapter` exigida pelo manifesto: os dois
 * devolvem `AgendaAdapterError` com `status: 409` para a mesma condição de
 * negócio.
 */
export class MockAgendaAdapter implements AgendaAdapter {
  private entries: SeedEntry[];
  private readonly clock: () => number;
  private readonly idGenerator: () => string;

  constructor(seed: readonly SeedEntry[] = DEFAULT_SEED, options: MockAgendaAdapterOptions = {}) {
    this.entries = structuredClone(seed) as SeedEntry[];
    this.clock = options.clock ?? (() => Date.now());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
  }

  async listAppointmentsByPatient(patientId: string): Promise<AppointmentHistoryEntry[]> {
    const entries = this.entries
      .filter((entry) => entry.appointment.patientId === patientId)
      .map((entry) => ({ appointment: entry.appointment, attendance: entry.attendance }));
    return structuredClone(entries);
  }

  async listAppointments(params: ListAppointmentsRangeParams): Promise<Appointment[]> {
    const fromMs = Date.parse(`${params.from}T00:00:00.000Z`);
    const toMs = Date.parse(`${params.to}T23:59:59.999Z`);
    const filtered = this.entries
      .map((entry) => entry.appointment)
      .filter((appointment) => {
        if (params.patientId && appointment.patientId !== params.patientId) return false;
        const startMs = Date.parse(appointment.startsAt);
        return startMs >= fromMs && startMs <= toMs;
      });
    return structuredClone(filtered);
  }

  async createAppointment(payload: AppointmentCreateRequest): Promise<Appointment> {
    const candidate = { startsAt: payload.startsAt, durationMinutes: payload.durationMinutes };
    const conflict = findConflictingAppointment(
      candidate,
      this.entries.map((entry) => entry.appointment),
    );
    if (conflict) {
      throw new AgendaAdapterError(AGENDA_CONFLICT_MESSAGE, 409);
    }

    const appointment: Appointment = {
      id: this.idGenerator(),
      patientId: payload.patientId,
      startsAt: payload.startsAt,
      durationMinutes: payload.durationMinutes,
      status: "agendada",
      createdAt: new Date(this.clock()).toISOString(),
      ...(payload.recurrence ? { recurrence: payload.recurrence } : {}),
    };
    this.entries.push({ appointment });
    return structuredClone(appointment);
  }

  async rescheduleAppointment(appointmentId: string, payload: RescheduleAppointmentInput): Promise<Appointment> {
    const index = this.entries.findIndex((entry) => entry.appointment.id === appointmentId);
    const entry = this.entries[index];
    if (index === -1 || !entry) {
      throw new AgendaAdapterError("Consulta não encontrada.", 404);
    }

    const candidate = {
      startsAt: payload.startsAt,
      durationMinutes: payload.durationMinutes ?? entry.appointment.durationMinutes,
    };
    const conflict = findConflictingAppointment(
      candidate,
      this.entries.map((e) => e.appointment),
      appointmentId,
    );
    if (conflict) {
      throw new AgendaAdapterError(AGENDA_CONFLICT_MESSAGE, 409);
    }

    const updated: Appointment = { ...entry.appointment, ...candidate };
    this.entries[index] = { ...entry, appointment: updated };
    return structuredClone(updated);
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const index = this.entries.findIndex((entry) => entry.appointment.id === appointmentId);
    const entry = this.entries[index];
    if (index === -1 || !entry) {
      throw new AgendaAdapterError("Consulta não encontrada.", 404);
    }
    // Cancelar marca o status — nunca remove a linha (a consulta cancelada
    // continua aparecendo no histórico da PSI-034).
    this.entries[index] = { ...entry, appointment: { ...entry.appointment, status: "cancelada" } };
  }

  async createAppointmentSeries(input: CreateAppointmentSeriesInput): Promise<CreateAppointmentSeriesResult> {
    return createAppointmentSeriesWith((payload) => this.createAppointment(payload), input);
  }
}
