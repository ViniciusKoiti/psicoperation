package com.psiops.api.appointment.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositório de registros administrativos de consulta ({@link
 * SessionRecordEntity}), escopado por usuária.
 *
 * <p><strong>{@link #findHistoryByUserIdAndPatientId} (PSI-025)</strong>: a
 * tabela {@code session_records} não tem coluna de paciente própria — o
 * paciente de um registro é sempre derivado da consulta vinculada (ver
 * assumption do manifesto PSI-025), então o histórico paginado por paciente
 * exige um join ad hoc com {@link AppointmentEntity} (mesmo módulo de
 * persistência), ordenado pela consulta mais recente primeiro.
 */
public interface SessionRecordRepository extends JpaRepository<SessionRecordEntity, UUID> {

  Optional<SessionRecordEntity> findByAppointmentId(UUID appointmentId);

  @Query(
      value =
          "select sr from SessionRecordEntity sr "
              + "join AppointmentEntity a on a.id = sr.appointmentId "
              + "where sr.userId = :userId and a.patientId = :patientId "
              + "order by a.startsAt desc",
      countQuery =
          "select count(sr) from SessionRecordEntity sr "
              + "join AppointmentEntity a on a.id = sr.appointmentId "
              + "where sr.userId = :userId and a.patientId = :patientId")
  Page<SessionRecordEntity> findHistoryByUserIdAndPatientId(
      @Param("userId") UUID userId, @Param("patientId") UUID patientId, Pageable pageable);
}
