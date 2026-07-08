package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Envelope comum de um evento de domínio. O &#x60;payload&#x60; é o dado específico do tipo; os schemas concretos (ChargeOverdueEvent, ReminderDueEvent) restringem &#x60;type&#x60; e &#x60;payload&#x60;.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class DomainEvent {

  private UUID eventId;

  private String type;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime occurredAt;

  private UUID userId;

  private Map<String, Object> payload = new HashMap<>();

  public DomainEvent() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public DomainEvent(UUID eventId, String type, OffsetDateTime occurredAt, UUID userId, Map<String, Object> payload) {
    this.eventId = eventId;
    this.type = type;
    this.occurredAt = occurredAt;
    this.userId = userId;
    this.payload = payload;
  }

  public DomainEvent eventId(UUID eventId) {
    this.eventId = eventId;
    return this;
  }

  /**
   * Identificador único do evento (idempotência).
   * @return eventId
   */
  @NotNull @Valid 
  @JsonProperty("eventId")
  public UUID getEventId() {
    return eventId;
  }

  @JsonProperty("eventId")
  public void setEventId(UUID eventId) {
    this.eventId = eventId;
  }

  public DomainEvent type(String type) {
    this.type = type;
    return this;
  }

  /**
   * Tipo do evento no formato `<recurso>.<fato>`.
   * @return type
   */
  @NotNull 
  @JsonProperty("type")
  public String getType() {
    return type;
  }

  @JsonProperty("type")
  public void setType(String type) {
    this.type = type;
  }

  public DomainEvent occurredAt(OffsetDateTime occurredAt) {
    this.occurredAt = occurredAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return occurredAt
   */
  @NotNull @Valid 
  @JsonProperty("occurredAt")
  public OffsetDateTime getOccurredAt() {
    return occurredAt;
  }

  @JsonProperty("occurredAt")
  public void setOccurredAt(OffsetDateTime occurredAt) {
    this.occurredAt = occurredAt;
  }

  public DomainEvent userId(UUID userId) {
    this.userId = userId;
    return this;
  }

  /**
   * Tenant (psicóloga) dona do fato.
   * @return userId
   */
  @NotNull @Valid 
  @JsonProperty("userId")
  public UUID getUserId() {
    return userId;
  }

  @JsonProperty("userId")
  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public DomainEvent payload(Map<String, Object> payload) {
    this.payload = payload;
    return this;
  }

  public DomainEvent putPayloadItem(String key, Object payloadItem) {
    if (this.payload == null) {
      this.payload = new HashMap<>();
    }
    this.payload.put(key, payloadItem);
    return this;
  }

  /**
   * Dado específico do tipo de evento.
   * @return payload
   */
  @NotNull 
  @JsonProperty("payload")
  public Map<String, Object> getPayload() {
    return payload;
  }

  @JsonProperty("payload")
  public void setPayload(Map<String, Object> payload) {
    this.payload = payload;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    DomainEvent domainEvent = (DomainEvent) o;
    return Objects.equals(this.eventId, domainEvent.eventId) &&
        Objects.equals(this.type, domainEvent.type) &&
        Objects.equals(this.occurredAt, domainEvent.occurredAt) &&
        Objects.equals(this.userId, domainEvent.userId) &&
        Objects.equals(this.payload, domainEvent.payload);
  }

  @Override
  public int hashCode() {
    return Objects.hash(eventId, type, occurredAt, userId, payload);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class DomainEvent {\n");
    sb.append("    eventId: ").append(toIndentedString(eventId)).append("\n");
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
    sb.append("    occurredAt: ").append(toIndentedString(occurredAt)).append("\n");
    sb.append("    userId: ").append(toIndentedString(userId)).append("\n");
    sb.append("    payload: ").append(toIndentedString(payload)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(@Nullable Object o) {
    return o == null ? "null" : o.toString().replace("\n", "\n    ");
  }
}

