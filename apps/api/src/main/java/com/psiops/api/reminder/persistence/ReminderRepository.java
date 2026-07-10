package com.psiops.api.reminder.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositório de lembretes ({@link ReminderEntity}), escopado por usuária.
 *
 * <p><strong>Isolamento multi-tenant (PSI-027)</strong>: toda consulta usada
 * pelo módulo de lembretes acima da camada de persistência passa por um dos
 * métodos aqui — todos recebem {@code userId} e o incluem no filtro (nunca
 * um {@code findById} puro).
 */
public interface ReminderRepository extends JpaRepository<ReminderEntity, UUID> {

  List<ReminderEntity> findByUserId(UUID userId);

  /** Busca um lembrete pelo id, mas somente se pertencer a {@code userId}. */
  Optional<ReminderEntity> findByIdAndUserId(UUID id, UUID userId);

  /**
   * Listagem paginada escopada a {@code userId}, com filtros opcionais
   * (nulos = sem filtro) por paciente e status — usada por {@code GET
   * /reminders} (contrato PSI-020). Mesmo padrão de {@code
   * com.psiops.api.billing.persistence.ChargeRepository#search}.
   */
  @Query(
      "select r from ReminderEntity r where r.userId = :userId "
          + "and (:patientId is null or r.patientId = :patientId) "
          + "and (:status is null or r.status = :status)")
  Page<ReminderEntity> search(
      @Param("userId") UUID userId,
      @Param("patientId") UUID patientId,
      @Param("status") ReminderStatus status,
      Pageable pageable);
}
