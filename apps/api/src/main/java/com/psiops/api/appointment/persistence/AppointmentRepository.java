package com.psiops.api.appointment.persistence;

import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

/**
 * Repositório de consultas ({@link AppointmentEntity}), escopado por usuária.
 *
 * <p><strong>Isolamento multi-tenant (PSI-024)</strong>: toda consulta usada
 * pelo módulo de agenda acima da camada de persistência passa por um dos
 * métodos aqui — todos recebem {@code userId} e o incluem no filtro (nunca
 * um {@code findById} puro).
 *
 * <p>{@link #findByUserIdAndStatusInAndStartsAtBetween} usa {@code
 * PESSIMISTIC_WRITE} para mitigar condição de corrida entre requisições
 * concorrentes de criação/remarcação (ver {@code risks} do manifesto
 * PSI-024): a checagem de conflito e a criação/remarcação acontecem na mesma
 * transação, com as linhas candidatas travadas até o commit.
 */
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, UUID> {

  List<AppointmentEntity> findByUserId(UUID userId);

  /** Busca uma consulta pelo id, mas somente se pertencer a {@code userId}. */
  Optional<AppointmentEntity> findByIdAndUserId(UUID id, UUID userId);

  Page<AppointmentEntity> findByUserId(UUID userId, Pageable pageable);

  Page<AppointmentEntity> findByUserIdAndPatientId(UUID userId, UUID patientId, Pageable pageable);

  Page<AppointmentEntity> findByUserIdAndStartsAtBetween(
      UUID userId, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

  Page<AppointmentEntity> findByUserIdAndPatientIdAndStartsAtBetween(
      UUID userId, UUID patientId, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

  /**
   * Candidatas a conflito de horário: consultas ativas (status em {@code
   * statuses}) da usuária cujo {@code startsAt} cai dentro da janela
   * {@code [from, to)}. A checagem exata de sobreposição (considerando a
   * duração de cada uma) acontece em memória no caso de uso — ver {@code
   * AppointmentService#assertNoConflict}.
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  List<AppointmentEntity> findByUserIdAndStatusInAndStartsAtBetween(
      UUID userId, List<AppointmentStatus> statuses, OffsetDateTime from, OffsetDateTime to);
}
