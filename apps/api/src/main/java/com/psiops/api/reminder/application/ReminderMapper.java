package com.psiops.api.reminder.application;

import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderStatus;
import com.psiops.contracts.model.Reminder;

/**
 * Converte entre {@link ReminderEntity} (persistência) e o DTO de contrato
 * {@link Reminder} (gerado de {@code packages/contracts}). O campo {@code
 * userId} nunca aparece no DTO — o escopo multi-tenant é implícito no bearer
 * token.
 *
 * <p>Os enums de canal/status são intencionalmente dois tipos distintos
 * (persistência vs. contrato, mesmo padrão de {@code
 * com.psiops.api.patient.application.PatientMapper}); a conversão é por nome
 * de constante, já que os valores são os mesmos.
 */
public final class ReminderMapper {

  private ReminderMapper() {
  }

  public static Reminder toContract(ReminderEntity entity) {
    return new Reminder(
            entity.getId(),
            toContractChannel(entity.getChannel()),
            entity.getSubject(),
            entity.getBody(),
            entity.getScheduledFor(),
            toContractStatus(entity.getStatus()),
            entity.getCreatedAt())
        .sentAt(entity.getSentAt())
        .patientId(entity.getPatientId())
        .appointmentId(entity.getAppointmentId())
        .chargeId(entity.getChargeId());
  }

  public static ReminderChannel toPersistenceChannel(com.psiops.contracts.model.ReminderChannel channel) {
    return ReminderChannel.valueOf(channel.name());
  }

  public static com.psiops.contracts.model.ReminderChannel toContractChannel(ReminderChannel channel) {
    return com.psiops.contracts.model.ReminderChannel.valueOf(channel.name());
  }

  public static ReminderStatus toPersistenceStatus(com.psiops.contracts.model.ReminderStatus status) {
    return ReminderStatus.valueOf(status.name());
  }

  public static com.psiops.contracts.model.ReminderStatus toContractStatus(ReminderStatus status) {
    return com.psiops.contracts.model.ReminderStatus.valueOf(status.name());
  }
}
