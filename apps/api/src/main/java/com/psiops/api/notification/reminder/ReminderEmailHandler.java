package com.psiops.api.notification.reminder;

import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.notification.email.DomainEventPublisher;
import com.psiops.api.notification.email.EmailDeliveryFailedException;
import com.psiops.api.notification.email.RetryingEmailSender;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.reminder.domain.event.ReminderDueDetectedEvent;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import com.psiops.contracts.model.ReminderDueEvent;
import com.psiops.contracts.model.ReminderDuePayload;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.eventhandling.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Entrega por e-mail do fato {@code lembrete.devido} (PSI-029).
 *
 * <p><strong>Só entrega, nenhuma regra de negócio</strong>: assunto e corpo
 * já foram definidos por quem agendou o lembrete - a psicóloga (via {@code
 * POST /reminders}, PSI-027) ou {@code
 * com.psiops.api.notification.appointment.AppointmentReminderPolicy} (para
 * véspera/dia de consulta) - este handler não decide nem reescreve
 * conteúdo, apenas formata e envia.
 *
 * <p><strong>Destinatário</strong> (assumption do manifesto, sem campo
 * explícito de "e-mail do destinatário" no contrato de lembrete): se o
 * lembrete tem {@code patientId}, vai para o e-mail do PACIENTE (coerente
 * com o próprio schema - "Lembrete agendado/enviado pela psicóloga A UM
 * PACIENTE", ver javadoc de {@code ReminderEntity}/{@code Reminder}); sem
 * paciente cadastrado com e-mail, a entrega falha definitivamente (nunca cai
 * de volta silenciosamente para o e-mail da psicóloga, que receberia uma
 * mensagem endereçada a outra pessoa). Sem {@code patientId} (lembrete
 * "solto", sem vínculo), vai para o e-mail da própria psicóloga (nota
 * interna).
 *
 * <p><strong>Idempotência durável</strong>: antes de enviar, relê {@link
 * ReminderEntity#getStatus()}/{@link ReminderEntity#getSentAt()} do banco -
 * se já não estiver {@code AGENDADO} (já {@code ENVIADO}, {@code FALHOU} ou
 * {@code CANCELADO}), não reenvia. Após o envio bem-sucedido, marca {@code
 * sentAt}/{@code status = ENVIADO} diretamente via {@link ReminderRepository}
 * (não via {@code CommandGateway}/Axon - é apenas um registro de entrega, não
 * um novo fato de domínio a ser event-sourced; ver decisão registrada no
 * javadoc de {@link ReminderDueDetectedEvent}). Essa coluna persistente
 * sobrevive a reinício e a redelivery do processador, ao contrário do guard
 * em memória usado para {@code cobranca.atrasada} (ver {@code
 * com.psiops.api.notification.billing.ChargeOverdueEmailHandler}, que não
 * tem coluna equivalente disponível sem uma migration nova).
 *
 * <p><strong>Isolamento</strong>: processing group {@code email-delivery}
 * (modo {@code tracking}), compartilhado com {@code
 * ChargeOverdueEmailHandler} - retries de SMTP nunca bloqueiam o agendamento
 * de deadlines ({@code reminder-deadlines}) nem outras requisições.
 */
@Component
@ProcessingGroup("email-delivery")
public class ReminderEmailHandler {

  private static final Logger log = LoggerFactory.getLogger(ReminderEmailHandler.class);

  private final ReminderRepository reminderRepository;
  private final PatientRepository patientRepository;
  private final UserRepository userRepository;
  private final RetryingEmailSender emailSender;
  private final DomainEventPublisher eventPublisher;

  public ReminderEmailHandler(
      ReminderRepository reminderRepository,
      PatientRepository patientRepository,
      UserRepository userRepository,
      RetryingEmailSender emailSender,
      DomainEventPublisher eventPublisher) {
    this.reminderRepository = reminderRepository;
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
    this.emailSender = emailSender;
    this.eventPublisher = eventPublisher;
  }

  @EventHandler
  @Transactional
  public void on(ReminderDueDetectedEvent event) {
    publishDomainEvent(event);

    ReminderEntity reminder = reminderRepository.findById(event.reminderId()).orElse(null);
    if (reminder == null || reminder.getStatus() != ReminderStatus.AGENDADO) {
      // Idempotência durável: já enviado/cancelado/falhado anteriormente
      // (redelivery do processador, ou o lembrete foi apagado - nunca
      // acontece hoje, mas o guard é defensivo).
      log.debug("lembrete {} já não está AGENDADO (ou não existe mais); e-mail não reenviado", event.reminderId());
      return;
    }

    Optional<String> recipient = resolveRecipient(reminder);
    if (recipient.isEmpty()) {
      log.warn(
          "lembrete {} não pôde ser entregue: paciente {} sem e-mail cadastrado",
          reminder.getId(),
          reminder.getPatientId());
      markFailed(reminder);
      return;
    }

    try {
      emailSender.send(recipient.get(), reminder.getSubject(), reminder.getBody());
      markSent(reminder);
    } catch (EmailDeliveryFailedException e) {
      log.error("falha definitiva ao entregar lembrete {}: {}", reminder.getId(), e.getMessage(), e);
      markFailed(reminder);
    }
  }

  private Optional<String> resolveRecipient(ReminderEntity reminder) {
    if (reminder.getPatientId() != null) {
      return patientRepository
          .findById(reminder.getPatientId())
          .map(PatientEntity::getEmail)
          .filter(email -> email != null && !email.isBlank());
    }
    return userRepository.findById(reminder.getUserId()).map(UserEntity::getEmail);
  }

  private void markSent(ReminderEntity reminder) {
    ReminderEntity updated =
        new ReminderEntity(
            reminder.getId(),
            reminder.getUserId(),
            reminder.getChannel(),
            reminder.getSubject(),
            reminder.getBody(),
            reminder.getScheduledFor(),
            OffsetDateTime.now(ZoneOffset.UTC),
            ReminderStatus.ENVIADO,
            reminder.getPatientId(),
            reminder.getAppointmentId(),
            reminder.getChargeId(),
            reminder.getCreatedAt());
    reminderRepository.save(updated);
  }

  private void markFailed(ReminderEntity reminder) {
    ReminderEntity updated =
        new ReminderEntity(
            reminder.getId(),
            reminder.getUserId(),
            reminder.getChannel(),
            reminder.getSubject(),
            reminder.getBody(),
            reminder.getScheduledFor(),
            reminder.getSentAt(),
            ReminderStatus.FALHOU,
            reminder.getPatientId(),
            reminder.getAppointmentId(),
            reminder.getChargeId(),
            reminder.getCreatedAt());
    reminderRepository.save(updated);
  }

  private void publishDomainEvent(ReminderDueDetectedEvent event) {
    ReminderDuePayload payload =
        new ReminderDuePayload(
                event.reminderId(), toContractChannel(event.channel()), event.scheduledFor())
            .patientId(event.patientId());
    ReminderDueEvent contractEvent =
        new ReminderDueEvent(
            UUID.randomUUID(), ReminderDueEvent.TypeEnum.LEMBRETE_DEVIDO, event.occurredAt(), event.userId(), payload);
    eventPublisher.publish(contractEvent);
  }

  private static com.psiops.contracts.model.ReminderChannel toContractChannel(
      com.psiops.api.reminder.persistence.ReminderChannel channel) {
    return com.psiops.contracts.model.ReminderChannel.valueOf(channel.name());
  }
}
