package com.psiops.api.notification.email;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.psiops.contracts.model.ChargeOverdueEvent;
import com.psiops.contracts.model.ChargeOverduePayload;
import com.psiops.contracts.model.ReminderChannel;
import com.psiops.contracts.model.ReminderDueEvent;
import com.psiops.contracts.model.ReminderDuePayload;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Verifica que {@code cobranca.atrasada}/{@code lembrete.devido} são
 * publicados EXATAMENTE no formato de envelope comum dos contratos (PSI-020,
 * acceptance criteria do manifesto PSI-029) - serializa os DTOs de contrato
 * ({@link ChargeOverdueEvent}/{@link ReminderDueEvent}, os mesmos usados
 * pelos handlers de e-mail para "publicar" o evento, ver {@link
 * DomainEventPublisher}) e confere as chaves/valores do envelope ({@code
 * eventId}/{@code type}/{@code occurredAt}/{@code userId}/{@code payload})
 * e do payload específico.
 */
class DomainEventPublisherTest {

  // findAndRegisterModules() traz o JavaTimeModule (jackson-datatype-jsr310,
  // já no classpath via spring-boot-starter-json); desabilitar
  // WRITE_DATES_AS_TIMESTAMPS reproduz a configuração do ObjectMapper
  // autoconfigurado pelo Spring Boot (datas ISO-8601, não arrays [ano,mes,dia]),
  // o mesmo bean que o DomainEventPublisher recebe em produção.
  private final ObjectMapper objectMapper =
      new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

  @Test
  void chargeOverdueEvent_serializesWithCommonEnvelopeAndPayloadShape() throws Exception {
    UUID eventId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID chargeId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    OffsetDateTime occurredAt = OffsetDateTime.now(ZoneOffset.UTC);
    ChargeOverduePayload payload = new ChargeOverduePayload(chargeId, patientId, "2026-07", 15000L, LocalDate.of(2026, 7, 5));
    ChargeOverdueEvent event = new ChargeOverdueEvent(eventId, ChargeOverdueEvent.TypeEnum.COBRANCA_ATRASADA, occurredAt, userId, payload);

    JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(event));

    assertThat(json.get("eventId").asText()).isEqualTo(eventId.toString());
    assertThat(json.get("type").asText()).isEqualTo("cobranca.atrasada");
    assertThat(json.get("userId").asText()).isEqualTo(userId.toString());
    assertThat(json.has("occurredAt")).isTrue();
    JsonNode payloadNode = json.get("payload");
    assertThat(payloadNode.get("chargeId").asText()).isEqualTo(chargeId.toString());
    assertThat(payloadNode.get("patientId").asText()).isEqualTo(patientId.toString());
    assertThat(payloadNode.get("competence").asText()).isEqualTo("2026-07");
    assertThat(payloadNode.get("amount").asLong()).isEqualTo(15000L);
    assertThat(payloadNode.get("dueDate").asText()).isEqualTo("2026-07-05");
  }

  @Test
  void reminderDueEvent_serializesWithCommonEnvelopeAndPayloadShape() throws Exception {
    UUID eventId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID reminderId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    OffsetDateTime occurredAt = OffsetDateTime.now(ZoneOffset.UTC);
    OffsetDateTime scheduledFor = occurredAt.minusSeconds(1);
    ReminderDuePayload payload = new ReminderDuePayload(reminderId, ReminderChannel.EMAIL, scheduledFor).patientId(patientId);
    ReminderDueEvent event = new ReminderDueEvent(eventId, ReminderDueEvent.TypeEnum.LEMBRETE_DEVIDO, occurredAt, userId, payload);

    JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(event));

    assertThat(json.get("eventId").asText()).isEqualTo(eventId.toString());
    assertThat(json.get("type").asText()).isEqualTo("lembrete.devido");
    assertThat(json.get("userId").asText()).isEqualTo(userId.toString());
    JsonNode payloadNode = json.get("payload");
    assertThat(payloadNode.get("reminderId").asText()).isEqualTo(reminderId.toString());
    assertThat(payloadNode.get("channel").asText()).isEqualTo("email");
    assertThat(payloadNode.get("patientId").asText()).isEqualTo(patientId.toString());
  }

  @Test
  void publisherLogsWithoutThrowing_forBothEventTypes() {
    DomainEventPublisher publisher = new DomainEventPublisher(objectMapper);
    ChargeOverduePayload chargePayload =
        new ChargeOverduePayload(UUID.randomUUID(), UUID.randomUUID(), "2026-07", 15000L, LocalDate.of(2026, 7, 5));
    ChargeOverdueEvent chargeEvent =
        new ChargeOverdueEvent(
            UUID.randomUUID(), ChargeOverdueEvent.TypeEnum.COBRANCA_ATRASADA, OffsetDateTime.now(ZoneOffset.UTC), UUID.randomUUID(), chargePayload);
    ReminderDuePayload reminderPayload =
        new ReminderDuePayload(UUID.randomUUID(), ReminderChannel.EMAIL, OffsetDateTime.now(ZoneOffset.UTC));
    ReminderDueEvent reminderEvent =
        new ReminderDueEvent(
            UUID.randomUUID(), ReminderDueEvent.TypeEnum.LEMBRETE_DEVIDO, OffsetDateTime.now(ZoneOffset.UTC), UUID.randomUUID(), reminderPayload);

    org.assertj.core.api.Assertions.assertThatCode(
            () -> {
              publisher.publish(chargeEvent);
              publisher.publish(reminderEvent);
            })
        .doesNotThrowAnyException();
  }
}
