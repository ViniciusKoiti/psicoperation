package com.psiops.api.reminder.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repositório de lembretes ({@link ReminderEntity}), escopado por usuária. */
public interface ReminderRepository extends JpaRepository<ReminderEntity, UUID> {

  List<ReminderEntity> findByUserId(UUID userId);
}
