package com.psiops.api.sessionrecord.application;

import com.psiops.api.appointment.persistence.AttendanceStatus;
import com.psiops.api.appointment.persistence.SessionRecordEntity;
import com.psiops.contracts.model.AttendanceRecord;

/**
 * Converte entre {@link SessionRecordEntity} (persistência) e o DTO de
 * contrato {@link AttendanceRecord} (gerado de {@code packages/contracts}) —
 * mesmo padrão de {@code com.psiops.api.appointment.application.AppointmentMapper}.
 *
 * <p>Os enums de comparecimento são dois tipos distintos (persistência vs.
 * contrato); a conversão é por nome de constante, já que os valores são os
 * mesmos ({@code COMPARECEU}/{@code FALTOU}/{@code REMARCADA}).
 */
public final class SessionRecordMapper {

  private SessionRecordMapper() {}

  /**
   * Monta o DTO de contrato a partir da entidade. Contém somente o que o
   * contrato modela (status de comparecimento + anotação administrativa +
   * instante do registro) — nenhum campo clínico.
   */
  public static AttendanceRecord toContract(SessionRecordEntity entity) {
    return new AttendanceRecord(toContractStatus(entity.getAttendance()))
        .administrativeNotes(entity.getAdministrativeNotes())
        .recordedAt(entity.getRecordedAt());
  }

  public static com.psiops.contracts.model.AttendanceStatus toContractStatus(AttendanceStatus status) {
    return com.psiops.contracts.model.AttendanceStatus.valueOf(status.name());
  }

  public static AttendanceStatus toPersistenceStatus(com.psiops.contracts.model.AttendanceStatus status) {
    return AttendanceStatus.valueOf(status.name());
  }
}
