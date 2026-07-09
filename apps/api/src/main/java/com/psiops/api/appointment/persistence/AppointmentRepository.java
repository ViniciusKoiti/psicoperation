package com.psiops.api.appointment.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório de consultas ({@link AppointmentEntity}), escopado por usuária. */
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, UUID> {

  List<AppointmentEntity> findByUserId(UUID userId);
}
