package com.psiops.api.reminder.application;

import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.billing.persistence.ChargeRepository;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.reminder.domain.InvalidReminderStateException;
import com.psiops.api.reminder.domain.ReminderLinkNotFoundException;
import com.psiops.api.reminder.domain.command.ScheduleReminderCommand;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import com.psiops.contracts.model.PageMeta;
import com.psiops.contracts.model.Reminder;
import com.psiops.contracts.model.ReminderCreateRequest;
import com.psiops.contracts.model.ReminderPage;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do módulo de lembretes (PSI-027): agendamento (canal email,
 * único do MVP) e listagem paginada com filtros.
 *
 * <p><strong>Contrato exposto</strong>: {@code
 * packages/contracts/openapi/paths/reminder/reminders.yaml} declara somente
 * {@code GET /reminders} e {@code POST /reminders} — ao contrário de
 * patient/appointment/charge/task, não há path {@code
 * /reminders/{reminderId}} no contrato (nenhum get/update/cancel por id).
 * Este serviço expõe exatamente essas duas operações; ver open_question
 * registrada no PR sobre cancelamento/edição ficarem fora desta tarefa por
 * ausência de path no contrato (que esta tarefa não pode alterar —
 * {@code packages/contracts/**} é forbidden_path).
 *
 * <p><strong>Agendar publica Axon</strong>: {@link #create} despacha {@link
 * ScheduleReminderCommand}, que o agregado ({@link ReminderEntity}) traduz em
 * {@code ReminderScheduledEvent}, persistido no event store JPA — deixando o
 * lembrete em {@code AGENDADO}, estado pronto para o disparo assíncrono da
 * PSI-029 (deadline real + envio de e-mail), que é exclusivo dela; nenhum
 * e-mail é enviado nem deadline é agendado aqui (ver javadoc de {@code
 * ScheduleReminderCommand}).
 *
 * <p><strong>Validações de agendamento</strong>: {@code scheduledFor} deve
 * estar no futuro (relativo ao instante da requisição); o vínculo opcional
 * (paciente/consulta/cobrança) é a exatamente um recurso quando informado
 * (assumption do manifesto) e, quando presente, deve existir e pertencer ao
 * MESMO {@code userId} autenticado — violação responde 404 ({@link
 * ReminderLinkNotFoundException}), sem revelar se o recurso existe para
 * outro tenant (acceptance criteria do manifesto PSI-027; note que isso
 * difere do 400 usado pelo módulo de cobranças para uma checagem análoga).
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}) e
 * toda consulta passa por um método de {@link ReminderRepository} que filtra
 * por {@code userId} — nunca um {@code findById} puro. Listagem de outra
 * usuária nunca vaza lembrete: lista vazia, nunca 403.
 */
@Service
public class ReminderService {

  private static final int MAX_PAGE_SIZE = 100;

  private final ReminderRepository reminderRepository;
  private final PatientRepository patientRepository;
  private final AppointmentRepository appointmentRepository;
  private final ChargeRepository chargeRepository;
  private final CommandGateway commandGateway;

  public ReminderService(
      ReminderRepository reminderRepository,
      PatientRepository patientRepository,
      AppointmentRepository appointmentRepository,
      ChargeRepository chargeRepository,
      CommandGateway commandGateway) {
    this.reminderRepository = reminderRepository;
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.chargeRepository = chargeRepository;
    this.commandGateway = commandGateway;
  }

  @Transactional
  public Reminder create(UUID userId, ReminderCreateRequest request) {
    assertScheduledInFuture(request.getScheduledFor());
    assertAtMostOneLink(request);
    assertLinkOwnedByTenant(userId, request);

    UUID reminderId = UUID.randomUUID();
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    commandGateway.sendAndWait(
        new ScheduleReminderCommand(
            reminderId,
            userId,
            ReminderMapper.toPersistenceChannel(request.getChannel()),
            request.getSubject(),
            request.getBody(),
            request.getScheduledFor(),
            request.getPatientId(),
            request.getAppointmentId(),
            request.getChargeId(),
            now));

    return ReminderMapper.toContract(findOwned(userId, reminderId));
  }

  /**
   * Listagem paginada, escopada a {@code userId}, com filtros opcionais por
   * paciente e status, conforme {@code GET /reminders} do contrato.
   */
  @Transactional(readOnly = true)
  public ReminderPage list(UUID userId, int page, int size, UUID patientId, String statusParam) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    ReminderStatus status = resolveStatus(statusParam);
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "scheduledFor"));

    Page<ReminderEntity> result = reminderRepository.search(userId, patientId, status, pageable);

    List<Reminder> items = result.getContent().stream().map(ReminderMapper::toContract).toList();
    PageMeta meta =
        new PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new ReminderPage(items, meta);
  }

  private ReminderEntity findOwned(UUID userId, UUID reminderId) {
    // Não há exceção de "não encontrado" pública aqui: logo após o
    // commandGateway.sendAndWait, o agregado já foi persistido na mesma
    // transação (ver javadoc da classe) — este findOwned nunca deveria
    // falhar em operação normal.
    return reminderRepository
        .findByIdAndUserId(reminderId, userId)
        .orElseThrow(() -> new IllegalStateException("lembrete recém-agendado não encontrado: " + reminderId));
  }

  private void assertScheduledInFuture(OffsetDateTime scheduledFor) {
    if (scheduledFor == null || !scheduledFor.isAfter(OffsetDateTime.now(ZoneOffset.UTC))) {
      throw new InvalidReminderStateException("scheduledFor deve estar no futuro: " + scheduledFor);
    }
  }

  private void assertAtMostOneLink(ReminderCreateRequest request) {
    int linkCount = 0;
    if (request.getPatientId() != null) {
      linkCount++;
    }
    if (request.getAppointmentId() != null) {
      linkCount++;
    }
    if (request.getChargeId() != null) {
      linkCount++;
    }
    if (linkCount > 1) {
      throw new InvalidReminderStateException(
          "o lembrete aceita no máximo um vínculo (patientId/appointmentId/chargeId), não vários simultaneamente");
    }
  }

  private void assertLinkOwnedByTenant(UUID userId, ReminderCreateRequest request) {
    if (request.getPatientId() != null && patientRepository.findByIdAndUserId(request.getPatientId(), userId).isEmpty()) {
      throw new ReminderLinkNotFoundException("paciente", request.getPatientId());
    }
    if (request.getAppointmentId() != null
        && appointmentRepository.findByIdAndUserId(request.getAppointmentId(), userId).isEmpty()) {
      throw new ReminderLinkNotFoundException("consulta", request.getAppointmentId());
    }
    if (request.getChargeId() != null && chargeRepository.findByIdAndUserId(request.getChargeId(), userId).isEmpty()) {
      throw new ReminderLinkNotFoundException("cobrança", request.getChargeId());
    }
  }

  private ReminderStatus resolveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      com.psiops.contracts.model.ReminderStatus contractStatus =
          com.psiops.contracts.model.ReminderStatus.fromValue(raw);
      return ReminderMapper.toPersistenceStatus(contractStatus);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}
