package com.psiops.api.patient.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório de pacientes ({@link PatientEntity}), escopado por usuária. */
public interface PatientRepository extends JpaRepository<PatientEntity, UUID> {

  List<PatientEntity> findByUserId(UUID userId);
}
