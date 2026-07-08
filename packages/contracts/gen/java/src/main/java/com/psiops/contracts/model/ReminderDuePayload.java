package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.ReminderChannel;
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
 * Payload do evento &#x60;lembrete.devido&#x60;.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ReminderDuePayload {

  private UUID reminderId;

  private ReminderChannel channel;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime scheduledFor;

  private @Nullable UUID patientId;

  public ReminderDuePayload() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ReminderDuePayload(UUID reminderId, ReminderChannel channel, OffsetDateTime scheduledFor) {
    this.reminderId = reminderId;
    this.channel = channel;
    this.scheduledFor = scheduledFor;
  }

  public ReminderDuePayload reminderId(UUID reminderId) {
    this.reminderId = reminderId;
    return this;
  }

  /**
   * Get reminderId
   * @return reminderId
   */
  @NotNull @Valid 
  @JsonProperty("reminderId")
  public UUID getReminderId() {
    return reminderId;
  }

  @JsonProperty("reminderId")
  public void setReminderId(UUID reminderId) {
    this.reminderId = reminderId;
  }

  public ReminderDuePayload channel(ReminderChannel channel) {
    this.channel = channel;
    return this;
  }

  /**
   * Get channel
   * @return channel
   */
  @NotNull @Valid 
  @JsonProperty("channel")
  public ReminderChannel getChannel() {
    return channel;
  }

  @JsonProperty("channel")
  public void setChannel(ReminderChannel channel) {
    this.channel = channel;
  }

  public ReminderDuePayload scheduledFor(OffsetDateTime scheduledFor) {
    this.scheduledFor = scheduledFor;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return scheduledFor
   */
  @NotNull @Valid 
  @JsonProperty("scheduledFor")
  public OffsetDateTime getScheduledFor() {
    return scheduledFor;
  }

  @JsonProperty("scheduledFor")
  public void setScheduledFor(OffsetDateTime scheduledFor) {
    this.scheduledFor = scheduledFor;
  }

  public ReminderDuePayload patientId(@Nullable UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Paciente vinculado (opcional).
   * @return patientId
   */
  @Valid 
  @JsonProperty("patientId")
  public @Nullable UUID getPatientId() {
    return patientId;
  }

  @JsonProperty("patientId")
  public void setPatientId(@Nullable UUID patientId) {
    this.patientId = patientId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ReminderDuePayload reminderDuePayload = (ReminderDuePayload) o;
    return Objects.equals(this.reminderId, reminderDuePayload.reminderId) &&
        Objects.equals(this.channel, reminderDuePayload.channel) &&
        Objects.equals(this.scheduledFor, reminderDuePayload.scheduledFor) &&
        Objects.equals(this.patientId, reminderDuePayload.patientId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(reminderId, channel, scheduledFor, patientId);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ReminderDuePayload {\n");
    sb.append("    reminderId: ").append(toIndentedString(reminderId)).append("\n");
    sb.append("    channel: ").append(toIndentedString(channel)).append("\n");
    sb.append("    scheduledFor: ").append(toIndentedString(scheduledFor)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
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

