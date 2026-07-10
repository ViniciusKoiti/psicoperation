package com.psiops.api.billing.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositório de cobranças ({@link ChargeEntity}), escopado por usuária.
 *
 * <p><strong>Isolamento multi-tenant (PSI-026)</strong>: toda consulta usada
 * pelo módulo financeiro acima da camada de persistência passa por um dos
 * métodos aqui — todos recebem {@code userId} e o incluem no filtro (nunca
 * um {@code findById} puro).
 */
public interface ChargeRepository extends JpaRepository<ChargeEntity, UUID> {

  List<ChargeEntity> findByUserId(UUID userId);

  List<ChargeEntity> findByUserIdAndCompetence(UUID userId, String competence);

  /** Busca uma cobrança pelo id, mas somente se pertencer a {@code userId}. */
  Optional<ChargeEntity> findByIdAndUserId(UUID id, UUID userId);

  List<ChargeEntity> findByUserIdAndStatus(UUID userId, ChargeStatus status);

  /**
   * Cobranças {@code pendente} da usuária vencidas (dueDate anterior a
   * {@code asOf}) e ainda sem pagamento registrado — a base da varredura de
   * detecção de atraso ({@code ChargeService#detectOverdueForUser}).
   * Pagamento é sempre nulo aqui: uma vez pago, o status vira {@code
   * EM_DIA}, nunca fica {@code PENDENTE} com pagamento presente.
   */
  List<ChargeEntity> findByUserIdAndStatusAndDueDateBefore(UUID userId, ChargeStatus status, LocalDate asOf);

  /**
   * Listagem paginada escopada a {@code userId}, com filtros opcionais
   * (nulos = sem filtro) por paciente, competência e status — usada por
   * {@code GET /charges} (contrato PSI-020).
   */
  @Query(
      "select c from ChargeEntity c where c.userId = :userId "
          + "and (:patientId is null or c.patientId = :patientId) "
          + "and (:competence is null or c.competence = :competence) "
          + "and (:status is null or c.status = :status)")
  Page<ChargeEntity> search(
      @Param("userId") UUID userId,
      @Param("patientId") UUID patientId,
      @Param("competence") String competence,
      @Param("status") ChargeStatus status,
      Pageable pageable);
}
