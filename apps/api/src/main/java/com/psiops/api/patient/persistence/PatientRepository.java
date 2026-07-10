package com.psiops.api.patient.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório de pacientes ({@link PatientEntity}), escopado por usuária.
 *
 * <p><strong>Isolamento multi-tenant (PSI-023)</strong>: toda consulta usada
 * pelo módulo de pacientes acima da camada de persistência passa por um dos
 * métodos aqui — todos recebem {@code userId} e o incluem no filtro (nunca
 * um {@code findById} puro). Isso garante que nenhuma leitura ou escrita
 * alcance um paciente de outra psicóloga.
 */
public interface PatientRepository extends JpaRepository<PatientEntity, UUID> {

  List<PatientEntity> findByUserId(UUID userId);

  /** Busca um paciente pelo id, mas somente se pertencer a {@code userId}. */
  Optional<PatientEntity> findByIdAndUserId(UUID id, UUID userId);

  Page<PatientEntity> findByUserIdAndStatus(UUID userId, PatientStatus status, Pageable pageable);

  /**
   * Variante não paginada de {@link #findByUserIdAndStatus(UUID,
   * PatientStatus, Pageable)}, usada pela geração mensal de cobranças
   * (PSI-026, {@code ChargeService#generateMonthlyCharges}): precisa
   * percorrer TODOS os pacientes ativos da usuária, não uma página.
   */
  List<PatientEntity> findByUserIdAndStatus(UUID userId, PatientStatus status);

  Page<PatientEntity> findByUserIdAndStatusAndNameContainingIgnoreCase(
      UUID userId, PatientStatus status, String name, Pageable pageable);
}
