package com.psiops.api.patient.application;

import com.psiops.api.patient.domain.PatientNotFoundException;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.patient.persistence.PatientStatus;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.PatientPage;
import com.psiops.contracts.model.PatientUpdateRequest;
import com.psiops.contracts.model.PageMeta;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do módulo de pacientes (PSI-023): CRUD, listagem paginada com
 * busca por nome e arquivamento (nunca exclusão física).
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}, nunca
 * lido daqui) e toda consulta/gravação passa por um método de {@link
 * PatientRepository} que filtra por {@code userId} — nunca um {@code
 * findById} puro. Um paciente de outra usuária é tratado exatamente como
 * inexistente: {@link PatientNotFoundException} (404) para operações por id,
 * lista vazia para listagens — nunca 403, para não vazar a existência do
 * recurso de outro tenant.
 */
@Service
public class PatientService {

  /** Tamanho de página máximo aceito (schema {@code PageSizeParam} do contrato). */
  private static final int MAX_PAGE_SIZE = 100;

  private final PatientRepository patientRepository;

  public PatientService(PatientRepository patientRepository) {
    this.patientRepository = patientRepository;
  }

  @Transactional
  public Patient create(UUID userId, PatientCreateRequest request) {
    PatientEntity entity = new PatientEntity(
        UUID.randomUUID(),
        userId,
        request.getName().trim(),
        request.getWhatsapp(),
        request.getEmail(),
        request.getMonthlyFee(),
        request.getBillingDay(),
        PatientStatus.ATIVO,
        request.getNotes(),
        OffsetDateTime.now(ZoneOffset.UTC));
    patientRepository.save(entity);
    return PatientMapper.toContract(entity);
  }

  @Transactional(readOnly = true)
  public Patient get(UUID userId, UUID patientId) {
    return PatientMapper.toContract(findOwned(userId, patientId));
  }

  /**
   * Listagem paginada, escopada a {@code userId}, com busca opcional por
   * nome (case-insensitive, correspondência parcial) e filtro opcional de
   * status.
   *
   * <p>Quando {@code statusParam} está ausente, a listagem retorna apenas
   * pacientes {@code ativo} — arquivados (status {@code inativo}) saem da
   * listagem padrão, mas continuam acessíveis por {@link #get} e
   * reaparecem se o status for filtrado explicitamente
   * (assunção registrada no manifesto PSI-023: o contrato não define um
   * valor "todos", então "sem filtro" equivale a "somente ativos").
   *
   * <p>O contrato não declara uma resposta de erro para {@code GET
   * /patients} (nenhum 400 nos paths do recurso); por isso um valor de
   * {@code status} não reconhecido é tratado como ausente em vez de gerar um
   * formato de erro não previsto no contrato.
   */
  @Transactional(readOnly = true)
  public PatientPage list(UUID userId, int page, int size, String statusParam, String nameParam) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    PatientStatus status = resolveStatus(statusParam);
    String trimmedName = (nameParam == null || nameParam.isBlank()) ? null : nameParam.trim();
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name"));

    Page<PatientEntity> result = trimmedName == null
        ? patientRepository.findByUserIdAndStatus(userId, status, pageable)
        : patientRepository.findByUserIdAndStatusAndNameContainingIgnoreCase(
            userId, status, trimmedName, pageable);

    List<Patient> items = result.getContent().stream().map(PatientMapper::toContract).toList();
    PageMeta meta = new PageMeta(
        result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new PatientPage(items, meta);
  }

  @Transactional
  public Patient update(UUID userId, UUID patientId, PatientUpdateRequest request) {
    PatientEntity entity = findOwned(userId, patientId);
    // Somente os campos presentes (não nulos) no payload são alterados —
    // conforme a descrição de PatientUpdateRequest no contrato.
    if (request.getName() != null) {
      entity.setName(request.getName().trim());
    }
    if (request.getWhatsapp() != null) {
      entity.setWhatsapp(request.getWhatsapp());
    }
    if (request.getEmail() != null) {
      entity.setEmail(request.getEmail());
    }
    if (request.getMonthlyFee() != null) {
      entity.setMonthlyFeeCents(request.getMonthlyFee());
    }
    if (request.getBillingDay() != null) {
      entity.setBillingDay(request.getBillingDay());
    }
    if (request.getStatus() != null) {
      entity.setStatus(PatientMapper.toPersistenceStatus(request.getStatus()));
    }
    if (request.getNotes() != null) {
      entity.setNotes(request.getNotes());
    }
    patientRepository.save(entity);
    return PatientMapper.toContract(entity);
  }

  /**
   * Arquiva o paciente (status passa a {@code inativo}) em vez de excluí-lo:
   * histórico financeiro e de consultas é preservado. Nenhum método deste
   * serviço expõe exclusão física (fora de escopo da PSI-023, ver LGPD em
   * tarefa futura).
   */
  @Transactional
  public void archive(UUID userId, UUID patientId) {
    PatientEntity entity = findOwned(userId, patientId);
    entity.setStatus(PatientStatus.INATIVO);
    patientRepository.save(entity);
  }

  private PatientEntity findOwned(UUID userId, UUID patientId) {
    return patientRepository.findByIdAndUserId(patientId, userId)
        .orElseThrow(() -> new PatientNotFoundException(patientId));
  }

  private PatientStatus resolveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return PatientStatus.ATIVO;
    }
    try {
      com.psiops.contracts.model.PatientStatus contractStatus =
          com.psiops.contracts.model.PatientStatus.fromValue(raw);
      return PatientMapper.toPersistenceStatus(contractStatus);
    } catch (IllegalArgumentException e) {
      return PatientStatus.ATIVO;
    }
  }
}
