package com.psiops.api.sessionrecord.application;

import com.psiops.api.appointment.application.AppointmentMapper;
import com.psiops.api.appointment.domain.AppointmentNotFoundException;
import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.appointment.persistence.AttendanceStatus;
import com.psiops.api.appointment.persistence.SessionRecordEntity;
import com.psiops.api.appointment.persistence.SessionRecordRepository;
import com.psiops.api.patient.domain.PatientNotFoundException;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.sessionrecord.web.SessionRecordHistoryItem;
import com.psiops.api.sessionrecord.web.SessionRecordPage;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AttendanceRecord;
import com.psiops.contracts.model.PageMeta;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de registros administrativos de consulta (PSI-025): vincular
 * (ou atualizar) a presença de uma consulta existente e montar o histórico
 * paginado por paciente.
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}) e
 * toda consulta/gravação passa por um método de {@link AppointmentRepository}
 * ou {@link PatientRepository} que filtra por {@code userId} — nunca um
 * {@code findById} puro. Consulta/paciente de outra usuária é tratado como
 * inexistente: {@link AppointmentNotFoundException}/{@link
 * PatientNotFoundException} (404) — nunca 403, para não vazar a existência
 * do recurso de outro tenant.
 *
 * <p><strong>Um registro por consulta</strong> (assumption do manifesto
 * PSI-025, respeitando o {@code UNIQUE (appointment_id)} da migration V2):
 * {@link #recordAttendance} faz upsert — uma segunda chamada para a mesma
 * consulta atualiza o registro existente (preservando {@code createdAt}) em
 * vez de violar a constraint ou criar um segundo registro.
 *
 * <p><strong>Sem efeito colateral na agenda</strong> (out_of_scope do
 * manifesto PSI-025): registrar {@code remarcada} aqui NÃO altera o {@code
 * status} da consulta (PSI-024) — a resposta de {@link #recordAttendance} é
 * sempre a consulta tal como está, só confirmando o vínculo.
 *
 * <p><strong>Nenhum campo clínico</strong> (restrição de produto
 * inviolável): ver javadoc de {@link
 * com.psiops.api.appointment.persistence.SessionRecordEntity}.
 */
@Service
public class SessionRecordService {

  private static final int MAX_PAGE_SIZE = 100;

  private final SessionRecordRepository sessionRecordRepository;
  private final AppointmentRepository appointmentRepository;
  private final PatientRepository patientRepository;

  public SessionRecordService(
      SessionRecordRepository sessionRecordRepository,
      AppointmentRepository appointmentRepository,
      PatientRepository patientRepository) {
    this.sessionRecordRepository = sessionRecordRepository;
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
  }

  /**
   * Registra (cria ou atualiza) a presença administrativa de {@code
   * appointmentId}. Rejeita consultas inexistentes ou de outra usuária com
   * {@link AppointmentNotFoundException} (404). O paciente do registro é
   * sempre o paciente da própria consulta — nunca recebido no payload (ver
   * assumption do manifesto: "paciente do registro é derivado da consulta
   * vinculada, evitando divergência entre registro e agenda").
   *
   * <p>{@code recordedAt} ausente no payload é preenchido com o instante do
   * servidor (UTC) — assumption desta implementação, documentada no PR: o
   * contrato só declara o campo como opcional, sem especificar o
   * comportamento de omissão; preencher com "agora" garante que o histórico
   * sempre tenha um instante de registro coerente.
   */
  @Transactional
  public Appointment recordAttendance(UUID userId, UUID appointmentId, AttendanceRecord request) {
    AppointmentEntity appointment =
        appointmentRepository
            .findByIdAndUserId(appointmentId, userId)
            .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));

    AttendanceStatus attendance = SessionRecordMapper.toPersistenceStatus(request.getAttendance());
    OffsetDateTime recordedAt =
        request.getRecordedAt() != null ? request.getRecordedAt() : OffsetDateTime.now(ZoneOffset.UTC);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    SessionRecordEntity existing = sessionRecordRepository.findByAppointmentId(appointmentId).orElse(null);
    SessionRecordEntity toSave =
        new SessionRecordEntity(
            existing == null ? UUID.randomUUID() : existing.getId(),
            userId,
            appointmentId,
            attendance,
            request.getAdministrativeNotes(),
            recordedAt,
            existing == null ? now : existing.getCreatedAt());
    sessionRecordRepository.save(toSave);

    return AppointmentMapper.toContract(appointment);
  }

  /**
   * Histórico paginado dos registros administrativos de {@code patientId},
   * ordenado da consulta mais recente para a mais antiga. Rejeita paciente
   * inexistente ou de outra usuária com {@link PatientNotFoundException}
   * (404). Paciente sem nenhum registro retorna página vazia (nunca erro).
   */
  @Transactional(readOnly = true)
  public SessionRecordPage history(UUID userId, UUID patientId, int page, int size) {
    if (patientRepository.findByIdAndUserId(patientId, userId).isEmpty()) {
      throw new PatientNotFoundException(patientId);
    }

    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    Pageable pageable = PageRequest.of(safePage, safeSize);

    Page<SessionRecordEntity> result =
        sessionRecordRepository.findHistoryByUserIdAndPatientId(userId, patientId, pageable);

    List<SessionRecordHistoryItem> items = result.getContent().stream().map(this::toHistoryItem).toList();
    PageMeta meta =
        new PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new SessionRecordPage(items, meta);
  }

  private SessionRecordHistoryItem toHistoryItem(SessionRecordEntity entity) {
    return new SessionRecordHistoryItem(
        entity.getId(),
        entity.getAppointmentId(),
        SessionRecordMapper.toContract(entity),
        entity.getCreatedAt());
  }
}
