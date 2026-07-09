package com.psiops.api.billing.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório de cobranças ({@link ChargeEntity}), escopado por usuária. */
public interface ChargeRepository extends JpaRepository<ChargeEntity, UUID> {

  List<ChargeEntity> findByUserId(UUID userId);

  List<ChargeEntity> findByUserIdAndCompetence(UUID userId, String competence);
}
