package com.psiops.api.appointment.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório de registros administrativos de consulta ({@link
 * SessionRecordEntity}), escopado por usuária.
 */
public interface SessionRecordRepository extends JpaRepository<SessionRecordEntity, UUID> {

  Optional<SessionRecordEntity> findByAppointmentId(UUID appointmentId);
}
