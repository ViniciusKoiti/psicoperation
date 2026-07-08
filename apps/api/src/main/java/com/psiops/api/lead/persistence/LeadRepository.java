package com.psiops.api.lead.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório do lead da lista de espera ({@link LeadEntity}). */
public interface LeadRepository extends JpaRepository<LeadEntity, UUID> {

  Optional<LeadEntity> findByEmail(String email);

  boolean existsByEmail(String email);
}
