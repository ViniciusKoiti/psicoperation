import type { Reminder, ReminderCreateRequest } from "@psiops/contracts";

import type { ListRemindersParams, RemindersAdapter } from "./RemindersAdapter";
import { RemindersAdapterError } from "./RemindersAdapterError";

// IDs compartilhados com os seeds de `MockAgendaAdapter`/`MockChargesAdapter`
// só para o mock de desenvolvimento ficar coerente (mesma paciente, mesma
// consulta/cobrança aparecem nos três adapters) — não há acoplamento de
// código entre eles.
const MARINA_ALVES_ID = "3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d";
const MARINA_SESSION_APPOINTMENT_ID = "c1a1a1a1-0005-4a6b-8c9d-0e1f2a3b4c5d";
const MARINA_PENDING_CHARGE_ID = "d1a1a1a1-0004-4a6b-8c9d-0e1f2a3b4c5d";

/**
 * Seed de exemplo determinístico (não é fixture de teste com seed — estado
 * inicial plausível para dev/demo, mesmo espírito de `MockTasksAdapter`): um
 * lembrete de sessão agendado (consulta futura de Marina Alves, PSI-035) e
 * um lembrete de pagamento já enviado (mensalidade de junho, cenário
 * histórico) — cobre os dois tipos de vínculo e dois status diferentes sem
 * depender do relógio real.
 */
const DEFAULT_SEED: readonly Reminder[] = [
  {
    id: "r1a1a1a1-0001-4a6b-8c9d-0e1f2a3b4c5d",
    channel: "email",
    subject: "Lembrete de consulta",
    body: "Você tem uma consulta agendada para 13/07/2026 às 14:00.",
    scheduledFor: "2026-07-12T14:00:00Z",
    status: "agendado",
    patientId: MARINA_ALVES_ID,
    appointmentId: MARINA_SESSION_APPOINTMENT_ID,
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "r1a1a1a1-0002-4a6b-8c9d-0e1f2a3b4c5d",
    channel: "email",
    subject: "Lembrete de pagamento",
    body: "Sua mensalidade de junho/2026 no valor de R$ 250,00 vence em 05/06/2026.",
    scheduledFor: "2026-06-04T09:00:00Z",
    sentAt: "2026-06-04T09:00:05Z",
    status: "enviado",
    patientId: MARINA_ALVES_ID,
    chargeId: MARINA_PENDING_CHARGE_ID,
    createdAt: "2026-06-01T09:00:00Z",
  },
];

export interface MockRemindersAdapterOptions {
  /** Relógio injetável — determinismo nos testes (`createdAt` gerado). */
  clock?: () => number;
  /** Gerador de identificadores injetável — determinismo nos testes. */
  idGenerator?: () => string;
}

/**
 * Implementação em memória de `RemindersAdapter` (ADR 0006): sem rede, sem
 * banco, estado isolado por instância, clonagem estrutural nas fronteiras.
 * Padrão em desenvolvimento e testes — NUNCA deve ser a seleção padrão em
 * build de produção (ver `./index.ts`).
 *
 * Simula o AGENDAMENTO de um lembrete (`createReminder` sempre nasce
 * `"agendado"` — nenhum email é de fato enviado, ver a doc de
 * `RemindersAdapter`) e expõe as transições de estado
 * (`agendado`/`enviado`/`falhou`/`cancelado`) para a UI exibir o histórico —
 * o avanço para `enviado`/`falhou` é responsabilidade do backend real
 * (PSI-029/PSI-044) e não é simulado automaticamente aqui; só `cancelReminder`
 * (ação explícita da usuária) muda o estado de um lembrete já criado neste
 * mock.
 */
export class MockRemindersAdapter implements RemindersAdapter {
  private readonly reminders: Reminder[];
  private readonly clock: () => number;
  private readonly idGenerator: () => string;

  constructor(seed: readonly Reminder[] = DEFAULT_SEED, options: MockRemindersAdapterOptions = {}) {
    this.reminders = structuredClone(seed) as Reminder[];
    this.clock = options.clock ?? (() => Date.now());
    this.idGenerator = options.idGenerator ?? (() => crypto.randomUUID());
  }

  async listReminders(params: ListRemindersParams = {}): Promise<Reminder[]> {
    const filtered = this.reminders.filter((reminder) => {
      if (params.patientId && reminder.patientId !== params.patientId) return false;
      if (params.status && reminder.status !== params.status) return false;
      return true;
    });
    return structuredClone(filtered);
  }

  async createReminder(payload: ReminderCreateRequest): Promise<Reminder> {
    const reminder: Reminder = {
      id: this.idGenerator(),
      channel: payload.channel,
      subject: payload.subject,
      body: payload.body,
      scheduledFor: payload.scheduledFor,
      status: "agendado",
      createdAt: new Date(this.clock()).toISOString(),
      ...(payload.patientId ? { patientId: payload.patientId } : {}),
      ...(payload.appointmentId ? { appointmentId: payload.appointmentId } : {}),
      ...(payload.chargeId ? { chargeId: payload.chargeId } : {}),
    };
    this.reminders.push(reminder);
    return structuredClone(reminder);
  }

  async cancelReminder(reminderId: string): Promise<Reminder> {
    const index = this.reminders.findIndex((reminder) => reminder.id === reminderId);
    if (index === -1) {
      throw new RemindersAdapterError(`Lembrete ${reminderId} não encontrado.`, 404);
    }
    const current = this.reminders[index] as Reminder;
    if (current.status !== "agendado") {
      throw new RemindersAdapterError("Este lembrete não está mais agendado e não pode ser cancelado.", 409);
    }

    const updated: Reminder = { ...current, status: "cancelado" };
    this.reminders[index] = updated;
    return structuredClone(updated);
  }
}
