package com.psiops.api.appointment.application;

import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.Weekday;
import com.psiops.contracts.model.Appointment;

/**
 * Converte entre {@link AppointmentEntity} (persistência/agregado) e o DTO de
 * contrato {@link Appointment} (gerado de {@code packages/contracts}). O
 * campo {@code userId} nunca aparece no DTO — o escopo multi-tenant é
 * implícito no bearer token (mesmo padrão de {@code
 * com.psiops.api.patient.application.PatientMapper}).
 *
 * <p>Os enums de status/dia-da-semana são intencionalmente dois tipos
 * distintos (persistência vs. contrato); a conversão é por nome de constante,
 * já que os valores são os mesmos.
 */
public final class AppointmentMapper {

  private AppointmentMapper() {}

  public static Appointment toContract(AppointmentEntity entity) {
    Appointment appointment =
        new Appointment(
            entity.getId(),
            entity.getPatientId(),
            entity.getStartsAt(),
            entity.getDurationMinutes(),
            toContractStatus(entity.getStatus()),
            entity.getCreatedAt());
    if (entity.getRecurrence() != null && entity.getRecurrence().getWeekday() != null) {
      com.psiops.contracts.model.WeeklyRecurrence recurrence =
          new com.psiops.contracts.model.WeeklyRecurrence(
                  toContractWeekday(entity.getRecurrence().getWeekday()))
              .interval(entity.getRecurrence().getInterval())
              .until(entity.getRecurrence().getUntil());
      appointment.recurrence(recurrence);
    }
    return appointment;
  }

  public static com.psiops.contracts.model.AppointmentStatus toContractStatus(
      com.psiops.api.appointment.persistence.AppointmentStatus status) {
    return com.psiops.contracts.model.AppointmentStatus.valueOf(status.name());
  }

  public static com.psiops.api.appointment.persistence.AppointmentStatus toPersistenceStatus(
      com.psiops.contracts.model.AppointmentStatus status) {
    return com.psiops.api.appointment.persistence.AppointmentStatus.valueOf(status.name());
  }

  public static com.psiops.contracts.model.WeeklyRecurrence.WeekdayEnum toContractWeekday(
      Weekday weekday) {
    return com.psiops.contracts.model.WeeklyRecurrence.WeekdayEnum.valueOf(weekday.name());
  }

  public static Weekday toPersistenceWeekday(
      com.psiops.contracts.model.WeeklyRecurrence.WeekdayEnum weekday) {
    return Weekday.valueOf(weekday.name());
  }
}
