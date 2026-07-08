package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.ReminderDuePayload;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * ReminderDueEvent
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ReminderDueEvent {

  private UUID eventId;

  /**
   * Gets or Sets type
   */
  public enum TypeEnum {
    LEMBRETE_DEVIDO("lembrete.devido");

    private final String value;

    TypeEnum(String value) {
      this.value = value;
    }

    @JsonValue
    public String getValue() {
      return value;
    }

    @Override
    public String toString() {
      return String.valueOf(value);
    }

    @JsonCreator
    public static TypeEnum fromValue(String value) {
      for (TypeEnum b : TypeEnum.values()) {
        if (b.value.equals(value)) {
          return b;
        }
      }
      throw new IllegalArgumentException("Unexpected value '" + value + "'");
    }
  }

  private TypeEnum type;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime occurredAt;

  private UUID userId;

  private ReminderDuePayload payload;

  public ReminderDueEvent() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ReminderDueEvent(UUID eventId, TypeEnum type, OffsetDateTime occurredAt, UUID userId, ReminderDuePayload payload) {
    this.eventId = eventId;
    this.type = type;
    this.occurredAt = occurredAt;
    this.userId = userId;
    this.payload = payload;
  }

  public ReminderDueEvent eventId(UUID eventId) {
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

  public ReminderDueEvent type(TypeEnum type) {
    this.type = type;
    return this;
  }

  /**
   * Get type
   * @return type
   */
  @NotNull 
  @JsonProperty("type")
  public TypeEnum getType() {
    return type;
  }

  @JsonProperty("type")
  public void setType(TypeEnum type) {
    this.type = type;
  }

  public ReminderDueEvent occurredAt(OffsetDateTime occurredAt) {
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

  public ReminderDueEvent userId(UUID userId) {
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

  public ReminderDueEvent payload(ReminderDuePayload payload) {
    this.payload = payload;
    return this;
  }

  /**
   * Get payload
   * @return payload
   */
  @NotNull @Valid 
  @JsonProperty("payload")
  public ReminderDuePayload getPayload() {
    return payload;
  }

  @JsonProperty("payload")
  public void setPayload(ReminderDuePayload payload) {
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
    ReminderDueEvent reminderDueEvent = (ReminderDueEvent) o;
    return Objects.equals(this.eventId, reminderDueEvent.eventId) &&
        Objects.equals(this.type, reminderDueEvent.type) &&
        Objects.equals(this.occurredAt, reminderDueEvent.occurredAt) &&
        Objects.equals(this.userId, reminderDueEvent.userId) &&
        Objects.equals(this.payload, reminderDueEvent.payload);
  }

  @Override
  public int hashCode() {
    return Objects.hash(eventId, type, occurredAt, userId, payload);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ReminderDueEvent {\n");
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

