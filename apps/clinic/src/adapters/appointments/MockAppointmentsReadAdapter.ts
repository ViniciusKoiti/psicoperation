import type { Appointment, AttendanceRecord } from "@psiops/contracts";

import type { AppointmentHistoryEntry, AppointmentsReadAdapter } from "./AppointmentsReadAdapter";

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
 * inicial plausível para dev/demo, no mesmo espírito de
 * `MockPatientsAdapter`). Marina Alves tem histórico variado (consultas
 * passadas realizadas/faltas/remarcadas/canceladas, com registro
 * administrativo de presença, mais consultas futuras agendadas) para
 * exercitar as quatro combinações de `AppointmentStatus`/`AttendanceStatus`
 * usadas pela tela de detalhe. Camila Souza tem um volume grande de
 * consultas (risco do manifesto PSI-034: "volume grande de histórico sem
 * paginação"). Pacientes sem chave aqui (ex.: Beatriz Nogueira) resolvem com
 * histórico vazio — cenário de estado vazio por seção.
 */
const SEED: Readonly<Record<string, readonly SeedEntry[]>> = {
  [MARINA_ALVES_ID]: [
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
  ],
  [CAMILA_SOUZA_ID]: Array.from({ length: 14 }, (_, index) => {
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
};

/**
 * Implementação em memória de `AppointmentsReadAdapter` (ADR 0006): sem
 * rede, sem banco, estado isolado por instância, clonagem estrutural nas
 * fronteiras. Padrão em desenvolvimento e testes.
 */
export class MockAppointmentsReadAdapter implements AppointmentsReadAdapter {
  private readonly entriesByPatient: Record<string, SeedEntry[]>;

  constructor(seed: Readonly<Record<string, readonly SeedEntry[]>> = SEED) {
    this.entriesByPatient = structuredClone(seed) as Record<string, SeedEntry[]>;
  }

  async listAppointmentsByPatient(patientId: string): Promise<AppointmentHistoryEntry[]> {
    const entries = this.entriesByPatient[patientId] ?? [];
    return structuredClone(entries);
  }
}
