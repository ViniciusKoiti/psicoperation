package com.psiops.api.notification.billing;

import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.billing.domain.event.ChargeOverdueDetectedEvent;
import com.psiops.api.notification.email.BrazilianFormats;
import com.psiops.api.notification.email.DomainEventPublisher;
import com.psiops.api.notification.email.EmailDeliveryFailedException;
import com.psiops.api.notification.email.RetryingEmailSender;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.contracts.model.ChargeOverdueEvent;
import com.psiops.contracts.model.ChargeOverduePayload;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.eventhandling.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Entrega por e-mail do fato {@code cobranca.atrasada} (PSI-029) para a
 * psicóloga dona da cobrança (o contrato de {@code Charge} não modela
 * paciente com login - o destinatário é sempre a psicóloga, um aviso
 * administrativo para acompanhamento).
 *
 * <p><strong>Só entrega, nenhuma regra de negócio</strong>: quem decide que a
 * cobrança está atrasada é {@code ChargeEntity#handle(MarkChargeOverdueCommand)}
 * (PSI-026); este handler só formata e envia um e-mail a partir do fato já
 * publicado.
 *
 * <p><strong>Idempotência - trade-off documentado (open_question do
 * manifesto)</strong>: ao contrário de {@code
 * com.psiops.api.notification.reminder.ReminderEmailHandler} (que tem a
 * coluna persistente {@code reminders.sent_at}/{@code status}), a tabela
 * {@code charges} (migration V2, imutável - nenhuma migration nova é
 * permitida nesta tarefa) NÃO tem nenhuma coluna equivalente para registrar
 * "e-mail de cobrança atrasada já enviado". Este handler usa um guard em
 * memória por {@code eventId} (suficiente para dedupe de redelivery dentro da
 * MESMA execução do processo, ex.: um erro transitório que faz o Axon
 * reprocessar o mesmo evento antes de avançar o token), mas esse guard É
 * PERDIDO a cada reinício - se o processo reiniciar entre a entrega do
 * e-mail e o avanço do token do processador (janela pequena, mas não nula),
 * um restart poderia reprocessar o mesmo {@code ChargeOverdueDetectedEvent} e
 * reenviar o e-mail. <strong>Registrado como open_question no PR</strong>:
 * uma tabela de log de envio (ex.: {@code charge_overdue_email_log(charge_id,
 * event_id, sent_at)}) tornaria isso durável, mas exigiria uma migration nova
 * - fora de escopo desta tarefa.
 *
 * <p>Processing group {@code email-delivery} (modo {@code tracking}),
 * compartilhado com {@code
 * com.psiops.api.notification.reminder.ReminderEmailHandler}.
 */
@Component
@ProcessingGroup("email-delivery")
public class ChargeOverdueEmailHandler {

  private static final Logger log = LoggerFactory.getLogger(ChargeOverdueEmailHandler.class);

  /**
   * Guard de idempotência em memória por {@code eventId} - ver javadoc da
   * classe sobre o trade-off de não sobreviver a restart. Cresce sem limite
   * de remoção nesta tarefa (volume esperado do MVP é baixo); uma expiração
   * por tempo seria um refinamento futuro, não necessário para o acceptance
   * criteria ("reprocessamento do mesmo evento não duplica e-mail").
   */
  private final Set<UUID> processedEventIds = ConcurrentHashMap.newKeySet();

  private final UserRepository userRepository;
  private final PatientRepository patientRepository;
  private final RetryingEmailSender emailSender;
  private final DomainEventPublisher eventPublisher;

  public ChargeOverdueEmailHandler(
      UserRepository userRepository,
      PatientRepository patientRepository,
      RetryingEmailSender emailSender,
      DomainEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
    this.emailSender = emailSender;
    this.eventPublisher = eventPublisher;
  }

  @EventHandler
  public void on(ChargeOverdueDetectedEvent event) {
    if (!processedEventIds.add(event.eventId())) {
      log.debug("evento cobranca.atrasada {} já processado nesta execução; e-mail não reenviado", event.eventId());
      return;
    }

    publishDomainEvent(event);

    UserEntity psychologist = userRepository.findById(event.userId()).orElse(null);
    if (psychologist == null) {
      log.warn("cobrança {} atrasada, mas psicóloga {} não encontrada; e-mail não enviado", event.chargeId(), event.userId());
      return;
    }

    String patientName =
        patientRepository.findById(event.patientId()).map(PatientEntity::getName).orElse("paciente");

    String subject = "Cobrança atrasada — " + patientName + " — " + event.competence();
    String body =
        "Olá, "
            + psychologist.getName()
            + ".\n\n"
            + "A cobrança da competência "
            + event.competence()
            + " de "
            + patientName
            + " venceu em "
            + BrazilianFormats.date(event.dueDate())
            + " e ainda não foi paga.\n\n"
            + "Valor: "
            + BrazilianFormats.currency(event.amountCents())
            + "\n\n"
            + "Este é um aviso administrativo automático do PsiOps.";

    try {
      emailSender.send(psychologist.getEmail(), subject, body);
    } catch (EmailDeliveryFailedException e) {
      log.error("falha definitiva ao entregar aviso de cobrança atrasada {}: {}", event.chargeId(), e.getMessage(), e);
    }
  }

  private void publishDomainEvent(ChargeOverdueDetectedEvent event) {
    ChargeOverduePayload payload =
        new ChargeOverduePayload(
            event.chargeId(), event.patientId(), event.competence(), event.amountCents(), event.dueDate());
    ChargeOverdueEvent contractEvent =
        new ChargeOverdueEvent(
            event.eventId(), ChargeOverdueEvent.TypeEnum.COBRANCA_ATRASADA, event.occurredAt(), event.userId(), payload);
    eventPublisher.publish(contractEvent);
  }
}
