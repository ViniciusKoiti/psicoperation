import type {
  Appointment,
  AppointmentCreateRequest,
  Charge,
  Patient,
  PatientCreateRequest,
  Reminder,
  ReminderCreateRequest,
  Task,
  TaskCreateRequest,
} from "@psiops/contracts";
import { describe, expect, it } from "vitest";

import {
  buildAppointment,
  buildAppointmentCreateRequest,
  buildAppointments,
  buildCharge,
  buildChargeCreateRequest,
  buildCharges,
  buildPatient,
  buildPatientCreateRequest,
  buildPatients,
  buildReminder,
  buildReminderCreateRequest,
  buildReminders,
  buildTask,
  buildTaskCreateRequest,
  buildTasks,
  createFixtures,
  type ChargeCreateRequest,
} from "../src/builders.js";
import { patterns } from "../src/patterns.js";

const CLINICAL_KEYWORDS = [
  "diagnóstic",
  "diagnostic",
  "cid-10",
  "queixa",
  "sintoma",
  "transtorno",
  "ansiedade",
  "depress",
  "tdah",
  "prontuário",
  "prontuario",
];

describe("builders — domínio completo (PSI-046) — determinismo", () => {
  it("mesma seed produz exatamente o mesmo Patient/Appointment/Charge/Task/Reminder", () => {
    expect(buildPatient({ seed: "determinismo" })).toEqual(buildPatient({ seed: "determinismo" }));
    expect(buildAppointment({ seed: "determinismo" })).toEqual(
      buildAppointment({ seed: "determinismo" }),
    );
    expect(buildCharge({ seed: "determinismo" })).toEqual(buildCharge({ seed: "determinismo" }));
    expect(buildTask({ seed: "determinismo" })).toEqual(buildTask({ seed: "determinismo" }));
    expect(buildReminder({ seed: "determinismo" })).toEqual(buildReminder({ seed: "determinismo" }));
  });

  it("seeds diferentes produzem entidades diferentes", () => {
    expect(buildPatient({ seed: 1 })).not.toEqual(buildPatient({ seed: 2 }));
    expect(buildAppointment({ seed: 1 })).not.toEqual(buildAppointment({ seed: 2 }));
    expect(buildCharge({ seed: 1 })).not.toEqual(buildCharge({ seed: 2 }));
  });

  it("séries são reprodutíveis (mesma seed → mesma série)", () => {
    expect(buildPatients(5, { seed: 99 })).toEqual(buildPatients(5, { seed: 99 }));
    expect(buildAppointments(5, { seed: 99 })).toEqual(buildAppointments(5, { seed: 99 }));
    expect(buildCharges(5, { seed: 99 })).toEqual(buildCharges(5, { seed: 99 }));
    expect(buildTasks(5, { seed: 99 })).toEqual(buildTasks(5, { seed: 99 }));
    expect(buildReminders(5, { seed: 99 })).toEqual(buildReminders(5, { seed: 99 }));
  });

  it("a fábrica com sequência mistura entidades de domínios diferentes de forma reprodutível", () => {
    const a = createFixtures("mix-dominio");
    const b = createFixtures("mix-dominio");
    const seriesA = [a.patient(), a.appointment(), a.charge(), a.task(), a.reminder()];
    const seriesB = [b.patient(), b.appointment(), b.charge(), b.task(), b.reminder()];
    expect(seriesA).toEqual(seriesB);
  });
});

describe("builders — domínio completo — overrides", () => {
  it("overrides parciais tipados sobrepõem os valores gerados", () => {
    const patient = buildPatient({ seed: 10, overrides: { name: "Paciente Fixado", billingDay: 7 } });
    expect(patient.name).toBe("Paciente Fixado");
    expect(patient.billingDay).toBe(7);
    expect(patient.id).toMatch(patterns.uuid);
  });

  it("overrides funcionam em séries sem afetar a distinção de ids", () => {
    const tasks = buildTasks(3, { seed: 12, overrides: { title: "Mesma Tarefa" } });
    expect(tasks.map((task) => task.title)).toEqual(["Mesma Tarefa", "Mesma Tarefa", "Mesma Tarefa"]);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(3);
  });
});

describe("builders — domínio completo — formatos dos contratos", () => {
  const fixtures = createFixtures("formatos-dominio");
  const patients = fixtures.patients(20);
  const appointments = fixtures.appointments(20);
  const charges = fixtures.charges(20);
  const tasks = fixtures.tasks(20);
  const reminders = fixtures.reminders(20);

  it("ids são UUID v4", () => {
    for (const entity of [...patients, ...appointments, ...charges, ...tasks, ...reminders]) {
      expect(entity.id).toMatch(patterns.uuid);
    }
  });

  it("createdAt é instante ISO 8601 UTC válido em todas as entidades", () => {
    for (const entity of [...patients, ...appointments, ...charges, ...tasks, ...reminders]) {
      expect(entity.createdAt).toMatch(patterns.isoDateTime);
    }
  });

  it("pacientes: monthlyFee em centavos inteiros positivos e billingDay entre 1 e 28", () => {
    for (const patient of patients) {
      expect(Number.isInteger(patient.monthlyFee)).toBe(true);
      expect(patient.monthlyFee).toBeGreaterThan(0);
      expect(patient.billingDay).toBeGreaterThanOrEqual(1);
      expect(patient.billingDay).toBeLessThanOrEqual(28);
      if (patient.whatsapp !== undefined) {
        expect(patient.whatsapp).toMatch(patterns.whatsAppBR);
      }
      if (patient.email !== undefined) {
        expect(patient.email).toMatch(patterns.email);
      }
    }
  });

  it("pacientes nunca carregam dado clínico (apenas notas administrativas)", () => {
    for (const patient of patients) {
      const notes = (patient.notes ?? "").toLowerCase();
      for (const keyword of CLINICAL_KEYWORDS) {
        expect(notes).not.toContain(keyword);
      }
    }
  });

  it("consultas: startsAt ISO 8601 UTC e durationMinutes positivo", () => {
    for (const appointment of appointments) {
      expect(appointment.startsAt).toMatch(patterns.isoDateTime);
      expect(appointment.durationMinutes).toBeGreaterThan(0);
      expect(appointment.patientId).toMatch(patterns.uuid);
    }
  });

  it("cobranças: amount em centavos inteiros positivos, dueDate ISO 8601 e competence AAAA-MM", () => {
    for (const charge of charges) {
      expect(Number.isInteger(charge.amount)).toBe(true);
      expect(charge.amount).toBeGreaterThan(0);
      expect(charge.dueDate).toMatch(patterns.isoDate);
      expect(charge.competence).toMatch(/^\d{4}-\d{2}$/);
      if (charge.status === "em_dia") {
        expect(charge.payment).toBeDefined();
      }
    }
  });

  it("tarefas: dueDate (quando presente) é IsoDate válido", () => {
    for (const task of tasks) {
      if (task.dueDate !== undefined) {
        expect(task.dueDate).toMatch(patterns.isoDate);
      }
    }
  });

  it("lembretes: canal sempre email, scheduledFor ISO 8601 e no máximo um vínculo", () => {
    for (const reminder of reminders) {
      expect(reminder.channel).toBe("email");
      expect(reminder.scheduledFor).toMatch(patterns.isoDateTime);
      const linkCount = [reminder.patientId, reminder.appointmentId, reminder.chargeId].filter(
        (value) => value !== undefined,
      ).length;
      expect(linkCount).toBeLessThanOrEqual(1);
    }
  });

  it("payloads de criação nunca incluem id nem createdAt", () => {
    const patientRequest = fixtures.patientCreateRequest();
    const appointmentRequest = fixtures.appointmentCreateRequest();
    const chargeRequest = fixtures.chargeCreateRequest();
    const taskRequest = fixtures.taskCreateRequest();
    const reminderRequest = fixtures.reminderCreateRequest();

    for (const request of [
      patientRequest,
      appointmentRequest,
      chargeRequest,
      taskRequest,
      reminderRequest,
    ]) {
      expect(request).not.toHaveProperty("id");
      expect(request).not.toHaveProperty("createdAt");
    }
  });
});

describe("builders — domínio completo — tipagem pelos contratos", () => {
  it("retornos são atribuíveis aos tipos gerados de @psiops/contracts", () => {
    // Falha em typecheck (não em runtime) se os builders divergirem dos tipos.
    const patient: Patient = buildPatient();
    const patientRequest: PatientCreateRequest = buildPatientCreateRequest();
    const appointment: Appointment = buildAppointment();
    const appointmentRequest: AppointmentCreateRequest = buildAppointmentCreateRequest();
    const charge: Charge = buildCharge();
    const chargeRequest: ChargeCreateRequest = buildChargeCreateRequest();
    const task: Task = buildTask();
    const taskRequest: TaskCreateRequest = buildTaskCreateRequest();
    const reminder: Reminder = buildReminder();
    const reminderRequest: ReminderCreateRequest = buildReminderCreateRequest();

    expect(patient).toBeDefined();
    expect(patientRequest).toBeDefined();
    expect(appointment).toBeDefined();
    expect(appointmentRequest).toBeDefined();
    expect(charge).toBeDefined();
    expect(chargeRequest).toBeDefined();
    expect(task).toBeDefined();
    expect(taskRequest).toBeDefined();
    expect(reminder).toBeDefined();
    expect(reminderRequest).toBeDefined();
  });
});
