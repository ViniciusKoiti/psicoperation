package com.psiops.api.notification.email;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.contracts.model.ChargeOverdueEvent;
import com.psiops.contracts.model.ReminderDueEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * "Publica" os eventos de domínio {@code lembrete.devido}/{@code
 * cobranca.atrasada} no formato de envelope comum dos contratos (PSI-020),
 * conforme o acceptance criteria do manifesto PSI-029.
 *
 * <p><strong>Sem broker/outbox nesta tarefa</strong>: o ADR 0009 não prevê
 * fila de mensagens (Kafka/RabbitMQ) nem worker separado para o MVP - o
 * transporte assíncrono é inteiramente interno ao Axon. Os schemas {@code
 * DomainEvent}/{@code ChargeOverdueEvent}/{@code ReminderDueEvent} (PSI-020)
 * não têm nenhum path HTTP associado (são apenas componentes/schemas,
 * confirmado em {@code packages/contracts/openapi/openapi.yaml}) - a própria
 * especificação os descreve como "publicados pelo backend (Axon) e
 * consumíveis por processos assíncronos", ou seja, o consumidor é o próprio
 * processo de entrega de e-mail deste pacote.
 *
 * <p>Esta classe materializa cada evento no DTO de contrato exato (garantindo
 * que o envelope/payload estejam corretos e testáveis) e o registra em log
 * estruturado (JSON), como o artefato auditável dessa publicação - um
 * outbox/webhook real fica registrado como open_question no PR para uma
 * tarefa futura, caso um consumidor externo precise assinar esses eventos.
 */
@Component
public class DomainEventPublisher {

  private static final Logger log = LoggerFactory.getLogger("com.psiops.api.notification.events");

  private final ObjectMapper objectMapper;

  public DomainEventPublisher(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void publish(ReminderDueEvent event) {
    log.info("evento publicado type={} payload={}", event.getType().getValue(), writeSafely(event));
  }

  public void publish(ChargeOverdueEvent event) {
    log.info("evento publicado type={} payload={}", event.getType().getValue(), writeSafely(event));
  }

  private String writeSafely(Object event) {
    try {
      return objectMapper.writeValueAsString(event);
    } catch (JsonProcessingException e) {
      // Nunca falha a entrega do e-mail por causa da serialização de log.
      return String.valueOf(event);
    }
  }
}
