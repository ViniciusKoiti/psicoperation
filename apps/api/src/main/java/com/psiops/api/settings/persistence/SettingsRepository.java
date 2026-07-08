package com.psiops.api.settings.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório das configurações da conta ({@link SettingsEntity}). */
public interface SettingsRepository extends JpaRepository<SettingsEntity, UUID> {

  Optional<SettingsEntity> findByUserId(UUID userId);
}
